# Product Plan

## User-Visible Outcome
The world should read as intentionally composed: houses, rocks, roads, props, NPCs, clouds, terrain, and ocean layers should not visibly fight each other or create accidental stacks.

## Acceptance Criteria
- Default arena has no obvious static scenery intersections in the starter area or landmark zones.
- Tenerife preview and full-island Puerto overlays do not show stacked duplicate buildings or buildings embedded in roads.
- Placement validation catches authored overlaps before runtime.
- A debug mode can show building/prop collision footprints or placement clearances.
- Browser smoke checks cover the relevant scene modes.

## Non-Goals
- Rebuilding the whole city generator.
- Replacing all OBJ building assets with GLB in this phase.
- Full navigation/pathfinding solution.
- Final art pass for every building model.

## Priority
High. The issue damages visual trust and can become a physics blocker when more gameplay objects are enabled.
