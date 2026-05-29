# Technical Plan

## Shoreline Precalculation
Currently, `ShorelineSurf.tsx` and `ShorelineSandSlope.tsx` use `getShorelinePathFromTerrain`, which scans `VertexBuffer.PositionKind` across all terrain meshes.
**Plan:**
- Add a build script (e.g., using a Node script with Babylon.js headless) or a Blender Python script to extract vertices near `TENERIFE_FULL_ISLAND_WATER_SURFACE_Y`.
- Sort and save these vertices as an ordered sequence of 2D coordinates in a `.json` file (`shoreline-path.json`).
- Fetch this JSON at runtime and build the `ShorelineCandidateType` array directly.

## Ocean Render List Filtering
Currently, `OceanSurface.tsx` pushes all meshes (except itself) to `material.addToRenderList(mesh)`.
**Plan:**
- Implement a filtering function `shouldRenderInWater(mesh: AbstractMesh): boolean`.
- Check properties like `mesh.getBoundingInfo().boundingSphere.radius` (skip small props) or specific tags/layers to determine inclusion.
- Apply this filter both in the initial loop and inside the `scene.onNewMeshAddedObservable`.

## Particle Pooling for Splashes
Currently, `createWaterEntrySplash` creates a new `ParticleSystem`, calls `start()`, and disposes it via `setTimeout`.
**Plan:**
- Create a globally accessible or scene-bound `WaterSplashManager`.
- Initialize a single `ParticleSystem` (or a small pool) on load.
- On water entry, update the emitter position and call `system.start()` / emit a manual burst without destroying the system.

## Underwater Camera Effect
**Plan:**
- In the main camera controller (or a dedicated `UnderwaterCameraEffect` component), check if the camera's absolute Y position is below `TENERIFE_FULL_ISLAND_WATER_SURFACE_Y`.
- If true, enable a `PostProcess` (e.g., tinting the screen blue/green and adding blur/distortion) or adjust the scene fog settings (`scene.fogColor`, `scene.fogDensity`).
