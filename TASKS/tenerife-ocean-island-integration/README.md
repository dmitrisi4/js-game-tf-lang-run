# Tenerife Ocean Island Integration

Build a proper ocean integration for `?tenerife=1&terrain=island-full`: one authoritative visual ocean system, verified against the actual running dev server, with a believable shoreline transition where the water meets the normalized Tenerife island model.

This epic supersedes the ad hoc full-island ocean level tuning in `TASKS/tenerife-ocean-polish/` for future implementation work. The previous polish task is still useful as first-pass prototype history, but this epic owns the durable shoreline/ocean integration plan.

References used:
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
- Babylon.js package docs for official materials packages: https://doc.babylonjs.com/setup/frameworkPackages/
- Babylon.js local package API: `node_modules/@babylonjs/materials/water/waterMaterial.d.ts`
- MDN WebGL shader docs: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders
- NVIDIA GPU Gems, Chapter 2, Rendering Water Caustics: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics

