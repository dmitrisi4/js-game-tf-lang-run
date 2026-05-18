# Puerto Building Colliders

## Summary

- Added static runtime blockers for Puerto de la Cruz buildings in `?tenerife=1&terrain=real`.
- Switched from the first proxy-box attempt to exact static mesh collision on the baked `puerto-osm-city-buildings` mesh after the user reported continued wall traversal.
- Kept terrain and building collision aggregates separate for cleanup and future performance tuning.
- Recorded a follow-up traversal concept: an explicit word/letter-powered roof vault action rather than a global jump-height increase.

## References Used

- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/world-building.md`
- `docs/llm-wiki/scene-architecture.md`

## Validation

- `bun run test src/scenes/environment/PuertoCityTerrain.test.ts` passed.
- `bunx biome check src/scenes/environment/PuertoCityTerrain.tsx src/scenes/environment/PuertoCityTerrain.test.ts src/scenes/environment/Environment.tsx ...` passed for edited source files.
- `bun run build` passed.
- `bun run check` failed on existing unrelated formatting issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Existing dev server responded with HTTP `200` at `http://127.0.0.1:5173/?tenerife=1&terrain=real`.
