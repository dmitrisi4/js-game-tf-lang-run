# Tech Stack And Validation

## Tech Stack
- Runtime and package manager: Bun
- Frontend: React 19 + TypeScript
- 3D engine: Babylon.js v8 + `react-babylonjs`
- Physics: Havok Physics
- State:
	- Zustand for local persistent gameplay state
	- TanStack Query for server-facing state if needed later
- Linting and formatting: Biome
- Tests: Vitest
- DCC workflow: Blender
- Runtime 3D asset format: `glb`

## Source Of Truth Documents
- Project standards: `AGENTS.md`
- Implementation roadmap: `docs/implementation_plan.md`
- AI asset pipeline: `docs/ai_asset_workflow.md`
- Local Blender workflow: `docs/blender_local_workflow.md`
- LLM project wiki: `docs/llm-wiki/index.md`
- Session history: `docs/history/logs/`

## Validation Pipeline
Before closing work, agents should validate results against the real current workflow.

Current commands:
- `bun run check`
- `bun run test`
- `bun run test:ci` for strict test gating when the presence of tests must be enforced
- `bun run build` for changes that can affect bundling, imports, or type-level integration

Validation behavior:
- `bun run check` must validate without mutating files.
- `bun run test` may stay stable on an empty local baseline.
- `bun run test:ci` is the strict gate and must fail if tests are absent or failing.
- Agents should report the exact failure mode when validation fails and distinguish project baseline issues from issues introduced by the current change.
