# Asset Intake Template

Use this before a model, texture set, or generated asset becomes gameplay-relevant.

## Identity

- Asset id:
- Asset name:
- Source path:
- Runtime path:
- Source/license:
- Imported by:
- Date:

## Runtime Role

- Category: character | prop | collectible | building | terrain | VFX | UI | other
- Gameplay role:
- Visual-only: yes | no
- Repeated/instanced candidate: yes | no
- Pooling candidate: yes | no

## Scale And Transform

- World scale checked against `1 unit = 1 meter`: yes | no
- Final scale:
- Pivot/origin:
- Forward/up axes:
- Bounding box:
- Spawn/placement notes:

## Materials And Textures

- Material model: glTF PBR metallic-roughness | unlit | other
- Texture budget file:
- Base color:
- Normal:
- Metallic/roughness:
- Ambient occlusion:
- Emissive:
- Alpha mode:
- Known material limitations:

## Collider Strategy

- Physics object file:
- Body type: static | kinematic | dynamic | trigger | visual-only
- Collider shape: primitive | compound primitive | convex | mesh | none
- Collision layer:
- Collision mask:
- Notes:

## Validation

- Blender cleanup complete: yes | no
- GLB export checked: yes | no
- glTF validation checked: yes | no
- Babylon runtime checked: yes | no
- Performance risk: low | medium | high
- Open issues:
