# Tasks

## 0. Planning

Status: Implemented

Tasks:
- [x] Create epic directory.
- [x] Add product plan.
- [x] Add roadmap.
- [x] Add technical plan.
- [x] Add tasks checklist.

## 1. Render List Optimization

Status: Implemented

Tasks:
- [x] Implement `shouldRenderInWater` utility.
- [x] Update `OceanSurface.tsx` to filter initial meshes.
- [x] Update `OceanSurface.tsx` to filter newly added meshes.
- [x] Test scene performance and visually verify reflections/refractions.

## 2. Particle Pooling

Status: Implemented

Tasks:
- [x] Create `WaterSplashManager` or refactor `waterEntryEffects.ts`.
- [x] Implement manual particle bursts or reuse logic instead of disposal.
- [x] Verify entry splashes still trigger correctly without visual artifacts.

## 3. Underwater Post-Processing

Status: Implemented

Tasks:
- [x] Add camera height check relative to water surface.
- [x] Apply underwater fog/tint when submerged.
- [x] Ensure smooth transition between above and below water.

## 4. Shoreline Precalculation

Status: Implemented

Tasks:
- [x] Write a script to extract the shoreline path from terrain assets.
- [x] Save the path to `public/data/shoreline-path.json`.
- [x] Modify `ShorelineSurf.tsx` to fetch and use the precalculated data.
- [x] Modify `ShorelineSandSlope.tsx` to fetch and use the precalculated data.
- [x] Remove `getShorelinePathFromTerrain` logic from runtime.

## 5. Validation

Status: Not started

Tasks:
- [ ] Run `bun run check`.
- [ ] Run `bun run test`.
- [ ] Run `bun run build`.
- [ ] Test in-browser visually.
- [ ] Write session log.
