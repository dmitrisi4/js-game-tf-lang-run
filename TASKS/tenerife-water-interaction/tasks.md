# Tasks

## 0. Planning

Status: Done

Tasks:
- [x] Create epic directory.
- [x] Add product plan.
- [x] Add roadmap.
- [x] Add technical plan.
- [x] Record implementation verification.

## 1. Research

Status: Implemented

Tasks:
- [x] Review current ocean rendering.
- [x] Review full-island player traversal.
- [x] Check official Babylon water, particle, fluid, and physics sources.

## 2. Water State

Status: Implemented

Tasks:
- [x] Add pure water interaction helpers.
- [x] Add water interaction tests.

## 3. Water Rendering

Status: Implemented

Tasks:
- [x] Move ocean rendering to Babylon `WaterMaterial`.
- [x] Add procedural bump/wave tuning.
- [x] Keep ocean visual-only.

## 4. Player Interaction

Status: Implemented

Tasks:
- [x] Apply full-island water speed and buoyant center height.
- [x] Prevent underwater terrain visual anchoring while in water.
- [x] Add entry splash VFX.

## 5. Validation

Status: Done

Tasks:
- [x] Run focused tests.
- [x] Run project check.
- [x] Run build.
- [x] Add session log.

Verification notes:
- Passed: `bun run test -- src/scenes/player/waterInteraction.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterInteraction.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterEntryEffects.ts`.
- Passed: `bun run build` with the existing large chunk warning.
- Partial: `bun run check` still fails on pre-existing unrelated formatting/import ordering in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.
- Not run: in-browser visual QA. Browser MCP verification was rejected in this session.

## 6. Depth And Entry Follow-Up

Status: Done

Tasks:
- [x] Enable water refraction/reflection render targets with a managed render list.
- [x] Strengthen water-state drag and surface transition so entering water is obvious.
- [x] Add tests for water entry impulse/drag behavior.
- [x] Re-run focused validation.

Verification notes:
- Passed: `bun run test -- src/scenes/player/waterInteraction.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterInteraction.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterEntryEffects.ts`.
- Passed: `bun run build` with the existing large chunk warning.
- Partial: `bun run check` still fails only on pre-existing unrelated formatting/import ordering in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.

## 7. Water Depth And Wake Visibility

Status: Done

Tasks:
- [x] Apply the bounded ocean material tuning in runtime `WaterMaterial`.
- [x] Strengthen player waterline and moving wake visuals.
- [x] Add focused tests for the wake/depth tuning helpers.
- [x] Re-run focused validation.

Verification notes:
- Passed: `bun run test -- src/scenes/player/waterInteraction.test.ts src/scenes/player/waterMovementWaves.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterLineEffect.ts src/scenes/player/waterMovementWaves.ts src/scenes/player/waterMovementWaves.test.ts`.
- Passed: `bun run check`.
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.
- Not run: headless Playwright visual smoke, because the `playwright` package is not installed in this workspace.

## 8. Open-Water State And Visible Depth Fix

Status: Done

Tasks:
- [x] Treat full-island no-terrain-support water positions as swimming instead of dry unsupported space.
- [x] Keep open-water movement at the swim center so water effects can remain active.
- [x] Make the full-island seabed visible and include it in `WaterMaterial` render targets for refraction depth.
- [x] Re-run focused and project validation.

Verification notes:
- Passed: `bun run test -- src/scenes/player/Player.test.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterMovementWaves.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/player/Player.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/OceanSurface.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterLineEffect.ts src/scenes/player/waterMovementWaves.ts src/scenes/player/waterMovementWaves.test.ts`.
- Passed: `bun run check`.
- Passed: `bun run build` with the existing large chunk warning.

## 9. Visible Waterline Recalibration

Status: Done

Tasks:
- [x] Raise the full-island waterline from background-only depth back into the visible gameplay range.
- [x] Recalibrate full-island seabed and deep-water reset under the raised waterline.
- [x] Snap open-water traversal to swim center instead of letting the model drift down slowly from land height.
- [x] Lower the player visual anchor in water so the model reads as submerged rather than standing on the surface.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/player/Player.test.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterMovementWaves.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/OceanSurface.tsx src/scenes/player/Player.tsx src/scenes/player/waterInteraction.ts src/scenes/player/waterInteraction.test.ts`.
- Passed: `bun run check`.
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.

## 10. Shoreline Depth Gradient

Status: Done

Tasks:
- [x] Replace the flat uniform seabed look with a gradual shallow-to-deep depth floor.
- [x] Keep the layer visual-only and non-pickable.
- [x] Add focused tests for shoreline depth gradient sizing.
- [x] Re-run focused and project validation.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/ShorelineDepthFloor.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bun run check`.
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.
- Note: shoreline ramp uses an approximate island-edge ellipse; exact coastline-following depth should be a later heightfield/contour-driven pass.

## 11. Animated Shoreline Surf

Status: Done

Tasks:
- [x] Add visual-only animated surf bands near the terrain-derived shoreline.
- [x] Drive foam motion from scene time so waves advance and recede.
- [x] Add focused tests for surf band configuration.
- [x] Re-run focused and project validation.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/ShorelineSurf.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bun run check`.
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.
- Note: surf is generated from loaded full-island terrain vertices near the configured waterline; if terrain vertices are too sparse at sea level, the next pass should build a denser coastline contour from the heightfield.

## 12. Surf Ribbon Terrain Bridging Fix

Status: Done

Tasks:
- [x] Stop the surf ribbon from connecting distant shoreline samples across terrain.
- [x] Remove circular wraparound that can draw a foam strip through the island.
- [x] Render surf in the normal depth-tested group so terrain can occlude it.
- [x] Add a regression test for long shoreline gap rejection.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/ShorelineSurf.test.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/ShorelineSurf.tsx src/scenes/environment/ShorelineSurf.test.ts src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bun run check`.
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.
