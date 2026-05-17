# Asset Pipeline

## Runtime Rules

- Runtime 3D asset format is `glb`. (source: ../../GEMINI.md)
- Runtime-ready assets belong in `src/assets/models`, `src/assets/textures`, and `src/assets/animations` when imported by the app. Runtime-served models currently also exist under `public/models/`. (source: ../../GEMINI.md; ../../docs/llm-wiki/project-map.md)
- Source work files such as `.blend` should not live inside runtime import folders. (source: ../../GEMINI.md)

## AI And Blender

AI-first asset generation is approved for collectibles, simple props, ruins pieces, and filler environment assets. Hero assets, characters, enemies, or animation-critical meshes require stricter review and usually manual cleanup or replacement. (source: ../../GEMINI.md)

Blender is the mandatory normalization layer before runtime export. Normalize scale, pivot/origin, naming, material sanity, collider strategy, and GLB export settings before importing assets into runtime. (source: ../../GEMINI.md; ../../docs/ai_asset_workflow.md; ../../docs/blender_local_workflow.md)

## Collision

Dynamic gameplay entities should not rely on raw triangle mesh collisions by default. Visual meshes are presentation assets and must not silently become gameplay authority. (source: ../../GEMINI.md)

## Related

- [[scene-architecture]]
- [[project-map]]
