import json
from pathlib import Path

import bpy
from mathutils import Vector
import math

ROOT = Path(__file__).resolve().parents[2]
SOURCE_GLB_PATH = ROOT / "public" / "models" / "environment" / "tenerife-full-island-normalized.glb"
OUTPUT_JSON_PATH = ROOT / "public" / "data" / "shoreline-path.json"

TERRAIN_PREFIX = "tenerife-full-island-terrain-tile-"
RUNTIME_SCALE = 0.02
WATER_SURFACE_Y = -3.75
SHORELINE_BUCKET_COUNT = 192
SHORELINE_MIN_RADIUS = 180
SHORELINE_POINT_Y_TOLERANCE = 10

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

def import_source():
    bpy.ops.import_scene.gltf(filepath=str(SOURCE_GLB_PATH))

def get_terrain_objects():
    return [
        obj for obj in bpy.context.scene.objects
        if obj.type == "MESH" and obj.name.startswith(TERRAIN_PREFIX) and len(obj.data.polygons) > 0
    ]

def main():
    clear_scene()
    import_source()
    terrain_objects = get_terrain_objects()

    if not terrain_objects:
        raise RuntimeError(f"No terrain meshes named {TERRAIN_PREFIX}* found")

    buckets = [None] * SHORELINE_BUCKET_COUNT

    for obj in terrain_objects:
        # Bake world matrix
        world_matrix = obj.matrix_world

        for vertex in obj.data.vertices:
            # Note: in Babylon.js it's X, Y, Z. Blender is X, Y, Z but Y and Z are swapped for Y-up
            # Actually, the runtime map builder used:
            # "x": -point.x * RUNTIME_SCALE,
            # "z": -point.y * RUNTIME_SCALE,
            # "y": point.z * RUNTIME_SCALE,
            world_co = world_matrix @ vertex.co
            x = -world_co.x * RUNTIME_SCALE
            z = -world_co.y * RUNTIME_SCALE
            y = world_co.z * RUNTIME_SCALE

            yDistance = abs(y - WATER_SURFACE_Y)
            radius = math.hypot(x, z)

            if yDistance > SHORELINE_POINT_Y_TOLERANCE or radius < SHORELINE_MIN_RADIUS:
                continue

            angle = math.atan2(z, x)
            normalizedAngle = angle if angle >= 0 else angle + math.pi * 2
            bucketIndex = min(
                SHORELINE_BUCKET_COUNT - 1,
                math.floor((normalizedAngle / (math.pi * 2)) * SHORELINE_BUCKET_COUNT)
            )
            score = yDistance - radius * 0.001
            current = buckets[bucketIndex]

            if not current or score < current["score"]:
                buckets[bucketIndex] = {
                    "angle": normalizedAngle,
                    "point": {"x": x, "y": y, "z": z},
                    "score": score
                }

    path_data = [
        {"angle": b["angle"], "point": b["point"]}
        for b in buckets if b is not None
    ]
    path_data.sort(key=lambda x: x["angle"])

    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON_PATH.write_text(json.dumps(path_data, indent=2))
    print(f"Extracted {len(path_data)} shoreline points to {OUTPUT_JSON_PATH.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
