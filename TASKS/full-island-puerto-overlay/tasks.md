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

## 4. Real Footprint City Layer

Status: Done

References used:
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/world-building.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/documentation-maintenance.md`
- `TASKS/puerto-real-terrain-city/technical-plan.md`
- `TASKS/puerto-real-terrain-city/data-and-asset-pipeline.md`

Tasks:
- [x] Confirm available OSM footprint source data.
- [x] Generate compact public runtime building footprint data.
- [x] Add full-island Puerto footprint building renderer.
- [x] Integrate real buildings into `?tenerife=1&terrain=island-full`.
- [x] Make roads visible by default in island-full Puerto mode.
- [x] Add focused tests.
- [x] Run validation and add session log.

Verification notes:
- Passed: `bun run check`.
- Passed: `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/puertoFootprintBuildings.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/puertoCityGeneratedData.test.ts`.
- Passed: `bun run build`.
- Passed HTTP smoke on `http://127.0.0.1:5174/`, `/data/tenerife/puerto-building-footprints-runtime.json`, and `/data/tenerife/roads-runtime.json`.
- Full browser smoke was blocked: local `playwright` module is not installed, and the DevTools connector reported an already-running Chrome profile.
- Follow-up proportions fix: split footprint building scale into horizontal and vertical multipliers so full-island OSM buildings do not render as wide flattened slabs.
- Follow-up city readability fix: full-island Puerto now applies a shared readability scale to road/building positions, thickens road ribbons, and narrows footprint boxes so streets remain visible between buildings.
- Follow-up roads-first calibration: full-island Puerto buildings are now opt-in with `&buildings=1`; default `?tenerife=1&terrain=island-full` renders the real OSM road network first.
- Follow-up road visibility fix: full-island roads now use the full-island heightfield provider instead of waiting for a `ground1` mesh, which does not exist in `terrain=island-full`.
- Follow-up road grounding fix: road ribbon height now prefers exact raycasts against `tenerife-full-island-terrain-tile-*` meshes before falling back to the coarse heightfield, preventing roads from floating over slopes.
- Follow-up road visual pass: full-island Puerto now shows `main` and `service` only by default, and renders roads as layered shoulder/surface/centerline passes instead of single flat strips.
- Follow-up startup performance fix: layered road meshes now reuse cached centerline terrain samples instead of raycasting every ribbon edge for every visual pass.
- Follow-up browser smoke: reloaded `http://127.0.0.1:5174/?tenerife=1&terrain=island-full&verify=1779888899000`; scene rendered and console reported no errors or warnings.
- Follow-up gameplay performance fix: full-island visible road layer props now keep a stable reference, preventing road mesh disposal/recreation on unrelated React renders; road meshes also no longer force `alwaysSelectAsActiveMesh`.
- Follow-up gameplay smoke: loaded `http://127.0.0.1:5174/?tenerife=1&terrain=island-full&verify=1779890000000`; console reported no errors or warnings, and a 120-frame sample measured about 65.9 FPS average.
- Follow-up Teide slope cleanup: full-island Puerto roads now use a coastal clip window and only render segments whose endpoints stay inside the Puerto band, removing the road strip that climbed the slope under Teide.
