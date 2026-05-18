# Tasks

## 1. Research And Diagnosis

Status: Done

Tasks:

- [x] Review current roof traversal behavior from user screenshots and reports.
- [x] Research common character-controller patterns in Unity, Godot, and
Babylon/Havok.
- [x] Record why the current impulse-first implementation is insufficient.
- [x] Create product, roadmap, and technical plans.

Implementation pipeline:

1. Inspect current `Player.tsx`, `roofTraversal.ts`, generated roof landing
data, and Puerto building collision setup.
2. Compare the local implementation against engine patterns where character
movement owns wall/floor classification instead of relying on free rigidbody
impulses.
3. Record the architectural problem: wall jump, ledge grab, climb, and roof
landing are mixed into normal player movement and lack runtime roof probing.
4. Create this task module with research, product expectations, roadmap,
technical plan, and execution checklist.

Validation:

- Confirm the task module exists under `TASKS/roof-parkour-controller/`.
- Confirm references are recorded in `README.md` and the session log.

Gate:

- Done when the team has a concrete replacement plan and no longer needs to
tune the broken prototype blindly.

## 2. Add Roof Parkour Debug Instrumentation

Status: Implemented, gameplay-visible markers added, needs manual route capture

Why:

- Current screenshots show symptoms but not exact geometry. We need to see the
wall ray, roof probe, capsule center, foot baseline, hang point, and landing
point in the running scene.

Tasks:

- [x] Create `src/scenes/player/roofParkourDebug.ts`.
- [x] Add a local debug flag: `?roofDebug=1`.
- [x] Draw/debug wall ray, wall hit, wall normal, roof downcast, roof hit,
hang center, landing center, capsule center, and visual foot baseline.
- [x] Add debug labels or color conventions that are readable from third-person
camera.
- [ ] Capture observations for at least one failing building.

Implementation pipeline:

1. Add a small debug module that owns temporary Babylon debug meshes/lines and
can dispose them cleanly.
2. Add a helper such as `shouldShowRoofParkourDebug(search)` so debug code is
strictly opt-in.
3. In `Player.tsx`, create/update the debug renderer only when `roofDebug=1`.
4. Feed it a debug payload from current traversal logic: ray origins,
directions, hit points, selected points, and player capsule metrics.
5. Use stable colors:
	- wall ray: red
	- wall normal: orange
	- roof downcast: blue
	- roof hit: cyan
	- hang center: yellow
	- landing center: green
	- capsule center: magenta
	- visual foot baseline: white
6. Ensure all debug meshes are non-pickable and have no physics.
7. Add unit tests only for pure helpers such as URL flag parsing and payload
normalization; visual debug rendering is browser-verified.

Validation:

- `bunx biome check src/scenes/player/roofParkourDebug.ts src/scenes/player/Player.tsx`
- `bun run build`
- Browser check: open `http://127.0.0.1:5173/?tenerife=1&terrain=real&roofDebug=1`
and confirm debug primitives appear only with the flag.

Gate:

- Done when a failing jump can be inspected visually and the developer can tell
whether the wrong point is wall hit, hang, roof hit, landing, capsule center, or
visual foot offset.

Implementation note:

- Debug rendering is active only with `?roofDebug=1`.
- Current implementation draws color-coded lines/spheres, not text labels.
- A gameplay marker renderer now shows a golden ledge strip/halo for the
currently reachable roof edge even without relying on full debug probes as a
developer-only feature.
- Browser smoke check loaded `http://127.0.0.1:5173/?tenerife=1&terrain=real&roofDebug=1`
without console errors.

## 3. Measure Player Capsule And Visual Foot Offsets

Status: Implemented, needs visual tuning capture

Why:

- The player may be physically grounded while the visual asset appears to float,
or the physics capsule may actually be too high. These must be separated.

Tasks:

- [x] Create `src/scenes/player/playerCapsuleMetrics.ts`.
- [x] Centralize capsule height, radius, half-height, and contact skin.
- [x] Measure or derive the visual model foot baseline relative to the invisible
capsule center.
- [x] Replace duplicated hardcoded values in roof landing code with named
metrics where appropriate.
- [x] Add tests for landing-center and visual-foot calculations.

Implementation pipeline:

