# Product Plan

## User-Visible Outcome

When the player faces a building wall in Puerto real terrain mode and presses
jump, the hero should visibly grab the roof edge, hold briefly, climb up, and
finish standing on the roof surface without floating, sliding, or being thrown
backward.

## Acceptance Criteria

- Wall jump triggers only when the player is close to a valid building wall and
is facing it.
- If no valid roof edge exists, the player performs a normal jump instead of a
broken partial parkour move.
- Ledge grab reads visually as a hang: the character is held near the roof edge
outside the wall, not launched away from it.
- Climb-up ends on a verified roof floor point.
- Feet appear grounded on the roof within a small visual tolerance.
- After climb-up, movement resumes normally and the player is considered
grounded on roof surfaces.
- The player cannot clip through building walls during traversal.
- The controller has debug instrumentation that can be enabled locally to show
wall hit, ledge point, roof probe, and landing point.

## Non-Goals

- Full climbing system for every mesh in the game.
- Freeform climbing along vertical walls.
- New animation assets before the controller is physically reliable.
- Perfect parkour on every imported OSM building shape in the first pass.

## Priority

High for Tenerife real terrain mode. The current prototype is visibly unstable
and should be replaced before adding more roof gameplay.
