# Sources

Research date: 2026-05-13.

## Local Project Sources

- **L01 - keyArena standards**: `../GEMINI.md`  
  Project-specific rules: Babylon runtime, Havok physics, GLB assets, Blender normalization, state ownership, validation.

## Official / Primary External Sources

- **S01 - Unity: Texture optimization**  
  https://docs.unity.cn/6000.0/Documentation/Manual/TextureLoading.html  
  Covers async texture loading, mipmap streaming, sparse textures, streaming virtual texturing, GPU memory reduction.

- **S02 - Unity: Mipmaps**  
  https://docs.unity3d.com/6000.0/Documentation/Manual/texture-mipmaps-introduction.html  
  Defines mipmaps, when they speed rendering/reduce artifacts, and when they add memory without benefit.

- **S03 - Unity: Texture formats in memory**  
  https://docs.unity3d.com/6000.0/Documentation/Manual/texture-compression-formats.html  
  Platform-specific GPU texture format selection and runtime texture memory considerations.

- **S04 - Unity: Optimize physics system for CPU usage**  
  https://docs.unity3d.com/6000.0/Documentation/Manual/physics-optimization-cpu.html  
  Covers timestep, collider types, rigidbody behavior, transform sync, collision matrix, broad phase, mesh collider cooking, sleeping.

- **S05 - Unity: Enhanced physics performance for smooth gameplay**  
  https://unity.com/how-to/enhanced-physics-performance-smooth-gameplay  
  Best-practice article for profiling and debugging physics with Unity Profiler, Memory Profiler, Physics Debugger.

- **S06 - Unity Learn: Object pooling**  
  https://learn.unity.com/tutorial/introduction-to-object-pooling  
  Explains pre-instantiating/reusing objects to reduce repeated create/destroy CPU and GC cost.

- **S07 - Unity AI Navigation: Navigation Overview**  
  https://docs.unity.cn/Packages/com.unity.ai.navigation%402.0/manual/NavigationOverview.html  
  NavMesh, NavMesh Agents, Obstacles, Off-Mesh Links, advanced navigation setup.

- **S08 - Unreal Engine: Texture Streaming Overview**  
  https://dev.epicgames.com/documentation/en-us/unreal-engine/texture-streaming-overview-for-unreal-engine  
  Texture streamer, mip selection, memory budget, visible mip priority.

- **S09 - Unreal Engine: Texture Streaming Configuration**  
  https://dev.epicgames.com/documentation/en-us/unreal-engine/texture-streaming-configuration-in-unreal-engine  
  Streaming pool, update cadence, mip bias, per-texture bias, visible mip priority, memory controls.

- **S10 - Unreal Engine: Scalability Reference**  
  https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-reference-for-unreal-engine  
  Texture quality, anisotropy, texture memory, streaming pool tradeoffs.

- **S11 - Unreal Engine: Behavior Tree Quick Start**  
  https://dev.epicgames.com/documentation/en-us/unreal-engine/behavior-tree-in-unreal-engine---quick-start-guide  
  AI Controller, Blackboard, Behavior Tree services, decorators, tasks, patrol/chase loop.

- **S12 - Khronos: glTF runtime 3D asset delivery**  
  https://www.khronos.org/gltf/  
  glTF/GLB as efficient runtime asset delivery; official resources include validator, sample viewer, texture compressor, asset auditor.

- **S13 - Khronos: glTF 2.0 Specification**  
  https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html  
  Textures/images/samplers, PBR metallic-roughness material model, consistent rendering across platforms.

- **S14 - Khronos: PBR in glTF**  
  https://www.khronos.org/gltf/pbr  
  Base color, metallic, roughness, normal, AO, emissive, clearcoat and other PBR material properties.

- **S15 - Khronos: KTX GPU Texture Container Format**  
  https://www.khronos.org/ktx  
  KTX 2.0 and `KHR_texture_basisu` for compact glTF textures and GPU-native compressed runtime formats.

- **S16 - Blender Manual: glTF 2.0 importer/exporter**  
  https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html  
  Blender glTF support for meshes, materials, textures, cameras, lights, animation, extensions, GLB export.

- **S17 - NVIDIA PhysX: Rigid Body Overview**  
  https://nvidia-omniverse.github.io/PhysX/physx/5.6.0/docs/RigidBodyOverview.html  
  Rigid actor model: static, dynamic, kinematic targets, sleeping, shapes, transforms, mass, inertia, velocity, damping, forces.

- **S18 - NVIDIA PhysX: Rigid Body Collision**  
  https://nvidia-omniverse.github.io/PhysX/physx/5.1.0/docs/RigidBodyCollision.html  
  Shapes for intersection, scene queries, triggers; shape sharing; dynamic triangle mesh limitations and SDF notes.

- **S19 - Godot: Physics introduction**  
  https://docs.godotengine.org/en/stable/tutorials/physics/physics_introduction.html  
  Collision detection/response, body categories, rigid body force-driven behavior, sleeping, friction, bounce.

- **S20 - Godot: Optimizing Navigation Performance**  
  https://docs.godotengine.org/en/4.4/tutorials/navigation/navigation_optimizing_performance.html  
  Use simple physics shapes for navmesh baking, reduce navmesh polygons/edges, avoid repeated reachability checks.

- **S21 - Babylon.js: Optimizing your scene**  
  https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene/  
  Babylon-specific scene optimization: freeze materials/world matrices when static, reduce draw calls, use instances.

- **S22 - Babylon.js: SceneOptimizer**  
  https://doc.babylonjs.com/features/featuresDeepDive/scene/sceneOptimizer  
  Runtime quality degradation to reach target framerate on weaker devices.

- **S23 - Babylon.js: Physics**  
  https://doc.babylonjs.com/features/featuresDeepDive/physics/  
  Babylon physics integration patterns, including Havok plugin/physics bodies/aggregates.

- **S24 - Babylon.js: Specifications**  
  https://www.babylonjs.com/specifications/  
  Engine feature surface: PBR, texture types, compressed textures, glTF export/import, physics, LOD, octrees, instancing, scene optimizer.
