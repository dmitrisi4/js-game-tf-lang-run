# 2026-05-11 - Tenerife Buildings

## Summary
- Rendered shared `WORLD_BUILDINGS` in Tenerife preview mode.
- Replaced the initial shared placement with a separate visual-only `TENERIFE_PREVIEW_BUILDINGS` set after arena coordinates proved unsuitable for the Tenerife mesh.
- Added raycast alignment against the Tenerife `ground1` mesh so preview buildings can be grounded after the island model loads.
- Kept manual Tenerife `heightOffset` tuning because visually good preview placement still depends on the current camera and island mesh.
- Normalized imported OBJ lower bounds to their placement anchors so source-model pivot offsets do not make houses float.
- Kept default-only scenery such as terrain ground, boundary walls, trees, rocks, props, NPC placeholders, and creatures inside `WorldScenery`.
- Updated the LLM wiki to reflect that buildings now appear in both default arena mode and `?tenerife=1`.

## Files Changed
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/WorldBuildings.tsx`
- `src/scenes/environment/worldData.ts`
- `src/scenes/environment/worldData.test.ts`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/llm-wiki/log.md`
