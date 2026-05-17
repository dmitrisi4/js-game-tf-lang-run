import bpy
import os


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLLECTIBLE_OUTPUT = os.path.join(
    ROOT_DIR, "public", "models", "collectibles", "collectible-letter-crystal.glb"
)
PLAYER_OUTPUT = os.path.join(
    ROOT_DIR, "public", "models", "player", "player-adventurer-prototype.glb"
)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block_collection in (
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.armatures,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(block_collection):
            if block.users == 0:
                block_collection.remove(block)


def ensure_directory(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def export_selection(output_path):
    ensure_directory(output_path)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )


def build_collectible():
    reset_scene()

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.45, location=(0, 0, 0))
    crystal = bpy.context.active_object
    crystal.name = "collectible_letter_crystal"
    crystal.scale = (0.55, 1.35, 0.55)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    mat = bpy.data.materials.new(name="collectible_letter_crystal_mat")
    mat.use_nodes = True
    principled = mat.node_tree.nodes["Principled BSDF"]
    principled.inputs["Base Color"].default_value = (0.95, 0.79, 0.34, 1.0)
    principled.inputs["Emission Color"].default_value = (0.18, 0.1, 0.02, 1.0)
    principled.inputs["Emission Strength"].default_value = 0.35
    principled.inputs["Roughness"].default_value = 0.38
    crystal.data.materials.append(mat)

    crystal.select_set(True)
    bpy.context.view_layer.objects.active = crystal
    export_selection(COLLECTIBLE_OUTPUT)


def build_player():
    reset_scene()

    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.28, depth=1.4, location=(0, 0, 0.9))
    body = bpy.context.active_object
    body.name = "player_body"

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(0, 0, 1.9))
    head = bpy.context.active_object
    head.name = "player_head"

    bpy.ops.mesh.primitive_cube_add(size=0.22, location=(-0.42, 0, 1.05))
    left_arm = bpy.context.active_object
    left_arm.name = "player_left_arm"
    left_arm.scale = (0.45, 0.18, 0.18)

    bpy.ops.mesh.primitive_cube_add(size=0.22, location=(0.42, 0, 1.05))
    right_arm = bpy.context.active_object
    right_arm.name = "player_right_arm"
    right_arm.scale = (0.45, 0.18, 0.18)

    bpy.ops.mesh.primitive_cube_add(size=0.24, location=(-0.16, 0, 0.15))
    left_leg = bpy.context.active_object
    left_leg.name = "player_left_leg"
    left_leg.scale = (0.22, 0.2, 0.65)

    bpy.ops.mesh.primitive_cube_add(size=0.24, location=(0.16, 0, 0.15))
    right_leg = bpy.context.active_object
    right_leg.name = "player_right_leg"
    right_leg.scale = (0.22, 0.2, 0.65)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in [body, head, left_arm, right_arm, left_leg, right_leg]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    player = bpy.context.active_object
    player.name = "player_adventurer_prototype"

    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    mat = bpy.data.materials.new(name="player_adventurer_prototype_mat")
    mat.use_nodes = True
    principled = mat.node_tree.nodes["Principled BSDF"]
    principled.inputs["Base Color"].default_value = (0.36, 0.7, 0.88, 1.0)
    principled.inputs["Emission Color"].default_value = (0.03, 0.06, 0.08, 1.0)
    principled.inputs["Emission Strength"].default_value = 0.18
    principled.inputs["Roughness"].default_value = 0.46
    player.data.materials.append(mat)

    player.select_set(True)
    bpy.context.view_layer.objects.active = player
    export_selection(PLAYER_OUTPUT)


build_collectible()
build_player()
