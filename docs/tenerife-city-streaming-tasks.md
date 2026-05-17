# Tenerife City Streaming Tasks

This task list tracks implementation against `docs/tenerife-city-streaming-plan.md`. Each task includes the local implementation context so work can continue without re-reading the whole plan.

## 1. Measure First

Status: Partially implemented

Context:

- Current runtime data entry point: `src/scenes/environment/tenerifeGeoData.ts`.
- Current road mesh entry point: `src/scenes/environment/TenerifeGeoRoadLayers.tsx`.
- Current building loader: `src/scenes/environment/WorldBuildings.tsx`.
- Add development-only `performance.mark` / `performance.measure` logging around parse, road layer build, road mesh creation, roadside building generation, and building settlement.

Tasks:

- [x] Add safe development-only measurement helpers.
- [x] Measure GeoJSON parse time.
- [x] Measure road layer projection/build time.
- [x] Measure roadside building generation time.
- [x] Measure road mesh creation time per layer.
- [x] Measure building settlement time for each `WorldBuildings` group.
- [ ] Capture real browser timing numbers from a local run.

## 2. Remove Generated City Buildings From Blocking Loading

Status: Implemented, pending browser timing confirmation

Context:

- Current blocking path is in `src/scenes/environment/Environment.tsx`.
- `TENERIFE_PREVIEW_BUILDINGS` and `TENERIFE_GEO_ROADSIDE_BUILDINGS` are currently concatenated into one `WorldBuildings` call.
- `onReadyChange={setAreBuildingsReady}` should apply only to the curated blocking preview buildings.

Tasks:

- [x] Keep `TENERIFE_PREVIEW_BUILDINGS` in the blocking `WorldBuildings` instance.
- [x] Render `TENERIFE_GEO_ROADSIDE_BUILDINGS` in a separate non-blocking `WorldBuildings` instance.
- [x] Keep generated roadside building physics disabled.
- [x] Verify in code that environment readiness no longer waits for generated roadside buildings.
- [ ] Verify with browser timing that generated roadside buildings do not hold the loading screen.

## 3. Move Raw OSM Data Out of the Client Bundle

Status: Implemented for a single compact runtime file; chunked files remain future work

Context:

- Current raw import: `src/scenes/environment/tenerifeGeoData.ts` imports `../../../data/tenerife2/export.geojson?raw`.
- Target runtime location: `public/data/tenerife/`.
- Source data should remain in `data/tenerife2/export.geojson`.

Tasks:

- [x] Add a preprocessing script for Tenerife OSM roads.
- [x] Emit compact projected runtime JSON under `public/data/tenerife/`.
- [x] Replace raw GeoJSON import with runtime data loading.
- [x] Keep tests reading source GeoJSON where useful.
- [ ] Split runtime data into chunk files.

Implementation note:

- Added `scripts/build_tenerife_runtime_roads.mjs`.
- Generated `public/data/tenerife/roads-runtime.json`.
- Runtime road data size is about 562 KB versus the 2.7 MB source GeoJSON.

## 4. Simplify Road Geometry During Preprocessing

Status: Partially implemented in preprocessing

Context:

- Current projection/build function: `buildTenerifeRoadLayerData` in `src/scenes/environment/tenerifeRoadLayers.ts`.
- Current point count is about 19,575 and segment count is about 16,148.

Tasks:

- [x] Add deterministic polyline simplification.
- [x] Preserve endpoints.
- [x] Report before/after line, point, and segment counts.
- [ ] Add tests for simplification behavior.

Implementation note:

- Added Douglas-Peucker simplification to `scripts/build_tenerife_runtime_roads.mjs`.
- Current tolerance is `0.35` world units.
- Runtime road data now contains 12,902 / 19,575 points and 9,475 / 16,148 segments.
- Runtime file size is about 451 KB.

## 5. Split City Content Into Grid Chunks

Status: Not started

Context:

- Current data model is layer-level arrays of full-city lines.
- Target model should group roads and buildings by grid chunk.

Tasks:

- [ ] Define chunk coordinate helpers.
- [ ] Assign road segments or lines to chunks.
- [ ] Assign generated buildings to chunks.
- [ ] Emit chunk files.
- [ ] Add tests for chunk assignment.

## 6. Add Runtime City Streaming

Status: Not started

Context:

- Target component name: `TenerifeCityStreamer`.
- Streaming source should be player or camera position.
- Start with active/prefetch/unload radii of `100` / `150` / `180` world units unless playtesting suggests otherwise.

Tasks:

- [ ] Create a chunk registry.
- [ ] Load chunks around the streaming source.
- [ ] Unload chunks with hysteresis.
- [ ] Report loaded chunk and object counts in development logs.

## 7. Render Roads Per Chunk

Status: Partially implemented for current full-city meshes; chunked rendering not started

Context:

- Current renderer: `src/scenes/environment/TenerifeGeoRoadLayers.tsx`.
- Current mesh creation can be reused, but input should become chunk-local.

Tasks:

- [ ] Create one road mesh per layer per loaded chunk.
- [ ] Dispose road meshes when chunks unload.
- [x] Freeze static road materials.
- [x] Freeze road mesh world matrices.
- [x] Keep roads non-pickable.

## 8. Stream Buildings With LOD

Status: Not started

Context:

- Current building renderer: `src/scenes/environment/WorldBuildings.tsx`.
- Current generated building count is capped at 72.
- OBJ instances are visually richer but should be reserved for nearby buildings.

Tasks:

- [ ] Define near/mid/far distance bands.
- [ ] Render OBJ instances only in near range.
- [ ] Render proxy boxes or thin instances in mid range.
- [ ] Hide far buildings.
- [ ] Enable colliders only near the player when needed.

## 9. Keep Initial Scene Readiness Small

Status: Not started

Context:

- Current readiness composition is in `src/scenes/environment/Environment.tsx`.
- Current loading should wait for terrain/island and blocking preview buildings only.

Tasks:

- [ ] Define "first playable" readiness.
- [ ] Keep non-critical city chunks out of blocking readiness.
- [ ] Add separate logs for first playable and city settled.

## 10. Verification Strategy

Status: Partially complete for implemented stages

Context:

- Existing focused test: `src/scenes/environment/tenerifeRoadLayers.test.ts`.
- Existing targeted checks can use Vitest, build, and Biome.

Tasks:

- [x] Run focused Tenerife road tests after each data-model change.
- [x] Run targeted Biome checks after edited files.
- [x] Run build after runtime integration changes.
- [ ] Browser-check roads and buildings when the dev server is available.

Verification note:

- `npm run test -- src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/worldData.test.ts` passed.
- Targeted `npx biome check ...` passed for edited implementation files.
- `npm run build` passed. The main chunk warning remains, but the main bundle dropped from about 7.57 MB to about 4.87 MB minified after removing raw GeoJSON from the bundle.
