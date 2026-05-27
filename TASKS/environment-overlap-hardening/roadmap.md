# Roadmap

## Phase 1: Reproduce And Classify
- Capture screenshots or browser observations for:
	- default arena
	- `?tenerife=1`
	- `?tenerife=1&terrain=real`
	- `?tenerife=1&terrain=island-full`
- Classify each overlap as:
	- authored placement conflict
	- generated city footprint conflict
	- road/building conflict
	- vertical terrain grounding issue
	- transparent render-order issue
	- duplicate mode-layer issue

Phase gate: every visible overlap has an owner category and a concrete file path.

## Phase 2: Add Placement Validation
- Add pure helpers for 2D footprints and clearance checks.
- Add tests for default `WORLD_*` object spacing.
- Add tests for Tenerife preview building spacing.
- Add road clearance checks for building centers/footprints where data exists.

Phase gate: current known overlaps fail tests before fixes and pass after data corrections.

## Phase 3: Fix Authored Data
- Move or resize the default arena rock/building conflict.
- Review the close crate/NPC staging.
- Reduce or spread `TENERIFE_PREVIEW_BUILDINGS` density, or mark this legacy list as debug-only if generated footprints replace it.

Phase gate: no authored-data clearance failures.

## Phase 4: Harden Generated Puerto Layers
- Add a single source of truth for which Puerto building layer renders in each terrain mode.
- Add query-flag tests for mode combinations.
- Add footprint filtering for generated roadside/footprint buildings before render.

Phase gate: no duplicate city layers in tested modes.

## Phase 5: Transparent Layer Policy
- Audit clouds, ocean, shoreline, road overlays, and debug visuals.
- Make depth write, alpha mode, inside-facing geometry, and rendering group choices explicit.
- Add visual smoke notes for camera angles where the issue was reported.

Phase gate: no transparent layer incorrectly draws over terrain/buildings in target views.

## Phase 6: Browser Verification
- Run unit tests and `bun run check`.
- Start dev server and inspect target URLs.
- Capture screenshots after fixes for task history.

Phase gate: tests pass and browser observations match acceptance criteria.
