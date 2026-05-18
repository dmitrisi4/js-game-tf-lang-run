# Technical Plan

## Current Files

- `src/scenes/player/Player.tsx`
- `src/scenes/player/roofTraversal.ts`
- `src/scenes/player/roofTraversal.test.ts`
- `src/scenes/environment/PuertoCityTerrain.tsx`
- `public/data/tenerife/puerto-roof-landings-runtime.json`
- `scripts/geo/build_puerto_roof_landings.mjs`

## Proposed New Files

- `src/scenes/player/roofParkourController.ts`
- `src/scenes/player/roofParkourController.test.ts`
- `src/scenes/player/roofParkourDebug.ts`
- `src/scenes/player/playerCapsuleMetrics.ts`

## Architecture

### Player Ownership

`Player.tsx` remains the owner of the physics capsule and frame loop, but it
delegates roof traversal decisions to a pure controller module.

Inputs to controller:

- current capsule center;
- current linear velocity;
- grounded state;
- jump edge event;
- camera-facing planar direction;
- scene probe adapter;
- loaded roof landing hints;
- mode flags for Tenerife real terrain.

Outputs from controller:

- movement mode;
- requested velocity for normal/wall-jump frames;
- requested controlled transform for hang/climb frames;
- debug probe data;
- whether normal jump/movement should be consumed.

### Probe Adapter

Create a small adapter around Babylon raycasts so core selection logic can be
unit tested:

- `castWallProbe(origin, direction, length)`;
- `castRoofDownProbe(origin, length)`;
- `testCapsuleClearance(center, radius, halfHeight)`;
- `isRoofGroundMesh(meshName)`;
- `isBuildingWallMesh(meshName)`.

The first implementation can use raycasts only. Capsule clearance can start as a
conservative multi-ray approximation, then move to a shape query if available.

### State Machine

Use explicit state data:

- `idle`
- `wallContact`
- `ledgeProbe`
- `ledgeHang`
- `climbUp`
- `roofSnap`
- `recover`

Each state stores `startedAt`, source position, target position, wall normal,
roof normal, and cancellation reason if it fails.

### Landing Height

Do not rely only on generated `landing.position.y`.

Landing center formula:

```text
capsuleCenterY = roofSurfaceY + capsuleHalfHeight + contactSkin
visualFootY = capsuleCenterY + visualFootOffset
```

Required measurements:

- physics capsule height: currently `1.8`;
- capsule half-height: currently `0.9`;
- capsule radius: currently `0.4`;
- visual foot offset relative to capsule center from `AssetPlayerVisual`;
- desired contact skin, likely `0.02..0.05`.

If the visual model still floats after capsule contact is correct, fix visual
anchor offset rather than lowering the physics body into the roof.

### Grounding

Current player ground ray accepts only `ground1` and `tenerife-seabed`. In real
terrain mode, building roofs need to be valid floor surfaces after climb-up.

Plan:

- Add a helper for player ground mesh classification.
- Include `puerto-osm-city-buildings` only for roof/floor checks when the hit
normal is floor-like or when the ray is downward.
- Do not allow wall-facing checks to treat vertical building surfaces as ground.

### Ledge Hang Position

Hang is not the same as landing. Store separate points:

- `wallHit`: collision point on vertical wall.
- `ledgeTop`: top edge or roof lip point.
- `hangCenter`: capsule center outside wall, below/near roof edge.
- `landingCenter`: capsule center on roof floor.

The hang point should be outside the wall along `wallNormal * (capsuleRadius +
skin)`, not behind the player from camera direction. Wall normal should come
from the picked surface or a local normal approximation, not from camera facing.

### Climb-Up

Use deterministic movement during climb:

- zero linear and angular velocity;
- disable normal movement input;
- interpolate from `hangCenter` to `landingCenter`;
- optionally split into `up` and `forward` segments to avoid clipping the roof
edge;
- perform `roofSnap` at the end.

Avoid repeated `setTargetTransform` mixed with arbitrary velocities. If using
prestep teleport, keep it isolated to controlled traversal frames and restore
normal mode afterward.

## Risks

- Imported building mesh may have incomplete pick normals or merged geometry.
- Mesh raycasts against dense OSM buildings may be expensive if run every frame.
- Visual model foot anchor may not match the invisible capsule.
- Some roofs are too small or too close together for safe landing.
- Static mesh collision on the full building mesh may be too coarse for precise
ledge probing.

## Tests

Unit tests:

- wall/floor mesh classifiers;
- state transition from jump + wall hit to `ledgeProbe`;
- failure when roof probe misses;
- hang center uses wall normal and capsule radius;
- landing center uses actual roof hit height;
- roof-snap lowers only within allowed snap distance;
- building roof can count as ground, building wall cannot.

Browser/manual checks:

- Jump at a valid wall: hang, climb, stand on roof.
- Jump near invalid/too-low/too-high wall: normal jump.
- Walk on roof after climb: grounded movement, no hover animation.
- Try five nearby buildings with different heights.

## Verification Commands

- `bun run test src/scenes/player/roofParkourController.test.ts src/scenes/player/roofTraversal.test.ts src/scenes/environment/PuertoCityTerrain.test.ts`
- `bunx biome check src/scenes/player/Player.tsx src/scenes/player/roofParkourController.ts src/scenes/player/roofParkourController.test.ts src/scenes/player/roofParkourDebug.ts src/scenes/player/playerCapsuleMetrics.ts`
- `bun run build`
- Browser check: `http://127.0.0.1:5173/?tenerife=1&terrain=real`
