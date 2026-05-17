import json
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
DEM_PATH = ROOT / "data" / "tenerife" / "generated" / "terrain" / "puerto-dem-runtime.json"
BUILDINGS_PATH = ROOT / "data" / "tenerife" / "generated" / "buildings" / "puerto-building-footprints.json"
CITY_LAYERS_PATH = ROOT / "data" / "tenerife" / "generated" / "puerto-city-layers.json"
TEXTURE_PATH = ROOT / "public" / "textures" / "tenerife" / "puerto-city-albedo.png"
BLEND_PATH = ROOT / "art" / "blender" / "puerto_de_la_cruz_terrain.blend"
GLB_PATH = ROOT / "public" / "models" / "environment" / "puerto-de-la-cruz-terrain.glb"
METADATA_PATH = ROOT / "public" / "data" / "tenerife" / "puerto-city-metadata.json"

BUILDING_FOOTPRINT_SCALE = 1.35
BUILDING_HEIGHT_SCALE = 1.18
BUILDING_LOCAL_SPACING_SCALE = 1.06
BUILDING_SPACING_BLOCK_WORLD_UNITS = 72.0


def clear_scene():
	bpy.ops.object.select_all(action="SELECT")
	bpy.ops.object.delete()
	bpy.context.scene.unit_settings.system = "METRIC"
	bpy.context.scene.unit_settings.scale_length = 1.0


def create_principled_material(name, color, roughness=0.9, metallic=0.0):
	material = bpy.data.materials.new(name)
	material.use_nodes = True
	material.use_backface_culling = False
	bsdf = material.node_tree.nodes.get("Principled BSDF")

	if not bsdf:
		return material

	bsdf.inputs["Base Color"].default_value = color
	bsdf.inputs["Roughness"].default_value = roughness
	bsdf.inputs["Metallic"].default_value = metallic

	return material


def create_material():
	material = create_principled_material("puerto-city-terrain-material", (0.44, 0.49, 0.36, 1.0), 0.92)
	bsdf = material.node_tree.nodes.get("Principled BSDF")

	if not bsdf:
		return material

	if TEXTURE_PATH.exists():
		texture_node = material.node_tree.nodes.new("ShaderNodeTexImage")
		texture_node.image = bpy.data.images.load(str(TEXTURE_PATH))
		texture_node.extension = "CLIP"
		material.node_tree.links.new(texture_node.outputs["Color"], bsdf.inputs["Base Color"])

	return material


def to_blender_point(x, z, height):
	return (x, z, height)


def sample_height(dem, x, z):
	columns = dem["columns"]
	rows = dem["rows"]
	bounds = dem["worldBounds"]
	heights = dem["heights"]
	u = (x - bounds["minX"]) / max(0.0001, bounds["maxX"] - bounds["minX"])
	v = (z - bounds["minZ"]) / max(0.0001, bounds["maxZ"] - bounds["minZ"])
	column = max(0, min(columns - 1, u * (columns - 1)))
	row = max(0, min(rows - 1, v * (rows - 1)))
	c0 = int(column)
	r0 = int(row)
	c1 = min(columns - 1, c0 + 1)
	r1 = min(rows - 1, r0 + 1)
	tx = column - c0
	tz = row - r0

	def grid_height(r, c):
		return heights[r * columns + c] or 0

	h00 = grid_height(r0, c0)
	h10 = grid_height(r0, c1)
	h01 = grid_height(r1, c0)
	h11 = grid_height(r1, c1)
	h0 = h00 * (1 - tx) + h10 * tx
	h1 = h01 * (1 - tx) + h11 * tx
	return h0 * (1 - tz) + h1 * tz


def deterministic_index(value, modulo):
	text = str(value)
	total = 0

	for index, char in enumerate(text):
		total += (index + 1) * ord(char)

	return total % modulo


