import json
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE_GLB_PATH = ROOT / "public" / "models" / "environment" / "tenerife-full-island-normalized.glb"
OUTPUT_TS_PATH = ROOT / "src" / "scenes" / "environment" / "tenerifeFullIslandMapData.ts"
METADATA_PATH = ROOT / "public" / "data" / "tenerife" / "full-island-metadata.json"

TERRAIN_PREFIX = "tenerife-full-island-terrain-tile-"
RUNTIME_SCALE = 0.02
GRID_SIZE = 384


def clear_scene():
	bpy.ops.object.select_all(action="SELECT")
	bpy.ops.object.delete()


def import_source():
	bpy.ops.import_scene.gltf(filepath=str(SOURCE_GLB_PATH))


def get_terrain_objects():
	return [
		obj
		for obj in bpy.context.scene.objects
		if obj.type == "MESH" and obj.name.startswith(TERRAIN_PREFIX) and len(obj.data.polygons) > 0
	]


def to_runtime_point(point):
	return {
		"x": -point.x * RUNTIME_SCALE,
		"z": -point.y * RUNTIME_SCALE,
		"y": point.z * RUNTIME_SCALE,
	}


def get_runtime_vertices(terrain_objects):
	vertices = []

	for obj in terrain_objects:
		for vertex in obj.data.vertices:
			vertices.append(to_runtime_point(obj.matrix_world @ vertex.co))

	return vertices


def get_bounds(vertices):
	return {
		"minX": min(vertex["x"] for vertex in vertices),
		"maxX": max(vertex["x"] for vertex in vertices),
		"minZ": min(vertex["z"] for vertex in vertices),
		"maxZ": max(vertex["z"] for vertex in vertices),
	}


def to_grid(point, bounds):
	x_ratio = (point["x"] - bounds["minX"]) / (bounds["maxX"] - bounds["minX"])
	z_ratio = (point["z"] - bounds["minZ"]) / (bounds["maxZ"] - bounds["minZ"])

	return {
		"x": x_ratio * (GRID_SIZE - 1),
		"y": (1 - z_ratio) * (GRID_SIZE - 1),
	}


def edge_value(point_a, point_b, point_c):
	return (point_c["x"] - point_a["x"]) * (point_b["y"] - point_a["y"]) - (
		point_c["y"] - point_a["y"]
	) * (point_b["x"] - point_a["x"])


def is_point_in_triangle(point, triangle):
	a, b, c = triangle
	edge_0 = edge_value(a, b, point)
	edge_1 = edge_value(b, c, point)
	edge_2 = edge_value(c, a, point)

	has_negative = edge_0 < 0 or edge_1 < 0 or edge_2 < 0
	has_positive = edge_0 > 0 or edge_1 > 0 or edge_2 > 0

	return not (has_negative and has_positive)


def rasterize_triangle(mask, triangle):
	min_x = max(0, int(min(point["x"] for point in triangle)))
	max_x = min(GRID_SIZE - 1, int(max(point["x"] for point in triangle)) + 1)
	min_y = max(0, int(min(point["y"] for point in triangle)))
	max_y = min(GRID_SIZE - 1, int(max(point["y"] for point in triangle)) + 1)

	for y in range(min_y, max_y + 1):
		for x in range(min_x, max_x + 1):
			if is_point_in_triangle({"x": x + 0.5, "y": y + 0.5}, triangle):
				mask[y][x] = True


