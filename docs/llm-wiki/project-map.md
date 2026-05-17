# Project Map

## Project Type
`keyArena` is a React + TypeScript + Vite 3D RPG prototype using Babylon.js, `react-babylonjs`, Havok physics, Zustand, and Vitest. Package scripts are in `package.json`; use `bun` commands unless a task has a clear reason not to.

## First Files
- `GEMINI.md` - authoritative standards and project protocol.
- `docs/llm-wiki/index.md` - this wiki's entry point.
- `package.json` - scripts, dependencies, and runtime stack.
- `src/main.tsx` and `src/App.tsx` - React entry and app shell.
- `src/scenes/MainScene.tsx` - 3D scene composition root.

## Source Map
- `src/scenes/MainScene.tsx` - wires engine, scene, physics readiness, input bridge, camera, environment, player, collectibles, prototype objects, and HUD data.
- `src/scenes/environment/` - sky, lighting, ground, terrain, world data, zones, scenery, and Tenerife preview.
- `src/scenes/player/` - player entity, controller, input normalization, visual asset bridge, and interaction bridge.
- `src/scenes/discovery/` - letter collectibles, asset-backed collectible visual, spawn waves, goals, recipes, and pickup utilities.
- `src/store/` - Zustand gameplay state, selectors, and store tests.
- `src/ui/` - HUD, inventory overlay, talent tree overlay, and HUD CSS.
- `public/models/` - current runtime-served GLB models.
- `public/textures/` - current runtime-served textures.
- `docs/history/logs/` - chronological session logs.

## Avoid By Default
- `node_modules/`
- `dist/`
- `.DS_Store`
- large model/texture folders unless the task is about assets

## Task Shortcuts
- Adding houses/buildings: read [World Building](./world-building.md), then inspect `src/scenes/environment/WorldScenery.tsx`, `src/scenes/environment/worldData.ts`, and the target model path.
- Changing player behavior: inspect `src/scenes/player/`, `src/scenes/camera/SceneCamera.tsx`, and relevant tests.
- Changing discovery/crafting: inspect `src/scenes/discovery/`, `src/store/useGameStore.ts`, `src/store/selectors.ts`, and tests.
- Changing validation or scripts: inspect `package.json`, `biome.json`, and [Validation](./validation.md).
