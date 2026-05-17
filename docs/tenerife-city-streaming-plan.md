# Tenerife City Streaming and Optimization Plan

## Context

The current Tenerife prototype renders Puerto de la Cruz street data from `data/tenerife2/export.geojson`. The exported GeoJSON is imported into the client bundle, parsed synchronously, projected into Babylon world coordinates, converted into road meshes, and then used to generate roadside building placements.

Current runtime content is roughly:

- 2.7 MB raw GeoJSON embedded into the JavaScript bundle.
- 3,486 GeoJSON features.
- 3,427 road LineStrings.
- 19,575 road points.
- 16,148 road segments.
- Three full-city road meshes generated at scene mount.
- Up to 72 generated roadside buildings, currently loaded with the same building component used by blocking preview buildings.

The target architecture is a streaming city layer: only nearby road and building chunks should be loaded, while far city content should be simplified, delayed, or omitted.

## 1. Measure First

Before changing the loading model, add lightweight runtime instrumentation around the expensive stages:

- GeoJSON parse time.
- Road layer projection/build time.
- Road mesh creation time.
- Roadside building placement generation time.
- Building model loading and instancing time.
- Environment readiness time.

Implementation notes:

- Use `performance.mark` and `performance.measure` where the browser API is available.
- Log measurements only in development builds.
- Keep instrumentation side-effect free, so tests and production builds remain stable.
- The first goal is to identify whether the slow loading is dominated by data parsing, mesh generation, or OBJ model instancing.

## 2. Remove Generated City Buildings From Blocking Loading

Generated roadside buildings should not block the main scene readiness. The player should be able to enter the scene after terrain, core environment, and curated preview buildings are ready.

Implementation notes:

- Keep `TENERIFE_PREVIEW_BUILDINGS` in the blocking `WorldBuildings` path.
- Render `TENERIFE_GEO_ROADSIDE_BUILDINGS` through a separate `WorldBuildings` instance without `onReadyChange`.
- Keep physics disabled for generated roadside buildings until we have a radius-based collision strategy.
- This should reduce perceived loading time without changing the visible result once loading completes.

## 3. Move Raw OSM Data Out of the Client Bundle

The raw GeoJSON should not be imported directly by the application bundle. Runtime code should consume compact, preprocessed data.

Implementation notes:

- Add a preprocessing script that reads `data/tenerife2/export.geojson`.
- Convert lon/lat to game-space `x/z` at preprocessing time.
- Drop unused OSM properties.
- Preserve only fields needed by gameplay and rendering: road id, layer id, name, width/style key, and points.
- Emit generated data under `public/data/tenerife/`.
- Keep the original GeoJSON as source data, not runtime data.

## 4. Simplify Road Geometry During Preprocessing

Road lines should be simplified before runtime rendering.

Implementation notes:

- Use a deterministic polyline simplification step.
- Start with a conservative tolerance, for example `0.5` to `1.0` world units.
- Preserve endpoints for each road line.
- Track before/after metrics: line count, point count, segment count.
- Keep separate tolerances per layer if needed: main roads can keep more detail than walk paths.

## 5. Split City Content Into Grid Chunks

Large city content should be split into spatial chunks.

Implementation notes:

- Use a fixed chunk size, likely `64` or `128` world units.
- Assign road segments to chunks by segment midpoint for the first version.
- If visual gaps appear near chunk borders, upgrade assignment to segment bounding-box overlap.
- Assign buildings by their final world position.
- Emit chunk files such as `roads/cx_cz.json` and `buildings/cx_cz.json`, or one combined chunk file per cell.

## 6. Add Runtime City Streaming

Introduce a `TenerifeCityStreamer` that loads, renders, and unloads chunks around the player.

Implementation notes:

- Use the player or camera position as the streaming source.
- Load chunks within an active radius.
- Prefetch chunks within a larger radius.
- Unload chunks only after they exceed a larger hysteresis radius.
- Suggested starting values:
  - Active radius: `100` world units.
  - Prefetch radius: `150` world units.
  - Unload radius: `180` world units.
- If the design requires real meters, convert carefully: with `metersToWorld = 0.26`, `100` real meters is about `26` world units.

## 7. Render Roads Per Chunk

Roads should be rendered as merged meshes per chunk and per visual layer.

Implementation notes:

- Create at most one mesh per road layer per loaded chunk.
- Reuse the current ribbon mesh generation logic, but feed it chunk-local road lines instead of all city lines.
- Dispose meshes when a chunk unloads.
- Freeze static road materials.
- Freeze road mesh world matrices after creation.
- Keep roads non-pickable.

## 8. Stream Buildings With LOD

Roadside buildings should use distance-based quality levels.

Implementation notes:

- Near range: render current OBJ instances.
- Mid range: render simplified box or low-poly proxy.
- Far range: hide buildings entirely.
- Group repeated buildings by model id and material.
- Consider Babylon thin instances for large static proxy sets.
- Avoid per-building physics by default. Enable colliders only for buildings near the player or buildings relevant to gameplay.

## 9. Keep Initial Scene Readiness Small

The loading screen should wait for the minimal playable scene, not the entire city.

Implementation notes:

- Blocking readiness should cover terrain, player-critical systems, and the first nearby city chunks.
- Non-critical city chunks should load after the first frame.
- Generated city buildings should not block readiness.
- Add clear performance logs for "first playable" versus "city fully settled".

## 10. Verification Strategy

Each step should have measurable validation.

Implementation notes:

- Unit tests should cover projection, layer splitting, simplification, and chunk assignment.
- Runtime logs should report loaded chunk counts, road mesh counts, building counts, and load timings.
- Build should stay green.
- Browser verification should confirm roads still sit on terrain and buildings appear beside roads.
- Performance should be compared before and after each optimization stage.

