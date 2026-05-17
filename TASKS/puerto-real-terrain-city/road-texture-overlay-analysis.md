# Road Texture Overlay Analysis

## Problem

Current roads are runtime ribbon meshes draped onto `ground1`. This works for debugging alignment, but a believable city needs roads to be part of the ground texture as well. Otherwise roads can look like strips floating above the terrain or visually disconnected from city blocks.

## Options

### Option A. Keep Runtime Road Meshes Only

Pros:
- Already implemented in `TenerifeGeoRoadLayers`.
- Easy to tune per road class.
- Can be toggled or regenerated without rebuilding textures.

Cons:
- More z-bias tuning.
- Roads can look pasted on top of terrain.
- Many mesh segments can become expensive.
- Texture still looks like generic terrain under the roads.

Use:
- Keep as debug overlay and optional close-range crispness layer.

### Option B. Bake Roads Into Terrain Albedo

Pros:
- Roads visually belong to the city surface.
- Fewer runtime meshes.
- Mipmaps handle distance readability.
- Works well with the GLB terrain asset.

Cons:
- Texture must be regenerated when roads/projection/AOI changes.
- Road edges can blur unless atlas resolution and masks are managed.
- Harder to support dynamic road style changes.

Use:
- Recommended default for first production pass.

### Option C. Bake Road Mask, Mix In Material

Pros:
- Keeps road data separate from base albedo.
- Can tune road color/roughness in Babylon or Blender material.
- Allows separate masks for main/service/walk in RGB channels.

Cons:
- Slightly more material complexity.
- Needs careful GLB-compatible material setup or runtime material assignment.

Use:
- Recommended if we want ongoing art tuning without rebaking every texture.

### Option D. Generate Road Geometry In Blender And Export With Terrain

Pros:
- Roads conform to terrain offline.
- One GLB can contain terrain and road material slots.
- Easy to inspect in Blender.

Cons:
- Asset rebuild required for road changes.
- Geometry roads still need z-fighting avoidance.
- Not ideal for future streaming/chunking unless split by tiles.

Use:
- Useful for preview renders and debug comparison, not the primary runtime path.

## Recommended Hybrid

Use baked road texture/mask as the default visual layer, then keep runtime road ribbons as an optional debug/close-range overlay.

Default runtime:
- terrain GLB with baked city material
- roads visible in albedo or road mask
- road ribbon meshes disabled

Debug/runtime enhancement:
- enable `TenerifeGeoRoadLayers` to compare projection
- optionally render only main roads as close-range decals/ribbons if texture resolution is not crisp enough

## Road Mask Channel Plan

Use `puerto-city-road-mask.png`:
- red channel: main roads
- green channel: service roads
- blue channel: walk paths
- alpha channel: optional road edge/shoulder or reserved

Material interpretation:
- main roads: dark asphalt, lower roughness variation
- service roads: warmer/desaturated asphalt
- walk paths: lighter stone/dust path color

## Texture Drawing Rules

Inputs:
- road centerlines from `roads-runtime.json` or regenerated `puerto-roads-runtime.json`
- road layer styles from `src/scenes/environment/tenerifeRoadLayers.ts`
- terrain AOI metadata

Algorithm:
1. Convert each runtime X/Z point to atlas UV.
2. Convert desired world road width to pixel width.
3. Draw antialiased polylines into class-specific mask channels.
4. Draw shoulders/edge feathering before road core.
5. Draw intersections with round joins.
6. Export mask losslessly.
7. Optionally composite mask into albedo for a self-contained fallback texture.

Pixel width rule:
- `pixelWidth = roadWidthWorld / worldWidth * atlasWidth`
- Clamp to minimum readable widths:
	- main: `3-5 px`
	- service: `2-3 px`
	- walk: `1-2 px`

For a `2048 px` atlas covering current road width of about `1531.5 world units`, `1 px` is about `0.75 world units`. Current main road width `3.4 world units` is about `4.5 px`, which is acceptable for a prototype atlas.

## City Texture Layers

Recommended layer order:
1. Base terrain color by slope/elevation/landuse.
2. Urban district tint around dense building footprints.
3. Building footprint soft shadows or ground patches.
4. Road shoulder/edge mask.
5. Road core mask.
6. Optional plazas, parks, coastline, and pedestrian areas.
7. Optional noise/detail pass to avoid flat color bands.

Do not use Google imagery. If orthophotos are used later, use documented PNOA/IGN licensing and keep attribution.

## Runtime Decision

First implementation adds query flags:
- `?tenerife=1&roads=mesh` for current mesh roads
- `?tenerife=1&roads=baked` for baked texture only
- `?tenerife=1&roads=both` for comparison
- `?tenerife=1&terrain=real` for the generated Puerto terrain patch

This lets browser verification decide whether the baked texture needs close-range geometry support.
