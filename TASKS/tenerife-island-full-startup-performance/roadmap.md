# Roadmap

## Phase 1: Measurement

Status: Implemented

- Inspect current full-island terrain, road, and city overlay startup path.
- Measure or reproduce the slow load path with the current dev URL.
- Identify whether the blocker is network/asset size, GLB processing, runtime road generation, building generation, or React effect churn.

Phase gate: bottleneck is identified with enough evidence for a scoped fix.

## Phase 2: Runtime Fix

Status: Implemented

- Make default island-full startup skip the expensive optional overlay work.
- Keep explicit opt-in query params for road/building visual QA.
- Preserve existing behavior for non-full-island Tenerife modes.

Phase gate: default URL reaches playable scene without road overlay startup blocking.

## Phase 3: Validation

Status: Implemented

- Update targeted tests for query-plan behavior.
- Run focused tests and broader project validation as appropriate.
- Browser-smoke the local URL and report exact results.

Phase gate: validation passes or failures are clearly attributed.
