# Tenerife Accurate Minimap

Date: 2026-05-20

## Scope

Generated a more accurate Tenerife full-island minimap surface from the normalized island GLB and wired the HUD projection to the generated runtime bounds.

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`

## Changes

- Added `TASKS/tenerife-accurate-minimap/` with product, roadmap, technical plan, and checklist.
- Added `scripts/blender/build_tenerife_full_island_map.py`.
- Generated `src/scenes/environment/tenerifeFullIslandMapData.ts` from `public/models/environment/tenerife-full-island-normalized.glb`.
- Added `src/ui/mapProjection.ts` and focused tests.
- Updated `src/ui/GameHud.tsx` so `?tenerife=1&terrain=island-full` renders the generated island outline and uses generated runtime bounds for player projection.
- Corrected generated map data to use the Babylon GLB import transform: source `x/y/z` becomes runtime `-x/-y/z`.
- Restored the Teide marker from the generated highest terrain vertex.
- Added WGS84-projected city markers for Puerto de la Cruz, Santa Cruz de Tenerife, Los Realejos, La Laguna, and La Orotava.

## Notes

- The generated map data uses a `384 x 384` rasterized top-down terrain footprint.
- Runtime map bounds are `x -407.428555..1181.542734` and `z -741.520078..598.920117`.
- Teide is generated at runtime `x 627.439961`, `z -12.222881`.
- City markers are projected with an affine Tenerife island-bounds fit into the mirrored full-island runtime map. This is suitable for full-map city labels, not road-level placement.

## Validation

- Passed: `blender -b --python scripts/blender/build_tenerife_full_island_map.py`.
- Passed: `bun run test -- src/ui/mapProjection.test.ts`.
- Passed: `bunx biome check scripts/blender/build_tenerife_full_island_map.py src/scenes/environment/tenerifeFullIslandMapData.ts src/ui/mapProjection.ts src/ui/mapProjection.test.ts src/ui/GameHud.tsx`.
- Passed: `bun run build`.
- `bun run check` still fails on pre-existing unrelated formatting/import issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Browser smoke passed at `http://127.0.0.1:5174/?tenerife=1&terrain=island-full`.
- Screenshot: `docs/history/logs/2026-05-20-tenerife-map-browser-smoke.png`.

## Follow-Up Marker Projection Fix

The first generated island path used the wrong source-to-runtime axes. Blender source `x/y` was treated as Babylon runtime `x/z`, while Babylon's GLB import for this asset produces runtime `x = -source.x` and `z = -source.y` after scaling. That mismatch put the marker and control points on a visually plausible but mirrored/rotated map.

Fix:

- Exported `getTenerifeFullIslandHeightfieldBounds()` from `src/scenes/environment/tenerifeFullIslandHeightfield.ts`.
- Updated `src/ui/mapProjection.ts` to prefer active heightfield bounds in full-island mode, falling back to generated map bounds before the terrain loads.
- Updated `scripts/blender/build_tenerife_full_island_map.py` to generate runtime points with `x = -source.x * scale`, `z = -source.y * scale`, and `y = source.z * scale`.
- Regenerated `src/scenes/environment/tenerifeFullIslandMapData.ts` with runtime bounds matching the Babylon-loaded terrain.
- Restored the full-island Teide marker from the generated highest terrain vertex.

Validation:

- Passed: `bun run test -- src/ui/mapProjection.test.ts`.
- Passed: `bunx biome check src/scenes/environment/tenerifeFullIslandHeightfield.ts src/ui/mapProjection.ts src/ui/mapProjection.test.ts src/ui/GameHud.tsx`.
- Passed: `bun run build`.
- Browser smoke confirmed player marker at `left: 64.2857%; top: 42.8571%`, Teide label at `left: 65.1282%; top: 45.5927%`, and visible label text `Teide`.

## Full-Island City Marker Pass

Requested city labels:

- Puerto de la Cruz: `28.41397, -16.54867`
- Santa Cruz de Tenerife: `28.46824, -16.25462`
- Los Realejos: `28.36739, -16.58335`
- La Laguna: `28.4899, -16.3232`
- La Orotava: `28.39076, -16.52309`

Coordinate sources:

- Latitude.to / LatLong.info for Puerto de la Cruz.
- Geodatos for Santa Cruz de Tenerife and La Orotava.
- latitudelongitude.org for Los Realejos.
- OpenStreetMap Wiki for San Cristobal de La Laguna.

Implementation:

- Added `projectTenerifeGeoToFullIslandWorldPoint()` in `src/ui/mapProjection.ts`.
- Added requested city markers to `TENERIFE_FULL_ISLAND_MARKERS` in `src/ui/GameHud.tsx`.
- Added projection tests that compare real Teide WGS84 coordinates against the generated highest-vertex Teide landmark.
- Added map-space calibration for Puerto de la Cruz and La Orotava after visual review showed the raw affine projection placed them too low against this island mesh.

Validation:

- Passed: `bun run test -- src/ui/mapProjection.test.ts`.
- Passed: `bunx biome check src/ui/mapProjection.ts src/ui/mapProjection.test.ts src/ui/GameHud.tsx TASKS/tenerife-accurate-minimap/product-plan.md TASKS/tenerife-accurate-minimap/roadmap.md TASKS/tenerife-accurate-minimap/technical-plan.md TASKS/tenerife-accurate-minimap/tasks.md docs/history/logs/2026-05-20-tenerife-accurate-minimap.md`.
- Passed: `bun run build`.
- Browser smoke confirmed visible labels for Teide, Puerto de la Cruz, Santa Cruz de Tenerife, Los Realejos, La Laguna, and La Orotava.
- Browser console showed no warnings or errors.
- Screenshot: `docs/history/logs/2026-05-20-tenerife-city-markers-browser-smoke.png`.

Follow-up calibration:

- Puerto de la Cruz and La Orotava now apply `top: -5%` after WGS84 projection.
- The calibration preserves real coordinate ordering while compensating for the non-georeferenced 3D island mesh outline.
