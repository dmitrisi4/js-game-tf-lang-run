# Tasks

## 0. Planning

Status: Done

References used:
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

Tasks:
- [x] Create epic directory.
- [x] Add product plan.
- [x] Add roadmap.
- [x] Add technical plan.
- [x] Add task checklist.

## 1. Shared Ocean Visual

Status: Implemented

Tasks:
- [x] Add pure ocean bounds and scale helpers.
- [x] Add focused helper tests.
- [x] Add visual-only shader ocean component.

## 2. Tenerife Integration

Status: Implemented

Tasks:
- [x] Wire full-island ocean to the shared visual component.
- [x] Wire preview safety water to the shared visual component.
- [x] Preserve seabed/reset behavior.

## 3. Validation

Status: Done

Tasks:
- [x] Run focused ocean tests.
- [x] Run Biome check for touched files.
- [x] Run build.
- [x] Add session log.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/TenerifeSafetyLayer.tsx`.
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `curl -I 'http://127.0.0.1:5174/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK` while the dev server was running.
- Not run: browser screenshot QA. The Browser plugin did not expose the required Node REPL tool in this session, and this project does not currently have `playwright` installed as a direct dependency.

## 4. Coastal Water-Level Fix

Status: Implemented

Tasks:
- [x] Lower full-island visual sea level after coastal QA showed the player and shore submerged.
- [x] Reduce full-island ocean opacity so coast geometry remains readable through shallow water.
- [x] Add a config test locking visual sea level above deep-water reset but below coastal grounding.
