# Technical Plan

## Files
- `vite.config.ts`
- `src/utils/publicAssetUrl.ts`
- `src/scenes/player/AssetPlayerVisual.tsx`
- `src/scenes/discovery/AssetLetterCollectiblesManager.tsx`
- `src/scenes/environment/*` runtime asset URL call sites
- `TASKS/github-pages-runtime-bundle-fix/tasks.md`
- `docs/history/logs/2026-05-30.md`

## Data Flow
- GitHub Actions runs `bun run build`.
- Vite emits the `dist` artifact.
- `actions/deploy-pages` publishes the artifact to GitHub Pages.
- Runtime model, texture, and JSON URLs are resolved with `import.meta.env.BASE_URL` before Babylon loaders or `fetch` request them.

## Risk
- Disabling production JavaScript code splitting increases the main bundle size.
- The tradeoff is acceptable for the immediate production-blocking Babylon chunk ordering issue.
- Public asset helper misuse could double-prefix URLs; keep helper inputs as root-relative `public/` paths and cover normalization with tests.

## Verification Commands
- `bun run check`
- `bun run test`
- `bun run build`
- Browser smoke test against a local production preview when practical.

## References Used
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/validation.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/documentation-maintenance.md`
