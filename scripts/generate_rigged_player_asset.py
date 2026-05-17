import bpy
import math
import os


ROOT_DIR = "/Users/dmytrosichkar/Documents/project/2026/keyArena"
OUTPUT_GLB = os.path.join(ROOT_DIR, "public", "models", "player", "player-hero-rigged.glb")
OUTPUT_BLEND = os.path.join(
    ROOT_DIR, "public", "models", "player", "source", "player-hero-rigged.blend"
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
        bpy.data.actions,
    ):
        for block in list(block_collection):
            if block.users == 0:
                block_collection.remove(block)


def ensure_directory(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def create_material(name, rgba, roughness=0.5):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    principled = next(
        (node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"),
        None,
    )
    if principled is None:
        raise RuntimeError("Principled BSDF node was not created for material")
    principled.inputs["Base Color"].default_value = rgba
    principled.inputs["Roughness"].default_value = roughness
    return material


def add_part(name, primitive, location, scale, material):
    if primitive == "cube":
        bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    elif primitive == "uv_sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=location, segments=16, ring_count=8)
    elif primitive == "cylinder":
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.5, depth=1, location=location)
    else:
        raise ValueError(f"Unsupported primitive {primitive}")

    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    return obj


def create_armature():
    bpy.ops.object.armature_add(location=(0, 0, 0))
    armature = bpy.context.active_object
    armature.name = "player_hero_armature"
    armature.data.name = "player_hero_armature_data"

    bpy.ops.object.mode_set(mode="EDIT")
    edit_bones = armature.data.edit_bones

    root = edit_bones[0]
    root.name = "root"
    root.head = (0, 0, 0)
    root.tail = (0, 0, 1)

    spine = edit_bones.new("spine")
    spine.head = (0, 0, 1)
    spine.tail = (0, 0, 2.2)
    spine.parent = root

    head = edit_bones.new("head")
    head.head = (0, 0, 2.2)
    head.tail = (0, 0, 2.8)
    head.parent = spine

    left_arm = edit_bones.new("left_arm")
    left_arm.head = (-0.45, 0, 1.95)
    left_arm.tail = (-1.15, 0, 1.75)
    left_arm.parent = spine

    right_arm = edit_bones.new("right_arm")
    right_arm.head = (0.45, 0, 1.95)
    right_arm.tail = (1.15, 0, 1.75)
    right_arm.parent = spine

    left_leg = edit_bones.new("left_leg")
    left_leg.head = (-0.22, 0, 1)
    left_leg.tail = (-0.22, 0, 0.1)
    left_leg.parent = root

    right_leg = edit_bones.new("right_leg")
    right_leg.head = (0.22, 0, 1)
    right_leg.tail = (0.22, 0, 0.1)
    right_leg.parent = root

    bpy.ops.object.mode_set(mode="OBJECT")
    armature.rotation_mode = "XYZ"
    return armature


def parent_part_to_bone(obj, armature, bone_name):
    obj.parent = armature
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_parent_inverse = armature.matrix_world.inverted()


def insert_pose_keyframe(armature, frame, rotations, root_location_z=0):
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="POSE")

    armature.pose.bones["root"].location = (0, 0, root_location_z)
    armature.pose.bones["root"].keyframe_insert(data_path="location", frame=frame)

    for bone_name, rotation in rotations.items():
        pose_bone = armature.pose.bones[bone_name]
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = rotation
        pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame)

    bpy.ops.object.mode_set(mode="OBJECT")


def stash_action(armature, action):
    if armature.animation_data is None:
        armature.animation_data_create()
    armature.animation_data.action = action
    track = armature.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, int(action.frame_range[0]), action)
    strip.action_frame_start = action.frame_range[0]
    strip.action_frame_end = action.frame_range[1]
    armature.animation_data.action = None


