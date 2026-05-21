# Tenerife Puerto Spawn

Date: 2026-05-20

## Scope

Moved the full-island player spawn from the Teide/highest-terrain QA point to the calibrated Puerto de la Cruz map position.

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`

## Changes

- Updated `TENERIFE_FULL_ISLAND_PUERTO_START_POSITION` to `x=441.53`, `z=-272.15`, matching the calibrated Puerto de la Cruz full-map marker.
- Replaced the default full-island reset path with Puerto-first terrain raycast grounding.
- Kept the highest-terrain scan as a fallback if Puerto grounding fails.
- Added test coverage for the calibrated Puerto fallback position.

## Validation

- Passed: `bun run test -- src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifePreviewConfig.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed: `bun run build`.
- Browser smoke passed at `http://127.0.0.1:5174/?tenerife=1&terrain=island-full`: player marker `left: 53.4282%; top: 64.9839%`, Puerto de la Cruz marker `left: 53.4245%; top: 64.9784%`.
- Browser console showed no warnings or errors.
