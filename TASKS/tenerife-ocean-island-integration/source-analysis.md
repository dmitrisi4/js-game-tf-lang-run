# Source Analysis

## Trusted Sources Read

### Babylon.js official documentation

Source:
- https://doc.babylonjs.com/
- https://doc.babylonjs.com/setup/frameworkPackages/

Relevant takeaways:
- Babylon.js is the project runtime engine and the source of truth for scene/material capabilities.
- The official package docs identify `babylonjs-materials` / `@babylonjs/materials` as Babylon-supported advanced materials. This project already depends on `@babylonjs/materials`.

Application to this project:
- Using Babylon's official `WaterMaterial` is valid from a dependency and support perspective.
- A custom shader remains valid where we need project-specific shoreline masking, but we should not ignore `WaterMaterial` as a baseline/reference.

### Local Babylon.js WaterMaterial API

Source:
- `node_modules/@babylonjs/materials/water/waterMaterial.d.ts`
- `node_modules/@babylonjs/materials/water/waterMaterial.js`

Relevant API facts:
- `WaterMaterial` supports render-target-backed reflection/refraction.
- It exposes `bumpTexture`, `windForce`, `windDirection`, `waveHeight`, `bumpHeight`, `waveLength`, `waveSpeed`, `waveCount`, `waterColor`, `waterColor2`, `colorBlendFactor`, `colorBlendFactor2`, and `disableClipPlane`.
- It creates reflection/refraction render targets and uses clip planes around the water mesh.

Application to this project:
- `WaterMaterial` can produce a richer ocean than the first-pass shader, but render targets can be expensive with a large island scene.
- The first implementation should measure cost at `256`, `512`, and disabled render-target modes before adopting it as default.
- `WaterMaterial` does not solve the shoreline mask by itself. We still need a project-specific shoreline/foam layer driven by island geometry.

### MDN WebGL shader documentation

Source:
- https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders

Relevant takeaways:
- Vertex shaders position vertices; fragment shaders compute pixel color.
- Uniforms are the right channel for scene/runtime inputs such as time, sun direction, water level, and tuning values.

Application to this project:
- The current `ShaderMaterial` approach is technically appropriate for project-specific color, wave, and foam effects.
- Shader code must stay parameterized and testable through TypeScript-side config helpers, not hard-coded magic spread through scene components.

### NVIDIA GPU Gems, Rendering Water Caustics

Source:
- https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics

Relevant takeaways:
- Realistic water is expensive, and real-time systems often use aesthetics-driven approximations.
- Caustics/refraction can be implemented procedurally or via fixed-resolution render targets.
- Fixed-resolution render targets give predictable cost; screen-space approaches vary with visible pixel area.

Application to this project:
- We should use stylized approximations for foam/caustics rather than full physical simulation.
- If caustics are added, they should be a low-cost optional pass, not a blocker for the shoreline integration.
- Performance budget must be measured because the full-island terrain already carries a large runtime cost.

## Current Project Findings

### Active port mismatch

Observed locally:
- `localhost:5173` is already served by a `node` process.
- Earlier work used `5174` because Vite reported `5173` as occupied.

Impact:
- Visual QA against `localhost:5173` can show a stale or different server instance from the one used by implementation validation.
- Ocean changes must not be accepted/rejected until the active server PID, port, URL, and served bundle timestamp are verified.

Required action:
- Add a tiny runtime debug marker showing ocean config values and build timestamp in development mode.
- Add a QA checklist step that verifies `curl -I`, visible dev overlay, and browser URL before screenshot capture.

### Competing water layers are likely

Current code:
- `TenerifeFullIslandTerrain.tsx` imports a normalized GLB and sets all imported meshes initially non-pickable, but it does not explicitly disable imported water-looking meshes by name.
- `TenerifeOcean.tsx` adds `tenerife-full-island-ocean-surface`.
- Prior docs mention disabling `env_atlantic_ocean_disc` in the older Tenerife preview GLB, but full-island mode needs its own explicit imported-water audit.

Impact:
- If a GLB water/background plane remains visible, changing `TENERIFE_FULL_ISLAND_WATER_SURFACE_Y` will not affect the image the user sees.

Required action:
- Enumerate full-island GLB mesh names/material names at runtime.
- Disable or tag all imported ocean/background/sea plane meshes.
- Add a debug mode that hides `OceanSurface` entirely to prove which mesh is visible.

### The current ocean does not know the island coast

Current code:
- `OceanSurface` uses rectangular bounds and radial color math around the ocean plane center.
- It does not sample the island terrain or coastline.
- Its "shoreline" factor is based on distance from plane center, not distance to actual shore.

Impact:
- Even when Y is correct, the coast transition will look arbitrary and can place foam/color bands in the wrong location.

Required action:
- Generate a shoreline mask from actual terrain data or a sampled heightfield.
- Drive foam and shallow-water color from distance-to-coast or sampled terrain height near waterline.

## Technical Direction

Use a staged approach:

1. Audit and isolate all water meshes.
2. Measure real full-island terrain heights around Puerto and coastal samples.
3. Generate a shoreline data asset from the terrain heightfield.
4. Render ocean as:
	- base water surface
	- shoreline foam ribbon or mask
	- optional caustics/shallow overlay
5. Evaluate Babylon `WaterMaterial` against custom shader for base water.
6. Keep safety/reset as separate gameplay logic.

