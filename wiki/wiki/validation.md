# Validation

## Commands

Use Bun scripts from `package.json`. (source: ../../GEMINI.md; ../../package.json)

- `bun run check` - Biome check; should validate without mutating files.
- `bun run test` - Vitest run, stable even when local test count is empty.
- `bun run test:ci` - strict gate that should fail if tests are missing or failing.
- `bun run build` - TypeScript build plus Vite build.
- `bun run dev` - local Vite server for manual browser validation.

## When To Run

- Documentation-only changes: no runtime validation required unless links or generated docs are involved.
- Pure logic changes: run focused tests when possible, then `bun run test`.
- Scene, import, type, or bundling changes: run `bun run build`.
- Formatting/lint-sensitive changes: run `bun run check`.
- Frontend visual changes: run the local dev server and inspect in browser when practical.

## Reporting

Always report the exact command run and pass/fail status. If validation fails, distinguish project baseline issues from issues introduced by the current change. (source: ../../GEMINI.md)

## Related

- [[project-map]]
