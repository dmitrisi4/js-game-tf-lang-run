# Session Log: 2026-05-05 - Babylon Inspector Production Cut

## Objectives
- Remove Babylon Inspector from the default production bundle path.
- Keep inspector available for development without shipping it eagerly to runtime users.

## Changes
- Removed the static `@babylonjs/inspector` import from `src/scenes/MainScene.tsx`.
- Changed inspector activation to a dev-only lazy import triggered by the `I` key.
- Removed `@babylonjs/inspector` from `vite.config.ts` dependency optimization include list.

## Validation
- `bun run check` passes
- `bun run build` passes

## Observed Outcome
- Production `dist/assets` no longer includes inspector/editor-heavy chunks such as:
	- `babylon.guiEditor-*`
	- `extensionsListService-*`
	- `quickCreateToolsService-*`
- The production asset list now shows only the main app bundle, CSS, and Havok WASM among the previously flagged items.
- Build module count dropped significantly after the change.

## Notes
- Babylon runtime is still heavy overall, but the first cleanup target was the correct one.
- Remaining bundle work, if needed later, should focus on loader/material usage and further code splitting rather than reintroducing debug tooling into production.
