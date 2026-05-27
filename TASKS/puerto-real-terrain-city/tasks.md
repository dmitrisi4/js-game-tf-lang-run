# Tasks

## 0. Planning Module

Status: Done

References used:
- `AGENTS.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`

Tasks:
- [x] Create the Puerto real terrain city epic.
- [x] Document product outcome and acceptance criteria.
- [x] Document technical decisions and current local data baseline.
- [x] Document source data choices and rejected sources.
- [x] Document road texture overlay analysis.
- [x] Update `AGENTS.md` task protocol to require immediate checklist status updates during execution.
- [x] Add session log for this planning work.
- [x] Verify `AGENTS.md` line count, symlink state, and task module files.

## 1. Data Acquisition And Attribution

Status: In progress

Tasks:
- [ ] Download or export the selected CNIG/IGN Puerto DTM tiles for the current road AOI plus buffer.
- [x] Record the exact DTM product, coverage, resolution, source URL, license, and attribution text.
- [ ] Store raw terrain files under `data/tenerife/source/dem/`.
- [x] Confirm whether the current OSM exports are sufficient or regenerate Overpass data for buildings, roads, landuse, amenities, and tourism.
- [x] Record OSM ODbL attribution and derived database policy in metadata.
- [ ] Decide whether GRAFCAN topobathymetric data is needed for the first pass or deferred to coastline polish.

## 2. Projection And AOI Normalization

Status: Done for OSM and fallback DEM

Tasks:
- [x] Define the canonical Puerto AOI bbox in WGS84 and projected CRS.
- [x] Confirm or update the existing projection center from `TENERIFE_ROAD_PROJECTION`.
- [x] Write `scripts/geo/prepare_puerto_dem.mjs`.
- [x] Write `scripts/geo/build_puerto_city_layers.mjs`.
- [x] Generate terrain, road, building, and AOI metadata in `data/tenerife/generated/`.
- [x] Add generated-data tests for terrain grid, texture road widths, and mesh metadata.

## 3. Terrain Mesh Generation

Status: Done for fallback DEM and first reference-city GLB

Tasks:
- [x] Write `scripts/blender/create_puerto_city_terrain.py`.
- [x] Generate Blender terrain mesh from the runtime DEM grid.
- [x] Apply deterministic AOI UVs to terrain.
- [x] Normalize mesh origin, scale, transforms, normals, material slots, and naming.
- [x] Export `public/models/environment/puerto-de-la-cruz-terrain.glb`.
- [x] Record mesh vertex count, triangle count, bounds, and collision strategy.
- [x] Add OSM building footprint massing, landuse overlays, ocean, volcanic coast, and Teide backdrop to the Blender export.
- [x] Re-export after the stronger facade palette, taller/closer Teide, and enlarged building visual scale tweak.

## 4. City Texture And Road Overlay

Status: Done

Tasks:
- [x] Write `scripts/geo/build_puerto_city_texture.mjs`.
- [x] Generate `puerto-city-albedo.png`.
- [x] Generate `puerto-city-road-mask.png` with main/service/walk channels.
- [x] Defer `puerto-city-roughness.webp` until material tuning needs a separate roughness map.
- [x] Verify road pixel width is readable at `2048 x 2048`.
- [x] Document texture budget, mipmap policy, compression target, and color/data classification.
- [x] Add visual QA contact sheet for road mask and albedo layers.
- [x] Add `scripts/build_puerto_city_runtime.mjs` as a one-command runtime asset pipeline.

## 5. Runtime Integration

Status: Done

Tasks:
- [x] Add `PuertoCityTerrain.tsx` or equivalent terrain loader.
- [x] Load the new GLB and expose the terrain as `ground1`.
- [x] Apply baked city material and textures.
- [x] Add a road render mode flag for `mesh`, `baked`, and `both`.
- [x] Keep player reset and building grounding raycasts against `ground1`.
- [x] Keep generated buildings visual-only unless a primitive collision strategy is implemented.
- [x] Add tests for terrain config and road render mode selection.
- [x] Disable old preview and generated roadside placeholder buildings when `?tenerife=1&terrain=real` is active, so the GLB city massing is the visible city source.

