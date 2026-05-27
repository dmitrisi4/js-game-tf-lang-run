# Official-Source Guide: How Pros Handle Scene Overlaps

## Sources
- Babylon.js collision events and filtering: https://doc.babylonjs.com/features/featuresDeepDive/physics/collisionEvents
- Babylon.js advanced collisions: https://doc.babylonjs.com/communityExtensions/editor/collisions/advancedCollisions
- Babylon.js game collisions and triggers: https://doc.babylonjs.com/guidedLearning/createAGame/collisionsTriggers/
- Unity colliders manual: https://docs.unity3d.com/Manual/CollidersOverview.html
- Unity mesh import collider guidance: https://docs.unity3d.com/Manual/class-Mesh.html
- Unity occlusion culling manual: https://docs.unity3d.com/Manual/OcclusionCulling.html
- Unreal Engine simple versus complex collision: https://dev.epicgames.com/documentation/unreal-engine/simple-versus-complex-collision-in-unreal-engine

## Professional Pattern
1. Separate visual geometry from gameplay collision.
	- Babylon's collision/trigger docs require explicit collision setup; imported meshes do not automatically express gameplay intent.
	- Unity and Unreal both distinguish simple primitive colliders from complex mesh collision. The common production rule is: use simple or compound simple shapes for gameplay; reserve complex mesh collision for static queries when needed.

2. Treat placement as authored data with validation, not manual one-off tuning.
	- Each placed object needs an anchor, footprint, height source, yaw, visual scale, and collision footprint.
	- A placement is not "done" when it looks acceptable from one camera. It is done when its footprint does not violate clearance rules, it lands on the intended surface, and it keeps traversal/readability goals.

3. Resolve overlaps before runtime.
	- Static scenery should have deterministic overlap checks in tests or generation scripts.
	- Generated city content should be filtered by footprint intersection, road clearance, coastline/water exclusion, and minimum spacing before it reaches React/Babylon rendering.

4. Keep render layers explicit.
	- Sky, clouds, ocean, terrain, roads, buildings, props, VFX, and UI-like debug visuals need an intentional draw order and depth policy.
	- Transparent materials are especially risky: they should have documented depth write/blend choices and should not accidentally render in front of world geometry.

5. Keep collisions inspectable.
	- Collision proxies should be visible through a debug flag.
	- Collision membership and collide masks should be explicit where object categories are stable.
	- Triggers should be separate from blocking collision.

6. Validate by mode.
	- Default arena, Tenerife city preview, Puerto real terrain, and full-island overlay are different scene contracts.
	- Each mode needs a smoke path that checks visual overlaps, physics blockers, grounding, and route readability.

## Project-Specific Rules To Apply
- `WorldScenery.tsx` should remain a renderer over validated data, not the place where overlap decisions are made.
- `worldData.ts` can hold authored data, but pure validation helpers should live beside it so tests can enforce clearances.
- `WorldBuildings.tsx` should render visuals and primitive colliders from the same normalized placement contract.
- Tenerife generated buildings need footprint validation before rendering; the current manual `heightOffset` is not enough.
- Road surfaces should be treated as visual overlays and raised only by a small documented lift; buildings should not sit inside road ribbons.
- Clouds and other transparent layers need fixed material policy: inside-facing geometry, alpha mode, depth write, and rendering group should be intentional.
