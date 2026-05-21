# Physics, Assets, And Render Hardening Epic

Status: In progress

Priority: High. This epic tracks the follow-up work from the full technical review of physics, runtime packaging, model-animation integration, and render stability.

## Problem

The current prototype has strong scene boundaries, input normalization, cached asset loading, and working Tenerife modes. The review also found several production-readiness gaps:

- full-island reset safety is not wired into the active full-island composition
- full-island traversal still relies on scripted terrain-follow movement instead of a physics-authoritative capsule
- full-island heightfield gap filling can create invisible terrain over water or missing mesh cells
- collision layers are documented but not applied to real Havok shapes
- production builds copy source and unused asset files from `public`
- the player visual loads a source hero asset and selects animations through brittle naming heuristics
- reset teleport logic is inconsistent between player and Tenerife safety code
- Puerto spawn tests assert constants instead of behavior
- React runtime and React type package versions are out of sync

## Goal

Make the prototype safer to iterate on by tightening the physics contract, runtime asset packaging, and player model/animation integration without replacing the current Tenerife experience or the existing art direction.

## Documents

- [Product Plan](./product-plan.md)
- [Roadmap](./roadmap.md)
- [Technical Plan](./technical-plan.md)
- [Tasks](./tasks.md)
- [Task Review](./task-review.md)

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
