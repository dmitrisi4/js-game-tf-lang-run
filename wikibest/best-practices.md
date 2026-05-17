# Game Development Best Practices

Research date: 2026-05-13. Sources are listed in [sources.md](./sources.md).

## Executive Summary

The strongest cross-engine pattern is simple: make runtime data cheap, explicit, and measurable. Textures should be compressed, mipmapped, budgeted, and streamed where needed. Physics should use simple colliders, stable timestep policy, collision layers, sleeping, and explicit rigidbody ownership. Behavior should be budgeted like rendering: avoid per-frame expensive queries, use state/behavior trees for decisions, and keep pathfinding data coarse enough to search quickly.

For `keyArena`, the immediate target is not to copy Unity or Unreal systems. The target is to encode their common principles into Babylon/Havok workflows: GLB validation, Blender normalization, primitive colliders, explicit physics authority, object pooling for repeated entities, navmesh/path-query budgets, and asset performance gates.

## Hard Rules

### Assets And GLB

- Use GLB/glTF as the runtime asset contract, not raw DCC files. Khronos defines glTF/GLB as an efficient transmission/loading format for 3D scenes and models, and `keyArena` already mandates GLB runtime assets. (sources: S12, L01)
- Validate runtime assets before they enter gameplay scenes: geometry, textures, materials, animation, scale, pivots, and extension support. Khronos points to the official glTF Validator, Asset Auditor, Sample Viewer, and texture optimizer as pipeline tools. (sources: S12, S13)
- Keep source `.blend` files outside runtime import folders; export cleaned GLB through Blender after normalization. (sources: S16, L01)
- Do not assume Blender's full material graph survives export. glTF has a specific PBR material model; bake or simplify procedural/complex materials into supported texture maps. (sources: S13, S14, S16)

### Textures

- Every 3D-world texture needs an intentional import/runtime policy: resolution, mipmaps, compression format, color space, normal-map handling, and streaming eligibility. (sources: S01, S02, S03, S08, S09)
- Use mipmaps for world textures viewed at variable distance. Mipmaps reduce sampling work and artifacts when textures render below full resolution, but add about 33% disk/memory overhead and are poor for full-resolution-only UI textures. (source: S02)
- Use GPU-native compressed formats per target platform. On the web/glTF path, prefer KTX 2.0/Basis Universal where engine support is confirmed. (sources: S03, S15, S24)
- Treat texture streaming as a memory-budget system, not a visual toggle. Unreal and Unity both frame mip/texture streaming as a way to keep quality where visible while controlling memory. (sources: S01, S08, S09, S10)
- Power-of-two world textures remain the safest default for mipmapping, compression, and streaming behavior. (sources: S02, S08, S09)

### Materials And Rendering

- Prefer PBR metallic-roughness materials for portable GLB assets. glTF defines PBR using a common metallic-roughness model for consistent cross-platform rendering. (sources: S13, S14)
- Freeze or mark static materials/transforms where the engine supports it. Babylon exposes optimization paths for static materials and world matrix computation. (source: S21)
- Reduce draw calls through instancing, mesh merging, and repeated asset reuse before inventing complex rendering systems. Babylon explicitly lists instances, mesh merging, LOD, octrees, and scene optimizer among optimization features. (sources: S21, S22, S24)
- Use LOD or equivalent distance simplification for repeated world objects. Do not ship a city/world layer where every object uses max visual detail at every distance. (sources: S10, S21, S24)

### Physics

- Gameplay authority must be a physics/control primitive, not a visual mesh. `keyArena` already states the player authority belongs to a physics capsule and that visual meshes must not become gameplay authority. (source: L01)
- Prefer primitive or convex colliders for dynamic gameplay objects. PhysX and Unity both distinguish collider type/cooking choices as a core performance decision; dynamic triangle meshes have stricter limitations and memory costs. (sources: S04, S18)
- Keep static, kinematic, and dynamic bodies conceptually separate. PhysX models static bodies as infinite mass/inertia, dynamic bodies as force/mass/inertia-driven, and dynamic bodies can sleep. (sources: S17, S19)
- Use collision layers/masks to remove impossible interactions before the physics engine tests them. Unity calls out the layer collision matrix as a CPU optimization path. (source: S04)
- Enable sleeping for stationary rigidbodies where behavior allows it. Both Unity guidance and PhysX/Godot rigidbody models use sleeping to avoid simulating bodies at rest. (sources: S04, S17, S19)
- Tune fixed timestep and physics frequency against the target framerate. Physics accuracy has a CPU cost; Unity explicitly treats fixed timestep and simulation frequency as optimization controls. (source: S04)
- Use continuous collision detection or swept tests only where needed: fast, small, important objects. Broad use increases CPU cost; no CCD on slow/large/static props unless profiling proves tunneling. (sources: S04, S17, S18)

### Behavior, AI, And Navigation

