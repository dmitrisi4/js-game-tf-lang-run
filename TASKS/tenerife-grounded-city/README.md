# Tenerife Grounded City Epic

Status: Planned

Priority: Current top priority before deeper streaming optimization.

## Problem

Puerto de la Cruz roads and roadside buildings are now visible, but the city layer does not yet read as grounded and geographically coherent:

- Some roads appear outside or beyond the visible island surface.
- Road ribbons can float or sit above the terrain instead of hugging the ground.
- Buildings need to be larger and more legible.
- Buildings must be placed along the same grounded road geometry, not merely near projected OSM lines.
- The island model may need to be scaled or the city projection fit may need adjustment so the playable city content sits inside the island footprint.

## Goal

Make the Tenerife city layer feel physically attached to the island:

- Roads sit tightly on top of terrain.
- Roads remain inside the intended island/map surface.
- Buildings are clearly scaled for the game camera.
- Buildings are distributed along valid road segments.
- The result should be verified visually in the browser.

## Documents

- [Product Plan](./product-plan.md)
- [Roadmap](./roadmap.md)
- [Technical Plan](./technical-plan.md)
- [Tasks](./tasks.md)

