# keyArena Agent Protocol

`AGENTS.md` is the authoritative agent memory file for this project.
`CLAUDE.md`, `CODEX.md`, and `GEMINI.md` are symlinks to this file and must stay that way.

## Required Reference Use
Before implementing, modifying, reviewing, or validating any task, agents must read the task-relevant reference docs listed below.

Do not rely only on this file for execution details. This file is the protocol index; the reference docs contain the project rules that must be applied during work.

For non-trivial tasks, record the references used in task notes, session logs, or the final response.

Use the smallest relevant reference set:
- Product or gameplay behavior: `docs/reference/project-vision.md`
- Runtime, package manager, validation, or dependencies: `docs/reference/tech-stack-validation.md`
- React, Babylon, Zustand, event bus, or architecture ownership: `docs/reference/runtime-architecture.md`
- Scene, player, camera, input, NPC, or gameplay object work: `docs/reference/scene-gameplay.md`
- Models, textures, Blender, AI assets, or GLB import/export: `docs/reference/asset-pipeline.md`
- Physics, collision, colliders, triggers, layers, pooling, or movement authority: `docs/reference/physics-collision.md`
- Documentation updates, templates, or session logs: `docs/reference/documentation-maintenance.md`

For implementation questions, read `docs/llm-wiki/index.md` before broad filesystem searches.

## Fast Orientation
- Package/runtime basics are in `package.json`; use `bun` scripts.
- Main scene composition starts at `src/scenes/MainScene.tsx`.
- Environment composition starts at `src/scenes/environment/Environment.tsx`.
- Default world scenery is rendered from `src/scenes/environment/WorldScenery.tsx`.
- Static world placement data lives in `src/scenes/environment/worldData.ts`.
- Terrain height helpers live in `src/scenes/environment/terrainData.ts`.
- Player logic lives under `src/scenes/player/`.
- Discovery and collectible logic lives under `src/scenes/discovery/`.
- HUD and overlays live under `src/ui/`.
- Runtime model assets are served from `public/models/`.

## Critical Project Constraints
- Gameplay loop: collect letters/words, craft valid words, unlock progress or power.
- React owns app/UI; Babylon owns scene, camera, physics, raycasts, and frame updates.
- Zustand owns durable player, inventory, progression, and UI state.
- Event bus is only for one-shot signals; never use it as HP, XP, inventory, or interaction state.
- Player movement authority belongs to a physics capsule, not the visual mesh.
- Input must be normalized into semantic commands before movement consumes it.
- Camera logic must stay isolated from raw scene markup.
- World scale is fixed at `1 unit = 1 meter`.
- Runtime 3D assets must be `glb`; AI assets require Blender cleanup before runtime use.
- Gameplay assets need source/license, scale, pivot, texture budget, material maps, collider strategy, and validation notes.
- Dynamic gameplay objects should prefer primitive or compound primitive colliders, not raw mesh collisions.
- Repeated pickups, projectiles, VFX, and damage indicators must be evaluated for pooling.

## Non-Negotiable Code Rules
1. Keep modules small and single-purpose.
2. Keep scene composition separate from gameplay behavior.
3. Do not use `interface`; use `type` exclusively.
4. Component props must be named `PropsType`.
5. Add JSDoc for functions, hooks, and non-trivial components.
6. Use tabs only and keep formatting Biome-compatible.
7. Use absolute imports such as `@/...`.
8. New features and bug fixes should include tests in the same phase of work.

## Task Planning Protocol
All implementation requests must go through the task manager before coding unless the user explicitly says to skip planning for a tiny one-line fix. Treat `TASKS/` as the project task dashboard.

When the user asks to implement a task or feature:
1. Create or update an epic under `TASKS/<epic-name>/`.
2. Add or update a product plan with user-visible outcome, acceptance criteria, non-goals, and priority.
3. Add or update a roadmap with ordered phases, dependencies, and phase gates.
4. Add or update a technical plan with files, systems, data flows, risks, migration notes, and verification commands.
5. Add or update a task checklist with status markers: `Not started`, `In progress`, `Implemented`, `Blocked`, `Deferred`, or `Done`.
6. Implement tasks in order and update statuses as work proceeds.
7. When executing checklist work, mark each completed item immediately after it is done; never leave finished work marked as `Not started` or `In progress` until the end.

Before implementing, collect enough context to make the task concrete:
- Current code paths and ownership boundaries.
- Existing data files, generated files, assets, and scripts involved.
- Runtime assumptions such as dev URL, feature flags, query params, and environment variables.
- User-visible acceptance criteria from screenshots, bug reports, or product descriptions.
- Verification path: unit tests, build, browser check, screenshots, logs, or manual checks.
- Known risks and rollback points.

Ask a concise question before coding only when missing information blocks a safe implementation. Do not ask for information that can be discovered from repository files, docs, tests, or screenshots.

## Validation
Use validation that matches the change:
- `bun run check`
- `bun run test`
- `bun run test:ci`
- `bun run build`

Report exact failures and distinguish project baseline issues from issues introduced by the current change.

## Session Logging
Every meaningful architecture or implementation session must be logged in `docs/history/logs/`.
**CRITICAL**: Every time before making a git commit, you MUST write or update a daily worklog in `docs/history/logs/<YYYY-MM-DD>.md` summarizing the work done.

When architecture changes materially, update `AGENTS.md`, `docs/implementation_plan.md`, and directly affected workflow docs.

---
Referenced by: `CLAUDE.md`, `CODEX.md`, `GEMINI.md`
