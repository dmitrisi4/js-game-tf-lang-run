# Product Plan

## User Outcome

The player should see a believable miniature Tenerife/Puerto de la Cruz city layer on the island. Roads should look painted or paved onto the ground, and houses should visibly sit beside those roads at a scale that reads clearly from the current third-person camera.

## Acceptance Criteria

- Roads no longer visibly float above the terrain.
- Roads do not obviously extend outside the intended island surface.
- Road placement feels aligned with the Tenerife minimap/island context.
- Roadside buildings are larger and more readable from gameplay camera distance.
- Roadside buildings are placed beside roads with consistent offsets and rotations.
- In `?tenerife=1&terrain=real`, the player cannot walk through nearby Puerto city buildings.
- Building blockers use exact static mesh collision on the baked Puerto city building mesh until a proven compound primitive pass can replace it.
- The initial scene still loads acceptably after the visual fixes.

## Non-Goals For This Epic

- Full city chunk streaming.
- Building LOD system.
- Perfect GIS-accurate coastline clipping.
- Final art pass for real Puerto de la Cruz architecture.
- Final roof traversal, wall-running, or climb/jump gameplay for buildings.

## Priority Decision

This epic should run before deeper streaming optimization. Streaming/chunking should be based on the corrected coordinate fit, terrain attachment, and placement rules. Optimizing the current incorrect visual placement would risk preserving the wrong geometry model.
