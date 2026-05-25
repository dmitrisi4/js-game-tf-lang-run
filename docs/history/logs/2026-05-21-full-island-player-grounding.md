# 2026-05-21 Full-Island Player Grounding

References used:
- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`

## Summary

Fixed a Puerto-area `?tenerife=1&terrain=island-full` grounding regression where the player visual appeared to run above the rendered terrain. The full-island controller and visual anchor now prefer exact downward raycasts against the rendered terrain tiles before falling back to the coarse runtime heightfield.

## Notes

- The heightfield remains a fallback for missing terrain ray hits.
- Full-island traversal remains kinematic and does not restore Havok mesh collision or the player physics aggregate in this mode.
- Added focused coverage for full-island terrain support preferring raycast terrain height.

## Validation

- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test -- src/scenes/player/Player.test.ts src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`
- Passed: `/Users/dmytrosichkar/.bun/bin/bunx biome check src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/Player.test.ts TASKS/full-tenerife-island-integration/tasks.md`
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build` with the existing Vite large chunk warning.
- Passed: `curl -I --max-time 5 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `200 OK`.
- Failed as baseline: `/Users/dmytrosichkar/.bun/bin/bun run check` still reports unrelated Biome issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Not run: Browser MCP screenshot QA, because the Browser plugin's Node REPL execution tool was not available after tool discovery in this session.
