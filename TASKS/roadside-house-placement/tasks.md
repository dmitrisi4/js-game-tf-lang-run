# Tasks

## References

Status: Done

- [x] Read `docs/llm-wiki/index.md`.
- [x] Read `docs/llm-wiki/world-building.md`.
- [x] Read `docs/llm-wiki/scene-architecture.md`.
- [x] Read `docs/reference/project-vision.md`.
- [x] Read `docs/reference/tech-stack-validation.md`.
- [x] Read `docs/reference/runtime-architecture.md`.
- [x] Read `docs/reference/scene-gameplay.md`.
- [x] Read `docs/reference/physics-collision.md`.
- [x] Read `docs/reference/documentation-maintenance.md`.

## Implementation

Status: Done

- [x] Replace naive roadside placement with road-following deterministic placement.
- [x] Add varied placeholder building variants.
- [x] Retarget generated cube placeholders from `?tenerife=1` to `?tenerife=1&terrain=island-full`.
- [x] Keep other Puerto terrain modes free of duplicate placeholder layers.
- [x] Clip full-island generated houses by their transformed road anchor, not only final box center.
- [x] Align full-island placeholder boxes to terrain raycasts so they do not float.
- [x] Make generated placeholder boxes block full-island kinematic player movement.
- [x] Fix remaining floating-house cases by grounding building bottoms from footprint samples instead of a single center point.
- [x] Fix remaining full-island cases where houses still appear suspended or overlap road ribbons.
- [x] Tune vertical grounding so full-island houses are not visibly buried into slopes.
- [x] Restore readable full-island placeholder house scale without putting houses back on roads.
- [x] Reduce visible downhill air gaps without returning to deep terrain burial.

## Verification

Status: Done

- [x] Add focused tests for generated placement.
- [x] Update Puerto layer source-selection tests.
- [x] Add focused tests for clip/classification fixes.
- [x] Run focused Vitest coverage.
- [x] Run project validation commands.
- [x] Add the session log entry.
- [x] Add focused tests for footprint-based building grounding.
- [x] Run targeted validation for edited environment files.
- [x] Add focused tests for full-island roadside clearance and grounding.
- [x] Re-run targeted validation after second follow-up.
- [x] Add focused tests for capped footprint support depth.
- [x] Re-run validation after vertical grounding retune.
- [x] Add focused tests for readable scale and revised slope grounding.
- [x] Re-run validation after scale/grounding follow-up.

## Notes

- Runtime data smoke via `bun -e` generated 120 placeholder buildings from `public/data/tenerife/roads-runtime.json` with 6 distinct height variants.
- In-app Browser verification was blocked because the session did not expose an `iab` browser backend; `agent.browsers.list()` returned an empty list.
- Follow-up: generated placeholder houses now target `?tenerife=1&terrain=island-full`, transform onto the full-island Puerto overlay, and stay disabled when OSM footprint buildings are explicitly enabled with `&buildings=1`.
- Placement fix: generated buildings now carry a road anchor, side, tangent, and road width so full-island placement recomputes the house center from the transformed road centerline. This keeps the larger placeholder boxes beside roads instead of letting the scaled box footprint cover the road surface.
- Row placement fix: placement now uses straight road segments as street frontage rows, laying houses sequentially along each segment by facade length plus small gaps. Placeholder dimensions and full-island visual scale were increased, while final positions still recompute clearance from the road edge.
- Grounding/blocking fix: full-island generated boxes now raycast to terrain meshes for Y alignment and block the kinematic player through building obstacle probes. In-app Browser verification remains blocked in this session because `agent.browsers.list()` returned an empty list.
- Follow-up issue: user screenshot on 2026-06-02 still shows full-island placeholder houses floating over sloped terrain. Hypothesis: center-point grounding keeps the middle of each flat box at terrain height, leaving downhill footprint edges visibly suspended.
- Follow-up fix: `WorldBuildings` now samples center, corners, and edge points across the rotated footprint, uses the lowest valid terrain sample for support, hides ungrounded raycast-dependent placeholder boxes, and applies a small full-island ground sink. Validation passed with focused tests, `bun run check`, full `bun run test`, and `bun run build`. Visual screenshot QA remains blocked because the in-app Browser `iab` backend is unavailable and Playwright is not installed in this workspace.
- Second follow-up issue: user screenshot on 2026-06-02 still shows some houses visually suspended and some centered over visible road ribbons. Hypothesis: full-island placeholder boxes still use an overly large visual scale and a setback that does not account for widened road shoulder meshes.
- Second follow-up fix: full-island generated placeholder scale was reduced from `1.55` to `1`, road setback increased from `0.85` to `2.4`, ground sink increased from `0.22` to `1.2`, and footprint terrain sampling expanded from `0.86` to `1.05`. The generator now rejects candidates too close to other road surfaces, not only previous building footprints. Runtime-data smoke kept 84 transformed houses with minimum visual clearance of about `1.80` world units from widened road shoulders.
- Second follow-up validation: focused tests passed, `bun run check` passed, full `bun run test` passed with 39 files / 193 tests, `bun run build` passed, and HTTP smoke returned `302` to the configured base path for `http://127.0.0.1:5173/?tenerife=1&terrain=island-full`.
- Third follow-up issue: user screenshot on 2026-06-02 shows the anti-floating fix now overcorrects, with houses visibly buried into terrain. Cause: full-island ground sink `1.2` plus lowest-footprint support is too aggressive on slopes.
- Third follow-up fix: full-island generated-house ground sink was reduced to `0.12`, footprint support depth is capped to `0.28` below the center terrain sample, and focused grounding tests cover the capped-support math. Runtime-data smoke still kept 84 transformed houses with minimum visual road clearance of about `1.80` world units; the worst transformed house now has `heightOffset` about `-0.093`.
- Third follow-up validation: focused tests passed, edited-file Biome passed, `bun run check` passed, full `bun run test` passed with 39 files / 193 tests, `bun run build` passed, and HTTP smoke returned `302` to the configured base path for `http://127.0.0.1:5173/?tenerife=1&terrain=island-full`. Browser screenshot QA remains blocked because `agent.browsers.list()` returned an empty list.
- Fourth follow-up issue: user reports on 2026-06-02 that the houses are now too small and still visibly floating above terrain, so the previous scale reduction and shallow support cap are insufficient.
- Fourth follow-up fix: full-island generated-house visual scale was raised to `1.45`, ground sink was raised to `0.35`, footprint support depth cap was raised to `0.65`, raycast grounding now uses the same capped footprint helper as heightfield grounding, and box placeholders render a shallow non-pickable foundation under the visible body to bridge slope gaps.
- Fourth follow-up validation: runtime-data smoke kept 84 transformed houses with minimum visual road clearance about `1.96` world units, minimum visible house body height about `3.78`, average visible height about `5.59`, and worst transformed `heightOffset` about `-0.311`. Focused tests passed with 32 tests, edited-file Biome passed, `bun run check` passed, full `bun run test` passed with 39 files / 194 tests, `bun run build` passed, and HTTP smoke returned `302` to the configured base path. Browser screenshot QA remains blocked because `agent.browsers.list()` returned an empty list.
