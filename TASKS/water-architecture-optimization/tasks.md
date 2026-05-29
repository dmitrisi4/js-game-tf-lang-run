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

Status: Not started

Tasks:
- [ ] Implement `shouldRenderInWater` utility.
- [ ] Update `OceanSurface.tsx` to filter initial meshes.
- [ ] Update `OceanSurface.tsx` to filter newly added meshes.
- [ ] Test scene performance and visually verify reflections/refractions.

## 2. Particle Pooling

Status: Not started

Tasks:
- [ ] Create `WaterSplashManager` or refactor `waterEntryEffects.ts`.
- [ ] Implement manual particle bursts or reuse logic instead of disposal.
- [ ] Verify entry splashes still trigger correctly without visual artifacts.

## 3. Underwater Post-Processing

Status: Not started

Tasks:
- [ ] Add camera height check relative to water surface.
- [ ] Apply underwater fog/tint when submerged.
- [ ] Ensure smooth transition between above and below water.

## 4. Shoreline Precalculation

Status: Not started

Tasks:
- [ ] Write a script to extract the shoreline path from terrain assets.
- [ ] Save the path to `public/data/shoreline-path.json`.
- [ ] Modify `ShorelineSurf.tsx` to fetch and use the precalculated data.
- [ ] Modify `ShorelineSandSlope.tsx` to fetch and use the precalculated data.
- [ ] Remove `getShorelinePathFromTerrain` logic from runtime.

## 5. Validation

Status: Not started

Tasks:
- [ ] Run `bun run check`.
- [ ] Run `bun run test`.
- [ ] Run `bun run build`.
- [ ] Test in-browser visually.
- [ ] Write session log.
