# Player Movement Physics Polish — Task Checklist

## Phase 1 — Slope Movement
- [x] Create `playerMovementPhysics.ts` with `projectOntoSurface` helper
- [x] Create `playerMovementPhysics.test.ts` with slope projection tests
- [x] Apply `projectOntoSurface` in `Player.tsx` render loop after groundNormal resolve

## Phase 2 — Grounded Check Hardening
- [x] Add `PLAYER_GROUND_MAX_DISTANCE` constant to `Player.tsx`
- [x] Replace vertical speed gate with distance-based guard
- [x] Verify `isGrounded` stays true on downhill slopes

## Phase 3 — Jump Delay Reduction
- [x] Lower `PLAYER_JUMP_PHYSICS_DELAY_MS` from 310 → 80 ms
- [x] Adjust `PLAYER_JUMP_QUEUE_EXPIRE_MS` from 260 → 180 ms

## Phase 4 — Inertia / Velocity Lerp
- [x] Add `lerpVelocityXZ` helper to `playerMovementPhysics.ts`
- [x] Add `lerpVelocityXZ` unit tests
- [x] Add `PLAYER_MOVE_ACCELERATION` and `PLAYER_STOP_DECELERATION` constants
- [x] Add `smoothedHorizontalVelocityRef` ref in `Player.tsx`
- [x] Replace hard `setLinearVelocity` XZ with lerped velocity
- [x] Validated delta-time clamping (already present: `Math.min(getDeltaTime()/1000, 0.05)`)

## Phase 5 — Air Control
- [x] Add `PLAYER_AIR_CONTROL = 0.35` constant
- [x] Scale movement direction by `PLAYER_AIR_CONTROL` when airborne

## Validation
- [x] `bun run test` — 179/179 passed
- [x] `bun run check` — 0 errors
- [x] `bun run build` — clean build
- [x] Write session log `docs/history/logs/2026-05-30.md`
- [ ] Git commit