1. Extract current player capsule constants from `Player.tsx`: height `1.8`,
diameter `0.8`, radius `0.4`, half-height `0.9`.
2. Add `PLAYER_CAPSULE_CONTACT_SKIN`, starting at `0.02` or `0.04`.
3. Add pure helpers:
	- `getCapsuleCenterYForFloor(floorY)`
	- `getFloorYFromCapsuleCenter(centerY)`
	- `getVisualFootYFromCapsuleCenter(centerY)`
4. Inspect `AssetPlayerVisual.tsx` and the imported visual anchor to determine
whether there is an existing model offset relative to the capsule.
5. If the visual root/feet offset cannot be derived statically, expose it as a
named tuning constant and validate with `?roofDebug=1`.
6. Update roof landing generation or runtime landing code to use the metric
helper instead of magic `0.9`/`1.35` values.
7. Add unit tests for all metric helpers.

Validation:

- `bun run test src/scenes/player/playerCapsuleMetrics.test.ts`
- `bunx biome check src/scenes/player/playerCapsuleMetrics.ts src/scenes/player/playerCapsuleMetrics.test.ts`
- `bun run build`
- Browser debug check: capsule center and foot baseline align with the visual
player in idle stance.

Gate:

- Done when we can state whether hover is a physics landing problem or a visual
asset offset problem.

Implementation note:

- Added capsule constants for height `1.8`, diameter `0.8`, radius `0.4`,
half-height `0.9`, and contact skin `0.04`.
- Added helpers for floor-to-capsule-center, capsule-center-to-floor, and visual
foot baseline calculations.
- Visual anchoring now treats Puerto building meshes as ground candidates, so
the imported hero visual can anchor to roofs instead of the terrain below.

## 4. Extract Roof Parkour Controller From Player

Status: Implemented

Why:

- `Player.tsx` currently owns normal movement, jump queue, wall detection,
ledge state, climb-up, and physics teleports. This makes tuning fragile.

Tasks:

- [x] Create `src/scenes/player/roofParkourController.ts`.
- [x] Define explicit parkour states: `idle`, `wallContact`, `ledgeProbe`,
`ledgeHang`, `climbUp`, `roofSnap`, `recover`.
- [x] Move roof traversal constants and state data out of `Player.tsx`.
- [x] Create a scene probe adapter boundary around Babylon raycasts.
- [x] Add unit tests for state transitions and target selection.

Implementation pipeline:

1. Define data types:
	- controller input type
	- controller output type
	- probe adapter type
	- debug payload type
	- state type union
2. Move pure functions from `roofTraversal.ts` into the new controller or have
the controller consume them through a compatibility layer.
3. Keep `Player.tsx` as a thin owner:
	- reads input
	- computes current grounded state
	- calls controller update
	- applies returned velocity or controlled transform
	- sends debug payload to debug renderer
4. Do not change behavior in this phase beyond module extraction.
5. Write tests for:
	- jump + valid wall begins probe/hang flow
	- no wall returns normal jump
	- active hang consumes normal movement
	- completed climb returns to normal movement
6. Keep old `roofTraversal.ts` only if needed for shared helpers; otherwise
replace it with the new module and update imports.

Validation:

- `bun run test src/scenes/player/roofParkourController.test.ts src/scenes/player/roofTraversal.test.ts`
- `bunx biome check src/scenes/player/Player.tsx src/scenes/player/roofParkourController.ts src/scenes/player/roofParkourController.test.ts`
- `bun run build`

Gate:

- Done when `Player.tsx` no longer contains parkour-specific state-machine
logic and behavior is unchanged from the current prototype.

Implementation note:

- `Player.tsx` now delegates parkour updates to `updateRoofParkourController`.
- The old impulse-first state was removed from `Player.tsx`.
- The controller returns `controlledPosition`, `suppressMovement`, `consumeJump`,
next state, and debug payload.
- The implemented state union uses `idle`, `ledgeHang`, `climbUp`, and
`roofSnap`; `wallContact`/`ledgeProbe` are represented in target selection and
debug state rather than as persistent frame states.

## 5. Replace Ledge Selection With Runtime Geometry Probes

Status: Implemented, needs browser tuning

Why:

- Generated roof landing points are useful hints but cannot prove the actual
edge, wall normal, roof surface, or capsule clearance.

