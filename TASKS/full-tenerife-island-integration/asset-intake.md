# Asset Intake: Full Tenerife Island

## Identity

- Asset id: `tenerife-full-island-source`
- Asset name: `Tenerife. Islas Canarias`
- Source path: `public/models/land/tenerife._islas_canarias.glb`
- Runtime path: not yet normalized
- Source/license: Sketchfab, CC-BY-4.0
- Author: `Unknown08tf`
- Source URL: `https://sketchfab.com/3d-models/tenerife-islas-canarias-628865c6fe29460bb2f6a8ba8d223087`
- Imported by: local project user
- Date: 2026-05-18

## Runtime Role

- Category: terrain
- Gameplay role: full-island visual terrain foundation, future broad traversal terrain
- Visual-only: first pass yes, later partial/no after collider strategy lands
- Repeated/instanced candidate: no
- Pooling candidate: no

## Scale And Transform

- World scale checked against `1 unit = 1 meter`: partially. Source bounds suggest meter scale.
- Final scale: undecided, recommended first pass preserves meters.
- Pivot/origin: source uses Sketchfab wrapper nodes and should be normalized.
- Forward/up axes: source GLB contains nested orientation matrices; Blender normalization required.
- Bounding box from GLB metadata: about `122,228 m x 122,228 m x 3,653 m`.
- Spawn/placement notes: Puerto spawn must be re-anchored after island normalization.

## Materials And Textures

- Material model: glTF PBR metallic-roughness
- Texture budget file: `TASKS/full-tenerife-island-integration/texture-budget.md`
- Base color: one embedded PNG, `8192 x 8192`
- Normal: none
- Metallic/roughness: factors only
- Ambient occlusion: none
- Emissive: none
- Alpha mode: opaque
- Known material limitations:
	- one large baked satellite-style texture
	- texture includes dark surrounding/background areas
	- ocean should be provided by runtime material, not this texture

## Collider Strategy

- Physics object file: `TASKS/full-tenerife-island-integration/physics-plan.md`
- Body type: visual-only first, then static terrain collider for active gameplay zones
- Collider shape: simplified mesh or heightfield proxy preferred
- Collision layer: environment terrain
- Collision mask: player capsule and downward raycasts
- Notes: full visual mesh collision is high risk because the source has about `720k` triangles.

## Validation

- Blender cleanup complete: no
- GLB export checked: source import checked outside sandbox
- glTF validation checked: metadata manually inspected
- Babylon runtime checked: no
- Performance risk: high until normalized and measured
- Open issues:
	- attribution must be added to runtime metadata
	- texture budget must be reduced for first browser pass
	- full island to Puerto patch transform must be calibrated
	- ocean must be separate runtime geometry/material
