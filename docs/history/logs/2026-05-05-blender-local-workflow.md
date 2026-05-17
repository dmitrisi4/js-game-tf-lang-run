# Session Log: 2026-05-05 - Blender Local Workflow

## Objectives
- Describe the practical local workflow for using Blender on macOS together with Claude and AI-generated assets.
- Turn the workflow into an operational project document.

## Decisions
- Added a dedicated local workflow document for Blender usage on macOS.
- Distinguished three working modes:
	- manual Blender workflow
	- Claude-assisted Blender workflow
	- AI-generated asset to Blender workflow
- Confirmed `glb` as the runtime export target for `keyArena`.
- Confirmed collectibles and simple props as the safest first assets for pipeline validation.

## Documentation Changes
- Added `docs/blender_local_workflow.md`.
- Linked it from `docs/ai_asset_workflow.md`.

## Operational Guidance
- Start with one simple collectible before attempting hero assets.
- Use Claude mainly for Blender Python automation, cleanup guidance, and export helpers.
- Keep `.blend` or source work files out of runtime asset folders.

## Recommended First Asset
- `collectible-letter-a.glb`
