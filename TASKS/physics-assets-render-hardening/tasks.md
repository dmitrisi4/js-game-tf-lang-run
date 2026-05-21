# Tasks

## 0. Planning Module

Status: Done

References used:
- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`

Tasks:
- [x] Create hardening epic directory.
- [x] Record product outcome, acceptance criteria, non-goals, and priority.
- [x] Record roadmap phases and gates.
- [x] Record technical implementation by phase.
- [x] Review the task module against the review findings.
- [x] Correct missing or unsafe tasks found during task-module review.

## 1. Full-Island Safety And Reset

Status: Done

Tasks:
- [x] Keep full-island `TenerifeOcean` visual rendering active.
- [x] Render `TenerifeSafetyLayer` in full-island mode without duplicating legacy water visuals.
- [x] Update safety teleport to call `setTargetTransform` on the Havok body.
- [x] Preserve velocity reset and rotation reset during safety teleport.
- [x] Add or update targeted reset-mode tests.
- [x] Run targeted environment tests after this phase.

Verification notes:
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test -- src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build` with the existing Vite large chunk warning.

## 2. Heightfield Validity And Puerto Spawn Tests

Status: Done

Tasks:
- [x] Add source-coverage metadata to full-island heightfield generation.
- [x] Reject sampled positions whose nearest source terrain cell is too far away.
- [x] Keep small local sampling gaps valid for sparse real terrain.
- [x] Add synthetic heightfield tests for valid land, small gap, and large empty span.
- [x] Add Puerto spawn behavior tests for direct hit, offset fallback, highest-terrain fallback, and no-scene fallback.
- [x] Run targeted heightfield and spawn tests after this phase.

Verification notes:
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test -- src/scenes/environment/tenerifeFullIslandHeightfield.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build` with the existing Vite large chunk warning.

## 3. Physics Authority And Collision Filters

Status: Done

Tasks:
- [x] Add shared collision filter application helpers.
- [x] Add tests for shape/body/aggregate filter application.
- [x] Apply filters to touched imperative static terrain aggregates.
- [x] Apply filters to safety/world-bounds/player bodies where timing is reliable.
- [x] Reassess full-island scripted traversal against physics capsule authority after safety and heightfield fixes.
- [x] Either migrate the narrow full-island player body path or document the remaining controller debt with an implementation gate.
- [x] Run targeted physics tests after this phase.

Verification notes:
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test -- src/scenes/physics/collisionLayers.test.ts src/scenes/player/playerCapsuleMetrics.test.ts`.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build` with post-build pruning and the existing Vite large chunk warning.
- Deferred: full-island traversal still uses a scripted terrain-follow controller. This pass reduced the risk by restoring safety/reset correctness, adding heightfield source coverage, and making the normal player body filterable. A full migration needs a dedicated controller phase with browser physics QA because the full-island terrain currently has no active Havok terrain collider.

## 4. Runtime Packaging

Status: Done

Tasks:
- [x] Add `scripts/prune-public-assets.mjs`.
- [x] Add prune policy tests for source model formats, source ZIPs, player source folder, source land assets, and unused texture maps.
- [x] Wire prune script into `bun run build` after Vite output.
- [x] Verify runtime-loaded GLBs and texture paths are not pruned.
- [x] Record post-build `dist` size and remaining large Vite chunk warning.
- [x] Run packaging tests and build after this phase.

Verification notes:
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test -- scripts/prune-public-assets.test.mjs`.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build`; prune removed 53 copied public assets.
- Post-build `dist` size after pruning: `136M`.
- Remaining known warning: main JS chunk is still about `4.9 MB` minified and should be addressed by a later code-splitting phase.

## 5. Player Model And Animation Hardening

Status: Done

Tasks:
- [x] Add animation registry helper for locomotion states.
- [x] Add registry tests for current Pumpkinboy naming and deterministic fallback.
- [x] Replace inline animation substring search in `AssetPlayerVisual`.
- [x] Check whether `public/models/player/player-hero-rigged.glb` can be preferred safely.
- [x] Keep source hero GLB fallback if the runtime player GLB cannot satisfy animation needs yet.
- [x] Run targeted player animation tests after this phase.

Verification notes:
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test -- src/scenes/player/playerAnimationRegistry.test.ts`.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build`.
- Deferred: `public/models/player/player-hero-rigged.glb` is kept packaged, but the current Pumpkinboy animated source GLB remains the runtime default until a browser/model smoke confirms equivalent animation groups, scale, and pivot behavior.

## 6. Dependency And Documentation Closure

Status: Done

Tasks:
- [x] Try to align React 19 runtime with React 19 type packages if package update is available.
- [x] Confirm no defer is needed because dependency update completed successfully.
- [x] Add session log in `docs/history/logs/`.
- [x] Run full `bun run test`.
- [x] Run `bun run build`.
- [x] Run `bun run check` and record baseline failures separately.
- [x] Run or explicitly defer browser smoke for `?tenerife=1&terrain=island-full`.
- [x] Update task statuses after final validation.

Notes:
- Completed: `@types/react` updated to `19.2.15`; `@types/react-dom` updated to `19.2.3`.
- No defer needed for dependency alignment.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test` with 27 files and 119 tests.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build`; post-build pruning removed 53 copied public assets.
- `bun run check` still fails only on pre-existing baseline issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- HTTP smoke passed for the full-island route and key GLB asset URLs.
- Browser visual screenshot smoke deferred because the in-app Browser tool was not available through tool discovery and Playwright is not installed.
