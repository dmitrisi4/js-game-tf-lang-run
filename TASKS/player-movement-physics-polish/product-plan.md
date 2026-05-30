# Player Movement Physics Polish — Product Plan

## User-Visible Outcome

Movement feels grounded, responsive, and physical:
- Player smoothly accelerates and decelerates instead of instant start/stop.
- Slopes are traversed naturally without stutter or phantom air-time.
- Grounded detection stays stable during downhill running.
- Jump responds almost instantly (no 310 ms lag).
- Airborne direction control is reduced to a natural correction, not full re-direction.

## Acceptance Criteria

- [ ] Walk and sprint have acceleration and deceleration ramp (no instant velocity flip).
- [ ] Player does not stutter or lose grounded state when running on slopes.
- [ ] `isGrounded` stays true when descending ramps at speed.
- [ ] Jump fires within ≤80 ms of button press; crouch-anticipation animation is trimmed to match.
- [ ] In-air direction influence is visibly limited (airControl factor applied).
- [ ] All existing unit tests pass (`bun run test`).
- [ ] Build passes (`bun run build`).

## Non-Goals

- Architectural split of Full Island vs Physics mode (deferred).
- NPC or external force reactions (requires force-based velocity in a later pass).
- Multiplayer sync.

## Priority

High — gameplay feel directly visible to all players.
