# Collision Layers

## Purpose

Collision layers remove impossible interactions before physics queries run. This keeps gameplay behavior clear and reduces physics work. (source: ../../wikibest/best-practices.md; ../../src/scenes/physics/collisionLayers.ts)

## Current Layers

The canonical registry is `../../src/scenes/physics/collisionLayers.ts`.

- `ground`
- `player`
- `staticWorld`
- `dynamicWorld`
- `pickup`
- `trigger`
- `enemy`
- `projectile`
- `worldBounds`

## Rules

- New gameplay colliders must choose a layer intentionally.
- Masks should be narrow. Do not default every object to collide with everything.
- Trigger-only objects should not block movement.
- Visual-only objects should not receive physics bodies.

## Related

- [[physics-object-policy]]
- [[behavior-ai-policy]]
