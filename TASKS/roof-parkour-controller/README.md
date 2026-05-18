# Roof Parkour Controller

## Purpose

This module tracks the redesign of roof traversal in `?tenerife=1&terrain=real`.
The current prototype proves that wall detection and roof placement can run, but
it does not yet feel like a real ledge grab or stable roof landing.

## Current Problem

- Wall jump starts inconsistently depending on building pickability.
- Ledge grab is not a hang state; it reads as a backward/upward launch.
- Climb-up lands with the visual character appearing above the roof surface.
- Roofs are not part of the player ground classification, so the controller can
keep treating the player as airborne after reaching a roof.
- The code mixes ordinary movement, wall-jump detection, ledge hold, climb-up,
and physics teleports inside `Player.tsx`.

## Documents

- `research.md` - engine research and local diagnosis.
- `product-plan.md` - user-visible outcome and acceptance criteria.
- `roadmap.md` - phased delivery plan.
- `technical-plan.md` - concrete architecture and implementation plan.
- `tasks.md` - execution checklist.

## References Used

- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/world-building.md`
- Unity CharacterController documentation: https://docs.unity3d.com/ScriptReference/CharacterController.html
- Unity CharacterController.Move documentation: https://docs.unity3d.com/ScriptReference/CharacterController.Move.html
- Unity CollisionFlags documentation: https://docs.unity3d.com/ScriptReference/CollisionFlags.html
- Godot CharacterBody3D documentation: https://docs.godotengine.org/en/latest/classes/class_characterbody3d.html
- Babylon.js Havok `setTargetTransform` discussion: https://forum.babylonjs.com/t/set-rotation-of-physicsbody-havok-programmatically/47002
- Babylon.js prestep discussion: https://forum.babylonjs.com/t/settargettransform-throw-meshes/51990