Tasks:

- [x] Detect wall hit with a wall normal.
- [x] Probe above/forward/down for a real roof surface.
- [x] Compute separate `wallHit`, `ledgeTop`, `hangCenter`, and `landingCenter`.
- [ ] Reject targets without capsule clearance.
- [x] Keep generated roof landing data as broad hints only.

Implementation pipeline:

1. From player chest/upper-body height, cast a forward wall probe against valid
building meshes.
2. Get or approximate the wall normal:
	- prefer picked face normal if available;
	- fallback to vector from wall hit toward player on the XZ plane.
3. From a point above the wall hit, cast down to locate a roof surface.
4. Validate the roof hit:
	- hit mesh is Puerto building mesh;
	- normal is floor-like enough;
	- vertical difference is climbable;
	- horizontal distance from wall is within allowed ledge depth.
5. Compute:
	- `hangCenter = ledgeTop + wallNormal * (capsuleRadius + skin) + hangYOffset`
	- `landingCenter = roofHit + up * (capsuleHalfHeight + skin)`
6. Run conservative clearance checks:
	- head clearance at hang center;
	- capsule center not inside wall;
	- landing point not outside roof or inside neighboring geometry.
7. Use generated roof landing points only to choose candidate search regions or
maximum allowed roof target distance.
8. If any validation fails, return `normalJump` and do not start a partial
parkour state.

Validation:

- Unit tests for ledge target math using fake probe hits.
- `bun run test src/scenes/player/roofParkourController.test.ts`
- Browser check with `roofDebug=1`: wall hit, roof hit, hang center, and landing
center are visibly distinct and plausible.

Gate:

- Done when jump near a valid building produces a validated hang/landing pair,
and invalid buildings fall back cleanly to normal jumping.

Implementation note:

- Wall hit comes from a forward ray against pickable Puerto building meshes.
- Roof hit comes from a downward ray starting inward from the wall hit.
- Wall normal prefers picked face normal and falls back to player-to-wall vector.
- Generated roof landing data is used only as a broad landing hint near the roof
hit, not as the sole landing height source.
- Hang center placement now uses the player-side direction from `wallHit.point`
instead of trusting the wall mesh normal or roof marker direction. This keeps the
controlled capsule on the same side of the facade as the player and reduces the
case where physics pushes the hero backward away from a valid roof marker.
- Capsule clearance is still conservative/incomplete and remains a follow-up.

## 6. Implement Stable Ledge Hang

Status: Implemented, needs browser feel tuning

Why:

- The user-visible “зацеп” should be a clear held state, not a launch impulse.

Tasks:

- [x] Enter `ledgeHang` only after a valid ledge target is found.
- [x] Stop normal movement and zero velocities while hanging.
- [x] Hold the player at `hangCenter` for a short, visible duration.
- [x] Keep the capsule outside the wall and below/near the roof lip.
- [ ] Add cancellation rules if the target becomes invalid.

Implementation pipeline:

1. Remove or drastically reduce the backward wall-jump impulse from the final
flow.
2. On jump near valid wall, transition directly into `ledgeProbe` and then
`ledgeHang`.
3. During `ledgeHang`:
	- ignore movement input;
	- zero linear/angular velocity;
	- apply controlled transform/prestep consistently;
	- keep capsule at `hangCenter`;
	- maintain facing toward wall or along current camera yaw as desired.
4. Hold for a named duration, e.g. `ROOF_LEDGE_HANG_MS`.
5. Emit debug state and optionally expose state name in debug labels.
6. Ensure normal jump happens if no ledge is valid.

Validation:

- Unit test: active hang consumes movement and jump.
- Unit test: hang duration transitions to climb-up.
- Browser check: player visibly pauses at the ledge instead of being thrown
backward.

Gate:

- Done when the mechanic reads as “grabbed edge” before climb-up.

Implementation note:

- The backward/upward wall-jump impulse is no longer part of the parkour flow.
- Valid parkour now starts directly in a controlled `ledgeHang` state.
- The hang point is anchored from the facade hit point toward the current player
position, so the pause should happen outside the wall instead of inside the
building collider.

## 7. Implement Deterministic Climb-Up

Status: Implemented, needs browser feel tuning

Why:

