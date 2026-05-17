import math
import json
import random
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
BLEND_PATH = ROOT / "art" / "blender" / "tenerife_island_location.blend"
GLB_PATH = ROOT / "public" / "models" / "environment" / "tenerife-island-location.glb"
PREVIEW_PATH = ROOT / "art" / "blender" / "tenerife_island_location_preview.png"
PUERTO_OSM_PATH = ROOT / "data" / "tenerife" / "puerto_de_la_cruz_osm.json"

RANDOM_SEED = 7
GRID_HALF_SIZE_KM = 54.0
GRID_STEPS = 156
ISLAND_LONG_RADIUS_KM = 43.0
COASTLINE_DISTANCE_FADE_KM = 13.5
COASTLINE_NOISE_KM = 0.34
HEIGHT_EXAGGERATION = 1.18
RENDER_PREVIEW = False
PUERTO_OSM_CENTER_LAT = 28.4147
PUERTO_OSM_CENTER_LON = -16.5481
PUERTO_OSM_DETAIL_SCALE = 2.7
MAX_PUERTO_OSM_BUILDINGS = 450
MAX_PUERTO_OSM_ROADS = 650

CITY_SITES = [
    {
        "id": "santa_cruz",
        "display": "Santa Cruz",
        "x": 35.0,
        "z": 7.2,
        "radius": 2.8,
        "blocks": 18,
        "marker_radius": 0.52,
    },
    {
        "id": "la_laguna",
        "display": "La Laguna",
        "x": 29.5,
        "z": 9.8,
        "radius": 2.1,
        "blocks": 12,
        "marker_radius": 0.42,
    },
    {
        "id": "puerto_cruz",
        "display": "Puerto de la Cruz",
        "x": 6.5,
        "z": 15.4,
        "radius": 6.3,
        "blocks": 0,
        "marker_radius": 0.52,
    },
    {
        "id": "la_orotava",
        "display": "La Orotava",
        "x": 2.2,
        "z": 12.4,
        "radius": 2.0,
        "blocks": 10,
        "marker_radius": 0.36,
    },
    {
        "id": "adeje",
        "display": "Adeje",
        "x": -20.5,
        "z": -12.4,
        "radius": 2.2,
        "blocks": 11,
        "marker_radius": 0.42,
    },
    {
        "id": "los_cristianos",
        "display": "Los Cristianos",
        "x": -11.5,
        "z": -15.4,
        "radius": 2.2,
        "blocks": 12,
        "marker_radius": 0.4,
    },
    {
        "id": "garachico",
        "display": "Garachico",
        "x": -25.0,
        "z": 9.2,
        "radius": 1.7,
        "blocks": 8,
        "marker_radius": 0.34,
    },
]

TENERIFE_COASTLINE_POINTS = [
    (-40.5, -2.2),
    (-38.2, 2.4),
    (-34.5, 4.8),
    (-30.0, 7.8),
    (-23.5, 9.8),
    (-15.5, 11.5),
    (-7.2, 13.4),
    (1.8, 16.2),
    (8.8, 17.1),
    (15.0, 15.7),
    (22.8, 13.6),
    (28.8, 14.2),
    (34.8, 17.1),
    (41.5, 17.6),
    (44.0, 13.9),
    (41.7, 9.5),
    (37.8, 6.4),
    (35.1, 2.6),
    (31.6, -1.5),
    (27.2, -6.2),
    (23.0, -9.8),
    (17.8, -12.7),
    (10.8, -14.7),
    (4.0, -16.2),
    (-1.5, -18.2),
    (-8.8, -18.4),
    (-15.8, -16.7),
    (-21.8, -14.4),
    (-27.4, -11.4),
    (-31.7, -8.2),
    (-36.8, -5.6),
]


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1000.0


def make_mat(name, color, roughness=0.75, metallic=0.0, emission=None, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Alpha"].default_value = alpha
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission[0]
            bsdf.inputs["Emission Strength"].default_value = emission[1]
    if alpha < 1.0:
        mat.blend_method = "BLEND"
        mat.show_transparent_back = True
    return mat


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def blender_location(loc):
    x, y, z = loc
    return (x, z, y)


def blender_scale(scale):
    x, y, z = scale
    return (x, z, y)


def blender_rotation(rotation):
    x, y, z = rotation
    return (x, z, y)


def create_collection(name):
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def link_to_collection(obj, collection):
    collection.objects.link(obj)
    for source_collection in list(obj.users_collection):
        if source_collection != collection and source_collection.name == "Collection":
            source_collection.objects.unlink(obj)


def add_cube(name, loc, scale, mat, collection, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=blender_location(loc),
        rotation=blender_rotation(rotation),
    )
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat)
    link_to_collection(obj, collection)
    return obj


def add_cylinder(name, loc, radius, depth, mat, collection, vertices=32, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=blender_location(loc),
        rotation=blender_rotation(rotation),
    )
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat)
    link_to_collection(obj, collection)
    return obj


def add_elliptical_cylinder(
    name,
    loc,
    size,
    mat,
    collection,
    vertices=32,
    rotation=(0, 0, 0),
):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=1,
        depth=1,
        location=blender_location(loc),
        rotation=blender_rotation(rotation),
    )
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = blender_scale(size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat)
    link_to_collection(obj, collection)
    return obj


def add_cone(name, loc, radius1, radius2, depth, mat, collection, vertices=48):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=blender_location(loc),
    )
    obj = bpy.context.object
    obj.name = name
    assign(obj, mat)
    link_to_collection(obj, collection)
    return obj


