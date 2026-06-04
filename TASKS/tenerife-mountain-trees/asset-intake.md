# Asset Intake: Spruce Trees

## Identity

- Asset id: `spruce-trees`
- Asset name: `Tree.glb`
- Source path: `public/models/spruce-trees/spruce-trees/source/Trees/Tree.glb`
- Runtime path: `public/models/spruce-trees/spruce-trees/source/Trees/Tree.glb`
- Source/license: pending user/source confirmation
- Imported by: local project user
- Date: 2026-06-02

## Runtime Role

- Category: prop
- Gameplay role: scenic mountain vegetation for Tenerife full-island mode
- Visual-only: yes
- Repeated/instanced candidate: yes
- Pooling candidate: no

## Scale And Transform

- World scale checked against `1 unit = 1 meter`: first-pass runtime scale only
- Final scale: `0.13` to `0.17` per authored placement
- Pivot/origin: source appears to contain multiple tree nodes; runtime instances anchor the pack to terrain Y
- Forward/up axes: GLB Y-up assumed
- Bounding box: source accessors indicate about `60` source units tall before runtime scale
- Spawn/placement notes: authored only outside Teide dry zone; terrain Y comes from full-island heightfield/raycast

## Materials And Textures

- Material model: glTF PBR metallic-roughness
- Texture budget file: not created; source textures are bundled beside the GLB
- Base color: `DefaultMaterial_BaseColor.png` plus branch textures
- Normal: `DefaultMaterial_Normal.png`
- Metallic/roughness: `DefaultMaterial_Metallic.png`, `DefaultMaterial_Roughness.png`
- Ambient occlusion: none identified
- Emissive: none identified
- Alpha mode: source GLB not yet audited in Blender
- Known material limitations: source has not yet been cleaned or optimized in Blender

## Collider Strategy

- Physics object file: none
- Body type: visual-only
- Collider shape: none
- Collision layer: none
- Collision mask: none
- Notes: first pass deliberately avoids tree colliders; add primitive trunk colliders later if trees become gameplay blockers.

## Validation

- Blender cleanup complete: no
- GLB export checked: file exists and is valid binary glTF
- glTF validation checked: no
- Babylon runtime checked: pending
- Performance risk: medium
- Open issues:
	- Confirm source/license.
	- Consider Blender cleanup or mesh merging if draw calls become expensive.
	- Remove archive/source clutter from runtime public assets if the asset is promoted to production.

