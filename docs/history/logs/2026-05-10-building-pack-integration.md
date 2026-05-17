# 2026-05-10 - Building Pack Integration

## Summary
- Added static building placement data for the `buildings-pack-jan2019` asset pack.
- Added a dedicated `WorldBuildings.tsx` renderer that loads OBJ building visuals and keeps gameplay collision on primitive box colliders.
- Wired buildings into default world scenery.
- Updated the LLM wiki with the current building integration path.

## Files Changed
- `src/scenes/environment/worldData.ts`
- `src/scenes/environment/WorldBuildings.tsx`
- `src/scenes/environment/WorldScenery.tsx`
- `src/scenes/environment/worldData.test.ts`
- `docs/llm-wiki/world-building.md`
- `docs/llm-wiki/decisions.md`
- `docs/llm-wiki/log.md`

## Notes
- The current building pack is OBJ/FBX/Blend, not GLB.
- Runtime integration uses OBJ as a practical first pass.
- A later Blender pass should normalize and export selected buildings to GLB.
