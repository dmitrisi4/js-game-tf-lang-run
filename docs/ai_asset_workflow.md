# AI Asset Workflow For keyArena

## Purpose
Define a practical workflow for creating prototype and MVP-ready 3D assets with AI, Blender, and manual cleanup before importing them into Babylon.

Local operating workflow on macOS: `docs/blender_local_workflow.md`

## Recommended Tooling
- AI generation:
	- Meshy as the default option for fast text-to-3D and image-to-3D prototyping
	- Tripo as an alternative for experiments or comparison passes
- DCC:
	- Blender for cleanup, validation, material fixes, pivot/scale normalization, and export
- AI inside Blender:
	- Claude or another MCP-compatible assistant may be used to automate repetitive Blender operations
- Runtime target:
	- Babylon.js consuming `glb`

## What AI Is Good For
- Rapid ideation of props
- Draft collectibles
- Early environment set dressing
- Base meshes for non-hero objects
- Variants exploration from one concept

## What AI Is Not Trusted For By Default
- Final topology for gameplay-critical hero assets
- Reliable pivots and scale
- Production-ready UVs in all cases
- Clean rigging and animation retargeting
- Accurate colliders
- Consistent material naming and texture packing

## Default Asset Categories
### Safe for AI-first workflow
- letter pickups
- word pickups
- crates
- rocks
- ruins props
- foliage accents
- simple treasure chests

### Use AI only as a starting point
- player character
- enemies
- gameplay-critical animated props
- anything requiring precise rigging, readable silhouettes, or strict collision behavior

## Canonical Pipeline
1. Define the asset role before prompting:
	- category
	- gameplay function
	- expected distance from camera
	- whether it needs animation
	- whether it needs collision
2. Generate one or more drafts in Meshy.
3. Import the best draft into Blender.
4. Normalize the asset in Blender:
	- apply transforms
	- set scale to meters
	- fix pivot/origin
	- rename root object and materials
	- inspect topology and normals
5. Replace or simplify collision strategy:
	- use primitive colliders or simple proxy meshes
	- do not rely on raw imported triangle mesh collisions for dynamic gameplay entities
6. Validate visual readability:
	- silhouette
	- texture clarity
	- shading response under project lighting
7. Export to `glb`.
8. Import into the game through the project asset loader.
9. Test in Babylon with real gameplay context:
	- size next to player
	- pickup readability
	- shadow behavior
	- collider fit
10. If the asset fails any gate, fix it in Blender or regenerate.

## Prompting Template
Use prompts that constrain gameplay requirements, not only aesthetics.

Example structure:
- object type
- style direction
- scale expectation
- material expectations
- topology simplicity
- silhouette/readability requirements

Example:
`Stylized floating collectible letter A for a fantasy action RPG, readable from mid-distance, clean simple silhouette, game-friendly topology, slight magical ornament, PBR-friendly materials, centered composition.`

## Blender Cleanup Checklist
### Required for every imported AI asset
- apply rotation, location, and scale as needed
- align forward direction consistently
- set world scale in meters
- place origin intentionally
- remove unused meshes/material slots
- recalculate or fix normals
- inspect ngons or broken geometry in visible areas
- verify texture hookups
- rename:
	- root object
	- mesh object
	- materials
	- animation actions if any

### Required for gameplay assets
- verify collider plan
- verify interaction point or center
- verify readability from gameplay camera height
- verify no hidden geometry inflates bounds unexpectedly

## Player-Specific Workflow
AI may help with concept or base mesh exploration, but the player asset has stricter gates.

Required checks:
- separate visual mesh from gameplay capsule
- verify humanoid proportions against meter scale
- verify root orientation
- verify skeleton cleanliness
- normalize animation clip names:
	- `idle`
	- `move`
	- `interact`
	- `damaged`
- validate that the mesh can follow the capsule without foot sliding becoming unacceptable

If the AI-generated player model fails rigging, deformation, or readability checks, treat it as concept input and rebuild or replace it manually.

## Collectible-Specific Workflow
Collectibles are the best early target for AI-assisted production.

Required checks:
- readable from gameplay distance
- pivot centered or intentionally offset
- simple collider volume
- compact bounds
- emissive or contrast treatment if needed for pickup discovery
- acceptable appearance under shadowed and lit conditions

## Environment Prop Workflow
For rocks, ruins, debris, and filler props:
- prefer batch generation of variants
- standardize naming per set
- reuse materials where possible
- use instancing in runtime where repetition exists
- create simplified collision only for props the player can meaningfully contact

## Claude Or AI Inside Blender
Use AI inside Blender for repetitive technical tasks, not blind finalization.

Good uses:
- batch rename objects
- set origins consistently
- apply transforms across many assets
- create export helpers
- inspect scene organization
- generate Python snippets for repetitive cleanup

Avoid delegating without review:
- final rigging decisions
- collider authoring for gameplay-critical meshes
- destructive geometry edits on the only copy of an asset

## Export Contract For keyArena
- runtime format: `glb`
- authored scale: meters
- one clear root per asset
- semantic file names
- avoid baking unnecessary scene junk into export

Suggested naming:
- `collectible-letter-a.glb`
- `collectible-word-fire.glb`
- `prop-ruins-column-a.glb`
- `player-adventurer-v01.glb`

## Runtime Acceptance Gates
An asset is accepted into the repo only if all relevant checks pass:
- imports into Blender cleanly
- exports to `glb` cleanly
- loads in Babylon without manual one-off hacks
- scale is correct relative to gameplay scene
- pivot/origin is intentional
- material response is acceptable
- collider strategy is defined
- naming is normalized

## Repo Placement
- runtime-ready assets:
	- `src/assets/models`
	- `src/assets/textures`
	- `src/assets/animations`
- optional source or work files should stay outside runtime import paths if added later

## Decision Rules
- If AI output is faster to clean than to model manually, keep it.
- If cleanup takes longer than rebuilding a simple asset, discard and remake.
- If an asset is hero-level or animation-critical, use AI for concept acceleration, not as final authority.

## First Assets To Build With This Workflow
1. `collectible-letter-a.glb`
2. `collectible-letter-b.glb`
3. `collectible-word-fire.glb`
4. `prop-ruins-column-a.glb`
5. `chest-small-a.glb`

These are low-risk assets that will validate the pipeline before attempting the player model.
