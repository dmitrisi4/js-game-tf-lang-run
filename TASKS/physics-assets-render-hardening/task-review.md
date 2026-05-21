# Task Module Review

Status: Done

## Review Checklist

- [x] Every finding from the technical review maps to a task.
- [x] Every implementation phase has a verification command.
- [x] Safety-critical work happens before packaging or animation polish.
- [x] Non-goals prevent risky broad rewrites.
- [x] Existing user changes are preserved.

## Findings

- Added a packaging size follow-up because the original review called out the large `dist` and Vite chunk warning, not only source-file copying.
- Added a browser smoke/defer task because render correctness cannot be fully proven by unit tests and build output.
- Kept full physics-capsule migration behind an implementation gate. The current full-island controller is risky to replace wholesale in the same pass as safety and heightfield fixes, so this epic must either reduce the debt safely or leave a precise blocker.

## Coverage Map

- Full-island safety wiring: Phase 1.
- Reset teleport consistency: Phase 1.
- Heightfield invisible support: Phase 2.
- Puerto spawn behavior tests: Phase 2.
- Collision layer application: Phase 3.
- Full-island movement authority debt: Phase 3.
- Production asset packaging: Phase 4.
- Player source asset and animation brittleness: Phase 5.
- React type mismatch: Phase 6.
- Render/build size verification: Phase 4 and Phase 6.