- Climb-up should move from hang to roof without clipping the wall or launching
the player.

Tasks:

- [x] Add `climbUp` state with deterministic movement curve.
- [x] Split climb into up-and-over segments if needed.
- [x] Keep velocity zeroed while controlled movement is active.
- [x] Restore normal movement only after roof snap succeeds.

Implementation pipeline:

1. Define climb curve as either:
	- single interpolation from `hangCenter` to `landingCenter`; or
	- two segments: `hangCenter -> mantleTop -> landingCenter`.
2. Prefer two segments if debug shows clipping through roof edges.
3. During climb:
	- lock normal movement;
	- zero velocity;
	- move capsule by controlled transform/prestep;
	- keep debug path visible when `roofDebug=1`.
4. On completion, transition to `roofSnap`, not directly to normal locomotion.
5. If controlled transform fights physics, isolate the body by using prestep
teleport for this state and restoring disabled prestep afterward.

Validation:

- Unit test: climb interpolation reaches exact landing target.
- Unit test: movement remains consumed during climb.
- Browser check: player does not pop backward or clip into building during
climb-up.

Gate:

- Done when climb-up visually moves from edge to roof in a deterministic path.

Implementation note:

- Climb-up uses a two-part curve: up to a mantle point, then over to landing.
- Controlled phases zero angular/linear velocity through the player body sync.

## 8. Add Roof Snap And Ground Classification

Status: Implemented, needs manual roof-walk verification

Why:

- The final state must stand on the actual roof surface and switch back to
grounded locomotion.

Tasks:

- [x] Add building roof support to player ground classification.
- [x] Add post-climb downward roof snap.
- [x] Distinguish roof floor hits from vertical wall hits.
- [x] Tune capsule center and visual foot offsets.
- [ ] Verify player can walk on roof after climb without airborne state.

Implementation pipeline:

1. Extract player ground mesh classification into a helper.
2. In Tenerife real terrain mode, allow `puerto-osm-city-buildings` as ground
only for downward floor checks.
3. Require floor-like hit normal or a downward ray hit from below a maximum snap
distance.
4. After climb-up, cast down from above `landingCenter`.
5. If roof hit is valid:
	- compute final center with `getCapsuleCenterYForFloor(roofY)`;
	- move player there;
	- zero velocity;
	- mark traversal complete;
	- let normal grounded logic recognize the roof next frame.
6. If roof snap fails:
	- either retry for a short timeout; or
	- safely return to normal airborne state without clipping.
7. Adjust visual foot offset only after physics landing is confirmed correct.

Validation:

- Unit tests for ground classification and roof snap math.
- Browser check: after climb, player feet sit on roof and movement resumes.
- Browser check: walking on roof does not force airborne pose.

Gate:

- Done when the user-visible hover shown in the screenshot is gone.

Implementation note:

- Ground classification now accepts Puerto building meshes only when the picked
normal is floor-like.
- Roof snap casts down after climb-up and recomputes capsule center from the
actual roof hit height.
- Visual anchoring also includes Puerto building meshes so the imported visual
does not search for terrain beneath the roof.

## 9. Add Runtime Tuning Parameters

Status: Implemented with temporary arcade tuning, needs value tuning

Why:

- After the architecture is correct, distances and timings need controlled
tuning without scattering magic numbers through the player loop.

Tasks:

- [x] Centralize trigger distance, facing cone, probe heights, hang duration,
climb duration, snap distance, and clearance skin.
- [x] Add comments explaining what each tuning value controls.
- [x] Add tests for boundary conditions where practical.
- [ ] Record tuned values in this task module after browser verification.

Implementation pipeline:

1. Create a named config object in `roofParkourController.ts` or
`roofParkourConfig.ts`.
2. Include defaults:
	- wall trigger distance;
	- chest ray height;
	- ledge top probe height;
	- roof downcast length;
	- max climb height;
	- max roof inward distance;
	- facing dot threshold;
	- hang duration;
	- climb duration;
	- roof snap distance;
	- capsule clearance skin.
3. Replace hardcoded literals in controller code with config values.
4. Add tests for facing threshold, max climb height, max wall distance, and snap
distance.
5. Tune values only after `roofDebug=1` confirms correct geometry.

Validation:

