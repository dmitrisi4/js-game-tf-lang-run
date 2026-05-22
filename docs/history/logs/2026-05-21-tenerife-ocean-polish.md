# 2026-05-21 Tenerife Ocean Polish

## Summary

Replaced the flat Tenerife water-surface boxes with a shared visual-only shader ocean surface. The full-island ocean and legacy Tenerife preview water now use the same procedural treatment while existing seabed and reset behavior remain in their prior owners.

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`

## Changes

- Added `src/scenes/environment/OceanSurface.tsx` as a visual-only Babylon shader surface.
- Added `src/scenes/environment/oceanVisualConfig.ts` and focused tests for ocean bounds and wave-scale helper math.
- Updated `TenerifeOcean.tsx` to render full-island water through `OceanSurface`.
- Updated `TenerifeSafetyLayer.tsx` to render preview water through `OceanSurface` while keeping seabed physics unchanged.
- Added `TASKS/tenerife-ocean-polish/` planning documents and checklist.

## Validation

- Passed: `bun run test -- src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/TenerifeSafetyLayer.tsx`.
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `curl -I 'http://127.0.0.1:5174/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.

## Follow-Up

- Run browser screenshot QA for `?tenerife=1&terrain=island-full` and `?tenerife=1` once a browser automation route is available.
- Tune shader palette after visual inspection from the Puerto coast.

## 2026-05-22 Coastal Water-Level Correction

Visual QA showed the full-island ocean surface cutting through the Puerto coast and player. Lowered `TENERIFE_FULL_ISLAND_WATER_SURFACE_Y` from `-0.18` to `-3.75`, kept deep-water reset at `-5.5`, and reduced full-island ocean opacity from `0.78` to `0.62`.

Follow-up QA still showed the ocean cutting through the coastal spawn, which means the normalized full-island coastal terrain sits lower than the initial sea-level estimate. Lowered the full-island visual ocean to `-24`, moved seabed to `-32`, and moved deep-water reset to `-28` so the water remains below the Puerto coast with a clear safety margin.

Validation:
- Passed: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/TenerifeOcean.tsx TASKS/tenerife-ocean-polish/tasks.md`.
- Passed: `bun run build` with the existing large chunk warning.
