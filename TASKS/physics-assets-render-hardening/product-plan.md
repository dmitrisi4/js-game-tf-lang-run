# Product Plan

## User-Visible Outcome

Players should be able to load the current arena, Puerto city patch, and full-island Tenerife mode with fewer physics edge cases and a smaller production package. The player should recover reliably from water/out-of-bounds states, stay grounded only on real terrain, and keep model/animation presentation decoupled from physics authority.

## Acceptance Criteria

- Full-island mode keeps the visible ocean and also runs the same reset safety loop used by other Tenerife modes.
- Water, out-of-bounds, and low-Y recovery teleports both the render mesh and Havok body consistently.
- Full-island height sampling does not return a valid floor over large empty cells created by ocean, removed source planes, or missing terrain.
- Puerto full-island spawn has behavior tests for primary marker hit, offset fallback, highest-terrain fallback, and no-scene fallback.
- Collision layer/mask helpers are applied to newly touched physics bodies and can be validated with unit tests.
- Production build output excludes known source-only model files and unused high-cost texture/source formats.
- Player visual asset usage is documented and prepared for a runtime-ready hero model path, without breaking the current fallback.
- Animation selection has a small registry layer so model-specific clip naming does not leak through every state transition.
- Validation runs between implementation phases and records baseline failures separately from new regressions.

## Non-Goals

- Do not replace the player controller with a full new character-controller system in this epic unless a narrow, tested migration path is found.
- Do not move or delete source art from the repository during this pass; packaging can prune generated `dist` output first.
- Do not fully align Puerto overlay onto the full island; that remains in `TASKS/full-tenerife-island-integration`.
- Do not introduce NPC/enemy/projectile systems just to exercise collision layers.
- Do not perform a visual redesign of the HUD or scene.

## Priority

1. Safety and reset correctness.
2. Terrain support correctness.
3. Collision filtering foundations.
4. Production packaging hygiene.
5. Player visual/animation hardening.
6. Dependency type alignment.
