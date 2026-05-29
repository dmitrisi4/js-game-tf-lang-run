# Roadmap

## Phase 1: Planning and Research
- Detail technical steps for pre-calculating the shoreline.
- Establish rules for `WaterMaterial` render list inclusion.

## Phase 2: Render List Optimization
- Modify `OceanSurface.tsx` to filter the meshes added to the `renderList`.
- Remove small or distant objects from reflection/refraction calculation.

## Phase 3: Particle Pooling
- Refactor `waterEntryEffects.ts` to use a pooled `ParticleSystem` or `ParticleSystemSet`.
- Eliminate GC spikes caused by repeated creation/destruction of particle systems.

## Phase 4: Underwater Post-Processing
- Implement an underwater post-process effect (fog, color grading, or distortion) when the camera dips below `TENERIFE_FULL_ISLAND_WATER_SURFACE_Y`.

## Phase 5: Shoreline Precalculation (Blender / Build Step)
- Create a script or Blender workflow to bake the shoreline path into a lightweight JSON or GLB curve.
- Update `ShorelineSurf.tsx` and `ShorelineSandSlope.tsx` to read the precalculated path instead of scanning the full terrain mesh at runtime.
