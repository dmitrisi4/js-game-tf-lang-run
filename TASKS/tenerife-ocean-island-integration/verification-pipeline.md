# Verification Pipeline

## Before Visual QA

1. Confirm active dev server:
	- `lsof -nP -iTCP:5173 -sTCP:LISTEN`
	- `curl -I 'http://localhost:5173/?tenerife=1&terrain=island-full'`
2. Confirm browser target:
	- URL exactly includes `?tenerife=1&terrain=island-full`
	- add `&oceanDebug=1` for QA captures
3. Confirm runtime values:
	- debug marker shows current waterline
	- debug marker shows whether imported/custom ocean layers are visible

## Code Validation

Use the smallest relevant set first:

- `bun run test -- src/scenes/environment/ocean/*.test.ts`
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/oceanVisualConfig.test.ts`
- `bunx biome check <touched-files>`
- `bun run build`

Run broader checks when touching shared systems:

- `bun run test`
- `bun run check`

## Browser Evidence

Capture at least:

- Puerto coast, normal mode.
- Puerto coast, `?oceanDebug=1`.
- Same view with custom ocean hidden.
- Same view with imported water hidden.
- Offshore horizon.

Each screenshot note must include:

- exact URL
- viewport size
- dev server port
- waterline values
- visible ocean layer mode

