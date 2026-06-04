# Tasks

## 0. Planning

Status: Implemented

- [x] Read required reference docs.
- [x] Create task module with product plan, roadmap, technical plan, and checklist.

## 1. Measurement

Status: Implemented

- [x] Inspect current query-plan defaults.
- [x] Count runtime road/building data volume.
- [x] Confirm local Vite URL responds.
- [x] Record measured bottleneck notes.

## 2. Runtime Fix

Status: Implemented

- [x] Restore default full-island runtime road mesh generation.
- [x] Restore default generated roadside houses.
- [x] Delay full-island road/house overlay loading until island terrain readiness.
- [x] Restore terrain raycast full-island road grounding by default.
- [x] Keep cheaper heightfield road grounding opt-in via `&roadGrounding=heightfield`.
- [x] Avoid generated roadside house Havok bodies in full-island mode.

## 3. Tests

Status: Implemented

- [x] Update Puerto layer plan tests for the fast default.
- [x] Preserve tests for visible default roads/houses and explicit grounding/building opt-ins.

## 4. Verification

Status: Implemented

- [x] Run targeted tests.
- [x] Run project validation.
- [x] Run local HTTP smoke.
- [x] Record browser smoke blockage.
- [x] Add session log.

Verification notes:

- Passed: `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed: `bun run check`.
- Passed: `bun run test`.
- Passed: `bun run build` with the existing Vite large chunk warning.
- Passed HTTP smoke: `curl -I --max-time 5 'http://localhost:5173/js-game-tf-lang-run/?tenerife=1&terrain=island-full'` returned `200 OK`.
- Browser visual smoke blocked: Browser `iab` was unavailable, and DevTools MCP reported an already-running Chrome profile.
- Follow-up correction: restored default full-island roads and generated roadside houses after user feedback, then changed the optimization to deferred overlay loading plus heightfield-first road grounding.
- Follow-up visual correction: restored terrain raycast road grounding by default after the heightfield approximation made roads float above sloped terrain.
- Follow-up validation passed: targeted tests, `bun run check`, `bun run test`, `bun run build`, and HTTP smoke for the full-island URL.
