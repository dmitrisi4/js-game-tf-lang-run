# 2026-05-12 - Tenerife Roads And Preloader

## Summary
- Added a fullscreen scene preloader that waits for physics, environment asset readiness, player setup, and a ready render frame.
- Added authored Puerto de la Cruz preview roads based on public map references for Calle Mequinez, Plaza del Charco, Calle Quintana, and Avenida Familia de Betancourt y Molina.
- Increased Tenerife preview building density and aligned the extra houses/buildings along the new road polylines.
- Added readiness callbacks for Tenerife island loading and building OBJ instancing so the preloader does not disappear while scene files are still settling.
- Updated the LLM wiki with the new preloader and road-placement rules.

## Files Changed
- `src/scenes/MainScene.tsx`
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/TenerifeIslandPreview.tsx`
- `src/scenes/environment/WorldBuildings.tsx`
- `src/scenes/environment/WorldRoads.tsx`
- `src/scenes/environment/WorldScenery.tsx`
- `src/scenes/environment/worldData.ts`
- `src/scenes/environment/worldData.test.ts`
- `src/ui/ScenePreloader.tsx`
- `src/ui/scenePreloader.css`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/llm-wiki/log.md`
