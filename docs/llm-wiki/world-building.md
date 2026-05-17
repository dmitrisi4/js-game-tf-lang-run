# World Building

## Purpose
Use this page for tasks that add or adjust map content: houses, buildings, trees, props, rocks, NPCs, creatures, zones, and static obstacles.

## Files To Inspect First
- `src/scenes/environment/WorldScenery.tsx`
- `src/scenes/environment/worldData.ts`
- `src/scenes/environment/terrainData.ts`
- `src/scenes/environment/worldZones.ts`
- `public/models/environment/` for current environment models

## Current Pattern
`worldData.ts` defines typed static placement arrays:
- `WORLD_TREES`
- `WORLD_BUILDINGS`
- `TENERIFE_PREVIEW_ROADS`
- `TENERIFE_PREVIEW_BUILDINGS`
- `WORLD_ROCKS`
- `WORLD_PROPS`
- `WORLD_NPCS`
- `WORLD_CREATURES`

`WorldScenery.tsx` renders those arrays into scene components and adds simple static physics. New repeated world content should follow this data-first pattern.

## Adding Houses Or Buildings
Preferred flow:
- Add or edit `WorldBuilding` entries in `worldData.ts` with `id`, `modelId`, `position`, `yaw`, `scale`, and collider metadata.
- Use `WORLD_BUILDINGS` for static building placement.
- Building visuals render through `src/scenes/environment/WorldBuildings.tsx`.
- Use `getTerrainHeightAt({ x, z })` for placement.
- Current building visuals load OBJ files from `public/models/build/buildings-pack-jan2019/OBJ/`.
- `WorldBuildings.tsx` normalizes imported OBJ root meshes so each model's lower bound sits on its placement anchor.
- Default arena buildings come from `WORLD_BUILDINGS`.
- Tenerife preview buildings come from `TENERIFE_PREVIEW_BUILDINGS`, raycast-align to the `ground1` island mesh, use small positive `heightOffset` values, and render without physics until collision placement is reviewed.
- Tenerife preview roads come from `TENERIFE_PREVIEW_ROADS`, use OSM way IDs where available, and raycast-align each segment to the exact `ground1` terrain mesh.
- Puerto de la Cruz road data is sourced from OpenStreetMap/Overpass. Keep provenance when regenerating: relation or bbox, query, date, filters, and `© OpenStreetMap contributors` attribution.
- The GLB already contains baked Puerto OSM geometry; keep it disabled in `TenerifeIslandPreview` when using runtime roads/building-pack houses to avoid duplicate floating city layers.
- Other `WorldScenery` content stays out of Tenerife mode.
- Add primitive or proxy colliders; do not use raw imported triangle meshes as default gameplay blockers.
- Keep imported assets normalized to meters with predictable pivots before placing them.

## Asset Selection For Houses
Prefer:
- `.glb` or `.gltf`
- low-poly or game-ready assets
- small texture sets
- clear license terms, ideally CC0
- consistent scale and pivot after Blender cleanup

Avoid:
- heavy architectural models with hundreds of thousands or millions of triangles
- unclear licenses
- many unique 4K/8K textures for background buildings
- assets that require one-off runtime hacks to display correctly

## Placement Notes
- World scale is `1 unit = 1 meter`.
- Keep spawn and starter paths readable.
- Do not block letter collectible routes unless the task intentionally changes progression.
- Validate movement around buildings with the player, not only by visual inspection.
- For Tenerife, update `src/scenes/environment/tenerifePreviewConfig.ts` instead of duplicating spawn/reset/bounds constants.
- If Puerto content appears in water, check the Puerto GLB anchor sign/scale and `ground1` raycast target before changing building Y offsets.

## When To Split Modules
Keep `WorldScenery.tsx` small enough to scan. If buildings need asset loading, cached containers, collision proxy setup, or many variants, create a dedicated module such as:
- `src/scenes/environment/WorldBuildings.tsx`
- `src/scenes/environment/buildingData.ts`
