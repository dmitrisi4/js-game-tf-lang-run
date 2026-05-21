# 2026-05-21 Physics, Assets, And Render Hardening

## Summary

Created `TASKS/physics-assets-render-hardening` and implemented the first hardening pass from the technical review of physics, packaging, model-animation integration, and render safety.

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`

## Changes

- Full-island mode now renders the visual ocean and the Tenerife safety reset loop at the same time.
- Tenerife safety teleport now mirrors player teleport behavior by calling `setTargetTransform` and clearing velocities.
- Full-island heightfield generation now tracks source coverage and rejects large filled gaps, preventing ocean or removed source planes from becoming invisible support.
- Puerto full-island spawn logic now has testable sampler helpers for direct marker hit, offset fallback, highest-terrain fallback, and no-scene fallback.
- Collision filter helpers now apply project layer/mask metadata to Havok shapes, bodies, and imperative aggregates.
- Touched terrain/building/player physics paths now apply explicit collision filters where shape timing is reliable.
- Production build now runs `scripts/prune-public-assets.mjs` after Vite and removes source-only copied assets from `dist`.
- Player animation selection now goes through `playerAnimationRegistry` instead of inline substring matching.
- React type packages are aligned to React 19.

## Validation

- Passed: `/Users/dmytrosichkar/.bun/bin/bun run test` with 27 files and 119 tests.
- Passed: `/Users/dmytrosichkar/.bun/bin/bun run build`.
- Build note: post-build pruning removed 53 copied public assets and `dist` is `136M`.
- Build warning remains: main JS chunk is about `4.9 MB` minified.
- `bun run check` still fails only on pre-existing baseline formatting/import issues:
	- `src/store/selectors.test.ts`
	- `src/ui/InventoryOverlay.tsx`
	- `src/ui/gameHud.css`
- HTTP smoke passed:
	- `http://127.0.0.1:5173/?tenerife=1&terrain=island-full`
	- `http://127.0.0.1:5173/models/environment/tenerife-full-island-normalized.glb?v=2026-05-19-restored-full`
	- `http://127.0.0.1:5173/models/hero/pumkinboy-rigged-animated-character/source/Pumpkinboy_10Animations.glb`

## Remaining Risks

- Full-island traversal still uses a scripted terrain-follow controller. A full physics capsule migration needs a dedicated phase with an active terrain collider/proxy and browser physics QA.
- Browser visual screenshot QA was deferred because the in-app Browser tool was not available through tool discovery and Playwright is not installed in this project.
- Runtime still uses the Pumpkinboy source GLB as the default animated hero until `public/models/player/player-hero-rigged.glb` is smoke-tested for animation groups, scale, and pivot.
- Code splitting is still needed for the large main JavaScript chunk.
