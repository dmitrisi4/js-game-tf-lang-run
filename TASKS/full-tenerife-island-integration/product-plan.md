# Product Plan

## User-Visible Outcome

Players entering the Tenerife mode should see and move through a complete island world, not a small city patch with a decorative horizon. Puerto de la Cruz should be the starter area on the north coast. Looking inland should reveal a real mountainous island mass, and Teide should exist as reachable terrain rather than as a painted backdrop.

## Acceptance Criteria

- A new preview mode loads the normalized full Tenerife island without removing the existing `?tenerife=1&terrain=real` Puerto patch mode.
- The ocean visibly surrounds the island and remains readable from coastal viewpoints.
- Teide is part of the terrain mesh or a terrain-aligned mesh, not a non-walkable backdrop.
- The player can spawn near Puerto de la Cruz on the full island and stand on the island terrain.
- Puerto de la Cruz city content can be placed at the correct north-coast location without obvious floating, sinking, or severe rotation mismatch.
- The detailed Puerto patch can be enabled after the full island is present, even if the first implementation uses a debug alignment mode.
- Attribution for the CC-BY-4.0 Sketchfab asset is recorded in project metadata.
- Browser runtime avoids loading unnecessary 8K texture and full collision mesh by default unless performance is measured acceptable.

## Non-Goals

- No final production streaming system in the first slice.
- No exact road-perfect geospatial fusion between every Puerto road and the Sketchfab terrain in the first slice.
- No photogrammetric city replacement.
- No dynamic ocean simulation in the first slice.
- No walking from Puerto to Teide at real-world time scale as a required first-pass gameplay loop.

## Priority Rules

1. Preserve the current playable Puerto mode.
2. Prove full-island visual placement and scale.
3. Make ocean and Teide read correctly.
4. Add player grounding and safe reset.
5. Add Puerto patch alignment.
6. Optimize asset size and collision after the visual/coordinate model is proven.
