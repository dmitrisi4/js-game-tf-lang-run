# Roadmap

## Phase 0: Planning

Gate: product outcome, technical scope, verification path, and task checklist are recorded.

Deliverables:
- Product plan.
- Roadmap.
- Technical plan.
- Task checklist.

## Phase 1: Shared Ocean Visual Module

Gate: a reusable visual-only ocean component exists and can render arbitrary rectangular ocean bounds.

Deliverables:
- New focused ocean surface module.
- Shader-driven wave, color, horizon, and specular treatment.
- No physics aggregates and no pickable water mesh.

## Phase 2: Tenerife Integration

Gate: both full-island and legacy preview modes use the shared ocean visual while keeping seabed and reset behavior intact.

Deliverables:
- Update full-island ocean component.
- Update preview safety layer water visual.
- Keep full-island invisible seabed and preview seabed behavior unchanged.

## Phase 3: Verification

Gate: focused tests and code validation pass or failures are documented.

Deliverables:
- Unit tests for pure ocean tuning helpers.
- Biome check for touched files.
- Targeted test run.
- Session log.

