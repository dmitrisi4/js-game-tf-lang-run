# 2026-05-13 - OSM Puerto City Safety

## Summary
- Switched Tenerife preview roads to OSM/Overpass-derived Puerto de la Cruz way geometry and kept OSM way IDs in runtime road data.
- Added denser road-side building placement using the January 2019 building pack, with positive terrain lift and no negative Tenerife height offsets.
- Added `TenerifeSafetyLayer` for low water, seabed, invisible bounds, and fall reset.
- Added shared Tenerife preview config for city anchor, player spawn, fall reset, and playable bounds.
- Increased the island preview scale and fixed the Puerto anchor so runtime city content sits over the island terrain instead of the water side.
- Fixed `TenerifeIslandPreview` terrain detection to use the exact terrain mesh name, not vertex count.
- Disabled baked Puerto GLB city/ocean details at runtime so the GLB blockout does not overlap runtime roads and building-pack houses.
- Gated Tenerife player creation until environment readiness and compute spawn height from the loaded `ground1` mesh.
- Updated LLM wiki pages for future scene edits.

## Files Changed
- `src/scenes/MainScene.tsx`
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/TenerifeIslandPreview.tsx`
- `src/scenes/environment/TenerifeSafetyLayer.tsx`
- `src/scenes/environment/tenerifePreviewConfig.ts`
- `src/scenes/environment/WorldBuildings.tsx`
- `src/scenes/environment/WorldRoads.tsx`
- `src/scenes/environment/worldData.ts`
- `src/scenes/environment/worldData.test.ts`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/llm-wiki/log.md`