def create_idle_action(armature):
    action = bpy.data.actions.new("Idle")
    if armature.animation_data is None:
        armature.animation_data_create()
    armature.animation_data.action = action

    insert_pose_keyframe(
        armature,
        1,
        {
            "spine": (0.0, 0.0, 0.0),
            "head": (0.03, 0.0, 0.0),
            "left_arm": (0.12, 0.0, -0.12),
            "right_arm": (-0.12, 0.0, 0.12),
            "left_leg": (-0.04, 0.0, 0.0),
            "right_leg": (0.04, 0.0, 0.0),
        },
        0.0,
    )
    insert_pose_keyframe(
        armature,
        20,
        {
            "spine": (0.03, 0.0, 0.0),
            "head": (-0.02, 0.0, 0.0),
            "left_arm": (0.08, 0.0, -0.08),
            "right_arm": (-0.08, 0.0, 0.08),
            "left_leg": (0.0, 0.0, 0.0),
            "right_leg": (0.0, 0.0, 0.0),
        },
        0.04,
    )
    insert_pose_keyframe(
        armature,
        40,
        {
            "spine": (0.0, 0.0, 0.0),
            "head": (0.03, 0.0, 0.0),
            "left_arm": (0.12, 0.0, -0.12),
            "right_arm": (-0.12, 0.0, 0.12),
            "left_leg": (-0.04, 0.0, 0.0),
            "right_leg": (0.04, 0.0, 0.0),
        },
        0.0,
    )

    stash_action(armature, action)


def create_run_action(armature):
    action = bpy.data.actions.new("Run")
    armature.animation_data.action = action

    insert_pose_keyframe(
        armature,
        1,
        {
            "spine": (-0.08, 0.0, 0.0),
            "head": (0.08, 0.0, 0.0),
            "left_arm": (-0.9, 0.0, -0.12),
            "right_arm": (0.9, 0.0, 0.12),
            "left_leg": (0.95, 0.0, 0.0),
            "right_leg": (-0.75, 0.0, 0.0),
        },
        0.08,
    )
    insert_pose_keyframe(
        armature,
        12,
        {
            "spine": (0.05, 0.0, 0.0),
            "head": (-0.02, 0.0, 0.0),
            "left_arm": (0.9, 0.0, -0.12),
            "right_arm": (-0.9, 0.0, 0.12),
            "left_leg": (-0.75, 0.0, 0.0),
            "right_leg": (0.95, 0.0, 0.0),
        },
        0.0,
    )
    insert_pose_keyframe(
        armature,
        24,
        {
            "spine": (-0.08, 0.0, 0.0),
            "head": (0.08, 0.0, 0.0),
            "left_arm": (-0.9, 0.0, -0.12),
            "right_arm": (0.9, 0.0, 0.12),
            "left_leg": (0.95, 0.0, 0.0),
            "right_leg": (-0.75, 0.0, 0.0),
        },
        0.08,
    )

    stash_action(armature, action)


def build_player():
    reset_scene()

    body_material = create_material("hero_body_mat", (0.18, 0.58, 0.82, 1.0), 0.42)
    limb_material = create_material("hero_limb_mat", (0.9, 0.69, 0.52, 1.0), 0.58)
    accent_material = create_material("hero_accent_mat", (0.94, 0.62, 0.24, 1.0), 0.35)

    armature = create_armature()

    torso = add_part("hero_torso", "cube", (0, 0, 1.6), (0.45, 0.22, 0.62), body_material)
    hips = add_part("hero_hips", "cube", (0, 0, 1.03), (0.34, 0.2, 0.2), accent_material)
    head = add_part("hero_head", "uv_sphere", (0, 0, 2.55), (0.28, 0.24, 0.3), limb_material)
    left_arm = add_part("hero_left_arm", "cube", (-0.78, 0, 1.72), (0.18, 0.16, 0.56), body_material)
    right_arm = add_part("hero_right_arm", "cube", (0.78, 0, 1.72), (0.18, 0.16, 0.56), body_material)
    left_leg = add_part("hero_left_leg", "cube", (-0.2, 0, 0.52), (0.18, 0.18, 0.48), accent_material)
    right_leg = add_part("hero_right_leg", "cube", (0.2, 0, 0.52), (0.18, 0.18, 0.48), accent_material)

    parent_part_to_bone(torso, armature, "spine")
    parent_part_to_bone(hips, armature, "root")
    parent_part_to_bone(head, armature, "head")
    parent_part_to_bone(left_arm, armature, "left_arm")
    parent_part_to_bone(right_arm, armature, "right_arm")
    parent_part_to_bone(left_leg, armature, "left_leg")
    parent_part_to_bone(right_leg, armature, "right_leg")

    create_idle_action(armature)
    create_run_action(armature)

    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 24
    bpy.context.scene.render.fps = 24

    ensure_directory(OUTPUT_BLEND)
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)

    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    for obj in [torso, hips, head, left_arm, right_arm, left_leg, right_leg]:
        obj.select_set(True)

    ensure_directory(OUTPUT_GLB)
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
    )


build_player()
