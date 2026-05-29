# Product Plan

## User-Visible Outcome

The game will run smoother with higher framerates near the coastline. Water visuals, foam, and sand rendering will remain visually identical or better, but will not cause CPU spikes during initialization. Entering the water frequently will not cause micro-stutters. Submerging the camera underwater will correctly apply a visual distortion and fog effect.

## Acceptance Criteria

- Coastal foam (`ShorelineSurf.tsx`) and underwater sand (`ShorelineSandSlope.tsx`) are generated efficiently without iterating over all terrain vertices at runtime.
- The ocean surface (`OceanSurface.tsx`) only renders relevant nearby or large meshes into its reflection and refraction render targets.
- Splashes (`waterEntryEffects.ts`) reuse particle systems (object pooling) to prevent garbage collection spikes on repeated entries.
- A post-processing effect or fog is applied when the active camera goes below the water surface level.

## Non-Goals

- Completely rewriting the `WaterMaterial` to a custom shader.
- Changing the physics model of buoyancy or swimming logic.
- Adding complex wave simulation (e.g., Gerstner waves affecting physics).

## Priority

Medium. Current implementation is functional, but optimization and polish are required before scaling up the environment density or porting to lower-end devices.