def add_uv_sphere(name, loc, scale, mat, collection, segments=16, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        radius=1,
        location=blender_location(loc),
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = blender_scale(scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, mat)
    link_to_collection(obj, collection)
    return obj


def add_text_label(name, text, loc, mat, collection, size=1.0):
    bpy.ops.object.text_add(location=blender_location(loc), rotation=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = text
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.025
    assign(obj, mat)
    link_to_collection(obj, collection)
    return obj


def add_curve_polyline(name, points, mat, collection, bevel_depth=0.055, z_offset=0.04):
    if len(points) < 2:
        return None

    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 8
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 2
    polyline = curve.splines.new("POLY")
    polyline.points.add(len(points) - 1)
    for point, coords in zip(polyline.points, points):
        x, y, z = coords
        bx, by, bz = blender_location((x, y + z_offset, z))
        point.co = (bx, by, bz, 1.0)
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    assign(obj, mat)
    return obj


def add_polygon_mesh(name, points, height, mat, collection, z_offset=0.0):
    if len(points) < 3:
        return None

    center_x = sum(point[0] for point in points) / len(points)
    center_z = sum(point[1] for point in points) / len(points)
    base_y = terrain_height(center_x, center_z) + z_offset
    verts = []

    for x, z in points:
        verts.append(blender_location((x, base_y, z)))

    for x, z in points:
        verts.append(blender_location((x, base_y + height, z)))

    count = len(points)
    faces = [tuple(range(count)), tuple(range(count, count * 2))]

    for index in range(count):
        next_index = (index + 1) % count
        faces.append((index, next_index, next_index + count, index + count))

    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    assign(obj, mat)
    weighted = obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")
    weighted.keep_sharp = True
    return obj


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def rotated_coords(x, z):
    # Tenerife is represented as a NE-SW island. u follows that long axis.
    angle = math.radians(-28.0)
    u = x * math.cos(angle) - z * math.sin(angle)
    v = x * math.sin(angle) + z * math.cos(angle)
    return u, v


def is_point_inside_polygon(x, z, polygon):
    inside = False
    previous_x, previous_z = polygon[-1]

    for current_x, current_z in polygon:
        crosses_z = (current_z > z) != (previous_z > z)

        if crosses_z:
            intersection_x = (previous_x - current_x) * (z - current_z) / (previous_z - current_z) + current_x

            if x < intersection_x:
                inside = not inside

        previous_x, previous_z = current_x, current_z

    return inside


def distance_to_segment(x, z, start, end):
    start_x, start_z = start
    end_x, end_z = end
    dx = end_x - start_x
    dz = end_z - start_z
    length_squared = dx * dx + dz * dz

    if length_squared == 0:
        return math.hypot(x - start_x, z - start_z)

    t = max(0.0, min(1.0, ((x - start_x) * dx + (z - start_z) * dz) / length_squared))
    nearest_x = start_x + t * dx
    nearest_z = start_z + t * dz
    return math.hypot(x - nearest_x, z - nearest_z)


def signed_distance_to_coastline(x, z):
    distance = min(
        distance_to_segment(
            x,
            z,
            TENERIFE_COASTLINE_POINTS[index],
            TENERIFE_COASTLINE_POINTS[(index + 1) % len(TENERIFE_COASTLINE_POINTS)],
        )
        for index in range(len(TENERIFE_COASTLINE_POINTS))
    )

    return distance if is_point_inside_polygon(x, z, TENERIFE_COASTLINE_POINTS) else -distance


def coastline_noise(x, z):
    return COASTLINE_NOISE_KM * (0.58 * math.sin(x * 0.72) + 0.42 * math.cos(z * 0.61))


def island_profile(x, z):
    u, v = rotated_coords(x, z)
    signed_distance = signed_distance_to_coastline(x, z)

    if signed_distance >= 0:
        normalized = 1.0 - min(signed_distance, COASTLINE_DISTANCE_FADE_KM) / COASTLINE_DISTANCE_FADE_KM
    else:
        normalized = 1.0 + min(abs(signed_distance), COASTLINE_DISTANCE_FADE_KM) / COASTLINE_DISTANCE_FADE_KM

    t = max(-1.0, min(1.0, u / ISLAND_LONG_RADIUS_KM))
    width = 13.5 + 8.0 * (1.0 - abs(t) ** 1.7)
    return normalized, u, v, width


def is_land(x, z):
    signed_distance = signed_distance_to_coastline(x, z)

    return signed_distance >= 0 or signed_distance + coastline_noise(x, z) >= 0


def gaussian(u, v, center_u, center_v, sigma_u, sigma_v, height):
    return height * math.exp(-(((u - center_u) / sigma_u) ** 2 + ((v - center_v) / sigma_v) ** 2))


def smoothstep(edge0, edge1, value):
    if edge0 == edge1:
        return 1.0 if value >= edge1 else 0.0
    t = max(0.0, min(1.0, (value - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def raw_terrain_height(x, z):
    normalized, u, v, _ = island_profile(x, z)
    if normalized >= 1.05:
        return -0.18

    coast_falloff = max(0.0, 1.0 - normalized) ** 0.38
    base = 0.12 + 0.32 * coast_falloff

    teide = gaussian(u, v, -2.2, 0.4, 7.0, 6.2, 3.05)
    teide_peak = gaussian(u, v, -2.4, 0.55, 2.35, 2.2, 1.05)
    caldera_wall = 0.55 * math.exp(-((math.sqrt((u + 2.0) ** 2 + (v - 0.2) ** 2) - 8.8) / 1.65) ** 2)
    caldera_floor = -0.22 * gaussian(u, v, -0.6, -0.2, 5.8, 4.8, 1.0)

    dorsal_ridge = gaussian(u, v, 13.0, 0.8, 18.0, 3.1, 0.82)
    anaga = gaussian(u, v, 35.0, 1.2, 6.6, 7.4, 1.12)
    teno = gaussian(u, v, -36.0, -0.2, 6.0, 6.5, 0.98)
    north_green_slope = gaussian(u, v, 3.0, 8.4, 30.0, 7.0, 0.38)
    south_lowlands = -gaussian(u, v, 13.0, -10.5, 20.0, 5.8, 0.16)

    ravines = (
        0.12 * math.sin(u * 0.72 + v * 0.24)
        + 0.08 * math.sin(u * 1.18 - v * 0.42)
        + 0.05 * math.cos(x * 0.47 + z * 0.31)
    )
    ravines *= max(0.0, normalized - 0.25) * max(0.0, 1.0 - normalized)

    height = (
        base
        + teide
        + teide_peak
        + caldera_wall
        + caldera_floor
        + dorsal_ridge
        + anaga
        + teno
        + north_green_slope
        + south_lowlands
        + ravines
    )
    return max(0.02, height * HEIGHT_EXAGGERATION)


def terrain_height(x, z):
    height = raw_terrain_height(x, z)

    for city in CITY_SITES:
        distance = math.hypot(x - city["x"], z - city["z"])
        inner_radius = city["radius"] * 0.68
        outer_radius = city["radius"] * 1.25

        if distance > outer_radius:
            continue

        target_height = raw_terrain_height(city["x"], city["z"])
        flatten_weight = 1.0 - smoothstep(inner_radius, outer_radius, distance)
        height = height * (1.0 - flatten_weight) + target_height * flatten_weight

    return height


def material_slot_for_point(x, z, height):
    normalized, u, v, _ = island_profile(x, z)
    if any(math.hypot(x - city["x"], z - city["z"]) < city["radius"] * 1.05 for city in CITY_SITES):
        return 6  # prepared urban pads.
    if normalized > 0.9:
        return 1  # beach/coast.
    if height > 3.3:
        return 4  # volcanic summit.
    if abs(u + 2.0) < 10.0 and abs(v) < 8.0 and height > 1.8:
        return 3  # Teide/caldera rock.
    if v > 1.5 and normalized > 0.35:
        return 2  # greener north.
    if v < -2.0:
        return 5  # dry south.
    return 0


def create_island_mesh(materials, collection):
    verts = []
    index_by_grid = {}
    step = (GRID_HALF_SIZE_KM * 2.0) / GRID_STEPS

    for zi in range(GRID_STEPS + 1):
        z = -GRID_HALF_SIZE_KM + zi * step
        for xi in range(GRID_STEPS + 1):
            x = -GRID_HALF_SIZE_KM + xi * step
            if not is_land(x, z):
                continue
            y = terrain_height(x, z)
            index_by_grid[(xi, zi)] = len(verts)
            verts.append(blender_location((x, y, z)))

    faces = []
    face_materials = []
    for zi in range(GRID_STEPS):
        for xi in range(GRID_STEPS):
            keys = ((xi, zi), (xi + 1, zi), (xi + 1, zi + 1), (xi, zi + 1))
            if not all(key in index_by_grid for key in keys):
                continue
            face = tuple(index_by_grid[key] for key in keys)
            faces.append(face)
            cx = -GRID_HALF_SIZE_KM + (xi + 0.5) * step
            cz = -GRID_HALF_SIZE_KM + (zi + 0.5) * step
            face_materials.append(material_slot_for_point(cx, cz, terrain_height(cx, cz)))

    mesh = bpy.data.meshes.new("tenerife_procedural_terrain_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new("env_tenerife_full_island_terrain_1unit_1km", mesh)
    collection.objects.link(obj)
    for mat in materials:
        obj.data.materials.append(mat)
    for polygon, mat_index in zip(obj.data.polygons, face_materials):
        polygon.material_index = mat_index

    obj["scale_note"] = "1 Blender unit is 1 kilometer for island blockout scale"
    obj["source_note"] = "Procedural art blockout inspired by Tenerife; not GIS DEM data"

    weighted = obj.modifiers.new("terrain_weighted_normals", "WEIGHTED_NORMAL")
    weighted.keep_sharp = True
    return obj


def create_ocean(mat, collection):
    ocean = add_cylinder("env_atlantic_ocean_disc", (0, -0.08, 0), 62.0, 0.08, mat, collection, vertices=128)
    ocean["gameplay_note"] = "visual ocean plane around island"
    return ocean


def create_coastline_markers(mat, collection):
    points = []
    for index, start in enumerate(TENERIFE_COASTLINE_POINTS):
        end = TENERIFE_COASTLINE_POINTS[(index + 1) % len(TENERIFE_COASTLINE_POINTS)]
        segment_length = math.hypot(end[0] - start[0], end[1] - start[1])
        segment_steps = max(1, int(segment_length / 0.9))

        for step_index in range(segment_steps):
            t = step_index / segment_steps
            x = start[0] + (end[0] - start[0]) * t
            z = start[1] + (end[1] - start[1]) * t
            points.append((x, terrain_height(x, z) + 0.02, z))

    add_curve_polyline("env_approx_coastline_outline", points + [points[0]], mat, collection, bevel_depth=0.035)


def create_roads(road_mat, collection):
    # Rough symbolic highways: north TF-5, south TF-1, and road toward Teide.
    routes = {
        "env_tf5_north_coast_route": [(-33, 1), (-25, 6), (-14, 10), (-2, 12), (6.5, 15.4), (11, 13), (25, 12), (36, 8)],
        "env_tf1_south_coast_route": [(35, 5), (26, -2), (17, -8), (5, -12), (-7, -13), (-11.5, -15.4), (-20, -11), (-32, -7)],
        "env_teide_access_route": [(-8, -13), (-5, -7), (-4, -1), (-3, 5), (-1, 10)],
        "env_west_masca_route": [(-35, -5), (-29, -2), (-23, 2), (-16, 5), (-8, 7)],
        "env_orotava_valley_city_link": [(6.5, 15.4), (2.2, 12.4), (-1, 10)],
        "env_north_capital_city_link": [(35.0, 7.2), (29.5, 9.8), (25, 12)],
    }

    for name, flat_points in routes.items():
        points = [(x, terrain_height(x, z), z) for x, z in flat_points if is_land(x, z)]
        add_curve_polyline(name, points, road_mat, collection, bevel_depth=0.09, z_offset=0.055)


def create_city_marker(name, display, x, z, city_mat, label_mat, collection, radius=0.45):
    y = terrain_height(x, z)
    add_cylinder(f"{name}_marker", (x, y + 0.11, z), radius, 0.22, city_mat, collection, vertices=16)
    add_text_label(f"{name}_label", display, (x, y + 0.55, z - 0.8), label_mat, collection, size=0.72)


def create_puerto_cruz_landmarks(x, z, y, radius, mats, collection):
    road_mat = mats["road"]
    building_mat = mats["building"]
    plaza_mat = mats["plaza"]
    harbor_mat = mats["harbor"]
    city_mat = mats["city"]
    label_mat = mats["label"]
    garden_mat = mats["garden"]
    water_mat = mats["water"]
    beach_mat = mats["beach"]

    add_elliptical_cylinder(
        "puerto_cruz_plaza_del_charco_blockout",
        (x - 0.25, y + 0.14, z + 0.18),
        (0.72, 0.08, 0.48),
        plaza_mat,
        collection,
        vertices=32,
    )
    add_elliptical_cylinder(
        "puerto_cruz_plaza_del_charco_fountain",
        (x - 0.25, y + 0.22, z + 0.18),
        (0.2, 0.06, 0.2),
        water_mat,
        collection,
        vertices=24,
    )
    add_text_label(
        "label_puerto_cruz_plaza_del_charco",
        "Plaza del Charco",
        (x - 0.25, y + 0.48, z - 0.28),
        label_mat,
        collection,
        size=0.32,
    )

    add_elliptical_cylinder(
        "puerto_cruz_lago_martianez_main_pool",
        (x + radius * 0.72, y + 0.12, z + radius * 0.53),
        (1.25, 0.06, 0.72),
        water_mat,
        collection,
        vertices=48,
        rotation=(0, math.radians(-8), 0),
    )
    for index, offset in enumerate([(-0.55, -0.26), (-0.12, 0.32), (0.42, -0.14)], start=1):
        add_elliptical_cylinder(
            f"puerto_cruz_lago_martianez_pool_{index}",
            (x + radius * 0.72 + offset[0], y + 0.16, z + radius * 0.53 + offset[1]),
            (0.34, 0.05, 0.22),
            water_mat,
            collection,
            vertices=24,
        )
    add_text_label(
        "label_puerto_cruz_lago_martianez",
        "Lago Martianez",
        (x + radius * 0.82, y + 0.48, z + radius * 0.18),
        label_mat,
        collection,
        size=0.32,
    )

    add_elliptical_cylinder(
        "puerto_cruz_playa_jardin_black_sand",
        (x - radius * 0.78, y + 0.08, z + radius * 0.48),
        (1.45, 0.04, 0.36),
        beach_mat,
        collection,
        vertices=32,
        rotation=(0, math.radians(10), 0),
    )
    add_cube(
        "puerto_cruz_castillo_san_felipe_blockout",
        (x - radius * 0.92, y + 0.24, z + radius * 0.36),
        (0.34, 0.32, 0.34),
        building_mat,
        collection,
        rotation=(0, math.radians(8), 0),
    )
    add_text_label(
        "label_puerto_cruz_playa_jardin",
        "Playa Jardin",
        (x - radius * 0.82, y + 0.42, z + radius * 0.06),
        label_mat,
        collection,
        size=0.3,
    )

    add_curve_polyline(
        "puerto_cruz_san_telmo_promenade",
        [
            (x + radius * 0.12, y, z + radius * 0.48),
            (x + radius * 0.36, y, z + radius * 0.72),
            (x + radius * 0.68, y, z + radius * 0.73),
            (x + radius * 0.98, y, z + radius * 0.56),
        ],
        road_mat,
        collection,
        bevel_depth=0.07,
        z_offset=0.13,
    )
    add_cube(
        "puerto_cruz_muelle_pesquero_and_aduana",
        (x + radius * 0.1, y + 0.12, z + radius * 0.82),
        (0.88, 0.12, 0.2),
        harbor_mat,
        collection,
        rotation=(0, math.radians(-4), 0),
    )

    add_elliptical_cylinder(
        "puerto_cruz_botanical_garden_pad",
        (x + radius * 0.52, y + 0.08, z - radius * 0.62),
        (0.86, 0.05, 0.58),
        garden_mat,
        collection,
        vertices=32,
        rotation=(0, math.radians(18), 0),
    )
    add_text_label(
        "label_puerto_cruz_botanical_garden",
        "Botanico",
        (x + radius * 0.52, y + 0.42, z - radius * 0.92),
        label_mat,
        collection,
        size=0.3,
    )

    add_elliptical_cylinder(
        "puerto_cruz_loro_parque_pad",
        (x - radius * 0.9, y + 0.08, z - radius * 0.34),
        (0.92, 0.05, 0.64),
        garden_mat,
        collection,
        vertices=32,
        rotation=(0, math.radians(-12), 0),
    )
    add_text_label(
        "label_puerto_cruz_loro_parque",
        "Loro Parque",
        (x - radius * 0.9, y + 0.42, z - radius * 0.68),
        label_mat,
        collection,
        size=0.3,
    )

    for index, (bx, bz, bw, bd) in enumerate(
        [
            (-0.7, 0.46, 0.36, 0.28),
            (-0.42, 0.62, 0.26, 0.34),
            (-0.06, 0.58, 0.32, 0.28),
            (0.22, 0.42, 0.3, 0.32),
            (0.42, 0.22, 0.28, 0.26),
        ],
        start=1,
    ):
        add_cube(
            f"puerto_cruz_la_ranilla_old_town_block_{index}",
            (x + bx, y + 0.28, z + bz),
            (bw, 0.34, bd),
            city_mat,
            collection,
            rotation=(0, random.uniform(-0.2, 0.2), 0),
        )


def load_osm_data():
    if not PUERTO_OSM_PATH.exists():
        return None

    with PUERTO_OSM_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def osm_lon_lat_to_puerto_local(lon, lat, city_x, city_z):
    km_per_degree_lat = 110.574
    km_per_degree_lon = 111.320 * math.cos(math.radians(PUERTO_OSM_CENTER_LAT))
    dx = (lon - PUERTO_OSM_CENTER_LON) * km_per_degree_lon * PUERTO_OSM_DETAIL_SCALE
    dz = (lat - PUERTO_OSM_CENTER_LAT) * km_per_degree_lat * PUERTO_OSM_DETAIL_SCALE

    return city_x + dx, city_z + dz


def get_osm_way_points(way, nodes_by_id, city_x, city_z):
    points = []

    for node_id in way.get("nodes", []):
        node = nodes_by_id.get(node_id)

        if not node:
            continue

        points.append(osm_lon_lat_to_puerto_local(node["lon"], node["lat"], city_x, city_z))

    return points


def road_bevel_for_highway(highway):
    widths = {
        "primary": 0.04,
        "secondary": 0.035,
        "tertiary": 0.03,
        "residential": 0.022,
        "living_street": 0.022,
        "unclassified": 0.021,
        "service": 0.017,
        "pedestrian": 0.026,
        "footway": 0.012,
        "path": 0.011,
        "steps": 0.01,
        "track": 0.012,
    }

    return widths.get(highway, 0.018)


def is_osm_point_inside_puerto_detail(x, z, city_x, city_z):
    return abs(x - city_x) <= 7.4 and abs(z - city_z) <= 5.7


def create_osm_puerto_roads(osm_data, city_x, city_z, mats, collection):
    nodes_by_id = {element["id"]: element for element in osm_data["elements"] if element["type"] == "node"}
    road_mat = mats["osm_road"]
    pedestrian_mat = mats["osm_pedestrian"]
    roads_created = 0

    road_priority = {
        "primary": 0,
        "secondary": 1,
        "tertiary": 2,
        "residential": 3,
        "living_street": 4,
        "pedestrian": 5,
        "service": 6,
        "unclassified": 7,
        "footway": 8,
        "path": 9,
        "steps": 10,
        "track": 11,
    }
    ways = [
        way
        for way in osm_data["elements"]
        if way["type"] == "way" and "highway" in way.get("tags", {})
    ]
    ways.sort(key=lambda way: road_priority.get(way["tags"].get("highway"), 20))

    for way in ways:
        if roads_created >= MAX_PUERTO_OSM_ROADS:
            break

        highway = way["tags"].get("highway")
        points = get_osm_way_points(way, nodes_by_id, city_x, city_z)
        points = [
            (x, terrain_height(x, z), z)
            for x, z in points
            if is_land(x, z) and is_osm_point_inside_puerto_detail(x, z, city_x, city_z)
        ]

        if len(points) < 2:
            continue

        material = pedestrian_mat if highway in {"footway", "path", "steps", "pedestrian"} else road_mat
        add_curve_polyline(
            f"puerto_cruz_osm_road_{roads_created + 1:04d}_{highway}",
            points,
            material,
            collection,
            bevel_depth=road_bevel_for_highway(highway),
            z_offset=0.18,
        )
        roads_created += 1

    return roads_created


def building_height_for_tags(tags):
    if "height" in tags:
        try:
            return max(0.18, min(float(str(tags["height"]).replace("m", "").strip()) / 1000 * PUERTO_OSM_DETAIL_SCALE, 0.9))
        except ValueError:
            pass

    if "building:levels" in tags:
        try:
            return max(0.18, min(float(tags["building:levels"]) * 0.085, 0.85))
        except ValueError:
            pass

    building = tags.get("building")

    if building in {"apartments", "hotel", "commercial", "retail"}:
        return 0.42

    if building in {"church", "public", "civic"}:
        return 0.5

    return 0.28


def polygon_area(points):
    if len(points) < 3:
        return 0

    area = 0

    for index, point in enumerate(points):
        next_point = points[(index + 1) % len(points)]
        area += point[0] * next_point[1] - next_point[0] * point[1]

    return abs(area) / 2


def create_osm_puerto_buildings(osm_data, city_x, city_z, mats, collection):
    nodes_by_id = {element["id"]: element for element in osm_data["elements"] if element["type"] == "node"}
    building_mat = mats["osm_building"]
    landmark_mat = mats["city"]
    buildings_created = 0

    building_ways = [
        way
        for way in osm_data["elements"]
        if way["type"] == "way" and "building" in way.get("tags", {})
    ]
    building_ways.sort(
        key=lambda way: polygon_area(get_osm_way_points(way, nodes_by_id, city_x, city_z)),
        reverse=True,
    )

    for way in building_ways:
        if buildings_created >= MAX_PUERTO_OSM_BUILDINGS:
            break

        node_ids = way.get("nodes", [])

        if len(node_ids) < 4 or node_ids[0] != node_ids[-1]:
            continue

        points = get_osm_way_points(way, nodes_by_id, city_x, city_z)[:-1]
        points = [
            (x, z)
            for x, z in points
            if is_land(x, z) and is_osm_point_inside_puerto_detail(x, z, city_x, city_z)
        ]

        if len(points) < 3:
            continue

        area = polygon_area(points)

        if area < 0.001:
            continue

        tags = way.get("tags", {})
        material = landmark_mat if "name" in tags or tags.get("building") in {"church", "public"} else building_mat
        add_polygon_mesh(
            f"puerto_cruz_osm_building_{buildings_created + 1:04d}",
            points,
            building_height_for_tags(tags),
            material,
            collection,
            z_offset=0.08,
        )
        buildings_created += 1

    return buildings_created


def create_osm_puerto_city_detail(city, mats, collection):
    osm_data = load_osm_data()

    if not osm_data:
        print(f"Puerto OSM data not found at {PUERTO_OSM_PATH}; using hand-authored blockout only.")
        return

    roads_created = create_osm_puerto_roads(osm_data, city["x"], city["z"], mats, collection)
    buildings_created = create_osm_puerto_buildings(osm_data, city["x"], city["z"], mats, collection)
    print(f"Created Puerto de la Cruz OSM detail: {roads_created} roads, {buildings_created} buildings")


def create_city_district(city, mats, collection):
    random.seed(f"{RANDOM_SEED}-{city['id']}")

    x = city["x"]
    z = city["z"]
    y = terrain_height(x, z)
    radius = city["radius"]
    city_mat = mats["city"]
    label_mat = mats["label"]
    pad_mat = mats["city_pad"]
    road_mat = mats["road"]
    building_mat = mats["building"]
    plaza_mat = mats["plaza"]

    add_cylinder(
        f"city_{city['id']}_prepared_flat_pad",
        (x, y + 0.035, z),
        radius,
        0.07,
        pad_mat,
        collection,
        vertices=48,
    )
    add_cylinder(
        f"city_{city['id']}_central_plaza",
        (x, y + 0.085, z),
        radius * 0.28,
        0.06,
        plaza_mat,
        collection,
        vertices=32,
    )

    add_curve_polyline(
        f"city_{city['id']}_main_street_east_west",
        [(x - radius * 0.82, y, z), (x + radius * 0.82, y, z)],
        road_mat,
        collection,
        bevel_depth=0.075,
        z_offset=0.09,
    )
    add_curve_polyline(
        f"city_{city['id']}_main_street_north_south",
        [(x, y, z - radius * 0.82), (x, y, z + radius * 0.82)],
        road_mat,
        collection,
        bevel_depth=0.075,
        z_offset=0.09,
    )

    if city["id"] == "puerto_cruz":
        create_osm_puerto_city_detail(city, mats, collection)
        add_curve_polyline(
            "city_puerto_cruz_seafront_promenade",
            [
                (x - radius * 1.05, y, z + radius * 0.55),
                (x - radius * 0.35, y, z + radius * 0.82),
                (x + radius * 0.45, y, z + radius * 0.74),
                (x + radius * 1.05, y, z + radius * 0.5),
            ],
            road_mat,
            collection,
            bevel_depth=0.1,
            z_offset=0.11,
        )
        add_cube(
            "city_puerto_cruz_harbor_placeholder",
            (x + radius * 0.9, y + 0.07, z + radius * 0.68),
            (1.25, 0.12, 0.42),
            mats["harbor"],
            collection,
            rotation=(0, math.radians(18), 0),
        )
        create_puerto_cruz_landmarks(x, z, y, radius, mats, collection)

    for index in range(city["blocks"]):
        angle = random.uniform(0, math.tau)
        distance = random.uniform(radius * 0.35, radius * 0.88)
        bx = x + math.cos(angle) * distance
        bz = z + math.sin(angle) * distance

        if not is_land(bx, bz):
            continue

        block_w = random.uniform(0.26, 0.58)
        block_d = random.uniform(0.22, 0.52)
        block_h = random.uniform(0.16, 0.48)
        if city["id"] in {"santa_cruz", "puerto_cruz"}:
            block_h *= 1.35

        add_cube(
            f"city_{city['id']}_blockout_building_{index + 1:02d}",
            (bx, y + block_h / 2.0 + 0.11, bz),
            (block_w, block_h, block_d),
            building_mat,
            collection,
            rotation=(0, random.uniform(-0.45, 0.45), 0),
        )

    create_city_marker(
        f"city_{city['id']}",
        city["display"],
        x,
        z,
        city_mat,
        label_mat,
        collection,
        city["marker_radius"],
    )


def create_landmarks(mats, collection):
    stone_mat = mats["stone"]
    lava_mat = mats["lava"]
    snow_mat = mats["snow"]
    city_mat = mats["city"]
    label_mat = mats["label"]
    runway_mat = mats["runway"]
    harbor_mat = mats["harbor"]
    glow_mat = mats["glow"]

    teide_x, teide_z = -2.4, 0.6
    teide_y = terrain_height(teide_x, teide_z)
    peak = add_cone(
        "landmark_mount_teide_peak_3718m_symbol",
        (teide_x, teide_y + 0.58, teide_z),
        1.45,
        0.08,
        1.15,
        lava_mat,
        collection,
        vertices=64,
    )
    peak["landmark"] = "Mount Teide, symbolic marker"
    add_uv_sphere("landmark_teide_snow_cap", (teide_x, teide_y + 1.22, teide_z), (0.42, 0.09, 0.42), snow_mat, collection)
    add_text_label("label_mount_teide", "TEIDE", (teide_x, teide_y + 1.85, teide_z - 1.4), label_mat, collection, size=1.05)

    add_cylinder("landmark_las_canadas_caldera_ring", (-1.0, terrain_height(-1.0, 0.0) + 0.08, 0.0), 8.8, 0.08, stone_mat, collection, vertices=96)
    bpy.context.object.scale.y = 0.72

    for city in CITY_SITES:
        create_city_district(city, mats, collection)

    add_cube(
        "landmark_tenerife_south_airport_runway",
        (-3.0, terrain_height(-3.0, -18.2) + 0.08, -18.2),
        (5.8, 0.08, 0.42),
        runway_mat,
        collection,
        rotation=(0, math.radians(-18), 0),
    )
    add_text_label("label_tfs_airport", "TFS", (-3.0, terrain_height(-3.0, -18.2) + 0.48, -19.2), label_mat, collection, size=0.62)

    add_cube(
        "landmark_tenerife_north_airport_runway",
        (27.0, terrain_height(27.0, 8.1) + 0.08, 8.1),
        (3.9, 0.08, 0.36),
        runway_mat,
        collection,
        rotation=(0, math.radians(12), 0),
    )
    add_text_label("label_tfn_airport", "TFN", (27.0, terrain_height(27.0, 8.1) + 0.48, 7.25), label_mat, collection, size=0.62)

    add_cube(
        "landmark_santa_cruz_harbor_blockout",
        (37.6, terrain_height(37.6, 5.1) + 0.05, 5.1),
        (2.4, 0.1, 0.75),
        harbor_mat,
        collection,
        rotation=(0, math.radians(-22), 0),
    )

    for idx, (name, x, z) in enumerate(
        [
            ("region_anaga_mountains", 36.5, 8.5),
            ("region_teno_mountains", -37.5, -1.5),
            ("region_costa_adeje_south", -18.5, -14.2),
            ("region_la_orotava_valley", 1.0, 11.2),
        ],
        start=1,
    ):
        y = terrain_height(x, z)
        marker = add_uv_sphere(f"{name}_glow_marker_{idx}", (x, y + 0.35, z), (0.28, 0.28, 0.28), glow_mat, collection)
        marker["region_marker"] = name


def create_vegetation(mats, collection):
    random.seed(RANDOM_SEED + 11)
    trunk_mat = mats["trunk"]
    pine_mat = mats["pine"]
    palm_mat = mats["palm"]
    shrub_mat = mats["shrub"]

    for index in range(120):
        for _ in range(100):
            x = random.uniform(-38, 38)
            z = random.uniform(-20, 20)
            if not is_land(x, z):
                continue
            normalized, _, v, _ = island_profile(x, z)
            if normalized > 0.88:
                continue
            y = terrain_height(x, z)
            if y < 0.55 or y > 2.8:
                continue
            north_bias = 0.72 if v > 0 else 0.28
            if random.random() > north_bias:
                continue
            height = random.uniform(0.55, 1.25)
            add_cylinder(f"veg_canary_pine_trunk_{index:03d}", (x, y + height * 0.22, z), 0.055, height * 0.44, trunk_mat, collection, vertices=6)
            add_cone(f"veg_canary_pine_canopy_{index:03d}", (x, y + height * 0.68, z), 0.32 * height, 0.05, 0.78 * height, pine_mat, collection, vertices=8)
            break

    for index in range(38):
        for _ in range(100):
            x = random.uniform(-38, 38)
            z = random.uniform(-19, 19)
            if not is_land(x, z):
                continue
            normalized, _, _, _ = island_profile(x, z)
            if normalized < 0.72:
                continue
            y = terrain_height(x, z)
            add_cylinder(f"veg_coastal_palm_trunk_{index:03d}", (x, y + 0.34, z), 0.045, 0.68, trunk_mat, collection, vertices=6)
            add_uv_sphere(f"veg_coastal_palm_crown_{index:03d}", (x, y + 0.78, z), (0.28, 0.12, 0.28), palm_mat, collection, 8, 4)
            break

    for index in range(72):
        for _ in range(100):
            x = random.uniform(-35, 35)
            z = random.uniform(-18, 15)
            if not is_land(x, z):
                continue
            normalized, _, v, _ = island_profile(x, z)
            if normalized < 0.45 or v > 0.5:
                continue
            y = terrain_height(x, z)
            add_uv_sphere(f"veg_south_dry_shrub_{index:03d}", (x, y + 0.08, z), (0.18, 0.08, 0.18), shrub_mat, collection, 8, 4)
            break


def setup_lighting_and_camera():
    sun_data = bpy.data.lights.new("sun_canary_islands_clear_day", "SUN")
    sun_data.energy = 2.8
    sun = bpy.data.objects.new("sun_canary_islands_clear_day", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(43), 0, math.radians(-37))

    area_data = bpy.data.lights.new("area_soft_atlantic_fill", "AREA")
    area_data.energy = 260
    area_data.size = 28
    area = bpy.data.objects.new("area_soft_atlantic_fill", area_data)
    bpy.context.scene.collection.objects.link(area)
    area.location = blender_location((-9, 18, -10))

    camera_data = bpy.data.cameras.new("camera_tenerife_preview")
    camera = bpy.data.objects.new("camera_tenerife_preview", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = blender_location((37, 42, 45))
    look_at(camera, blender_location((0, 1.2, 0)))
    camera.data.lens = 30
    bpy.context.scene.camera = camera

    engine_ids = [item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engine_ids else "BLENDER_EEVEE"
    if hasattr(bpy.context.scene, "eevee"):
        bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.render.resolution_x = 1400
    bpy.context.scene.render.resolution_y = 900
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.world = bpy.data.worlds.new("world_atlantic_sky_gradient_placeholder")
    bpy.context.scene.world.color = (0.05, 0.09, 0.13)


def create_scene():
    clear_scene()
    source = create_collection("Tenerife_Island_Location_Source")

    terrain_mats = [
        make_mat("mat_mid_island_scrub", (0.38, 0.43, 0.25, 1), 0.88),
        make_mat("mat_black_sand_and_coast", (0.18, 0.16, 0.13, 1), 0.9),
        make_mat("mat_green_north_slope", (0.16, 0.35, 0.19, 1), 0.9),
        make_mat("mat_las_canadas_volcanic_rock", (0.32, 0.29, 0.25, 1), 0.83),
        make_mat("mat_teide_high_lava", (0.24, 0.22, 0.22, 1), 0.76),
        make_mat("mat_dry_south_lowlands", (0.58, 0.46, 0.27, 1), 0.92),
        make_mat("mat_prepared_city_terrain_pad", (0.5, 0.48, 0.43, 1), 0.82),
    ]
    mats = {
        "ocean": make_mat("mat_atlantic_ocean", (0.02, 0.21, 0.35, 0.72), 0.22, emission=((0.0, 0.08, 0.14, 1), 0.18), alpha=0.72),
        "coast": make_mat("mat_light_coastline_debug", (0.8, 0.74, 0.52, 1), 0.86),
        "road": make_mat("mat_symbolic_asphalt_routes", (0.055, 0.058, 0.06, 1), 0.8),
        "osm_road": make_mat("mat_puerto_osm_streets_asphalt", (0.075, 0.073, 0.068, 1), 0.76),
        "osm_pedestrian": make_mat("mat_puerto_osm_pedestrian_paths", (0.34, 0.32, 0.27, 1), 0.82),
        "stone": make_mat("mat_caldera_stone_marker", (0.34, 0.33, 0.31, 1), 0.76),
        "lava": make_mat("mat_teide_dark_lava_marker", (0.2, 0.16, 0.14, 1), 0.72),
        "snow": make_mat("mat_teide_snow_cap", (0.9, 0.92, 0.86, 1), 0.48),
        "city": make_mat("mat_city_marker_white", (0.92, 0.9, 0.78, 1), 0.55, emission=((0.8, 0.68, 0.42, 1), 0.35)),
        "city_pad": make_mat("mat_city_pad_warm_concrete", (0.44, 0.42, 0.36, 1), 0.86),
        "building": make_mat("mat_city_blockout_buildings", (0.62, 0.58, 0.49, 1), 0.72),
        "osm_building": make_mat("mat_puerto_osm_buildings", (0.68, 0.64, 0.55, 1), 0.74),
        "plaza": make_mat("mat_city_plaza_stone", (0.72, 0.68, 0.56, 1), 0.78),
        "garden": make_mat("mat_city_garden_green", (0.18, 0.36, 0.18, 1), 0.88),
        "water": make_mat("mat_city_water_pool_blue", (0.08, 0.42, 0.58, 0.84), 0.28, emission=((0.0, 0.13, 0.2, 1), 0.15), alpha=0.84),
        "beach": make_mat("mat_black_sand_beach_detail", (0.12, 0.11, 0.1, 1), 0.9),
        "label": make_mat("mat_black_label_text", (0.02, 0.02, 0.018, 1), 0.65),
        "runway": make_mat("mat_airport_runway", (0.08, 0.085, 0.09, 1), 0.72),
        "harbor": make_mat("mat_harbor_concrete", (0.42, 0.43, 0.42, 1), 0.82),
        "glow": make_mat("mat_region_marker_blue_glow", (0.12, 0.55, 0.95, 1), 0.34, emission=((0.07, 0.42, 0.9, 1), 1.8)),
        "trunk": make_mat("mat_canary_tree_bark", (0.32, 0.21, 0.12, 1), 0.88),
        "pine": make_mat("mat_canary_pine_green", (0.12, 0.3, 0.18, 1), 0.91),
        "palm": make_mat("mat_coastal_palm_green", (0.2, 0.42, 0.21, 1), 0.88),
        "shrub": make_mat("mat_dry_south_shrub", (0.39, 0.36, 0.18, 1), 0.92),
    }

    create_ocean(mats["ocean"], source)
    island = create_island_mesh(terrain_mats, source)
    create_coastline_markers(mats["coast"], source)
    create_roads(mats["road"], source)
    create_landmarks(mats, source)
    create_vegetation(mats, source)
    setup_lighting_and_camera()

    for obj in bpy.context.scene.objects:
        obj.select_set(False)
        if obj.type == "MESH":
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            try:
                bpy.ops.object.shade_smooth()
            except RuntimeError:
                pass
            obj.select_set(False)

    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
    PREVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    for obj in source.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = island
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )

    if RENDER_PREVIEW:
        bpy.context.scene.render.filepath = str(PREVIEW_PATH)
        bpy.ops.render.render(write_still=True)

    print(f"Saved Blender source: {BLEND_PATH}")
    print(f"Exported runtime GLB: {GLB_PATH}")
    if RENDER_PREVIEW:
        print(f"Rendered preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    create_scene()