def get_visual_building_center(centroid):
	block_center_x = round(centroid["x"] / BUILDING_SPACING_BLOCK_WORLD_UNITS) * BUILDING_SPACING_BLOCK_WORLD_UNITS
	block_center_z = round(centroid["z"] / BUILDING_SPACING_BLOCK_WORLD_UNITS) * BUILDING_SPACING_BLOCK_WORLD_UNITS

	return {
		"x": block_center_x + (centroid["x"] - block_center_x) * BUILDING_LOCAL_SPACING_SCALE,
		"z": block_center_z + (centroid["z"] - block_center_z) * BUILDING_LOCAL_SPACING_SCALE,
	}


def get_visual_building_points(points, centroid, visual_center):
	return [
		{
			"x": visual_center["x"] + (point["x"] - centroid["x"]) * BUILDING_FOOTPRINT_SCALE,
			"z": visual_center["z"] + (point["z"] - centroid["z"]) * BUILDING_FOOTPRINT_SCALE,
		}
		for point in points
	]


def create_mesh(dem):
	columns = dem["columns"]
	rows = dem["rows"]
	bounds = dem["worldBounds"]
	heights = dem["heights"]
	verts = []
	faces = []

	for row in range(rows):
		z = bounds["minZ"] + ((bounds["maxZ"] - bounds["minZ"]) * row) / max(1, rows - 1)

		for column in range(columns):
			x = bounds["minX"] + ((bounds["maxX"] - bounds["minX"]) * column) / max(1, columns - 1)
			y = heights[row * columns + column] or 0
			verts.append(to_blender_point(x, z, y))

	for row in range(rows - 1):
		for column in range(columns - 1):
			a = row * columns + column
			b = a + 1
			d = (row + 1) * columns + column
			c = d + 1
			faces.append((a, b, c, d))

	mesh = bpy.data.meshes.new("ground1-mesh")
	mesh.from_pydata(verts, [], faces)
	mesh.update()

	terrain = bpy.data.objects.new("ground1", mesh)
	bpy.context.scene.collection.objects.link(terrain)
	terrain.data.materials.append(create_material())

	uv_layer = terrain.data.uv_layers.new(name="puerto-city-aoi-uv")
	width = bounds["maxX"] - bounds["minX"]
	depth = bounds["maxZ"] - bounds["minZ"]

	for polygon in terrain.data.polygons:
		for loop_index in polygon.loop_indices:
			vertex = terrain.data.vertices[terrain.data.loops[loop_index].vertex_index].co
			u = (vertex.x - bounds["minX"]) / width
			v = 1 - (vertex.y - bounds["minZ"]) / depth
			uv_layer.data[loop_index].uv = (u, v)

	bpy.context.view_layer.objects.active = terrain
	terrain.select_set(True)
	bpy.ops.object.shade_smooth()

	return terrain


