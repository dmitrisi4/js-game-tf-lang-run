# Puerto Real Terrain City Implementation Log

Date: 2026-05-16

## Scope

Implemented the first runtime pass for the Puerto de la Cruz terrain city pipeline:

- OSM-derived roads, building footprints, and POI extraction.
- Runtime AOI and generated metadata.
- DEM runtime preparation with explicit procedural fallback until CNIG/IGN DTM is added.
- Baked city albedo and road mask textures.
- Blender terrain mesh export to GLB and `.blend`.
- Reference-city visual pass with OSM building massing, Atlantic ocean plane, black volcanic coast strip, landuse overlays, Orotava ridge, and Teide backdrop.
- Babylon runtime loader for `?tenerife=1&terrain=real`.
- Road render modes: `baked`, `mesh`, `both`.

## References Used

- `AGENTS.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`
- Puerto photo references:
	- https://tenerifepost.com/puertodelacruz.html
	- https://www.pexels.com/photo/aerial-view-of-puerto-de-la-cruz-tenerife-coastline-30372578/
	- https://www.pexels.com/photo/breathtaking-coastal-view-in-puerto-de-la-cruz-31391838/
	- https://commons.wikimedia.org/wiki/Category:Coasts_of_Puerto_de_la_Cruz
	- https://sasvata.travel/inspiration/aerial_view_of_puerto_de_la_cruz_with_teide_volcano_in_the_background_tenerife_by_sasvata-travel-jpg/

## Reference-City Pass

The first terrain export was technically correct but visually too empty for Puerto de la Cruz. A second Blender pass added city-scale visual context directly into `public/models/environment/puerto-de-la-cruz-terrain.glb`:

- 3,087 OSM-derived building footprints extruded as low-poly city massing.
- 490 garden, park, pool, sport, and plaza overlays from generated landuse layers.
- Atlantic ocean plane, volcanic black coast strip, and foam line along the north edge.
- Orotava valley ridge and Teide volcano backdrop, based on the common Puerto de la Cruz panorama composition.
- Photo-reference-inspired facade and roof palette. This is not photogrammetry; the photos are used for style and composition, while geometry comes from OSM footprints and the terrain pipeline.

Runtime was also updated so `?tenerife=1&terrain=real` disables the old generated roadside placeholder buildings. The actual city in real terrain mode now comes from the baked GLB instead of the asset-pack houses.

## Main Files

- `scripts/geo/puerto_city_common.mjs`
- `scripts/geo/build_puerto_city_layers.mjs`
- `scripts/geo/prepare_puerto_dem.mjs`
- `scripts/geo/png_writer.mjs`
- `scripts/geo/build_puerto_city_texture.mjs`
- `scripts/blender/create_puerto_city_terrain.py`
- `scripts/build_puerto_city_runtime.mjs`
- `src/scenes/environment/PuertoCityTerrain.tsx`
- `src/scenes/environment/puertoCityConfig.ts`
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/puertoCityConfig.test.ts`
- `src/scenes/environment/puertoCityGeneratedData.test.ts`
- `biome.json`

## Generated Outputs

- `data/tenerife/generated/terrain/puerto-city-aoi.json`
- `data/tenerife/generated/terrain/puerto-dem-runtime.json`
- `data/tenerife/generated/terrain/puerto-dem-metadata.json`
- `data/tenerife/generated/roads/puerto-roads-runtime.json`
- `data/tenerife/generated/buildings/puerto-building-footprints.json`
- `data/tenerife/generated/puerto-city-layers.json`
- `data/tenerife/generated/textures/puerto-city-texture-metadata.json`
- `public/data/tenerife/puerto-city-metadata.json`
- `public/textures/tenerife/puerto-city-albedo.png`
- `public/textures/tenerife/puerto-city-road-mask.png`
- `public/textures/tenerife/puerto-city-contact-sheet.png`
- `public/models/environment/puerto-de-la-cruz-terrain.glb`
- `art/blender/puerto_de_la_cruz_terrain.blend`

## Validation

- Pipeline: `node scripts/build_puerto_city_runtime.mjs`
	- Passed after running Blender outside the default sandbox. Blender segfaulted in the sandbox.
- Targeted tests:
	- `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/puertoCityGeneratedData.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts`
	- Passed: 3 files, 10 tests.
- Build:
	- `bun run build`
	- Passed with the existing large chunk warning.
- Global check:
	- `bun run check`
	- Large generated/source geo dumps are excluded in `biome.json`.
	- Still fails on unrelated existing formatting/import issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Browser:
	- `http://127.0.0.1:5173/?tenerife=1&terrain=real`
	- `http://127.0.0.1:5173/?tenerife=1&terrain=real&roads=both`
	- No console errors or warnings observed.
- Reference-city GLB export:
	- `public/models/environment/puerto-de-la-cruz-terrain.glb`
	- Exported at 17 MB with 86,868 terrain vertices, 172,546 terrain triangles, 3,087 building footprints, ocean/coast meshes, landuse overlays, and Teide backdrop.
- 2026-05-17 building scale pass:
	- `scripts/blender/create_puerto_city_terrain.py` now uses a stronger facade palette, closer/taller Teide backdrop, 1.35x footprint scale, 1.18x height scale, and 1.06x local block spacing.
	- Re-export completed: `public/models/environment/puerto-de-la-cruz-terrain.glb` and `art/blender/puerto_de_la_cruz_terrain.blend` were regenerated on 2026-05-17.

## Screenshots

- `docs/history/logs/2026-05-16-puerto-real-terrain-baked.png`
- `docs/history/logs/2026-05-16-puerto-real-terrain-roads-both.png`
- `docs/history/logs/2026-05-16-puerto-reference-city-baked.png`

## Caveats

- The DEM is not the final CNIG/IGN terrain yet. Current metadata records `sourceKind: procedural-fallback-awaiting-cnig-dtm`.
- `prepare_puerto_dem.mjs` is ready to consume a source `.tif` or `.tiff` under `data/tenerife/source/dem/`, using GDAL if available.
- `roads=both` is intended as a comparison/debug mode. Default `terrain=real` uses baked roads only.
- The current city model is a procedural reference model. A true photo-derived model would require licensed photogrammetry or georeferenced imagery capture, not only web photos.
