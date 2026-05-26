# Tasks

## 0. Planning

Status: Done

References used:
- `docs/llm-wiki/index.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- `TASKS/full-tenerife-island-integration/technical-plan.md`
- `TASKS/puerto-real-terrain-city/technical-plan.md`

Tasks:
- [x] Create task module.
- [x] Record transform strategy.

## 1. Runtime Implementation

Status: Done

Tasks:
- [x] Add full-island Puerto overlay transform helper.
- [x] Disable the baked Puerto GLB on `island-full` because its source vertex heights cannot be corrected with one root Y offset.
- [x] Allow `TenerifeGeoRoadLayers` to render with transform props.
- [x] Transform generated Puerto roadside buildings into full-island coordinates.
- [x] Ground generated full-island Puerto buildings against the full-island heightfield.
- [x] Keep runtime road meshes opt-in for `island-full` to avoid browser stalls.

## 2. Tests

Status: Done

Tasks:
- [x] Cover `island-full` road default.
- [x] Cover full-island Puerto overlay transform scale and anchor.
- [x] Cover transformed road points.
- [x] Cover transformed/generated full-island roadside building positions and visual scale.

## 3. Verification

Status: Done

Tasks:
- [x] Run targeted tests.
- [x] Run build.
- [x] Add session log.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts`.
- Passed: `bunx biome check src/scenes/environment/Environment.tsx src/scenes/environment/PuertoCityTerrain.tsx src/scenes/environment/TenerifeGeoRoadLayers.tsx src/scenes/environment/puertoCityConfig.ts src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/Clouds.tsx src/scenes/environment/SkyDome.tsx src/scenes/environment/TenerifeFullIslandTerrain.tsx TASKS/full-island-puerto-overlay/tasks.md TASKS/full-island-puerto-overlay/technical-plan.md`.
- Passed: `bun run build` with the existing Vite large chunk warning.
- Passed browser smoke at `http://localhost:5173/?tenerife=1&terrain=island-full`: DevTools console had no errors/warnings, and network loaded the full island GLB, Puerto GLB, Puerto roads JSON, and Puerto albedo texture with `200` responses.
- Note: Biome ignores `TASKS/` and `docs/history/` markdown paths, so direct markdown checks report no processed files.
- Follow-up freeze fix: changed default `island-full` roads from runtime mesh ribbons to baked-only and disabled Havok physics for the full-island Puerto overlay. Runtime road ribbons remain available through `roads=mesh` or `roads=both`.
- Follow-up vertical placement fix: the full-island Puerto overlay now waits for the full-island heightfield, samples the actual terrain height at the Puerto anchor, and subtracts the Puerto source projection-center terrain height before applying the overlay root Y. This removes the fixed `y=16` placement that made buildings float.
- Follow-up root-cause fix: the full-island path no longer renders the baked Puerto GLB. It now renders generated Puerto roadside buildings transformed to the island position and grounded through `getTenerifeFullIslandHeightAtPosition`, which avoids the floating baked source geometry.
- Follow-up browser smoke: reloaded `http://localhost:5173/?tenerife=1&terrain=island-full&verify=1779830703160`; DevTools console reported no errors or warnings after the stable empty list and stable settlement callback fixes.
- Follow-up visibility fix: full-island Puerto buildings now render as simple grounded box volumes with gameplay footprint/visual multipliers, because the geographically exact generated OBJ instances were too small and hard to see at the compressed island scale.