def create_city_buildings(dem):
	if not BUILDINGS_PATH.exists():
		return {"footprintCount": 0}

	building_data = json.loads(BUILDINGS_PATH.read_text())
	footprints = building_data.get("buildingFootprints", [])
	verts = []
	faces = []
	face_materials = []
	facade_colors = [
		(0.72, 0.67, 0.55, 1.0),
		(0.78, 0.73, 0.61, 1.0),
		(0.64, 0.58, 0.48, 1.0),
		(0.56, 0.50, 0.42, 1.0),
		(0.68, 0.38, 0.28, 1.0),
		(0.50, 0.60, 0.52, 1.0),
	]
	roof_colors = [
		(0.58, 0.18, 0.11, 1.0),
		(0.34, 0.22, 0.17, 1.0),
		(0.17, 0.17, 0.15, 1.0),
		(0.55, 0.38, 0.22, 1.0),
	]
	materials = [
		*[
			create_principled_material(f"puerto-facade-{index}", color, 0.84)
			for index, color in enumerate(facade_colors)
		],
		*[
			create_principled_material(f"puerto-roof-{index}", color, 0.88)
			for index, color in enumerate(roof_colors)
		],
	]
	roof_offset = len(facade_colors)
	created_count = 0

	for footprint in footprints:
		points = footprint.get("points", [])

		if len(points) < 3 or footprint.get("areaWorldUnits", 0) < 4:
			continue

		seed = footprint.get("id", created_count)
		facade_material = deterministic_index(seed, len(facade_colors))
		roof_material = roof_offset + deterministic_index(f"{seed}:roof", len(roof_colors))
		is_hotel = footprint.get("tags", {}).get("tourism") == "hotel"
		height_meters = footprint.get("heightMeters") or 7.5
		centroid = footprint.get("centroid") or {
			"x": sum(point["x"] for point in points) / len(points),
			"z": sum(point["z"] for point in points) / len(points),
		}
		visual_center = get_visual_building_center(centroid)
		visual_points = get_visual_building_points(points, centroid, visual_center)
		height_world = max(3.6, min(26.0, height_meters * (0.5 if is_hotel else 0.42) * BUILDING_HEIGHT_SCALE))
		base_heights = [sample_height(dem, point["x"], point["z"]) + 0.07 for point in visual_points]
		top_height = max(base_heights) + height_world
		bottom_indices = []
		top_indices = []

		for point, base_height in zip(visual_points, base_heights):
			bottom_indices.append(len(verts))
			verts.append(to_blender_point(point["x"], point["z"], base_height))
			top_indices.append(len(verts))
			verts.append(to_blender_point(point["x"], point["z"], top_height))

		for index in range(len(visual_points)):
			next_index = (index + 1) % len(visual_points)
			faces.append(
				(
					bottom_indices[index],
					bottom_indices[next_index],
					top_indices[next_index],
					top_indices[index],
				)
			)
			face_materials.append(facade_material)

		center_index = len(verts)
		verts.append(to_blender_point(visual_center["x"], visual_center["z"], top_height + 0.03))

		for index in range(len(visual_points)):
			next_index = (index + 1) % len(visual_points)
			faces.append((center_index, top_indices[index], top_indices[next_index]))
			face_materials.append(roof_material)

		created_count += 1

	mesh = bpy.data.meshes.new("puerto-osm-city-buildings-mesh")
	mesh.from_pydata(verts, [], faces)
	mesh.update()

	city = bpy.data.objects.new("puerto-osm-city-buildings", mesh)
	bpy.context.scene.collection.objects.link(city)

	for material in materials:
		city.data.materials.append(material)

	for polygon, material_index in zip(city.data.polygons, face_materials):
		polygon.material_index = material_index

	bpy.context.view_layer.objects.active = city
	city.select_set(True)
	bpy.ops.object.shade_flat()
	city.select_set(False)

	return {"footprintCount": created_count}


def create_landuse_overlays(dem):
	if not CITY_LAYERS_PATH.exists():
		return {"polygonCount": 0}

	city_layers = json.loads(CITY_LAYERS_PATH.read_text())
	polygons = city_layers.get("landusePolygons", [])
	material_by_tag = {
		"garden": 0,
		"park": 0,
		"common": 0,
		"dog_park": 0,
		"golf_course": 0,
		"outdoor_seating": 0,
		"playground": 1,
		"pitch": 1,
		"sports_centre": 1,
		"stadium": 1,
		"track": 1,
		"swimming_pool": 2,
		"water": 2,
		"water_park": 2,
		"retail": 3,
	}
	materials = [
		create_principled_material("puerto-garden-overlay", (0.19, 0.34, 0.17, 1.0), 0.95),
		create_principled_material("puerto-sport-overlay", (0.23, 0.42, 0.22, 1.0), 0.9),
		create_principled_material("puerto-pool-overlay", (0.04, 0.48, 0.62, 1.0), 0.52),
		create_principled_material("puerto-urban-plaza-overlay", (0.58, 0.53, 0.44, 1.0), 0.9),
	]
	verts = []
	faces = []
	face_materials = []
	created_count = 0

	for polygon in polygons:
		points = polygon.get("points", [])
		material_index = material_by_tag.get(polygon.get("tag"))

		if material_index is None or len(points) < 3:
			continue

		center_x = sum(point["x"] for point in points) / len(points)
		center_z = sum(point["z"] for point in points) / len(points)
		center_index = len(verts)
		verts.append(to_blender_point(center_x, center_z, sample_height(dem, center_x, center_z) + 0.12))
		point_indices = []

		for point in points:
			point_indices.append(len(verts))
			verts.append(
				to_blender_point(point["x"], point["z"], sample_height(dem, point["x"], point["z"]) + 0.1)
			)

		for index in range(len(point_indices)):
			next_index = (index + 1) % len(point_indices)
			faces.append((center_index, point_indices[index], point_indices[next_index]))
			face_materials.append(material_index)

		created_count += 1

	mesh = bpy.data.meshes.new("puerto-landuse-overlays-mesh")
	mesh.from_pydata(verts, [], faces)
	mesh.update()
	overlays = bpy.data.objects.new("puerto-landuse-overlays", mesh)
	bpy.context.scene.collection.objects.link(overlays)

	for material in materials:
		overlays.data.materials.append(material)

	for polygon, material_index in zip(overlays.data.polygons, face_materials):
		polygon.material_index = material_index

	return {"polygonCount": created_count}


