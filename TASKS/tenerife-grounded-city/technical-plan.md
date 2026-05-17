# Technical Plan

## Relevant Files

- `src/scenes/environment/TenerifeGeoRoadLayers.tsx`
- `src/scenes/environment/tenerifeRoadLayers.ts`
- `src/scenes/environment/tenerifeGeoData.ts`
- `src/scenes/environment/TenerifeIslandPreview.tsx`
- `src/scenes/environment/tenerifePreviewConfig.ts`
- `src/scenes/environment/Environment.tsx`
- `public/data/tenerife/roads-runtime.json`
- `scripts/build_tenerife_runtime_roads.mjs`

## Current Hypotheses

1. The island model and road projection do not share a matching playable footprint.
2. The road mesh uses a positive y bias that may be too large for the island terrain scale.
3. Road vertices are visible over water/void because there is no footprint clipping.
4. Buildings are technically placed along roads, but the accepted road set may include out-of-bounds segments.
5. Current generated building scale is too small for the camera and island scale.

## Diagnostic Steps

- Log road bounds from runtime data.
- Inspect island mesh bounds at runtime.
- Compare roads against the minimap island outline.
- Capture a browser screenshot after scene load.
- Temporarily render a debug footprint/bounds overlay if needed.

## Implementation Approach

### Road Grounding

- Reduce `TENERIFE_ROAD_LAYER_STYLES.*.heightOffset`.
- Use one consistent minimal surface bias for road mesh vertices.
- Keep road material visible through color/roughness/emissive tuning, not large vertical offsets.
- Consider disabling road shadows if z-fighting or shadow artifacts appear.

### Road Fit

- Prefer correcting projection/scale/offset before scaling the island.
- Scale the island only if roads and gameplay content are globally too large for the island model.
- Add a conservative placement bounds/footprint filter so far-away or invalid road segments are not rendered.
- If needed, define a simple island ellipse/polygon footprint in world coordinates for first-pass clipping.

### Building Placement

- Generate buildings only from the same accepted/visible road segments.
- Increase base scale and optionally collider dimensions proportionally.
- Keep side offsets relative to road width and building footprint.
- Sample terrain height at final building position.
- Avoid placing buildings on water/out-of-footprint positions.

### Verification

- Run targeted tests for road layer data if data logic changes.
- Run targeted Biome on edited files.
- Run build after runtime changes.
- Browser-check the Tenerife scene with `?tenerife=1`.

## Risks

- Scaling the island may affect player spawn, minimap, safety layer, and collision.
- Reducing road y-offset too much may produce z-fighting.
- Clipping roads too aggressively may remove useful visible streets.
- Larger buildings may collide visually or block player navigation unless spacing is adjusted.

