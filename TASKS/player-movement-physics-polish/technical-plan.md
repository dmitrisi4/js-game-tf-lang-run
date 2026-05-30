# Player Movement Physics Polish — Technical Plan

## Files Affected

### [MODIFY] Player.tsx
`src/scenes/player/Player.tsx`

**Phase 1 — Slope projection**
- After `groundNormal` is resolved (L464), project `movementDirection` onto the ground plane using: `dir - normal * dot(dir, normal)`, then normalize.
- New helper: `projectOntoSurface(direction, normal)` — pure function, no scene access.

**Phase 2 — Grounded check hardening**
- Replace `Math.abs(currentVerticalVelocity) <= PLAYER_GROUND_MAX_VERTICAL_SPEED` with a distance-based guard using `groundHit.distance`.
- New constant: `PLAYER_GROUND_MAX_DISTANCE = 1.35` (slightly above raycast origin offset + contact skin).
- Keep the `isFloorLikeNormal` check.
- Remove the vertical speed gate OR raise it significantly (e.g., 4.0) so descending slopes don't falsely trigger airborne.

**Phase 3 — Jump delay**
- `PLAYER_JUMP_PHYSICS_DELAY_MS`: 310 → 80 ms.
- `PLAYER_JUMP_QUEUE_EXPIRE_MS`: 260 → 180 ms (proportional).

**Phase 4 — Inertia lerp**
- Add `currentHorizontalVelocityRef: useRef<Vector3>` to track the last applied XZ velocity (avoids reading physics body which may lag).
- Compute `lerpFactor = 1 - Math.exp(-PLAYER_MOVE_ACCELERATION * deltaSeconds)`.
- New constants: `PLAYER_MOVE_ACCELERATION = 18` (ground), `PLAYER_STOP_DECELERATION = 24`.
- If no input → lerp toward zero with deceleration factor.
- Apply lerped value to `setLinearVelocity` XZ; Y stays unchanged.

**Phase 5 — Air control**
- New constant: `PLAYER_AIR_CONTROL = 0.35`.
- When `isGrounded` is false (and not `shouldTriggerJump`), scale `movementDirection` by `PLAYER_AIR_CONTROL` before feeding into the lerp.

### [NEW] playerMovementPhysics.ts
`src/scenes/player/playerMovementPhysics.ts`

Pure helper functions extracted from the render loop:
- `projectOntoSurface(direction: Vector3, normal: Vector3): Vector3`
- `lerpVelocityXZ(current: Vector3, target: Vector3, acceleration: number, deltaSeconds: number): Vector3`
- These are pure and easily unit-testable.

### [NEW] playerMovementPhysics.test.ts
`src/scenes/player/playerMovementPhysics.test.ts`

Unit tests for:
- `projectOntoSurface` with flat (no-op), 45° slope, steep normal.
- `lerpVelocityXZ` convergence, zero input deceleration.

## Data Flow

```
inputCommands
    → resolveCameraRelativeMovement (PlayerController.ts)      [unchanged]
        → rawMovementDirection (flat, normalized)
            → projectOntoSurface(rawMovementDirection, groundNormal)  [Phase 1]
                → slopeAdjustedDirection
                    → scale by AIR_CONTROL if airborne             [Phase 5]
                        → lerpVelocityXZ toward target speed       [Phase 4]
                            → setLinearVelocity (Y unchanged)
```

## Risks

- **Slope projection on flat ground**: when `groundNormal` is `Vector3.Up`, projection is a no-op — safe.
- **Inertia during water**: water mode uses full-island kinematic path, not the physics body path. No conflict.
- **Jump + inertia**: at jump frame, XZ inertia lerp still applies. This is desirable — player keeps momentum through jump.
- **Parkour suppression**: `parkourResult.suppressMovement` early-returns before velocity is set — no conflict.

## Verification Commands

```bash
bun run test
bun run build
bun run check
```

Manual browser: run down a ramp, jump while running, sprint-stop, try mid-air turn.