def create_ocean_and_coast(dem):
	bounds = dem["worldBounds"]
	ocean_material = create_principled_material("puerto-atlantic-ocean", (0.03, 0.36, 0.5, 0.82), 0.38)
	basalt_material = create_principled_material("puerto-black-volcanic-coast", (0.045, 0.041, 0.037, 1.0), 0.96)
	foam_material = create_principled_material("puerto-coast-foam-line", (0.78, 0.88, 0.84, 1.0), 0.65)
	ocean_y = max(0.78, dem["minHeight"] + 0.14)
	ocean_verts = [
		to_blender_point(bounds["minX"] - 900, bounds["minZ"] - 1300, ocean_y),
		to_blender_point(bounds["maxX"] + 900, bounds["minZ"] - 1300, ocean_y),
		to_blender_point(bounds["maxX"] + 900, bounds["minZ"] + 170, ocean_y),
		to_blender_point(bounds["minX"] - 900, bounds["minZ"] + 135, ocean_y),
	]
	ocean_mesh = bpy.data.meshes.new("puerto-atlantic-ocean-mesh")
	ocean_mesh.from_pydata(ocean_verts, [], [(0, 1, 2, 3)])
	ocean_mesh.update()
	ocean = bpy.data.objects.new("puerto-atlantic-ocean", ocean_mesh)
	bpy.context.scene.collection.objects.link(ocean)
	ocean.data.materials.append(ocean_material)

	strip_steps = 80
	coast_verts = []
	coast_faces = []
	foam_verts = []
	foam_faces = []

	for index in range(strip_steps + 1):
		t = index / strip_steps
		x = bounds["minX"] + (bounds["maxX"] - bounds["minX"]) * t
		wave = 18 * __import__("math").sin(t * 18.0) + 7 * __import__("math").sin(t * 43.0)
		inner_z = bounds["minZ"] + 245 + wave
		outer_z = bounds["minZ"] + 128 + wave * 0.45
		coast_verts.append(to_blender_point(x, outer_z, sample_height(dem, x, outer_z) + 0.16))
		coast_verts.append(to_blender_point(x, inner_z, sample_height(dem, x, inner_z) + 0.2))
		foam_verts.append(to_blender_point(x, outer_z - 4, ocean_y + 0.03))
		foam_verts.append(to_blender_point(x, outer_z + 4, ocean_y + 0.04))

	for index in range(strip_steps):
		a = index * 2
		coast_faces.append((a, a + 1, a + 3, a + 2))
		foam_faces.append((a, a + 1, a + 3, a + 2))

	coast_mesh = bpy.data.meshes.new("puerto-volcanic-coast-mesh")
	coast_mesh.from_pydata(coast_verts, [], coast_faces)
	coast_mesh.update()
	coast = bpy.data.objects.new("puerto-volcanic-coast", coast_mesh)
	bpy.context.scene.collection.objects.link(coast)
	coast.data.materials.append(basalt_material)

	foam_mesh = bpy.data.meshes.new("puerto-coast-foam-mesh")
	foam_mesh.from_pydata(foam_verts, [], foam_faces)
	foam_mesh.update()
	foam = bpy.data.objects.new("puerto-coast-foam-line", foam_mesh)
	bpy.context.scene.collection.objects.link(foam)
	foam.data.materials.append(foam_material)

	return {"hasCoast": True, "hasOcean": True}


