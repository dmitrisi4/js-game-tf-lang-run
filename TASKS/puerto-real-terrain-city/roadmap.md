# Roadmap

## Phase 0. Planning Module

Status: Done

Create the task module, document source decisions, analyze road texture overlay options, and update the agent task protocol.

Gate: task module exists and completed planning items are marked done.

## Phase 1. Data Acquisition And Licensing

Status: In progress

Collect the real terrain and vector inputs for the same Puerto de la Cruz area as the existing road runtime file.

Gate:
- DEM/DTM source chosen.
- Exact AOI bbox and projection recorded.
- License and attribution notes written.
- Raw files stored outside runtime folders.

## Phase 2. Projection And Preprocessing

Status: Done for OSM and fallback DEM

Normalize terrain, roads, building footprints, landuse, and POI data into one local meter-space coordinate system.

Gate:
- All layers share the same origin, scale, axis convention, and bounds.
- Existing road projection has a measured compatibility check against terrain extents.
- Generated intermediate files have reproducible build scripts.

## Phase 3. Blender Terrain Mesh

Status: Done for fallback DEM

Build a Puerto terrain mesh in Blender from the DEM/DTM, crop it to the city AOI, decimate it for runtime, and export a preview GLB.

Gate:
- Terrain mesh is named or mapped to `ground1`.
- Mesh origin, scale, pivot, and material slots are normalized.
- Terrain raycast works in Babylon after import.

## Phase 4. City Texture And Road Overlay

Status: Done

Bake a city ground texture atlas from terrain/landuse/buildings/roads, with roads drawn into a road mask or albedo layer.

Gate:
- Terrain UVs are deterministic and match the AOI.
- Main/service/walk roads are visible in the texture.
- Texture budget, mipmap policy, compression target, and color/data classification are documented.

## Phase 5. Runtime Integration

Status: Done

Load the real Puerto terrain asset into the Tenerife preview and switch roads/buildings to align against it.

Gate:
- `TenerifeIslandPreview` or a new terrain component can load the city terrain GLB.
- Existing `TenerifeGeoRoadLayers` can be disabled, kept as close-range overlay, or compared behind a debug flag.
- Player reset and building grounding still raycast against `ground1`.

## Phase 6. Browser Verification And Tuning

Status: Done with documented baseline check failures

Verify the result visually and technically in `?tenerife=1`.

Gate:
- Browser screenshot confirms roads follow hillside terrain.
- Buildings sit beside roads without obvious floating.
- Build/test/check commands pass or baseline failures are documented.
- Follow-up streaming tasks are updated with the new data model.
