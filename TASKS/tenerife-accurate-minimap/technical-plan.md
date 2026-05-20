# Technical Plan

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`

## Current Baseline

- `src/ui/GameHud.tsx` owns map shape constants, marker data, and projection logic.
- Tenerife map shape is a hand-authored SVG path.
- Full-island player projection uses a square `-1225..1225` bounds constant, while the normalized terrain model has its own runtime bounds.
- `public/data/tenerife/full-island-metadata.json` records the source terrain bounds and `src/scenes/environment/tenerifeFullIslandConfig.ts` records the runtime scale.

## Proposed Files

- `scripts/blender/build_tenerife_full_island_map.py`
- `src/scenes/environment/tenerifeFullIslandMapData.ts`
- `src/ui/mapProjection.ts`
- `src/ui/mapProjection.test.ts`
- Update `src/ui/GameHud.tsx`
- Update `src/ui/gameHud.css` only if new path styling requires it.

## Data Flow

1. Blender imports `public/models/environment/tenerife-full-island-normalized.glb`.
2. Terrain meshes named `tenerife-full-island-terrain-tile-*` are inspected in world coordinates.
3. Boundary vertices are projected from source `x/y/z` to Babylon runtime `-x/-y/z` with `TENERIFE_FULL_ISLAND_RUNTIME_SCALE`.
4. The script emits SVG path coordinates normalized to a `0..100` viewBox and runtime bounds.
5. React HUD renders the generated path and uses the same bounds for player projection.
6. Full-island city markers use WGS84 coordinates projected into the runtime bounds with the same mirrored east-west orientation validated by the Teide control point.

## Risks

- Terrain tile seams can appear as false boundaries if the contour is generated only from loose mesh edges.
- Rasterizing the terrain footprint is more robust than direct boundary edge extraction if tile seams are visible.
- The full-island city projection is an affine island-bounds fit. It is accurate enough for map labels, but not a road-level GIS overlay.
- Future settlement markers should use the same projection or a stronger georeferenced control-point transform.

## Verification Commands

- `blender -b --python scripts/blender/build_tenerife_full_island_map.py`
- `bun run test -- src/ui/mapProjection.test.ts`
- `bunx biome check scripts/blender/build_tenerife_full_island_map.py src/scenes/environment/tenerifeFullIslandMapData.ts src/ui/mapProjection.ts src/ui/mapProjection.test.ts src/ui/GameHud.tsx`
- `bun run build`
