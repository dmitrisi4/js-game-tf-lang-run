# 2026-05-26 - Full-Island Puerto Overlay

## Summary

- Enabled the calibrated Puerto de la Cruz overlay by default for `?tenerife=1&terrain=island-full`, with `puerto=0` as an opt-out.
- Added a first-pass full-island Puerto transform derived from the Puerto road projection center, Teide WGS84 control point, generated full-island map bounds, and the existing Puerto visual map calibration.
- Reused `PuertoCityTerrain` with optional transform props so the existing Puerto GLB can be placed on the full island without changing `?tenerife=1&terrain=real`.
- Reused `TenerifeGeoRoadLayers` with an optional road transform so runtime OSM road ribbons align with the scaled Puerto overlay.
- Hid duplicated distant Puerto context meshes for the full-island overlay, keeping the full island's own ocean and Teide as the large-scale context.
- Removed unused imports/constants that blocked `bun run build` after the current sky/cloud/full-island files were present in the working tree.

## Files Changed

- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/PuertoCityTerrain.tsx`
- `src/scenes/environment/TenerifeGeoRoadLayers.tsx`
- `src/scenes/environment/puertoCityConfig.ts`
- `src/scenes/environment/tenerifeFullIslandConfig.ts`
- `src/scenes/environment/puertoCityConfig.test.ts`
- `src/scenes/environment/tenerifeFullIslandConfig.test.ts`
- `src/scenes/environment/tenerifeRoadLayers.test.ts`
- `src/scenes/environment/Clouds.tsx`
- `src/scenes/environment/SkyDome.tsx`
- `src/scenes/environment/TenerifeFullIslandTerrain.tsx`
- `TASKS/full-island-puerto-overlay/`

## Verification

- `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts` passed.
- `bunx biome check src/scenes/environment/Environment.tsx src/scenes/environment/PuertoCityTerrain.tsx src/scenes/environment/TenerifeGeoRoadLayers.tsx src/scenes/environment/puertoCityConfig.ts src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/Clouds.tsx src/scenes/environment/SkyDome.tsx src/scenes/environment/TenerifeFullIslandTerrain.tsx TASKS/full-island-puerto-overlay/tasks.md TASKS/full-island-puerto-overlay/technical-plan.md` passed.
- `bun run build` passed with the existing Vite large chunk warning.
- Browser smoke at `http://localhost:5173/?tenerife=1&terrain=island-full` passed: DevTools console had no errors/warnings, and network loaded the full island GLB, Puerto GLB, Puerto roads JSON, and Puerto albedo texture with `200` responses.
- Direct Biome checks for `TASKS/` and `docs/history/` markdown paths were not applicable because those paths are ignored by the project Biome configuration.
- Follow-up freeze fix changed the default `island-full` road mode to baked-only and disabled Havok physics for the full-island Puerto overlay. Runtime road ribbons remain opt-in with `roads=mesh` or `roads=both`.
- Follow-up vertical placement fix changed Puerto overlay Y from a fixed marker height to full-island heightfield sampling at the Puerto anchor, offset by the Puerto source projection-center terrain height. This prevents the city/buildings from floating over the full-island terrain.
- Follow-up visual placement fix added a post-import bounding-box correction in `PuertoCityTerrain` so transformed full-island overlays align the visible building mesh bottom to the sampled full-island ground, avoiding source DEM/origin mismatch from baked GLB geometry.
- Follow-up root-cause fix stopped rendering the baked Puerto GLB on `island-full`; that asset contains baked source-height geometry that still floated after root-Y corrections. Full-island now uses transformed/generated Puerto roadside buildings grounded directly through the full-island heightfield.
- Fixed the browser hang by replacing unstable inline empty building arrays and inline settlement callbacks with stable references. Browser smoke after reload reported no DevTools console errors or warnings.
- Added a gameplay visual scale multiplier for generated full-island Puerto buildings so their coordinates remain geospatially placed while the models remain readable at the compressed island scale.
- Replaced full-island generated Puerto OBJ instances with simple box volumes and added a gameplay footprint multiplier plus terrain sink. This makes the houses visible immediately while keeping them grounded on the full-island heightfield.

## Follow-Up

- Runtime street ribbons for full-island remain opt-in with `roads=mesh` or `roads=both`; a lower-cost/capped road renderer is still needed before making streets default again.
