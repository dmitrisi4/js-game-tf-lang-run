# 2026-05-22 Tenerife Ocean Island Integration Planning

## Summary

Created `TASKS/tenerife-ocean-island-integration/` as the durable epic for a proper full-island ocean and shoreline integration. This was triggered after visual QA showed no apparent change while viewing `http://localhost:5173/?tenerife=1&terrain=island-full`; local inspection found `5173` is served by an existing node process while earlier work had used a different Vite port.

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- Babylon.js official docs: https://doc.babylonjs.com/
- Babylon.js package docs: https://doc.babylonjs.com/setup/frameworkPackages/
- Babylon.js local `WaterMaterial` API: `node_modules/@babylonjs/materials/water/waterMaterial.d.ts`
- MDN WebGL shader docs: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders
- NVIDIA GPU Gems water caustics chapter: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics

## Key Decisions

- Treat wrong-port/stale-server validation as a first-class risk.
- Audit imported GLB water/background meshes before changing more ocean Y constants.
- Build shoreline integration from measured terrain/coast data.
- Keep visual ocean separate from safety/reset gameplay logic.
- Evaluate Babylon `WaterMaterial` behind a flag, not as an immediate default.

## Validation

Documentation-only planning change. No runtime code was changed in this session segment.