def create_teide_backdrop(dem):
	import math

	bounds = dem["worldBounds"]
	ridge_material = create_principled_material("puerto-orotava-valley-ridge", (0.28, 0.32, 0.29, 1.0), 0.94)
	teide_material = create_principled_material("puerto-teide-volcano", (0.33, 0.27, 0.22, 1.0), 0.96)
	cap_material = create_principled_material("puerto-teide-summit-cap", (0.78, 0.74, 0.67, 1.0), 0.88)
	ridge_steps = 28
	ridge_verts = []
	ridge_faces = []
	ridge_z = bounds["maxZ"] + 210

	for index in range(ridge_steps + 1):
		t = index / ridge_steps
		x = bounds["minX"] - 620 + (bounds["maxX"] - bounds["minX"] + 1240) * t
		peak = 76 + 82 * math.exp(-((t - 0.58) / 0.18) ** 2) + 22 * math.sin(t * math.pi * 3)
		ridge_verts.append(to_blender_point(x, ridge_z, 38))
		ridge_verts.append(to_blender_point(x, ridge_z + 42, peak))

	for index in range(ridge_steps):
		a = index * 2
		ridge_faces.append((a, a + 1, a + 3, a + 2))

	ridge_mesh = bpy.data.meshes.new("puerto-orotava-valley-ridge-mesh")
	ridge_mesh.from_pydata(ridge_verts, [], ridge_faces)
	ridge_mesh.update()
	ridge = bpy.data.objects.new("puerto-orotava-valley-ridge", ridge_mesh)
	bpy.context.scene.collection.objects.link(ridge)
	ridge.data.materials.append(ridge_material)

	center_x = 165
	center_z = bounds["maxZ"] + 390
	base_height = 56
	peak_height = 470
	segments = 56
	verts = []
	faces = []

	for index in range(segments):
		angle = (index / segments) * math.tau
		verts.append(
			to_blender_point(
				center_x + math.cos(angle) * 290,
				center_z + math.sin(angle) * 210,
				base_height + math.sin(angle * 2) * 7,
			)
		)

	peak_index = len(verts)
	verts.append(to_blender_point(center_x + 18, center_z + 20, peak_height))
	base_center_index = len(verts)
	verts.append(to_blender_point(center_x, center_z, base_height - 2))

	for index in range(segments):
		next_index = (index + 1) % segments
		faces.append((index, next_index, peak_index))
		faces.append((base_center_index, next_index, index))

	teide_mesh = bpy.data.meshes.new("puerto-teide-volcano-mesh")
	teide_mesh.from_pydata(verts, [], faces)
	teide_mesh.update()
	teide = bpy.data.objects.new("puerto-teide-volcano", teide_mesh)
	bpy.context.scene.collection.objects.link(teide)
	teide.data.materials.append(teide_material)

	cap_radius = 54
	cap_base = peak_height - 38
	cap_verts = []
	cap_faces = []

	for index in range(segments):
		angle = (index / segments) * math.tau
		cap_verts.append(
			to_blender_point(
				center_x + 18 + math.cos(angle) * cap_radius,
				center_z + 20 + math.sin(angle) * cap_radius * 0.72,
				cap_base,
			)
		)

	cap_peak_index = len(cap_verts)
	cap_verts.append(to_blender_point(center_x + 18, center_z + 20, peak_height + 1))

	for index in range(segments):
		cap_faces.append((index, (index + 1) % segments, cap_peak_index))

	cap_mesh = bpy.data.meshes.new("puerto-teide-summit-cap-mesh")
	cap_mesh.from_pydata(cap_verts, [], cap_faces)
	cap_mesh.update()
	cap = bpy.data.objects.new("puerto-teide-summit-cap", cap_mesh)
	bpy.context.scene.collection.objects.link(cap)
	cap.data.materials.append(cap_material)

	return {"hasOrotavaRidge": True, "hasTeideBackdrop": True}


