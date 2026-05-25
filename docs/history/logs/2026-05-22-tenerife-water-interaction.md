# 2026-05-22 Tenerife Water Interaction

## Summary

Implemented the first real-water gameplay pass for full-island Tenerife. The ocean surface now uses Babylon `WaterMaterial` with procedural bump waves, and the full-island player controller resolves a water state from terrain floor height versus the configured ocean surface.

## Changes

- Added `TASKS/tenerife-water-interaction/` with product, roadmap, technical plan, and checklist.
- Replaced the custom flat ocean shader in `OceanSurface` with Babylon `WaterMaterial`.
- Added tested ocean material tuning helpers in `oceanVisualConfig`.
- Added tested player water interaction helpers for depth, swim center, visual anchor, and water speed drag.
- Updated full-island traversal to slow movement and keep the capsule near the waterline when submerged.
- Updated the player visual anchor so swimming does not snap feet to underwater terrain.
- Added a one-shot particle splash when entering water.

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- Babylon.js official Fluid Renderer documentation
- Babylon.js official Physics documentation
- Babylon.js official Particle System documentation
- Babylon.js official `WaterMaterial` source and local package typings

## Validation

- Passed: `bun run test -- src/scenes/player/waterInteraction.test.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterInteraction.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterEntryEffects.ts`
- Passed: `bun run build`
- Partial: `bun run check` still fails on unrelated existing formatting/import-order issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'`

## Follow-Up

- Add dedicated swim animation mapping when the rig animation registry has a suitable clip.
- Add underwater camera/post-process treatment.
- Add shoreline foam masks when coast depth data is available.

## 2026-05-24 Follow-Up

Responded to QA that the first pass still read as a blue background without depth or entry physics.

Changes:
- Enabled `WaterMaterial` render targets instead of disabling them.
- Added a managed water render list that tracks current and newly-added scene meshes so terrain/player visuals can appear in water refraction/reflection.
- Strengthened water drag from `0.46` to `0.3` and added a `0.16` dry-to-wet entry resistance multiplier.
- Added an expanding foam ring at the water surface alongside the splash particle burst.
- Added tests for entry-frame water resistance.

Validation:
- Passed: `bun run test -- src/scenes/player/waterInteraction.test.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterInteraction.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterEntryEffects.ts`
- Passed: `bun run build`
- Partial: `bun run check` still fails only on unrelated existing formatting/import-order issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`
