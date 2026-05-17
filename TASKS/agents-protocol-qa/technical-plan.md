# Technical Plan

## Files

- `AGENTS.md`: protocol under test.
- `docs/reference/*.md`: required detail references.
- `docs/llm-wiki/index.md`: implementation orientation index.
- `TASKS/agents-protocol-qa/qa-report.md`: output report.
- `docs/history/logs/2026-05-16-agents-protocol-qa.md`: session log.

## Method

This is a manual compliance test. Each scenario is phrased like a future user task. The expected agent behavior is derived from `AGENTS.md` and the relevant reference docs.

Each scenario is checked for:
- Whether `AGENTS.md` points to the correct reference docs.
- Whether task planning is required or can be skipped.
- Whether validation expectations are clear.
- Whether session logging expectations are clear.
- Whether any instruction conflicts or ambiguous paths appear.

## Verification

- Check `AGENTS.md` line count remains under 150.
- Check all symlinks still point to `AGENTS.md`.
- Check all referenced docs exist.
- No runtime commands are required because this is documentation QA only.
