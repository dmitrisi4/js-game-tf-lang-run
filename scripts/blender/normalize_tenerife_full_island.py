import json
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE_GLB_PATH = ROOT / "public" / "models" / "land" / "tenerife._islas_canarias.glb"
OUTPUT_GLB_PATH = ROOT / "public" / "models" / "environment" / "tenerife-full-island-normalized.glb"
LOW_RUNTIME_GLB_PATH = (
	ROOT / "public" / "models" / "environment" / "tenerife-full-island-runtime-low.glb"
)
METADATA_PATH = ROOT / "public" / "data" / "tenerife" / "full-island-metadata.json"

ASSET_ID = "tenerife-full-island"
RUNTIME_TEXTURE_SIZE = 2048
LOW_RUNTIME_DECIMATE_RATIO = 0.24
SOURCE_TITLE = "Tenerife. Islas Canarias"
SOURCE_AUTHOR = "Unknown08tf"
SOURCE_AUTHOR_URL = "https://sketchfab.com/Unknown08tf"
SOURCE_URL = "https://sketchfab.com/3d-models/tenerife-islas-canarias-628865c6fe29460bb2f6a8ba8d223087"
SOURCE_LICENSE = "CC-BY-4.0"
SOURCE_LICENSE_URL = "http://creativecommons.org/licenses/by/4.0/"
MIN_RUNTIME_LAND_HEIGHT_METERS = 1.5


def clear_scene():
	bpy.ops.object.select_all(action="SELECT")
	bpy.ops.object.delete()


def import_source():
	bpy.ops.import_scene.gltf(filepath=str(SOURCE_GLB_PATH))


def get_terrain_objects():
	return [
		obj
		for obj in bpy.context.scene.objects
		if obj.type == "MESH" and obj.name.startswith("Object_")
	]


def normalize_materials():
	for material in bpy.data.materials:
		if material.name != "material_0":
			continue

		material.name = "tenerife-full-island-albedo-material"
		material.use_nodes = True

		for image in bpy.data.images:
			if image.name == "Image_0":
				image.name = "tenerife-full-island-albedo-4096"
				if image.size[0] > RUNTIME_TEXTURE_SIZE or image.size[1] > RUNTIME_TEXTURE_SIZE:
					image.scale(RUNTIME_TEXTURE_SIZE, RUNTIME_TEXTURE_SIZE)


def normalize_terrain_objects(terrain_objects):
	terrain_objects.sort(key=lambda obj: obj.name)

	for index, obj in enumerate(terrain_objects):
		obj.name = f"tenerife-full-island-terrain-tile-{index:02d}"
		obj.data.name = f"tenerife-full-island-terrain-tile-{index:02d}-mesh"
		obj["assetId"] = ASSET_ID
		obj["collisionPolicy"] = "visual-only-first-pass"
		obj["sourceLicense"] = SOURCE_LICENSE
		obj.select_set(True)
		bpy.context.view_layer.objects.active = obj
		bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
		obj.select_set(False)


def remove_flat_background_faces(terrain_objects):
	for obj in terrain_objects:
		mesh = obj.data
		remove_faces = [
			polygon.index
			for polygon in mesh.polygons
			if max(mesh.vertices[vertex_index].co.z for vertex_index in polygon.vertices)
			< MIN_RUNTIME_LAND_HEIGHT_METERS
		]

		if not remove_faces:
			continue

		bpy.context.view_layer.objects.active = obj
		obj.select_set(True)
		bpy.ops.object.mode_set(mode="EDIT")
		bpy.ops.mesh.select_mode(type="FACE")
		bpy.ops.mesh.select_all(action="DESELECT")
		bpy.ops.object.mode_set(mode="OBJECT")

		for face_index in remove_faces:
			mesh.polygons[face_index].select = True

		bpy.ops.object.mode_set(mode="EDIT")
		bpy.ops.mesh.delete(type="FACE")
		bpy.ops.object.mode_set(mode="OBJECT")
		obj.select_set(False)
		mesh.update()


def compute_object_bounds(obj):
	corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
	return {
		"min": [min(corner[index] for corner in corners) for index in range(3)],
		"max": [max(corner[index] for corner in corners) for index in range(3)],
	}


def compute_combined_bounds(objects):
	mins = [float("inf"), float("inf"), float("inf")]
	maxs = [float("-inf"), float("-inf"), float("-inf")]

	for obj in objects:
		bounds = compute_object_bounds(obj)
		for index in range(3):
			mins[index] = min(mins[index], bounds["min"][index])
			maxs[index] = max(maxs[index], bounds["max"][index])

	return {
		"max": maxs,
		"min": mins,
		"size": [maxs[index] - mins[index] for index in range(3)],
	}


