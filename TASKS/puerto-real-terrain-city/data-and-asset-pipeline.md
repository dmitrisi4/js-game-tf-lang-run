# Data And Asset Pipeline

## Pipeline Overview

The city generation pipeline should be reproducible from source data to runtime assets:

1. Acquire source data.
2. Normalize geospatial coordinates.
3. Crop and resample terrain.
4. Extract vector city layers.
5. Generate terrain mesh.
6. Generate city texture and road masks.
7. Normalize in Blender.
8. Export runtime GLB and textures.
9. Integrate in Babylon.
10. Verify in browser and record metadata.

## 1. Source Data Acquisition

Required:
- CNIG/IGN DTM for Puerto de la Cruz AOI.
- Existing `data/tenerife2/export.geojson` road source.
- Existing `data/tenerife/puerto_de_la_cruz_osm.json` for buildings, roads, amenities, tourism, landuse.

Optional:
- IDECanarias/GRAFCAN topobathymetric model for coastline and seabed.
- PNOA orthophoto only if license and texture use are explicitly documented; not needed for first stylized city texture.

Store raw files under `data/tenerife/source/`. Do not put raw GeoTIFF, LAS/LAZ, `.blend`, or source shapefiles in runtime asset folders.

## 2. Terrain Preprocessing

Script: `scripts/geo/prepare_puerto_dem.mjs`

Responsibilities:
- Read source GeoTIFF/COG DTM.
- Reproject to the selected local projected CRS if needed.
- Crop to road bbox plus buffer.
- Fill nodata holes.
- Resample to prototype and high-quality grids.
- Emit:
	- `data/tenerife/generated/terrain/puerto-dem-runtime.json`
	- `data/tenerife/generated/terrain/puerto-dem-metadata.json`

Metadata must include:
- source URL
- source license/attribution
- source CRS
- processing CRS
- bbox in WGS84
- bbox in projected coordinates
- grid resolution
- vertical unit
- nodata policy
- resampling method

## 3. Vector Layer Preprocessing

Script: `scripts/geo/build_puerto_city_layers.mjs`

Responsibilities:
- Read roads from `data/tenerife2/export.geojson`.
- Read OSM ways/nodes from `data/tenerife/puerto_de_la_cruz_osm.json`.
- Build a node index for OSM way geometry.
- Extract:
	- road centerlines by layer
	- building footprints
	- amenity/tourism POIs
	- landuse/leisure/natural polygons when available
- Reproject every coordinate into the same runtime local X/Z frame.
- Clip to terrain AOI.
- Simplify geometry with layer-specific tolerances.
- Emit:
	- `data/tenerife/generated/roads/puerto-roads-runtime.json`
	- `data/tenerife/generated/buildings/puerto-building-footprints.json`
	- `data/tenerife/generated/terrain/puerto-city-aoi.json`

## 4. Blender Terrain Generation

Script: `scripts/blender/create_puerto_city_terrain.py`

Responsibilities:
- Load runtime DEM grid.
- Build terrain mesh vertices using runtime X/Y/Z scale.
- Generate deterministic UVs from AOI bounds.
- Assign material slots:
	- terrain base
	- road overlay/mask material
	- optional debug slope/elevation material
- Add optional simplified collision mesh.
- Name the runtime terrain mesh `ground1` or document the mapping in the loader.
- Export:
	- `public/models/environment/puerto-de-la-cruz-terrain.glb`
	- `art/blender/puerto_de_la_cruz_terrain.blend`

Blender cleanup requirements:
- apply transforms
- confirm scale and pivot
- remove unused cameras/lights unless needed for preview
- ensure normals are correct
- ensure material graph is GLB-compatible

## 5. City Texture Generation

Script: `scripts/geo/build_puerto_city_texture.mjs`

Responsibilities:
- Create a deterministic top-down atlas using the same AOI bounds as terrain UVs.
- Draw base land/urban zones.
- Draw building footprints into a low-contrast city block layer.
- Draw roads by class into either:
	- final albedo texture, or
	- separate road mask channels, or
	- both.
- Emit:
	- `public/textures/tenerife/puerto-city-albedo.png`
	- `public/textures/tenerife/puerto-city-road-mask.png`
	- `public/textures/tenerife/puerto-city-contact-sheet.png`
	- `data/tenerife/generated/textures/puerto-city-texture-metadata.json`

Texture coordinate rule:
- `u = (worldX - minX) / (maxX - minX)`
- `v = 1 - (worldZ - minZ) / (maxZ - minZ)`

Road width rule:
- Convert runtime road width to source meters before pixel conversion.
- Clamp visual widths per layer so roads remain readable at the chosen atlas resolution.

## 6. Runtime Integration

Component: `src/scenes/environment/PuertoCityTerrain.tsx`

Responsibilities:
- Load `puerto-de-la-cruz-terrain.glb`.
- Find and expose `ground1`.
- Apply baked city material and textures.
- Configure static terrain physics shape.
- Signal readiness to `Environment`.

Integration steps:
- Keep existing `TenerifeGeoRoadLayers` for comparison behind a debug flag.
- Update `WorldBuildings` input to use generated footprint-derived building placements when available.
- Keep player reset raycast against `ground1`.
- Keep roads non-pickable if rendered as overlay geometry.

## 7. Metadata And Attribution

Add `public/data/tenerife/puerto-city-metadata.json` with:
- DEM source and license
- OSM source and license
- processing date
- scripts and versions
- bbox
- CRS
- runtime scale
- mesh vertex count
- texture dimensions
- collision strategy
- validation status

Do not ship derived city data without attribution notes.

## Source References

- IGN/CNIG data policy: https://www.ign.es/web/politica-datos
- PNOA LiDAR third coverage status: https://pnoa.ign.es/pnoa-lidar/tercera-cobertura
- OpenStreetMap copyright and license: https://www.openstreetmap.org/copyright
- IDECanarias topobathymetric model: https://www.idecanarias.es/listado_servicios/topobatimetrico
