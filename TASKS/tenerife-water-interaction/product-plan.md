# Product Plan

## User-Visible Outcome

When the player enters Tenerife ocean water, the surface looks and behaves like water: animated waves, visible water motion, slower movement, buoyant height at the waterline, and an entry splash instead of running across a flat blue ground.

## Acceptance Criteria

- Full-island ocean uses an engine-supported water material with animated wave displacement.
- Player transitions into a water state when terrain under the player is below the configured ocean surface.
- In water, movement is slower and the player is held near the water surface instead of terrain-following the seabed.
- Entering water emits a short splash/foam effect.
- Visual player anchoring does not snap feet to underwater terrain while swimming.
- Existing seabed/deep-water reset behavior remains intact.
- Focused tests cover water-state math.

## Non-Goals

- No full computational fluid simulation for the Atlantic ocean.
- No swimming animation retargeting in this phase.
- No underwater camera/post-process in this phase.
- No imported water assets or new paid texture dependencies.

## Priority

High. This fixes a visible gameplay immersion issue in the main Tenerife full-island mode.
