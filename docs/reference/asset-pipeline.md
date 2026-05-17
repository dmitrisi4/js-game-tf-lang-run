# Asset Pipeline

## 3D Asset Governance
- Runtime asset format is `glb`.
- Runtime-ready assets belong in:
	- `src/assets/models`
	- `src/assets/textures`
	- `src/assets/animations`
- Source work files such as `.blend` should not live inside runtime import folders.
- AI-generated assets must not be imported directly into runtime without Blender cleanup.
- Every imported asset must be normalized for:
	- scale
	- pivot/origin
	- naming
	- material sanity
	- collider strategy
- Every imported gameplay asset must have an intake note or equivalent metadata covering source/license, scale, pivot, texture budget, material maps, collider strategy, and validation status.
- World textures must have an explicit budget: maximum resolution, mipmap policy, compression target, color/data classification, and streaming/loading expectation.
- Use mipmaps for 3D-world textures viewed at variable distance unless there is a documented exception.
- Avoid mipmaps for full-resolution-only UI textures unless profiling or visual QA requires them.
- Prefer glTF-compatible PBR metallic-roughness materials.
- Bake or simplify procedural Blender materials before export instead of expecting arbitrary node graphs to survive GLB export.
- Dynamic gameplay entities should not rely on raw triangle mesh collisions by default.
- Visual meshes are presentation assets and must not silently become gameplay authority.

## AI And Blender Policy
- AI-first asset generation is approved for:
	- collectibles
	- simple props
	- ruins pieces
	- filler environment assets
- AI output for hero assets, characters, enemies, or animation-critical meshes requires stricter review and usually manual cleanup or replacement.
- Blender is the mandatory normalization layer before exporting runtime assets.
- Claude may be used for:
	- Blender Python scripting
	- cleanup automation
	- naming normalization
	- export helpers
- Do not trust AI to finalize hero topology, rigging, or gameplay colliders without review.
