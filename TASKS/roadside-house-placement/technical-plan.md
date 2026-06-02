# Technical Plan

## Files

- `src/scenes/environment/tenerifeRoadLayers.ts`
- `src/scenes/environment/puertoCityConfig.ts`
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/WorldBuildings.tsx`
- `src/scenes/environment/worldBuildingGrounding.ts`
- `src/scenes/environment/worldBuildingGrounding.test.ts`
- `src/scenes/environment/tenerifeRoadLayers.test.ts`
- `src/scenes/environment/puertoCityConfig.test.ts`
- `src/scenes/player/Player.tsx`
- `src/scenes/player/roofParkourController.ts`
- `src/scenes/player/roofParkourController.test.ts`
- `docs/history/logs/2026-06-01.md`

## Data Flow

1. `loadTenerifeGeoData()` loads `/data/tenerife/roads-runtime.json`.
2. `buildTenerifeRoadLayerDataFromRuntime()` converts road lines into render layers.
3. `buildTenerifeRoadsideBuildings()` derives placeholder houses from main/service road geometry.
4. `getPuertoLayerPlan()` selects the generated roadside source for `terrain=island-full`.
5. `Environment` transforms generated Puerto-local houses onto the full-island Puerto overlay frame.
6. `Environment` renders generated houses through `WorldBuildings` with `visualMode="boxes"`.
7. Box fallbacks align to terrain raycasts across the building footprint when available, then fall back to the selected height provider.
8. Full-island player movement treats generated placeholder boxes as blocking building geometry.

## Placement Rules

- Use only main and service roads for house candidates; skip walk paths.
- Sample along road polylines, not isolated random points.
- Keep candidates away from line ends and tight junctions.
- Offset building centers by road half-width, building half-depth, and a small setback.
- Align placeholder frontage with road tangent.
- Use deterministic variation based on line/sample/side indices.
- Reject candidates outside the Puerto city footprint or overlapping previously accepted footprints.
- Reject candidates that land too close to any other road segment so frontage rows do not cover crossing or adjacent road ribbons.
- In full-island mode, use the widened visual road shoulder width as the clearance target, not only the source road centerline width.

## Grounding And Collision Strategy

Generated placeholder boxes stay pickable and named with the `tenerife-roadside-building-*` prefix. Full-island movement is kinematic, so player blocking is handled by forward/side obstacle raycasts against those building meshes instead of relying only on Havok aggregates.

For visual grounding, generated placeholders use multiple terrain samples around the rotated footprint. The lower support sample is preferred so flat placeholder boxes sink slightly into sloped terrain instead of leaving downhill edges visibly floating, but the selected support depth is capped relative to the center sample so one low downhill point cannot visibly bury the whole house. Terrain raycasts and heightfield sampling both use this shared capped footprint helper.

Full-island placeholders intentionally use a readable full-island visual scale and a shallow terrain sink compared with the source Puerto-local generation. Box placeholders also render a shallow visual-only foundation below the body; this bridges small downhill slope gaps without changing building collision or player movement blockers.

## Risks

- Excessive density could hide road readability.
- Sparse generated candidates could still leave visible empty streets.
- Runtime mode selection must avoid duplicate buildings beside real terrain or full-island footprint buildings.
- Footprint-based grounding can slightly embed the uphill side of a flat placeholder box; this is acceptable for the blockout pass and preferable to visible floating.
- Overly aggressive footprint support or ground sink can bury boxes into slopes; keep the support-depth cap, shallow sink, and visible foundation covered by tests and runtime smoke.
- Aggressive road-overlap rejection can reduce house count; validate with real `roads-runtime.json` smoke, not only synthetic tests.

## Verification Commands

- `bun run test src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/puertoCityConfig.test.ts`
- `bun run test src/scenes/environment/worldBuildingGrounding.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/puertoCityConfig.test.ts`
- `bun run test src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/puertoCityConfig.test.ts src/scenes/player/roofParkourController.test.ts`
- `bun run check`
- `bun run test`
- `bun run build`
