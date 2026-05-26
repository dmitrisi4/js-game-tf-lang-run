# Product Plan

## User-Visible Outcome

When the player opens `?tenerife=1&terrain=island-full`, Puerto de la Cruz should appear on the north coast of the full Tenerife island with the same city/road readability available in `?tenerife=1&terrain=real&roads=both`.

## Acceptance Criteria

- Full-island mode renders the Puerto de la Cruz overlay by default.
- Runtime OSM road ribbons render in full-island mode using the same road data as the real Puerto terrain mode.
- Puerto overlay is centered on the calibrated full-island Puerto marker.
- Puerto overlay uses a scale derived from full-island geospatial control points instead of a visual-only guess.
- Existing `?tenerife=1&terrain=real&roads=both` behavior remains available.

## Non-Goals

- Rebuilding the Puerto GLB or road data.
- Solving a final high-precision GIS transform for every city on Tenerife.
- Adding new gameplay objectives inside Puerto.
- Replacing the full-island terrain heightfield.

## Priority

High for Tenerife mode continuity. This connects the detailed city prototype to the full-island traversal mode.
