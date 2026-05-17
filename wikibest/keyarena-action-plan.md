# keyArena Application Plan

Research date: 2026-05-13. See [best-practices.md](./best-practices.md) and [sources.md](./sources.md).

## Immediate Documentation Rules

Add these to the project wiki or standards when asset/world work resumes:

- Every imported GLB needs an asset note: source, license, scale, pivot, material maps, texture sizes, collider strategy, and validation result.
- Every dynamic object needs a physics note: body type, collider, mass/damping/friction/bounce, collision layer, sleeping, CCD need.
- Every repeated runtime object needs a lifecycle note: spawned once, pooled, streamed, or procedural.
- Every NPC/enemy needs a behavior ownership note: sensing, state, decision, action, pathfinding budget.

## Asset Pipeline Actions

1. Create a reusable `asset-intake.md` template under the project docs or `wiki/wiki/`.
2. Add a required "collider strategy" field before assets can be used in gameplay.
3. Add a required "texture budget" field:
   - max texture size
   - mipmaps yes/no
   - compression target
   - color/data texture classification
4. Validate GLB files through a glTF validator before runtime integration.
5. Test assets in Babylon runtime or a glTF viewer, not only Blender.

## Runtime/Rendering Actions

1. Audit repeated scenery for instancing candidates.
2. Add a rule: repeated world props must share materials where possible.
3. For Tenerife/world streaming work, separate:
   - near gameplay colliders
   - mid/far visuals
   - navmesh/path data
   - decorative non-colliding props
4. Track texture memory and model count as part of future build/debug overlays.
5. Use Babylon scene optimization features only after a baseline profile identifies bottlenecks.

## Physics Actions

1. Define collision layers for player, ground, static props, pickups, triggers, enemies, projectiles, and world bounds.
2. Keep imported meshes visual by default. Add explicit primitive or compound colliders.
3. For pickups/letters, prefer triggers or simple bodies; avoid full simulation unless the mechanic requires it.
4. For fast projectiles, document whether swept collision/CCD is required.
5. For pooled objects, reset physics body velocity, angular velocity, transform, enabled state, collision state, and subscriptions.

## Behavior/AI Actions

1. Start with simple finite state machines for narrow gameplay props.
2. Use behavior-tree-like decomposition for NPCs/enemies once patrol/chase/search/attack grows beyond trivial branching.
3. Do not issue path queries every frame. Query when goal changes or on a controlled interval.
4. Keep navmesh source geometry simpler than visual geometry.
5. Add relevance ranges so distant NPCs can tick less often or sleep.

## Suggested Wiki Pages To Add Next

- `wiki/wiki/asset-intake-template.md`
- `wiki/wiki/texture-budget.md`
- `wiki/wiki/physics-object-policy.md`
- `wiki/wiki/collision-layers.md`
- `wiki/wiki/behavior-ai-policy.md`
- `wiki/wiki/world-streaming-performance.md`

## First Implementation Slice

The smallest useful next change is documentation-only:

1. Add `physics-object-policy.md`.
2. Add `texture-budget.md`.
3. Add `asset-intake-template.md`.
4. Link them from `wiki/wiki/index.md`.

That would turn this research into enforceable project memory without changing runtime code yet.