## 6. Verification

Status: Done with documented baseline check failures

Tasks:
- [x] Run `bun run check` and document current baseline failures.
- [x] Run targeted tests for projection/layer generation.
- [x] Run `bun run build`.
- [x] Browser-check `?tenerife=1&terrain=real`.
- [x] Browser-check `?tenerife=1&terrain=real&roads=both`.
- [x] Capture screenshots showing roads on slopes and buildings grounded beside roads.
- [x] Capture reference-city screenshot after the GLB city/coast/Teide export.
- [x] Update follow-up streaming tasks if the new city asset changes chunking assumptions.

Verification notes:
- `bun run check` now skips large generated/source geo dumps, but still fails on pre-existing unrelated formatting/import issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Targeted tests passed: `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/puertoCityGeneratedData.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts`.
- `bun run build` passed with the existing Vite large chunk warning.
- Browser screenshots:
	- `docs/history/logs/2026-05-16-puerto-real-terrain-baked.png`
	- `docs/history/logs/2026-05-16-puerto-real-terrain-roads-both.png`
	- `docs/history/logs/2026-05-16-puerto-reference-city-baked.png`
- Current exported GLB includes 3,087 OSM-derived building footprints, 490 landuse overlays, Atlantic ocean/coast meshes, Teide/Orotava backdrop, and enlarged building visual scale.
- Browser recheck after disabling the old placeholder buildings was blocked by the tool usage limit. The runtime source change is in `src/scenes/environment/Environment.tsx`.
- Building visual scale pass added and exported on 2026-05-17: 1.35x footprint scale, 1.18x height scale, and 1.06x local block spacing.

## 7. Roadbed And PBR Material Pipeline

Status: Done

References used:
- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- `docs/history/logs/2026-05-27-road-terrain-photoreal-research.md`

Tasks:
- [x] Record the roadbed/PBR phase in the roadmap and task checklist.
- [x] Update the technical plan and pipeline docs for roadbed deformation and PBR maps.
- [x] Add a roadbed deformation pass to `scripts/geo/prepare_puerto_dem.mjs`.
- [x] Add generated ORM/roughness and normal/detail texture outputs to `scripts/geo/build_puerto_city_texture.mjs`.
- [x] Update runtime material loading in `PuertoCityTerrain`.
- [x] Keep new runtime textures in the build asset allowlist and tests.
- [x] Regenerate city layers, DEM, textures, Blender GLB, and runtime metadata.
- [x] Add or update focused tests for generated metadata and runtime texture config.
- [x] Run validation commands and record results.
- [x] Add a session log for the implementation.

Verification notes:
- `node --check scripts/geo/prepare_puerto_dem.mjs` passed.
- `node --check scripts/geo/build_puerto_city_texture.mjs` passed.
- `python3 -m py_compile scripts/blender/create_puerto_city_terrain.py` passed.
- `./node_modules/.bin/tsc -p tsconfig.app.json --noEmit` passed.
- `bun run test -- src/scenes/environment/puertoCityGeneratedData.test.ts src/scenes/environment/puertoCityConfig.test.ts scripts/prune-public-assets.test.mjs` passed: 18 tests.
- `./node_modules/.bin/biome check ...` passed for changed JS/TS files.
- `bun run check` passed.
- `bun run test` passed: 35 files, 163 tests.
- `bun run build` passed with the existing Vite large chunk warning.
- Browser smoke at `http://127.0.0.1:5174/?tenerife=1&terrain=real` loaded a canvas and returned HTTP 200 for `puerto-city-albedo.png`, `puerto-city-road-mask.png`, `puerto-city-orm.png`, `puerto-city-normal.png`, and `puerto-de-la-cruz-terrain.glb?v=2026-05-27-roadbed-pbr-pass`.
- Sandboxed Blender export crashed with a segmentation fault; rerunning `blender -b --python scripts/blender/create_puerto_city_terrain.py` outside sandbox restrictions succeeded.
