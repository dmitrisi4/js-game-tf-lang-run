# Asset Pipeline

## Canonical References
- `docs/ai_asset_workflow.md`
- `docs/blender_local_workflow.md`
- `docs/templates/asset-intake.md`
- `docs/templates/texture-budget.md`
- `docs/templates/physics-object.md`
- `GEMINI.md`
- `wikibest/best-practices.md`

This page is a fast navigation layer, not the full asset policy.

## Runtime Format
Runtime 3D model format is `glb`. Source work files such as `.blend` are cleanup/editing files, not direct runtime dependencies.

## Current Repo Reality
The current app loads runtime models from `public/models/`, for example:
- `public/models/player/`
- `public/models/collectibles/`
- `public/models/environment/`
- `public/models/hero/`

Project standards also describe future runtime-ready asset folders under `src/assets/`. Do not move existing assets as part of an unrelated task. Follow the existing path for feature work unless the task is an explicit asset-layout refactor.

## Before Importing A Model
Normalize in Blender:
- apply transforms
- verify meter scale
- set intentional pivot/origin
- remove hidden junk geometry
- fix normals and obvious material issues
- rename root object, mesh objects, materials, and animation clips where relevant
- export clean `glb`

## Runtime Acceptance
An asset is ready only when:
- it loads in Babylon without one-off hacks
- it is correctly scaled next to the player
- materials respond acceptably under project lighting
- the collider plan is explicit
- texture budget is explicit: max size, mipmaps, compression target, color/data classification, and loading expectation
- physics metadata is explicit for gameplay objects: body type, collider shape, layer/mask, sleeping, CCD need, and reset policy if pooled
- repeated assets can be instanced or cloned where practical
- license terms allow the intended use

## Required Templates
- Use `docs/templates/asset-intake.md` before a model or generated asset becomes gameplay-relevant.
- Use `docs/templates/texture-budget.md` for texture sets that affect runtime memory or material quality.
- Use `docs/templates/physics-object.md` for objects that collide, trigger, move, or participate in physics queries.
- Use `docs/templates/behavior-agent.md` for NPCs, enemies, creatures, and autonomous world props.

## Best-Practice Policy Additions
- Prefer glTF-compatible PBR metallic-roughness materials. Bake or simplify unsupported Blender material graphs before GLB export.
- Use mipmaps for 3D-world textures viewed at variable distance; avoid them for full-resolution-only UI textures unless justified.
- Prefer primitive or compound primitive colliders for dynamic gameplay objects.
- Mesh colliders are mainly for static environment queries and require an explicit reason.
- Repeated runtime objects such as pickups, projectiles, transient VFX, and damage indicators must be evaluated for pooling.

## Loading Notes
- Asset-backed collectibles currently use `AssetContainer` caching in `src/scenes/discovery/AssetLetterCollectible.tsx`.
- For repeated houses/buildings, prefer a similar cached-container or instancing pattern over importing the same file repeatedly.
- Visual meshes are presentation. Gameplay collisions should use primitive/proxy colliders unless there is a deliberate reason otherwise.
- Collision layer metadata starts in `src/scenes/physics/collisionLayers.ts`; physics object policy types start in `src/scenes/physics/physicsMetadata.ts`.

## Third-Party Asset Sites
For buildings and houses, useful sources include:
- Kenney - free game-ready kits, often CC0.
- Quaternius - low-poly game assets, commonly CC0.
- Sketchfab - broad selection; always check license and triangle count.
- Poly Haven and ambientCG - strong for CC0 materials and environment assets.

Always record attribution requirements when a license requires it.
