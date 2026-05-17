# Texture Budget

## Purpose

Every runtime texture set needs an explicit budget before it becomes part of gameplay content. The goal is to prevent accidental GPU memory growth, slow loads, and inconsistent material export behavior. (source: ../../wikibest/best-practices.md; ../../wikibest/sources.md)

## Required Fields

- usage: world material, character, prop, UI, sky, lightmap, data texture, or other
- max runtime size
- mipmap policy
- compression target
- color/data classification
- alpha/transparency need
- streaming/loading expectation
- Babylon/glTF validation status

Use `../../docs/templates/texture-budget.md` for new texture sets.

## Rules

- Use mipmaps for 3D-world textures viewed at variable distance unless there is a documented exception.
- Avoid mipmaps for UI textures that are always rendered at full resolution.
- Prefer power-of-two dimensions for world textures.
- Prefer glTF-compatible PBR texture maps and runtime-friendly compressed formats where supported.
- Treat 4K textures as exceptions that need screen-size and camera-distance justification.

## Related

- [[asset-pipeline]]
- [[asset-intake-template]]
- [[world-streaming-performance]]
