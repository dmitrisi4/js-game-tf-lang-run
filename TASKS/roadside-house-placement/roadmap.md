# Roadmap

## Phase 1: Task Setup

Status: Done

- Capture the requested outcome and acceptance criteria.
- Identify the active environment layer that owns Puerto roads and buildings.

Gate: task documents exist and reference docs are recorded.

## Phase 2: Placement Logic

Status: Done

- Improve the deterministic roadside building generator.
- Use road tangent, side offsets, spacing, junction clearance, and overlap checks.
- Add varied placeholder building variants.

Gate: generated buildings are data-driven and deterministic.

## Phase 3: Runtime Integration

Status: Done

- Enable generated roadside placeholders for the legacy Tenerife island preview.
- Render generated placeholders as box volumes for this phase.
- Keep real terrain and full-island footprint modes from duplicating buildings.

Gate: layer plan selects only one building source per terrain mode.

## Phase 4: Verification

Status: Done

- Add and update Vitest coverage.
- Run focused tests and project validation commands.
- Record session log notes.

Gate: validation result is documented with exact failures if any.

## Phase 5: Footprint Grounding Follow-Up

Status: Done

- Replace single-point building Y placement with rotated footprint sampling.
- Prefer a slightly embedded flat foundation on slopes over visible downhill gaps.
- Keep generated placeholder houses scoped to `?tenerife=1&terrain=island-full`.
- Add focused tests for the grounding math.

Gate: footprint-grounding implementation and targeted validation are recorded. Browser screenshot QA remains blocked in this session because the in-app Browser backend is unavailable and Playwright is not installed in the workspace.

## Phase 6: Road Clearance And Scale Follow-Up

Status: Done

- Reduce full-island placeholder visual scale so houses no longer dominate the road corridor.
- Increase road-edge setback to account for widened road shoulder meshes.
- Reject generated candidates that are too close to other road segments.
- Increase full-island foundation sink and footprint sampling radius for sloped terrain.

Gate: real road-data smoke keeps a readable house count with positive widened-road clearance, and targeted/full validation passes.

## Phase 7: Vertical Grounding Retune

Status: Done

- Reduce the full-island generated-house ground sink after screenshot QA showed visibly buried houses.
- Cap footprint support depth relative to the center terrain sample so one low downhill sample cannot pull the whole box too far into the slope.
- Keep the Phase 6 widened-road clearance behavior unchanged.
- Add focused coverage for capped support depth and rerun full validation.

Gate: focused/full validation passes, runtime-data smoke keeps positive widened-road clearance, and the worst transformed generated-house `heightOffset` remains near a shallow foundation sink instead of a deep embed.

## Phase 8: Scale And Slope-Gap Follow-Up

Status: Done

- Raise full-island generated placeholder scale back to a readable town massing size.
- Keep the transformed road-anchor offset and widened-road clearance behavior intact.
- Increase the support-depth cap and shallow sink enough to reduce remaining floating cases without returning to the previous deep embed.
- Add a visual-only foundation under box placeholders so slopes do not read as open air under the body.
- Unify terrain raycast grounding with heightfield grounding so runtime visual alignment follows the same capped footprint rule covered by tests.

Gate: focused/full validation passes, runtime-data smoke keeps positive widened-road clearance, and in-app Browser availability is recorded.