def write_metadata(terrain_objects):
	combined_bounds = compute_combined_bounds(terrain_objects)
	terrain_tiles = []

	for obj in terrain_objects:
		terrain_tiles.append(
			{
				"bounds": compute_object_bounds(obj),
				"name": obj.name,
				"polygons": len(obj.data.polygons),
				"vertices": len(obj.data.vertices),
			}
		)

	METADATA_PATH.parent.mkdir(parents=True, exist_ok=True)
	METADATA_PATH.write_text(
		json.dumps(
			{
				"assetId": ASSET_ID,
				"attribution": {
					"author": SOURCE_AUTHOR,
					"authorUrl": SOURCE_AUTHOR_URL,
					"license": SOURCE_LICENSE,
					"licenseUrl": SOURCE_LICENSE_URL,
					"sourceTitle": SOURCE_TITLE,
					"sourceUrl": SOURCE_URL,
				},
				"collisionStrategy": "visual-only first pass; use simplified static collider or height proxy before gameplay authority",
				"combinedBounds": combined_bounds,
				"runtime": {
					"glbPath": str(OUTPUT_GLB_PATH.relative_to(ROOT)),
					"lowGlbPath": str(LOW_RUNTIME_GLB_PATH.relative_to(ROOT)),
					"sourcePath": str(SOURCE_GLB_PATH.relative_to(ROOT)),
					"terrainMode": "island-full",
				},
				"terrain": {
					"approxTriangles": sum(len(obj.data.polygons) for obj in terrain_objects),
					"maxElevationMeters": combined_bounds["max"][2],
					"minElevationMeters": combined_bounds["min"][2],
					"tileCount": len(terrain_objects),
					"tiles": terrain_tiles,
					"vertices": sum(len(obj.data.vertices) for obj in terrain_objects),
				},
				"textureBudget": {
					"sourceEmbeddedBaseColor": "8192x8192 PNG",
					"runtimeBaseColor": f"{RUNTIME_TEXTURE_SIZE}x{RUNTIME_TEXTURE_SIZE}",
					"mipmaps": True,
				},
				"normalization": {
					"lowRuntimeDecimateRatio": LOW_RUNTIME_DECIMATE_RATIO,
					"minRuntimeLandHeightMeters": MIN_RUNTIME_LAND_HEIGHT_METERS,
					"removedFlatSeaBackgroundFaces": True,
				},
				"version": 1,
			},
			indent="\t",
		)
		+ "\n"
	)


def export_runtime_glb():
	OUTPUT_GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
	bpy.ops.export_scene.gltf(
		filepath=str(OUTPUT_GLB_PATH),
		export_format="GLB",
		export_apply=True,
		export_yup=True,
	)


def decimate_runtime_terrain(terrain_objects):
	for obj in terrain_objects:
		if len(obj.data.polygons) == 0:
			continue

		bpy.context.view_layer.objects.active = obj
		obj.select_set(True)
		modifier = obj.modifiers.new("tenerife-full-island-low-runtime-decimate", "DECIMATE")
		modifier.ratio = LOW_RUNTIME_DECIMATE_RATIO
		modifier.use_collapse_triangulate = True
		bpy.ops.object.modifier_apply(modifier=modifier.name)
		obj.select_set(False)


def export_low_runtime_glb():
	LOW_RUNTIME_GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
	bpy.ops.export_scene.gltf(
		filepath=str(LOW_RUNTIME_GLB_PATH),
		export_format="GLB",
		export_apply=True,
		export_yup=True,
	)


def main():
	clear_scene()
	import_source()
	terrain_objects = get_terrain_objects()

	if not terrain_objects:
		raise RuntimeError(f"No terrain objects found in {SOURCE_GLB_PATH}")

	normalize_materials()
	normalize_terrain_objects(terrain_objects)
	remove_flat_background_faces(terrain_objects)
	export_runtime_glb()
	decimate_runtime_terrain(terrain_objects)
	export_low_runtime_glb()
	write_metadata(terrain_objects)
	print(
		f"Wrote {OUTPUT_GLB_PATH.relative_to(ROOT)} and "
		f"{LOW_RUNTIME_GLB_PATH.relative_to(ROOT)} with "
		f"{sum(len(obj.data.vertices) for obj in terrain_objects)} vertices"
	)


if __name__ == "__main__":
	main()
