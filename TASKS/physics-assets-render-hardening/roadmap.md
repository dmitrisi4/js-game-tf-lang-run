# Roadmap

## Phase 0: Planning And Review

Status: Done

Gate:
- Task module exists with product plan, roadmap, technical plan, checklist, and self-review.
- Every review finding maps to at least one implementation or deferred task.

## Phase 1: Full-Island Safety And Reset

Status: Done

Dependencies:
- Existing `TenerifeOcean`, `TenerifeSafetyLayer`, and `tenerifePreviewConfig` reset helpers.

Gate:
- Full-island composition renders ocean visuals and reset safety at the same time.
- Reset teleport uses `setTargetTransform` when a physics body exists.
- Targeted tests pass.

## Phase 2: Heightfield Validity And Spawn Tests

Status: Done

Dependencies:
- Existing full-island heightfield builder and Puerto spawn config.

Gate:
- Heightfield builder preserves source coverage and rejects support over large filled gaps.
- Puerto spawn behavior is covered by focused unit tests.
- Targeted tests pass after implementation.

## Phase 3: Physics Authority And Collision Filters

Status: Done

Dependencies:
- Existing collision layer registry and current player controller.

Gate:
- Shared helper applies layer/mask filters to Havok shapes.
- Newly touched terrain/player/safety physics bodies get explicit filters.
- Full-island controller debt is reduced or recorded behind a technical gate if full migration is unsafe in this pass.
- Targeted physics tests pass.

## Phase 4: Runtime Packaging

Status: Done

Dependencies:
- Vite public copy behavior and current runtime asset locations.

Gate:
- Build script prunes source-only and unused runtime files from `dist`.
- Prune policy has unit tests.
- Build still passes.

## Phase 5: Player Model And Animation Hardening

Status: Done

Dependencies:
- Current Pumpkinboy visual bridge and `public/models/player/player-hero-rigged.glb`.

Gate:
- Runtime hero model path preference is explicit.
- Animation clip selection is centralized in a registry/helper with tests.
- Current visual fallback remains intact.

## Phase 6: Dependency And Documentation Closure

Status: Done

Dependencies:
- Package manager availability and baseline check status.

Gate:
- React type package mismatch is either updated with lockfile changes or explicitly deferred with reason.
- Session log is added.
- Final validation results are recorded.
