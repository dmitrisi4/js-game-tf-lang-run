# Roadbed PBR Pipeline Implementation

Date: 2026-05-27

## Scope

Implemented and ran the first Puerto roadbed and PBR material pipeline pass. This builds on the existing baked-road terrain path and keeps runtime physics authority on `ground1`.

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- `docs/history/logs/2026-05-27-road-terrain-photoreal-research.md`
- `TASKS/puerto-real-terrain-city/road-texture-overlay-analysis.md`
- `TASKS/puerto-real-terrain-city/technical-plan.md`
- `TASKS/puerto-real-terrain-city/data-and-asset-pipeline.md`

## Changes

- Added a roadbed deformation pass to `scripts/geo/prepare_puerto_dem.mjs`.
	- Uses generated OSM road centerlines.
	- Applies per-layer road width, crown, shoulder width, and smooth falloff.
	- Preserves longitudinal slope by sampling nearest centerline height.
	- Records roadbed metrics in DEM metadata.
- Extended `scripts/geo/build_puerto_city_texture.mjs`.
	- Keeps albedo and road mask outputs.
	- Adds `puerto-city-orm.png`.
	- Adds `puerto-city-normal.png`.
	- Adds alpha shoulder/disturbed-ground coverage to the road mask.
	- Updates the contact sheet to show albedo, road mask, ORM, and normal.
- Updated `PuertoCityTerrain` to load generated PBR maps.
	- Albedo is loaded as sRGB.
	- ORM and normal are loaded as linear data textures.
	- Roughness uses ORM green, AO uses ORM red, metallic remains zero.
- Updated build pruning allowlist and tests for the new runtime textures.
- Regenerated the Puerto terrain GLB and generated texture/data outputs.

## Generated Outputs

- `data/tenerife/generated/terrain/puerto-dem-runtime.json`
- `data/tenerife/generated/terrain/puerto-dem-metadata.json`
- `data/tenerife/generated/terrain/puerto-roadbed-metadata.json`
- `data/tenerife/generated/textures/puerto-city-texture-metadata.json`
- `public/textures/tenerife/puerto-city-albedo.png`
- `public/textures/tenerife/puerto-city-road-mask.png`
- `public/textures/tenerife/puerto-city-orm.png`
- `public/textures/tenerife/puerto-city-normal.png`
- `public/textures/tenerife/puerto-city-contact-sheet.png`
- `public/models/environment/puerto-de-la-cruz-terrain.glb`
- `public/data/tenerife/puerto-city-metadata.json`

## Metrics

- DEM grid: `342 x 254`.
- Terrain mesh: `86,868` vertices, `172,546` terrain triangles.
- Roadbed affected samples: `13,895`.
- Roadbed affected by layer:
	- main: `7,966`
	- service: `3,194`
	- walk: `2,735`
- Roadbed max delta: `0.275` world units.
- Runtime GLB size: about `17 MB`.
- New generated textures:
	- albedo: about `2.1 MB`
	- road mask: about `734 KB`
	- ORM: about `3.0 MB`
	- normal: about `2.2 MB`

## Validation

- `node --check scripts/geo/prepare_puerto_dem.mjs` passed.
- `node --check scripts/geo/build_puerto_city_texture.mjs` passed.
- `python3 -m py_compile scripts/blender/create_puerto_city_terrain.py` passed.
- `./node_modules/.bin/tsc -p tsconfig.app.json --noEmit` passed.
- Targeted tests passed: `18` tests.
- Changed-file Biome check passed.
- `bun run check` passed.
- `bun run test` passed: `35` files, `163` tests.
- `bun run build` passed with the existing Vite large chunk warning.
- Browser smoke passed at `http://127.0.0.1:5174/?tenerife=1&terrain=real`.
	- Canvas loaded.
	- Console had no error/warn/issue messages.
	- New texture and GLB URLs returned HTTP `200`.
- `PUERTO_CITY_TERRAIN_MODEL_URL` now uses `v=2026-05-27-roadbed-pbr-pass` for cache busting.

## Notes

- The first `node scripts/build_puerto_city_runtime.mjs` run completed city layers, DEM, and texture generation, then Blender crashed inside the sandbox with a segmentation fault.
- Rerunning `blender -b --python scripts/blender/create_puerto_city_terrain.py` outside sandbox restrictions succeeded.
- The DEM source is still `procedural-fallback-awaiting-cnig-dtm`; this roadbed pass should be regenerated after the final CNIG/IGN DTM is added.
