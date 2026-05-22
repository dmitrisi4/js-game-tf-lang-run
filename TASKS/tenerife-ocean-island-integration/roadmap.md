# Roadmap

## Phase 0: Research And Planning

Gate: trusted sources, current-code findings, risks, and pipeline are documented.

Deliverables:
- Product plan.
- Source analysis.
- Technical plan.
- Task checklist.

## Phase 1: Runtime Truth And Mesh Audit

Gate: screenshots are proven to come from the same code instance that was edited.

Deliverables:
- Dev-only ocean debug marker.
- Port verification note.
- Full-island imported mesh/material audit.
- Debug flags to hide/show imported water and custom ocean.

## Phase 2: Measured Waterline

Gate: ocean Y comes from terrain/coast measurements.

Deliverables:
- Terrain sampling utility.
- Puerto/coast height report.
- Tests for sampling math.
- Config names separating visual waterline from reset thresholds.

## Phase 3: Shoreline Data

Gate: shoreline mask/ribbon aligns with island geometry.

Deliverables:
- Low-resolution shoreline mask or foam ribbon.
- Debug visualization.
- Data provenance and regeneration command.

## Phase 4: Ocean Rendering

Gate: base ocean and shoreline foam render together without submerging dry terrain.

Deliverables:
- Full-island ocean component.
- Base water material.
- Foam/shallow/deep layers.
- Optional `WaterMaterial` experiment flag.

## Phase 5: Performance And QA

Gate: visual result is accepted against screenshots and runtime budget.

Deliverables:
- Browser screenshots.
- Frame timing notes.
- Final validation.
- Session log.

