# Product Plan

## User-Visible Outcome

The Tenerife preview should show Puerto de la Cruz as a grounded hillside coastal city rather than flat roads on a generic island surface. Roads should visually belong to the terrain texture, buildings should sit on believable slopes, and the coastline should still read cleanly from the current third-person camera.

## Acceptance Criteria

- Puerto terrain uses real elevation data, not the current procedural terrain approximation.
- Existing OSM road data is projected onto the same coordinate frame as the terrain.
- Roads are visible in the city ground texture, with different visual treatment for main, service, and walk layers.
- Runtime can still raycast against `ground1` for player reset, road placement, building placement, and future interaction checks.
- Generated assets include source/license notes for DEM, OSM roads/buildings, textures, and any derived masks.
- Terrain mesh, texture atlas, and optional road geometry have documented budgets.
- Browser verification confirms roads and buildings no longer look like they float above or cut through the city surface.

## Non-Goals

- Exact photorealistic Google Maps-style city reconstruction.
- Google Maps, Google Earth, or any copyrighted imagery without explicit reuse rights.
- Full city streaming implementation; this epic should produce the corrected data and asset foundation first.
- Final hand-authored architecture for every building.
- Gameplay collisions for all generated buildings in the first phase.

## Priority

High. The city terrain source affects roads, buildings, player grounding, future streaming, minimap alignment, and visual credibility.
