# Project Map

## Summary

`keyArena` is a React + TypeScript + Vite 3D RPG prototype using Babylon.js, `react-babylonjs`, Havok physics, Zustand, and Vitest. Use Bun scripts for validation and development. (source: ../../GEMINI.md; ../../package.json)

## First Files

- `../../GEMINI.md` - authoritative standards and project protocol.
- `../../package.json` - scripts, dependencies, and runtime stack.
- `../../src/main.tsx` and `../../src/App.tsx` - React entry and app shell.
- `../../src/scenes/MainScene.tsx` - 3D scene composition root.
- `../../docs/llm-wiki/index.md` - existing compact project wiki that this nested wiki can reference during migration.

## Source Map

- `../../src/scenes/MainScene.tsx` - wires scene composition, physics readiness, camera, environment, player, collectibles, prototype objects, and HUD data.
- `../../src/scenes/environment/` - sky, lighting, ground, terrain, world data, zones, scenery, Tenerife preview, and OSM-backed environment layers.
- `../../src/scenes/player/` - player entity, controller, input normalization, visual asset bridge, and interaction bridge.
- `../../src/scenes/discovery/` - letter collectibles, collectible visuals, spawn waves, goals, recipes, and pickup utilities.
- `../../src/store/` - Zustand gameplay state, selectors, and store tests.
- `../../src/ui/` - HUD, inventory overlay, talent tree overlay, and HUD styling.
- `../../public/models/` - runtime-served GLB models.
- `../../public/textures/` - runtime-served textures.
- `../../docs/history/logs/` - chronological session logs.

## Avoid By Default

- `../../node_modules/`
- `../../dist/`
- `.DS_Store`
- large model and texture folders unless the task is about assets

## Related

- [[scene-architecture]]
- [[gameplay-loop]]
- [[asset-pipeline]]
- [[validation]]