def build_mask(terrain_objects, bounds):
	mask = [[False for _ in range(GRID_SIZE)] for _ in range(GRID_SIZE)]

	for obj in terrain_objects:
		world_points = [to_runtime_point(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices]
		grid_points = [to_grid(point, bounds) for point in world_points]

		for polygon in obj.data.polygons:
			indices = list(polygon.vertices)

			if len(indices) < 3:
				continue

			first = grid_points[indices[0]]

			for index in range(1, len(indices) - 1):
				triangle = [first, grid_points[indices[index]], grid_points[indices[index + 1]]]
				rasterize_triangle(mask, triangle)

	return mask


def add_edge(adjacency, start, end):
	adjacency.setdefault(start, set()).add(end)
	adjacency.setdefault(end, set()).add(start)


def build_boundary_adjacency(mask):
	adjacency = {}

	for y in range(GRID_SIZE):
		for x in range(GRID_SIZE):
			if not mask[y][x]:
				continue

			if y == 0 or not mask[y - 1][x]:
				add_edge(adjacency, (x, y), (x + 1, y))

			if x == GRID_SIZE - 1 or not mask[y][x + 1]:
				add_edge(adjacency, (x + 1, y), (x + 1, y + 1))

			if y == GRID_SIZE - 1 or not mask[y + 1][x]:
				add_edge(adjacency, (x + 1, y + 1), (x, y + 1))

			if x == 0 or not mask[y][x - 1]:
				add_edge(adjacency, (x, y + 1), (x, y))

	return adjacency


def polygon_area(points):
	area = 0

	for index, point in enumerate(points):
		next_point = points[(index + 1) % len(points)]
		area += point[0] * next_point[1] - next_point[0] * point[1]

	return area / 2


def trace_boundary_loops(adjacency):
	unvisited_edges = {
		tuple(sorted([point, neighbor]))
		for point, neighbors in adjacency.items()
		for neighbor in neighbors
	}
	loops = []

	while unvisited_edges:
		edge = next(iter(unvisited_edges))
		start, current = edge
		previous = None
		points = [start]

		while True:
			points.append(current)
			normalized_edge = tuple(sorted([previous or start, current]))
			unvisited_edges.discard(normalized_edge)

			neighbors = sorted(adjacency[current])
			next_point = None

			for neighbor in neighbors:
				edge_key = tuple(sorted([current, neighbor]))
				if neighbor != previous and edge_key in unvisited_edges:
					next_point = neighbor
					break

			if next_point is None:
				if start in adjacency[current]:
					unvisited_edges.discard(tuple(sorted([current, start])))
				break

				break

			previous = current
			current = next_point

			if current == start:
				unvisited_edges.discard(tuple(sorted([previous, current])))
				break

		if len(points) >= 4:
			loops.append(points)

	return sorted(loops, key=lambda loop: abs(polygon_area(loop)), reverse=True)


def simplify_loop(points):
	if len(points) <= 3:
		return points

	simplified = []

	for index, point in enumerate(points):
		previous = points[index - 1]
		next_point = points[(index + 1) % len(points)]
		vector_a = (point[0] - previous[0], point[1] - previous[1])
		vector_b = (next_point[0] - point[0], next_point[1] - point[1])

		if vector_a == vector_b:
			continue

		simplified.append(point)

	return simplified


def to_viewbox_point(point):
	x, y = point

	return (x / GRID_SIZE * 100, y / GRID_SIZE * 100)


def format_number(value):
	return f"{value:.3f}".rstrip("0").rstrip(".")


def loop_to_path(points):
	view_points = [to_viewbox_point(point) for point in simplify_loop(points)]
	start = view_points[0]
	commands = [f"M {format_number(start[0])} {format_number(start[1])}"]

	for point in view_points[1:]:
		commands.append(f"L {format_number(point[0])} {format_number(point[1])}")

	commands.append("Z")

	return " ".join(commands)


def write_typescript(bounds, path):
	source_metadata = json.loads(METADATA_PATH.read_text())
	teide_marker = bounds["landmarks"]["teide"]
	content = f"""export type TenerifeFullIslandMapBoundsType = {{
\tmaxX: number;
\tmaxZ: number;
\tminX: number;
\tminZ: number;
}};

export type TenerifeFullIslandMapDataType = {{
\tbounds: TenerifeFullIslandMapBoundsType;
\tlandmarks: {{
\t\tteide: {{
\t\t\tlabel: string;
\t\t\tx: number;
\t\t\tz: number;
\t\t}};
\t}};
\tlandPath: string;
\tmetadata: {{
\t\tgenerator: string;
\t\tgridSize: number;
\t\truntimeScale: number;
\t\tsourceAssetId: string;
\t\tsourceModel: string;
\t}};
}};

export const TENERIFE_FULL_ISLAND_MAP_DATA: TenerifeFullIslandMapDataType = {{
\tbounds: {{
\t\tmaxX: {bounds["maxX"]:.6f},
\t\tmaxZ: {bounds["maxZ"]:.6f},
\t\tminX: {bounds["minX"]:.6f},
\t\tminZ: {bounds["minZ"]:.6f},
\t}},
\tlandmarks: {{
\t\tteide: {{
\t\t\tlabel: 'Teide',
\t\t\tx: {teide_marker["x"]:.6f},
\t\t\tz: {teide_marker["z"]:.6f},
\t\t}},
\t}},
\tlandPath:
\t\t'{path}',
\tmetadata: {{
\t\tgenerator: 'scripts/blender/build_tenerife_full_island_map.py',
\t\tgridSize: {GRID_SIZE},
\t\truntimeScale: {RUNTIME_SCALE},
\t\tsourceAssetId: '{source_metadata["assetId"]}',
\t\tsourceModel: '{source_metadata["runtime"]["glbPath"]}',
\t}},
}};
"""
	OUTPUT_TS_PATH.write_text(content)


def main():
	clear_scene()
	import_source()
	terrain_objects = get_terrain_objects()

	if not terrain_objects:
		raise RuntimeError(f"No terrain meshes named {TERRAIN_PREFIX}* found in {SOURCE_GLB_PATH}")

	vertices = get_runtime_vertices(terrain_objects)
	bounds = get_bounds(vertices)
	bounds["landmarks"] = {
		"teide": max(vertices, key=lambda vertex: vertex["y"]),
	}
	mask = build_mask(terrain_objects, bounds)
	loops = trace_boundary_loops(build_boundary_adjacency(mask))

	if not loops:
		raise RuntimeError("No island boundary loops could be traced from the terrain mask")

	land_path = " ".join(loop_to_path(loop) for loop in loops[:4])
	write_typescript(bounds, land_path)
	print(
		f"Wrote {OUTPUT_TS_PATH.relative_to(ROOT)} from {len(terrain_objects)} terrain tiles "
		f"with {len(loops)} boundary loops"
	)


if __name__ == "__main__":
	main()
