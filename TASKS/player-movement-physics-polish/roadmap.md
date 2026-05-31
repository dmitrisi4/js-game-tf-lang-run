# Player Movement Physics Polish — Roadmap

## Phase Order and Dependencies

### Phase 1 — Slope Movement (Point 2)
Project horizontal movement vector onto ground normal before applying velocity.
No dependencies. One-line math change in the render loop.
**Gate**: no stutter on slope demo in browser.

### Phase 2 — Grounded Check Hardening (Point 3)
Replace single-ray + rigid speed cap with distance-from-floor check.
Depends on Phase 1 being stable (slope normal already fetched).
**Gate**: player stays `isGrounded` while jogging downhill.

### Phase 3 — Jump Delay Reduction (Point 4)
Lower `PLAYER_JUMP_PHYSICS_DELAY_MS` from 310 ms to 80 ms.
Independent of phases 1–2, but should be tested after grounded check is solid.
**Gate**: jump fires within one render frame of button press, animation still looks intentional.

### Phase 4 — Inertia / Velocity Lerp (Point 1)
Replace hard `setLinearVelocity` with lerp toward target velocity using delta-time.
Depends on Phase 1+2 (slope and ground checks must be correct first).
**Gate**: visible acceleration ramp on walk start/stop, no oscillation.

### Phase 5 — Air Control Coefficient (Point 5)
Multiply `movementDirection` by `AIR_CONTROL` factor when `isAirborne`.
Depends on Phase 3 (jump must fire before testing air behavior).
**Gate**: player cannot fully redirect mid-air, slight correction still possible.

### Phase 6 — Run Jump Landing Recovery
Stabilize grounded re-entry after a moving jump so the visual animation leaves the
one-shot jump/free-fall pose without requiring the player to stop or sprint.
Depends on phases 2, 4, and 5 because the bug appears through grounded distance,
horizontal inertia, and air-control state.
**Gate**: hold run, press jump, keep holding run after landing; walk/run
animation resumes on landing without an input toggle.
