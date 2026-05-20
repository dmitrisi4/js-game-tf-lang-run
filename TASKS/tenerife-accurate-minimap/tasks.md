# Tasks

## 0. Planning

Status: Done

Tasks:
- [x] Create product plan.
- [x] Create roadmap.
- [x] Create technical plan.
- [x] Create task checklist.

## 1. Generated Map Data

Status: Implemented

Tasks:
- [x] Add deterministic Blender map generation script.
- [x] Generate full-island runtime map data.
- [x] Record generated data provenance and runtime transform.

## 2. Runtime HUD Integration

Status: Implemented

Tasks:
- [x] Extract map projection logic from `GameHud.tsx`.
- [x] Render generated full-island map path in Tenerife full-island mode.
- [x] Keep arena and legacy Tenerife preview maps unchanged.

## 3. Verification

Status: Done

Tasks:
- [x] Add focused projection tests.
- [x] Run focused tests.
- [x] Run targeted Biome check.
- [x] Run build.
- [x] Add browser smoke check.
- [x] Add session log.

## 4. City Markers

Status: Implemented

Tasks:
- [x] Research WGS84 coordinates for Puerto de la Cruz, Santa Cruz de Tenerife, Los Realejos, La Laguna, and La Orotava.
- [x] Add full-island WGS84-to-runtime marker projection.
- [x] Render requested city labels on the full-island map.
- [x] Add focused projection coverage against Teide and Santa Cruz placement.

Verification notes:
- Passed: `blender -b --python scripts/blender/build_tenerife_full_island_map.py`.
- Passed: `bun run test -- src/ui/mapProjection.test.ts`.
- Passed: `bunx biome check scripts/blender/build_tenerife_full_island_map.py src/scenes/environment/tenerifeFullIslandMapData.ts src/ui/mapProjection.ts src/ui/mapProjection.test.ts src/ui/GameHud.tsx`.
- Passed: `bun run build`.
- `bun run check` still fails on pre-existing unrelated formatting/import issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Browser smoke passed at `http://127.0.0.1:5174/?tenerife=1&terrain=island-full`; screenshot saved to `docs/history/logs/2026-05-20-tenerife-map-browser-smoke.png`.
- Browser console showed no errors; only existing Vite, React, Babylon, and Tenerife perf/info messages.
- Follow-up fix: corrected Blender-to-Babylon map generation from source `x/y/z` to runtime `-x/-y/z`, regenerated map data, and restored Teide from the generated highest terrain vertex.
- Browser smoke confirmed player marker at `left: 64.2857%; top: 42.8571%` and Teide label at `left: 65.1282%; top: 45.5927%` on the full-island map.
- City marker projection sources: Latitude.to for Puerto de la Cruz; Geodatos for Santa Cruz de Tenerife and La Orotava; latitudelongitude.org for Los Realejos; OpenStreetMap Wiki for San Cristobal de La Laguna.
- City marker browser smoke confirmed 6 full-map labels: Teide plus the 5 requested cities. Screenshot saved to `docs/history/logs/2026-05-20-tenerife-city-markers-browser-smoke.png`.
- User visual calibration: Puerto de la Cruz and La Orotava were too low on the model shoreline/water, so both now receive a `-5%` top map-space offset after WGS84 projection.
