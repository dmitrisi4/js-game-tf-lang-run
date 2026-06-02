# Product Plan

## User-Visible Outcome

The full Tenerife island preview should show a more natural first-pass Puerto town layout: placeholder cube houses sit beside full-island road overlays, follow road direction, vary in height and footprint, and leave visible street space instead of appearing randomly scattered.

## Acceptance Criteria

- `?tenerife=1&terrain=island-full` renders deterministic roadside house placeholders derived from the current road layer data.
- Houses are offset from road centerlines and oriented with their frontage along the road direction.
- Building placeholders use varied footprints and heights for residential rows, compact houses, taller town blocks, and corner volumes.
- Placement avoids obvious footprint overlaps and skips tight road junction/end areas.
- Placeholder house bottoms visually meet or slightly embed into sloped full-island terrain instead of floating above it.
- Existing real terrain and full-island building modes do not receive duplicate placeholder city layers.
- Legacy `?tenerife=1` does not need this generated placeholder layer.
- Focused tests cover placement density, variation, road offset behavior, and Puerto layer source selection.

## Non-Goals

- Importing final house models.
- Adding gameplay collisions for every Tenerife placeholder house.
- Rebuilding OSM road data or terrain assets.
- Replacing the real Puerto terrain GLB building massing.

## Priority

High. The roads are already visible; the missing roadside city massing makes the road network feel unfinished and makes spatial scale hard to read.
