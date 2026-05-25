# Roadmap

## Phase 1: Research And Plan

- Confirm current water rendering and full-island player movement ownership.
- Check official Babylon capabilities for water material, particles, physics, and fluid rendering.
- Decide first production slice.

Gate: task documents list accepted approach and non-goals.

## Phase 2: Water State Model

- Add pure helpers for water depth, swimming transition, speed multiplier, and swim center height.
- Add focused unit tests.

Gate: helper tests pass.

## Phase 3: Rendering Upgrade

- Replace custom flat shader surface with Babylon `WaterMaterial`.
- Use procedural bump texture and tuned parameters for island scale.
- Keep visual-only ocean mesh pick/collision disabled.

Gate: build/typecheck accepts the material integration.

## Phase 4: Player Integration

- Apply water state in full-island kinematic traversal.
- Slow movement and hold capsule near the waterline when submerged.
- Prevent visual feet from anchoring to underwater terrain.
- Emit entry splash VFX on dry-to-water transitions.

Gate: focused tests and build pass.

## Phase 5: Review And Follow-Up

- Log implementation.
- Leave future tasks for swimming animation, underwater camera treatment, and shoreline foam refinement.
