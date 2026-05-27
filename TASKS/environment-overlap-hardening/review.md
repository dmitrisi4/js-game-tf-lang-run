# Project Review Against The Guide

## Scope Reviewed
- `src/scenes/environment/Clouds.tsx`
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/WorldScenery.tsx`
- `src/scenes/environment/WorldBuildings.tsx`
- `src/scenes/environment/WorldRoads.tsx`
- `src/scenes/environment/worldData.ts`
- `src/scenes/environment/worldData.test.ts`
- relevant history logs and task docs

## Findings
1. Tenerife preview buildings have many likely footprint overlaps.
	- Static distance audit found 51 Tenerife building pairs below a conservative clearance threshold.
	- Worst pairs include `tenerife-osm-building-19`/`20`, `04`/`05`, `02`/`08`, `23`/`25`, and `10`/`12`.
	- These are manual visual placements in `TENERIFE_PREVIEW_BUILDINGS`, not generated from non-overlapping footprints.
	- Risk: city reads as stacked houses; future physics would turn the visual problem into blocking/jitter.

2. Default arena has at least one concrete authored-object conflict.
	- `building-west-ridge-tower` and `rock-ridge-01` overlap by the approximate footprint audit.
	- `crate-camp-01` and `npc-crafter-alie` are close enough to deserve manual review, though this may be intentional staging.
	- Risk: player pathing, camera framing, and interaction readability are worse around authored landmarks.

3. Placement tests only enforce bounds and population counts.
	- `worldData.test.ts` checks world bounds and counts, but not object-object clearance, road clearance, or mode-specific constraints.
	- Risk: overlap regressions can be introduced silently.

4. Building visuals and colliders are related but not validated together.
	- `WorldBuildings.tsx` uses primitive box colliders, which matches project and industry guidance.
	- However, the collider footprint is not tested against neighboring object footprints or road ribbons.
	- Risk: visual and physics layouts can diverge.

5. Tenerife full-island overlay has multiple independently rendered city layers.
	- `Environment.tsx` conditionally renders geo roads, `WorldBuildings`, generated roadside buildings, and `PuertoFootprintBuildings`.
	- Conditions mostly prevent obvious duplicate layers, but the logic is complex enough that a query flag combination can create visual confusion unless covered by tests/browser smoke.
	- Risk: duplicate city surfaces, roads, or buildings reappearing when flags change.

6. `Clouds.tsx` has transparent rendering policy ambiguity.
	- It sets alpha blending and disables depth write, uses `renderingGroupId = 1`, flips faces, and keeps `backFaceCulling = true` with a contradictory comment.
	- This may be unrelated to ground-object overlap, but it is a credible source of "things drawn over things" reports.
	- Risk: clouds or transparent sky content can visually layer incorrectly depending on camera and render order.

## Positive Baseline
- The project already has the right architectural shape: environment composition is separated, world placement is data-first, and primitive colliders are used for gameplay blockers.
- There is prior history recognizing the same class of issue: Tenerife building placement was split from default arena data and raycast-aligned against terrain.
- Existing docs already state the correct policy: `1 unit = 1 meter`, imported visuals should not silently become gameplay colliders, and terrain helpers should drive placement.

## Main Diagnosis
The current problem is not a Babylon limitation. It is missing placement validation. The renderer is faithfully drawing data that has not been filtered for footprint clearance, road clearance, mode-level duplication, and transparent layer ordering.