def update_metadata(dem, terrain, visual_counts):
	if METADATA_PATH.exists():
		metadata = json.loads(METADATA_PATH.read_text())
	else:
		metadata = {"version": 1}

	metadata["terrain"] = {
		"blendPath": str(BLEND_PATH.relative_to(ROOT)),
		"collisionStrategy": "static mesh terrain for raycasts and environment collision",
		"columns": dem["columns"],
		"glbPath": str(GLB_PATH.relative_to(ROOT)),
		"maxHeight": dem["maxHeight"],
		"minHeight": dem["minHeight"],
		"rows": dem["rows"],
		"sourceKind": dem["sourceKind"],
		"triangleCount": len(terrain.data.polygons) * 2,
		"vertexCount": len(terrain.data.vertices),
		"worldBounds": dem["worldBounds"],
	}
	metadata["visualModel"] = {
		"buildingFootprintCount": visual_counts["buildings"]["footprintCount"],
		"coast": visual_counts["coast"],
		"landuseOverlayCount": visual_counts["landuse"]["polygonCount"],
		"referenceBasis": [
			{
				"focus": "coastline, volcanic foreshore, Lago Martianez, and town setting",
				"url": "https://tenerifepost.com/puertodelacruz.html",
			},
			{
				"focus": "aerial city massing, coast, Atlantic edge, and colorful dense buildings",
				"url": "https://www.pexels.com/photo/aerial-view-of-puerto-de-la-cruz-tenerife-coastline-30372578/",
			},
			{
				"focus": "coastal architecture and rugged waterfront composition",
				"url": "https://www.pexels.com/photo/breathtaking-coastal-view-in-puerto-de-la-cruz-31391838/",
			},
			{
				"focus": "Puerto de la Cruz coast and black volcanic shore references",
				"url": "https://commons.wikimedia.org/wiki/Category:Coasts_of_Puerto_de_la_Cruz",
			},
			{
				"focus": "Puerto de la Cruz panorama with Teide volcano in the background",
				"url": "https://sasvata.travel/inspiration/aerial_view_of_puerto_de_la_cruz_with_teide_volcano_in_the_background_tenerife_by_sasvata-travel-jpg/",
			},
		],
		"style": "procedural low-poly city massing from OSM footprints with photo-reference-inspired colors",
		"visualScale": {
			"buildingFootprintScale": BUILDING_FOOTPRINT_SCALE,
			"buildingHeightScale": BUILDING_HEIGHT_SCALE,
			"buildingLocalSpacingScale": BUILDING_LOCAL_SPACING_SCALE,
			"buildingSpacingBlockWorldUnits": BUILDING_SPACING_BLOCK_WORLD_UNITS,
		},
		"teide": visual_counts["teide"],
	}
	METADATA_PATH.parent.mkdir(parents=True, exist_ok=True)
	METADATA_PATH.write_text(json.dumps(metadata, indent="\t") + "\n")


def main():
	clear_scene()
	dem = json.loads(DEM_PATH.read_text())
	terrain = create_mesh(dem)
	visual_counts = {
		"buildings": create_city_buildings(dem),
		"coast": create_ocean_and_coast(dem),
		"landuse": create_landuse_overlays(dem),
		"teide": create_teide_backdrop(dem),
	}

	BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
	GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
	bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
	bpy.ops.export_scene.gltf(
		filepath=str(GLB_PATH),
		export_format="GLB",
		export_apply=True,
		export_yup=True,
	)
	update_metadata(dem, terrain, visual_counts)
	print(
		f"Wrote {GLB_PATH.relative_to(ROOT)} with {len(terrain.data.vertices)} vertices "
		f"and {len(terrain.data.polygons) * 2} terrain triangles plus "
		f"{visual_counts['buildings']['footprintCount']} city footprints"
	)


if __name__ == "__main__":
	main()
