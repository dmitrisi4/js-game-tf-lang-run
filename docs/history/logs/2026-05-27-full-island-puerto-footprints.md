# Full-Island Puerto Footprint Buildings

## Summary

- Added a compact public runtime building data file for Puerto de la Cruz OSM-derived building footprints.
- Integrated a new `PuertoFootprintBuildings` runtime layer for `?tenerife=1&terrain=island-full`.
- The new layer renders footprint-derived buildings through Babylon thin instances instead of many React mesh nodes.
- Changed full-island Puerto road default to visible mesh roads so streets and buildings appear together by default.

## References

- `docs/llm-wiki/index.md`
- `docs/llm-wiki/world-building.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/documentation-maintenance.md`
- `TASKS/full-island-puerto-overlay/*`
- `TASKS/puerto-real-terrain-city/technical-plan.md`
- `TASKS/puerto-real-terrain-city/data-and-asset-pipeline.md`

## Validation

- Passed: `bun run check`
- Passed: `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/puertoFootprintBuildings.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/puertoCityGeneratedData.test.ts`
- Passed: `bun run build`
- Passed HTTP smoke on dev server `http://127.0.0.1:5174/` for:
	- `/`
	- `/data/tenerife/puerto-building-footprints-runtime.json`
	- `/data/tenerife/roads-runtime.json`

## Notes

- Full browser smoke was not completed because local Playwright is not installed and the DevTools connector reported an already-running Chrome profile.
- The first pass uses primitive building volumes with no per-building physics. This keeps the full-island mode lightweight while preserving real OSM-derived placement.
- Follow-up: adjusted full-island city readability after visual QA showed compressed buildings with no visible street gaps. Puerto roads/buildings now share a larger position scale, road ribbons are widened, and footprint boxes are horizontally narrowed with separate vertical scaling.
- Follow-up: switched full-island Puerto to roads-first calibration. Buildings now require `&buildings=1`, while the default `?tenerife=1&terrain=island-full` focuses on the real OSM road network.
- Follow-up: fixed full-island road creation by grounding road ribbons through the full-island heightfield provider instead of waiting for `ground1`. Full-island terrain uses `tenerife-full-island-terrain-tile-*` mesh names.
- Follow-up: changed road grounding to prefer exact raycasts against full-island terrain tiles before falling back to the coarse heightfield. This prevents road ribbons from inheriting overly high heightfield cells on coastal slopes.
- Follow-up: improved roads-first readability by hiding `walk` in full-island mode and rendering `main/service` roads as layered shoulder, surface, and centerline visual passes.
- Follow-up: reduced full-island road startup cost by caching terrain height samples on transformed road centerline points and reusing them across shoulder, surface, and centerline visual passes.
- Follow-up browser smoke: loaded `http://127.0.0.1:5174/?tenerife=1&terrain=island-full&verify=1779888899000`; the scene rendered and the browser console reported no errors or warnings.
- Follow-up: fixed gameplay stutter by passing the full-island visible road layer list as a stable prop instead of allocating a new array on every render, which could recreate the full road mesh set repeatedly. Road meshes also no longer force `alwaysSelectAsActiveMesh`.
- Follow-up browser smoke: loaded `http://127.0.0.1:5174/?tenerife=1&terrain=island-full&verify=1779890000000`; console had no errors or warnings, and a 120-frame sample measured about 65.9 FPS average.
- Follow-up: clipped full-island Puerto road segments to the coastal city band so road ribbons no longer climb the slope under Teide. The clip checks segment endpoints to avoid long strips crossing the boundary.
