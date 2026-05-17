# Puerto Real Terrain City Epic

Status: Implemented first runtime pass with procedural DEM fallback

Priority: Replace the fallback DEM with the selected CNIG/IGN DTM before production tuning.

## Problem

Puerto de la Cruz is not flat, but the current Tenerife prototype uses a lightweight procedural island GLB as `ground1`. Roads and buildings now raycast onto that mesh, so city believability is limited by the terrain source rather than by road placement alone.

The city needs a real terrain patch, city texture, and road overlay pipeline before deeper streaming optimization locks in the current flat/smoothed city surface.

## Goal

Generate a runtime-ready Puerto de la Cruz terrain/city asset from real geospatial data:

- real LiDAR-derived terrain height
- OSM-derived roads aligned to the same projection
- OSM-derived building footprints and POI context
- baked city texture with roads visible on the ground surface
- optional close-range road geometry or decals for crisp gameplay readability
- Blender-normalized `glb` output that can replace or augment the current `ground1`

Current implementation note:
- OSM roads, buildings, POIs, baked road texture, Blender terrain export, and Babylon runtime loading are implemented.
- Terrain generation currently uses `sourceKind: procedural-fallback-awaiting-cnig-dtm` until a raw CNIG/IGN DTM GeoTIFF is stored under `data/tenerife/source/dem/`.
- Runtime entrypoint: `?tenerife=1&terrain=real`; add `&roads=both` to compare baked roads with runtime road ribbons.

## Documents

- [Product Plan](./product-plan.md)
- [Roadmap](./roadmap.md)
- [Technical Plan](./technical-plan.md)
- [Data And Asset Pipeline](./data-and-asset-pipeline.md)
- [Road Texture Overlay Analysis](./road-texture-overlay-analysis.md)
- [Tasks](./tasks.md)
