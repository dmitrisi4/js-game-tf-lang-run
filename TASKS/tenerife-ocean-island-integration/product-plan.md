# Product Plan

## User-Visible Outcome

Players in full-island Tenerife mode should see a stable Atlantic ocean that surrounds the island, sits below walkable coastal terrain, and blends into the shoreline with foam, shallow-water color, and visual depth. The player must never appear submerged while standing on terrain near Puerto unless gameplay actually moves them into water.

## Acceptance Criteria

- `http://localhost:5173/?tenerife=1&terrain=island-full` is verified as the active app instance before visual QA conclusions are made.
- There is exactly one visible ocean surface in full-island mode unless debug flags explicitly show comparisons.
- Imported GLB water/background meshes are identified and disabled or documented as intentionally used.
- Ocean height is derived from measured terrain/coast data, not manually guessed from screenshots.
- Player spawn near Puerto is visibly above the water plane with clear dry terrain underfoot.
- Shoreline has a controlled transition:
	- sandy gradual underwater slope around the island edge
	- shallow cyan/turquoise water near shore
	- darker Atlantic water offshore
	- foam/whitewash at the coast
	- no hard rectangular edge at normal camera views
- Ocean visual remains collision-free.
- Seabed/deep-water reset remain separate safety/gameplay systems.
- Desktop QA captures before/after screenshots for Puerto coast, offshore view, and steep shoreline.
- Validation records tests, build, and browser/port evidence.

## Non-Goals

- No physically exact ocean simulation.
- No full hydrology or tide system.
- No expensive screen-space reflections as a hard requirement in the first production slice.
- No changing player movement authority.
- No turning the ocean mesh into physics authority.
- No importing third-party ocean assets without source/license review.

## Priority

1. Stop false QA caused by wrong dev port or stale server.
2. Remove competing water layers.
3. Measure terrain/coast geometry.
4. Build a stable shoreline mask and ocean height model.
5. Add foam/shallow/deep visual layers.
6. Tune performance and visual quality.
