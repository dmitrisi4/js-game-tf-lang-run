# 2026-05-13 - wikibest Integration

## Summary

Integrated the official-source game development research pack from `wikibest/` into project instructions, project wiki, documentation templates, and initial runtime metadata primitives.

## Changes

- Updated `GEMINI.md` with enforceable rules for:
	- asset intake metadata
	- texture budgets
	- glTF-compatible PBR materials
	- physics/collision policy
	- pooling candidates
	- behavior/pathfinding budgets
- Added templates:
	- `docs/templates/asset-intake.md`
	- `docs/templates/texture-budget.md`
	- `docs/templates/physics-object.md`
	- `docs/templates/behavior-agent.md`
- Added nested wiki guidance:
	- `wiki/wiki/asset-intake-template.md`
	- `wiki/wiki/texture-budget.md`
	- `wiki/wiki/physics-object-policy.md`
	- `wiki/wiki/collision-layers.md`
	- `wiki/wiki/behavior-ai-policy.md`
	- `wiki/wiki/world-streaming-performance.md`
- Added runtime primitives:
	- `src/scenes/physics/collisionLayers.ts`
	- `src/scenes/physics/physicsMetadata.ts`

## Notes

The code additions are intentionally metadata/registry-only. They do not change current scene behavior, but provide canonical names and types for future Havok/Babylon physics integrations.
