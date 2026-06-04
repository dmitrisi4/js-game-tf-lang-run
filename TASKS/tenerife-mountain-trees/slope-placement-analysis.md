# Slope Placement Analysis

## Problem

The dense tree follow-up increased count but still used hand-authored X/Z belts. The screenshot shows a failure mode of that approach: many trees read as a side band near the sea/horizon instead of sitting on the visible mountain slopes above Puerto de la Cruz.

## Findings

- The full-island terrain GLB world-space bounds after runtime scale are approximately:
	- X: `-1181.54..407.43`
	- Z: `-741.52..598.92`
	- Y: `0..73.07`
- `TENERIFE_FULL_ISLAND_MAP_DATA` has an X-sign mismatch relative to the parsed runtime terrain points, so authored geography-style X/Z guesses are risky.
- Puerto spawn/overlay sits near the eastern terrain edge. The immediately adjacent spawn rectangle has few valid terrain samples until farther inland, so trees placed by proximity alone tend to read as coastline or edge content.
- The previous dense data included many northern-edge placements around `z=-650..-700`. Those can appear as trees off to the side near water from the Puerto viewpoint.
- Reliable slope placement needs to be based on terrain samples: authored X/Z must pass height, slope, Teide-distance, and northern-edge filters before entering runtime data.

## Versions Considered

### Version A: Manual Belt Retune

Move the existing belts by hand toward the visible hills.

Pros:

- Small code change.
- Keeps current data shape.

Cons:

- Still relies on guessing the coordinate system.
- Does not prevent another coastal/edge miss.
- Tests would only verify counts, not slope quality.

### Version B: Runtime Slope Search

Generate trees at runtime from the loaded heightfield.

Pros:

- Directly reacts to the loaded terrain.
- Avoids large static coordinate arrays.

Cons:

- Adds startup work during scene load.
- Makes placement harder to inspect and review.
- Requires deterministic sampling and stronger runtime guards to avoid visual churn.

### Version C: Offline GLB-Sampled Static Slopes

Parse `public/models/environment/tenerife-full-island-normalized.glb`, sample candidate cells from the scaled terrain, keep only candidates that pass height/slope/Teide/edge filters, and commit the resulting deterministic placements.

Pros:

- Placement is derived from actual runtime terrain geometry.
- Runtime remains simple: load GLB once, set thin-instance matrices, align Y to heightfield.
- Tests can assert slope metadata and prevent coastal-edge regressions.
- Coordinates remain reviewable in source control.

Cons:

- Requires regenerating placement data if the terrain GLB changes materially.
- Adds terrain-sample metadata to the tree data.

## Decision

Use Version C.

## Detailed Implementation

- Replace the previous hand-authored and dense guessed belts with GLB-sampled slope belts.
- Add compact terrain sample tuples: `[x, z, height, slope]`.
- Generate runtime placements from named belts with deterministic yaw and scale variation.
- Store `terrainSample` on every placement so tests can assert the data was selected from real slopes.
- Keep the current runtime renderer and height/raycast Y settlement.
- Preserve the Teide dry-zone radius of `390`.
- Add guards that reject:
	- low/flat samples below the slope terrain threshold,
	- excessive northern-edge placements below `z=-620`,
	- east-edge placements beyond the selected slope limit,
	- positions inside the Teide dry zone.
- Keep named coverage for:
	- `puerto-upper-slope`,
	- `puerto-inner-slope`,
	- `puerto-santa-cruz-slope`,
	- `central-slope`,
	- `teno-slope`,
	- `south-slope`.
