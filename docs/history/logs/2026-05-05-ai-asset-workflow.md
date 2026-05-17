# Session Log: 2026-05-05 - AI Asset Workflow

## Objectives
- Clarify whether AI-assisted 3D asset creation in Blender is realistic for the current project.
- Convert the answer into a reusable project workflow instead of leaving it in chat only.

## Decisions
- AI-assisted 3D generation is approved for prototype and MVP asset production in `keyArena`.
- Meshy is the default AI-first path for early asset generation.
- Blender remains the mandatory normalization and validation layer before runtime import.
- `glb` is the runtime export target for Babylon.
- AI-generated assets are acceptable for collectibles and simple props first.
- Player and other animation-critical assets may use AI for exploration, but not as final authority without stricter cleanup and validation.

## Documentation Changes
- Added `docs/ai_asset_workflow.md` as the canonical workflow for:
	- AI generation
	- Blender cleanup
	- export rules
	- runtime acceptance gates
- Linked the workflow from `docs/implementation_plan.md`.

## Operational Guidance
- Do not import raw AI output directly into runtime.
- Every asset must pass scale, pivot, material, collider, and naming checks in Blender.
- Prefer validating the pipeline on collectibles and props before attempting the player model.

## Next Recommended Assets
1. `collectible-letter-a.glb`
2. `collectible-letter-b.glb`
3. `collectible-word-fire.glb`
4. `prop-ruins-column-a.glb`
5. `chest-small-a.glb`
