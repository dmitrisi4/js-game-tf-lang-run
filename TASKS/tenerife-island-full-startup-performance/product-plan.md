# Product Plan

## User-Visible Outcome

The full Tenerife island preview should become playable quickly instead of sitting on the loading overlay for minutes.

## Acceptance Criteria

- Default `?tenerife=1&terrain=island-full` keeps Puerto roads and roadside houses visible.
- Full-island road and house overlay work is delayed until after the island terrain is ready.
- Full-island roads sit on the visible terrain mesh instead of floating above slopes.
- The full-island terrain, ocean, player, and baseline gameplay still render.
- Cheaper heightfield road grounding remains available through an explicit query param for performance QA.
- Validation documents the measured bottleneck and the verification command results.

## Non-Goals

- Do not redesign the full island terrain asset.
- Do not introduce chunked streaming in this pass.
- Do not change player movement authority or physics ownership.
- Do not remove existing Puerto overlay debug modes.

## Priority

High. The current startup behavior blocks normal local iteration.
