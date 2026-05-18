# Roof Parkour Controller Analysis

## Summary

- Paused further code tuning after user feedback showed the prototype still
looked like a launch/hover rather than a ledge grab and grounded landing.
- Created `TASKS/roof-parkour-controller/` as a dedicated planning module.
- Researched character-controller patterns from Unity, Godot, and Babylon/Havok
sources.
- Wrote a redesign plan centered on explicit wall/floor classification, runtime
ledge/roof probes, a deterministic hang/climb state machine, and roof floor
snap.
- Expanded `TASKS/roof-parkour-controller/tasks.md` into ten implementation
tasks, each with rationale, pipeline, validation, and phase gate.
- Implemented the first controller pass with debug rendering, capsule metrics,
runtime wall/roof probes, deterministic ledge hang, climb-up, roof snap, and
roof-aware grounding.
- Added gameplay-visible roof ledge markers so reachable roof edges can be
highlighted when the same runtime parkour probe finds a valid hang/landing pair.
- Temporarily switched traversal tuning to a permissive arcade mode so most
Puerto roofs can be reached during exploration, using generated roof landing
hints as fallback when direct roof downcast misses.
- Adjusted ledge hang placement after marker testing showed the roof target could
be valid while the capsule was still being pushed backward by building collision.
The hang point is now offset from `wallHit.point` toward the current player side
instead of relying on the wall normal or landing marker direction.

## References Used

- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/world-building.md`
- https://docs.unity3d.com/ScriptReference/CharacterController.html
- https://docs.unity3d.com/ScriptReference/CharacterController.Move.html
- https://docs.unity3d.com/ScriptReference/CollisionFlags.html
- https://docs.godotengine.org/en/latest/classes/class_characterbody3d.html
- https://forum.babylonjs.com/t/set-rotation-of-physicsbody-havok-programmatically/47002
- https://forum.babylonjs.com/t/settargettransform-throw-meshes/51990

## Validation

- Documentation-only task module created.
- Detailed implementation task pipeline added.
- Runtime implementation added after planning:
	- `src/scenes/player/playerCapsuleMetrics.ts`
	- `src/scenes/player/roofParkourController.ts`
	- `src/scenes/player/roofParkourDebug.ts`
	- `src/scenes/player/roofParkourMarkers.ts`
	- `Player.tsx` integration
	- `AssetPlayerVisual.tsx` roof anchoring update
- `bun run test src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/player/roofParkourController.test.ts src/scenes/player/roofTraversal.test.ts src/scenes/environment/PuertoCityTerrain.test.ts` passed.
- Targeted `bunx biome check` passed for changed player files.
- `bun run build` passed.
- Browser smoke check opened `http://127.0.0.1:5173/?tenerife=1&terrain=real&roofDebug=1` and reported no console errors after pressing `Space`.
- After marker implementation, focused marker tests, targeted Biome, `bun run
build`, and a fresh browser smoke check with `roofDebug=1` passed.
- After arcade tuning, focused roof parkour tests, targeted Biome, and
`bun run build` passed.
- After player-side hang placement, focused roof parkour tests, targeted Biome,
and `bun run build` passed.
