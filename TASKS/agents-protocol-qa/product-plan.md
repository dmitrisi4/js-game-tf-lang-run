# Product Plan

## User-Visible Outcome

Agents should start future tasks from a compact `AGENTS.md`, then read the required task-relevant reference docs before implementation, review, or validation.

## Acceptance Criteria

- `AGENTS.md` stays below 150 lines.
- The file explicitly requires reading relevant reference docs before work.
- Test scenarios cover gameplay, runtime architecture, scene work, assets, physics, validation, documentation, and task planning.
- Findings identify whether the requirement is strong enough and where instructions may still be ambiguous.
- A session log records the QA work.

## Non-Goals

- No source code behavior changes.
- No runtime asset or gameplay implementation.
- No automated test harness for natural-language agent behavior.

## Priority

Medium. This affects future agent reliability, not current runtime behavior.
