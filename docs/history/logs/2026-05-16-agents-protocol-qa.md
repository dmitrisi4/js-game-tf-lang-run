# 2026-05-16 Agents Protocol QA

## Summary

Tested the compact `AGENTS.md` protocol after detailed rules were moved to `docs/reference/`.

## Work Completed

- Read `AGENTS.md`.
- Read all reference docs under `docs/reference/`.
- Read `docs/llm-wiki/index.md`.
- Created `TASKS/agents-protocol-qa/`.
- Wrote a scenario-based QA report covering gameplay, architecture, scene work, assets, physics, validation, documentation, reviews, and small fixes.

## Findings

- `AGENTS.md` is 80 lines and remains under the 150-line target.
- The required reference-use rule is explicit and broad enough for normal implementation, modification, review, and validation tasks.
- The main audit gap was that agents were not required to record which references they used; this was fixed in `AGENTS.md`.
- `docs/llm-wiki/index.md` still named `GEMINI.md` as the mandatory standards file; this was updated to `AGENTS.md`.
- `docs/llm-wiki/log.md` was updated for the wiki index change.

## Validation

- Documentation-only change; runtime tests were not required.
- File and symlink checks were performed during the session.
