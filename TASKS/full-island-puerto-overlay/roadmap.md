# Roadmap

## Phase 1 - Planning And Calibration

- Confirm existing Puerto and full-island coordinate systems.
- Define a reusable full-island Puerto overlay transform.
- Gate phase completion on focused transform tests.

## Phase 2 - Runtime Composition

- Render Puerto city terrain on full-island mode.
- Render OSM road ribbons with the full-island transform.
- Preserve existing Puerto real-terrain behavior.

## Phase 3 - Verification

- Run targeted unit tests.
- Run build validation.
- Browser-check `?tenerife=1&terrain=island-full`.
- Add session log notes.
## Phase 4: Real Footprint City Layer

Status: In progress

Goal: replace the current full-island visual city placeholder with a lightweight runtime layer generated from Puerto de la Cruz OSM building footprints.

Phase gate:
- `?tenerife=1&terrain=island-full` shows Puerto roads and OSM-derived building volumes by default.
- The building layer can be disabled with the existing `puerto=0` opt-out.
- Targeted tests cover the runtime data conversion and island-full defaults.
