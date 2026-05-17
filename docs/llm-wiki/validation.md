# Validation

## Commands
Use the scripts in `package.json`.

- `bun run check` - Biome check; should validate without mutating files.
- `bun run test` - Vitest run with `--passWithNoTests`.
- `bun run test:ci` - strict test gate; should fail if tests are missing or failing.
- `bun run build` - TypeScript build plus Vite build.
- `bun run dev` - local Vite server for manual browser validation.

## When To Run
- Documentation-only changes: no runtime validation required unless links or generated docs are involved.
- Pure logic changes: run focused tests when possible, then `bun run test`.
- Scene, import, type, or bundling changes: run `bun run build`.
- Formatting/lint-sensitive changes: run `bun run check`.
- Frontend visual changes: run local dev server and inspect in browser when practical.

## Reporting
Always report:
- exact command run
- pass/fail
- if failed, whether it looks like an existing baseline issue or introduced by the current change

Do not claim validation passed if commands were not run.
