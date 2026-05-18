# Roadmap

## Phase 1 - Instrument And Measure

Goal: prove the actual contact geometry before further tuning.

Tasks:

- Add local debug drawing for wall ray, ledge probe, roof downcast, selected
landing, capsule center, and visual foot baseline.
- Measure player capsule half-height, radius, visual root offset, and foot
contact offset from `AssetPlayerVisual`.
- Record whether roof surfaces are hit by raycasts against
`puerto-osm-city-buildings`.

Gate:

- A screenshot or browser observation can show where the physics capsule center,
visual feet, roof surface, and intended hang point are relative to each other.

## Phase 2 - Extract Roof Traversal Controller

Goal: remove parkour state complexity from `Player.tsx`.

Tasks:

- Create `src/scenes/player/roofParkourController.ts`.
- Move state machine, probes, target selection, and debug payload into the new
module.
- Keep `Player.tsx` responsible only for feeding input, player body, camera
forward, and scene references.

Gate:

- Existing focused tests pass and new controller tests cover state transitions.

## Phase 3 - Runtime Ledge And Roof Probes

Goal: choose climb targets from actual runtime geometry, not only generated roof
data.

Tasks:

- Use a wall ray or shape probe to find wall hit and wall normal.
- Use a high forward probe and a downward roof probe to locate the top edge.
- Verify capsule clearance at hang and landing positions.
- Keep generated roof landing data only as a broad candidate/hint layer.

Gate:

- Invalid buildings fail gracefully into normal jump.
- Valid buildings produce wall hit, ledge, and roof-surface points.

## Phase 4 - Stable Hang And Climb

Goal: make ledge grab read as a held parkour state.

Tasks:

- On ledge grab, stop normal movement authority.
- Hold the capsule at a hang center outside the wall using a deterministic
position update.
- Use a short climb-up curve from hang center to landing center.
- Keep velocity zeroed while in hang/climb states.

Gate:

- Browser check shows a visible pause at the edge before climb-up.
- The player no longer gets thrown backward during ledge grab.

## Phase 5 - Roof Grounding And Floor Snap

Goal: make the final landing physically and visually grounded.

Tasks:

- Add building roof surfaces to player ground classification in real terrain
mode.
- Perform a short downward snap after climb-up against building roof geometry.
- Store separate physics capsule center offset and visual foot offset constants.
- Add tests for landing center calculation from roof surface height.

Gate:

- After climb-up, the player stands on the roof and can walk without airborne
pose/hover.

## Phase 6 - Tuning And UX

Goal: make the mechanic feel deliberate.

Tasks:

- Tune trigger distance, facing cone, hang duration, climb duration, and landing
clearance.
- Add optional camera easing or brief input lock during hang/climb.
- Decide whether roof traversal should require holding jump, tapping jump, or a
future parkour/interact command.

Gate:

- Movement is predictable across at least five nearby Puerto buildings.