- Separate sensing, decision, and actuation. Unreal's behavior-tree flow separates AI Controller, Blackboard, services, decorators, and tasks; the portable principle is modular decision state. (source: S11)
- Use NavMesh-style path data for agents instead of physics collision meshes. Unity's navigation stack separates NavMesh, agents, obstacles, and off-mesh links. (source: S07)
- Keep navigation meshes simple. Godot documents that pathfinding cost correlates with navmesh polygon/edge count, not just world size. (source: S20)
- Avoid per-frame "can I reach this?" checks. Godot notes that reachability checks can be equivalent to expensive path queries; query a path when actually needed and inspect the result. (source: S20)
- Use simple physics collision shapes as source data for navmesh baking where possible, not detailed visual meshes. (source: S20)

### Object Lifecycle

- Pool high-frequency objects such as projectiles, pickups, transient VFX, damage numbers, and short-lived interaction prompts. Unity's object pooling guidance targets repeated create/destroy cost and GC/CPU spikes. (source: S06)
- Pooling is not free: every pooled object needs a reset contract for state, physics body, event listeners, timers, animation, visibility, and ownership. This is a project rule inferred from the pooling pattern; the source establishes the reuse pattern, while `keyArena` should define reset discipline. (sources: S06, L01)

## Heuristics

- Optimize from profiling, but design the data so optimization is possible. Do not prematurely build complex streaming or AI systems, but do enforce asset metadata, collider strategy, and object ownership from day one. (sources: S04, S05, S08, S21)
- Prefer a small set of reusable world assets with instances over many unique meshes and unique materials. This helps draw calls, memory, and asset QA. (sources: S21, S24)
- Treat high-resolution textures as a budget request. A 4K texture needs justification based on screen size, camera distance, material role, and platform memory. (sources: S01, S02, S08, S10)
- Use physics for interaction truth, not for every animation. Doors, pickups, loot, and UI-like world props can often be deterministic transforms with triggers, not fully simulated rigidbodies. (sources: S04, S17, S19)
- Use behavior trees for reusable reactive NPCs; use finite state machines or simple rule tables for narrow deterministic props. Unreal's behavior-tree docs demonstrate patrol/chase NPCs, not every possible object behavior. (source: S11)
- For web builds, degrade gracefully: lower resolution, reduce effects, lower shadow/texture quality, simplify scene detail, and keep target FPS visible in profiling. Babylon's SceneOptimizer exists for runtime quality degradation on weaker devices. (source: S22)

## Topic Checklists

### Texture Checklist

- Is this texture used in 3D world, UI, skybox, lightmap, normal map, or data lookup?
- Does it need mipmaps?
- Is resolution justified by on-screen size?
- Is it power-of-two unless a specific exception exists?
- Is it compressed in a runtime-friendly format?
- Is color space correct: color texture vs data/normal/roughness/metallic?
- Can roughness/metallic/occlusion be packed?
- Does it stream or load upfront?
- Has it been tested in Babylon/glTF viewer, not only Blender?

### GLB Asset Checklist

- Scale normalized to `1 unit = 1 meter`.
- Pivot/origin intentional.
- Mesh names stable and readable.
- Materials use glTF-compatible PBR.
- Textures are linked/exported correctly.
- Collider strategy documented separately from visual mesh.
- Bounding box and spawn placement verified.
- Asset validated with glTF Validator or equivalent.
- License/source recorded.

### Physics Object Checklist

- Body type: static, kinematic, dynamic, trigger.
- Collider shape: primitive, compound primitives, convex, mesh only if justified.
- Mass, inertia, damping, friction, restitution set deliberately.
- Collision layer/mask configured.
- Sleeping behavior acceptable.
- CCD/sweep needed only for fast/small objects.
- Visual mesh cannot silently define gameplay authority.
- Reset behavior defined if pooled.

### Behavior Checklist

- What senses the world?
- What stores decision state?
- What acts on the world?
- What update rate is needed?
- Is pathfinding requested only when target/goal changes?
- Does the agent have a fallback when target is unreachable?
- Is the behavior deterministic enough for tests?
- Is expensive behavior disabled outside relevance range?

## Common Anti-Patterns

- Shipping visual triangle meshes as dynamic colliders because it "looks accurate". This is expensive and unstable compared to primitive/convex gameplay shapes. (sources: S04, S18, L01)
- Using full-resolution textures everywhere and relying on the engine to solve memory. Streaming systems need budgets, mips, and source assets prepared correctly. (sources: S01, S02, S08, S09)
- Baking navigation from high-detail render meshes. Use simple source geometry and keep navmesh polygons/edges low. (source: S20)
- Running reachability/path queries every frame for many agents. Pathfinding cost grows with navmesh complexity and query frequency. (source: S20)
- Treating object pooling as only `setActive(false)`. Pooled objects must reset state and physics; otherwise bugs accumulate across reuse. (source: S06)
- Letting event buses or behavior systems become hidden sources of durable gameplay truth. `keyArena` already forbids this for HP, XP, inventory, and interaction state. (source: L01)
