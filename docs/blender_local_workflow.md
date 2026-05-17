# Local Blender Workflow For keyArena

## Purpose
Describe the day-to-day workflow on macOS for using Blender, Claude, and AI-generated assets together for `keyArena`.

## Local Stack
- Blender installed via Homebrew cask
- Claude available for:
	- chat and planning
	- code generation
	- Blender Python script generation
- Optional AI asset generation:
	- Meshy
	- Tripo
- Runtime target:
	- Babylon.js
	- `glb`

## Working Modes
### Mode 1: Manual Blender workflow
Use this when:
- creating a simple prop from scratch
- cleaning an imported mesh
- checking scale, pivot, and export

Flow:
1. Open Blender.
2. Create or import the asset.
3. Normalize transforms, pivot, naming, and materials.
4. Export `glb`.
5. Place runtime asset into the repo.
6. Test in Babylon.

### Mode 2: Claude-assisted Blender workflow
Use this when:
- you need repetitive cleanup
- you want Python automation
- you need help inspecting a Blender scene
- you want faster setup of export helpers

Flow:
1. Open Blender.
2. Describe the task to Claude clearly.
3. Ask Claude for:
	- Blender Python scripts
	- cleanup steps
	- naming normalization
	- export automation
4. Run the generated script inside Blender.
5. Review the result manually.
6. Export `glb` and test in runtime.

### Mode 3: AI-generated asset to Blender workflow
Use this when:
- you want a draft asset quickly
- the asset is a collectible, chest, prop, ruin, rock, or filler object

Flow:
1. Generate 2-4 variants in Meshy or similar.
2. Pick the best silhouette.
3. Import into Blender.
4. Clean it up.
5. Export `glb`.
6. Validate it in `keyArena`.

## Folder Conventions
### Runtime-ready files
- `src/assets/models`
- `src/assets/textures`
- `src/assets/animations`

### Documentation
- `docs/ai_asset_workflow.md`
- `docs/blender_local_workflow.md`

### Optional local source files
If you keep source `.blend` files later, do not place them into runtime import folders.

Suggested future source location:
- `art/blender`
- `art/concepts`
- `art/exports`

## First Practical Workflow On Your Mac
### Option A: Build a simple collectible manually
Best first exercise because it has low failure risk.

1. Open Blender.
2. Create a simple stylized letter collectible:
	- start from text or a simple mesh
	- add bevel if needed
	- keep silhouette readable
3. Scale it roughly to pickup size in meters.
4. Set origin to center or base as intended.
5. Give it simple PBR-friendly materials.
6. Export as `collectible-letter-a.glb`.
7. Place it under `src/assets/models`.

### Option B: Generate collectible with AI first
1. Use Meshy with a constrained prompt.
2. Import result into Blender.
3. Fix:
	- scale
	- pivot
	- naming
	- normals
	- extra geometry
4. Export as `collectible-letter-a.glb`.
5. Place it under `src/assets/models`.

## How To Work With Claude In Practice
### Good requests
- `Write a Blender Python script to rename all selected meshes with the prefix collectible-letter-.`
- `Give me a Blender Python script to set origin to geometry center for selected objects.`
- `Generate a cleanup checklist for this imported Meshy collectible before glb export.`
- `Write a Blender Python script that applies transforms and prints object dimensions.`
- `Help me decide whether this asset should use a primitive collider or proxy collider.`

### Bad requests
- `Make this final and production-ready automatically.`
- `Fix all topology issues without review.`
- `Rig this hero character perfectly from raw AI mesh.`

## Blender Checklist Per Asset
Before export:
- apply transforms
- verify scale in meters
- verify forward direction
- verify origin
- verify object names
- verify material names
- verify normals
- remove hidden junk geometry
- verify bounds
- verify there is one clear export root

After export:
- import into Babylon flow
- check size relative to scene
- check lighting response
- check readability from gameplay camera
- define collider strategy

## Export Settings Guidance
Target:
- `glb`

Keep exports clean:
- export only intended objects
- avoid scene junk
- avoid duplicate unused materials
- keep naming stable

## Recommended Weekly Workflow
1. Pick 1-3 low-risk assets.
2. Generate or model drafts.
3. Clean in Blender.
4. Export `glb`.
5. Import into the game.
6. Validate scale, readability, and collision.
7. Only after that move to more complex assets.

## Best First Assets
- `collectible-letter-a.glb`
- `collectible-letter-b.glb`
- `collectible-word-fire.glb`
- `prop-ruins-column-a.glb`
- `chest-small-a.glb`

## Decision Rules
- If the asset is simple, Blender-first may be faster than AI-first.
- If the asset needs many visual variations, AI-first is often worth it.
- If the asset is hero-level or animation-critical, do not trust AI output as final.
- If cleanup is taking too long, discard the draft and regenerate or remodel.

## Suggested Next Step
Start with one asset only:
- `collectible-letter-a.glb`

That will validate:
- Blender startup
- export path
- project folder placement
- Babylon import strategy
- your comfort with the workflow
