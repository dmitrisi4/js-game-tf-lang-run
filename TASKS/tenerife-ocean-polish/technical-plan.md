# Technical Plan

## Current Baseline

- `TenerifeOcean.tsx` renders full-island water as a large, shallow `box` with a `standardMaterial`.
- `TenerifeSafetyLayer.tsx` renders preview water as another shallow `box` and also owns the seabed/reset behavior.
- `SkyDome.tsx` already provides a shader-driven sky with a stable sun direction and warm horizon.

## Implementation Shape

Add a reusable visual-only component:

- `src/scenes/environment/OceanSurface.tsx`
	- creates a Babylon ground mesh imperatively
	- uses `ShaderMaterial`
	- supports rectangular bounds with a center position and size
	- sets `isPickable = false`
	- keeps depth write disabled so it behaves like a visual water layer
	- animates a `time` uniform from `scene.onBeforeRenderObservable`

Add pure helpers:

- `src/scenes/environment/oceanVisualConfig.ts`
	- resolves ocean center and size from bounds
	- resolves UV scale from physical meters
	- keeps testable math outside Babylon scene creation

Wire existing components:

- `TenerifeOcean.tsx`
	- uses `OceanSurface` for full-island visual water
	- keeps invisible seabed unchanged
- `TenerifeSafetyLayer.tsx`
	- replaces only the preview water box with `OceanSurface`
	- keeps seabed mesh and physics unchanged

## Shader Treatment

First-pass stylized shader:

- base deep ocean color
- shallow/coastal tint based on local UV distance from center
- animated wave bands
- two moving shimmer fields
- warm sun glint aligned with the existing sky direction
- alpha tuned per mode
- soft horizon/distance darkening

## Risks

- A large transparent plane can sort badly if depth state is wrong.
- Too much alpha can make terrain look washed out.
- Wave scale must be based on world units so preview and full-island modes do not look mismatched.

## Verification Commands

- `bun run test -- src/scenes/environment/oceanVisualConfig.test.ts`
- `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/TenerifeSafetyLayer.tsx`
- `bun run build`

