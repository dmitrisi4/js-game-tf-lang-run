# World Streaming Performance

## Purpose

World content should be organized so rendering, physics, navigation, and loading can be optimized independently. This is especially important for Tenerife/city-scale work. (source: ../../wikibest/best-practices.md; ../../docs/llm-wiki/scene-architecture.md)

## Separation Rule

For large world layers, separate:
- near gameplay colliders
- mid/far visuals
- navmesh/path data
- decorative non-colliding props
- texture and material budgets

## Rendering Rules

- Prefer repeated assets, shared materials, and instancing for scenery.
- Use LOD or distance simplification for large repeated content.
- Treat high-resolution textures as explicit budget requests.
- Profile before introducing complex runtime degradation, but keep data structured so degradation is possible.

## Physics And Navigation Rules

- Do not derive gameplay colliders directly from dense visual city meshes.
- Keep navigation data simple and avoid per-frame path/reachability checks.
- Static environment collision should use simplified shapes wherever possible.

## Related

- [[scene-architecture]]
- [[texture-budget]]
- [[physics-object-policy]]