- `bun run test src/scenes/player/roofParkourController.test.ts`
- `bunx biome check` on touched player files.
- Browser check on at least five Puerto buildings.

Gate:

- Done when changing a traversal parameter requires editing one config location.

Implementation note:

- Added `ROOF_PARKOUR_CONFIG` in `roofParkourController.ts`.
- Current values need gameplay tuning after manual route testing.
- Temporary arcade traversal mode is active:
	- `maxClimbHeight` increased to `80`
	- `maxRoofDropFromProbe` increased to `90`
	- `wallRayLength` increased to `2.25`
	- `landingHintSearchRadius` added at `18`
	- climb duration increased to `760ms`
- If direct roof downcast misses, the controller can now use the nearest
generated roof landing hint near the wall hit. This is intentionally permissive
so the player can reach most roofs during exploration.

## 10. Runtime Verification And Acceptance Pass

Status: Partially complete

Why:

- The mechanic must be verified across real Puerto geometry, not only a single
happy path.

Tasks:

- [x] Run focused tests.
- [x] Run targeted Biome.
- [x] Run build.
- [ ] Browser-check five Puerto buildings in `?tenerife=1&terrain=real`.
- [x] Browser-check the same buildings with `?roofDebug=1`.
- [ ] Record remaining tuning values and risks.

Implementation pipeline:

1. Run focused tests:
	- `roofParkourController.test.ts`
	- `playerCapsuleMetrics.test.ts`
	- `roofTraversal.test.ts` if still present
	- `PuertoCityTerrain.test.ts`
2. Run targeted Biome against all changed source/test files.
3. Run `bun run build`.
4. In browser, test five buildings:
	- low roof;
	- medium roof;
	- adjacent roofs;
	- narrow roof;
	- invalid/too-high roof.
5. For each building, record:
	- did wall detection trigger?
	- did hang point appear outside wall?
	- did climb path avoid clipping?
	- did final roof snap land feet on surface?
	- did grounded movement resume?
6. Update this task file with observed pass/fail notes.

Validation:

- All targeted tests pass.
- Build passes.
- Manual browser pass meets product acceptance criteria.

Gate:

- Done when the mechanic is stable enough to remove or hide debug visuals and
continue with animation/UX polish.

Verification note:

- `bun run test src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/player/roofParkourController.test.ts src/scenes/player/roofTraversal.test.ts src/scenes/environment/PuertoCityTerrain.test.ts` passed.
- `bun run test src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/player/roofParkourController.test.ts src/scenes/player/roofParkourMarkers.test.ts src/scenes/player/roofTraversal.test.ts src/scenes/environment/PuertoCityTerrain.test.ts` passed after marker implementation.
- `bun run test src/scenes/player/roofParkourController.test.ts src/scenes/player/roofParkourMarkers.test.ts src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/player/roofTraversal.test.ts src/scenes/environment/PuertoCityTerrain.test.ts` passed after temporary arcade traversal tuning.
- `bun run test src/scenes/player/roofParkourController.test.ts src/scenes/player/roofParkourMarkers.test.ts src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/player/roofTraversal.test.ts src/scenes/environment/PuertoCityTerrain.test.ts` passed after player-side hang placement.
- `bunx biome check src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/playerCapsuleMetrics.ts src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/player/roofParkourController.ts src/scenes/player/roofParkourController.test.ts src/scenes/player/roofParkourDebug.ts` passed.
- `bunx biome check src/scenes/player/Player.tsx src/scenes/player/roofParkourMarkers.ts src/scenes/player/roofParkourMarkers.test.ts src/scenes/player/roofParkourController.ts src/scenes/player/roofParkourDebug.ts` passed after marker implementation.
- `bunx biome check src/scenes/player/roofParkourController.ts src/scenes/player/roofParkourController.test.ts` passed after temporary arcade traversal tuning.
- `bunx biome check src/scenes/player/roofParkourController.ts src/scenes/player/roofParkourController.test.ts` passed after player-side hang placement.
- `bun run build` passed.
- Browser smoke check loaded `?tenerife=1&terrain=real&roofDebug=1` and showed no console errors after pressing `Space`.
- Browser smoke check reloaded `?tenerife=1&terrain=real&roofDebug=1` after marker implementation and showed no console errors.
