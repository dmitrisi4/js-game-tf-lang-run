# Tasks

## 0. Planning

Status: Done

Tasks:
- [x] Create epic directory.
- [x] Add product plan.
- [x] Add roadmap.
- [x] Add technical plan.
- [x] Add tasks checklist.

## 1. Diagnose

Status: Implemented

Tasks:
- [x] Confirm GitHub Pages is serving built `dist` output.
- [x] Inspect generated `thinEngine` chunk and identify cross-chunk Babylon base-class import.

## 2. Bundling Fix

Status: Implemented

Tasks:
- [x] Configure production build to avoid invalid circular runtime chunks.
- [x] Rebuild and confirm the problematic split chunk is gone.

## 3. Validation

Status: Done

Tasks:
- [x] Run `bun run check`.
- [x] Run `bun run test`.
- [x] Run `bun run build`.
- [x] Run local production browser smoke test.
- [x] Update worklog.

Notes:
- Local production preview no longer reports the `Class extends value undefined is not a constructor or null` startup error.
- Preview reported existing 404s for absolute `/models/...` and `/textures/...` asset URLs under a non-root base path; fixed in phase 4.

## 4. Public Asset Base Paths

Status: Done

Tasks:
- [x] Identify runtime model, texture, and JSON URLs that bypass the Vite base path.
- [x] Add a shared public asset URL resolver backed by `import.meta.env.BASE_URL`.
- [x] Update Babylon loaders, textures, and runtime `fetch` calls to use the resolver.
- [x] Run `bun run check`.
- [x] Run `bun run test`.
- [x] Run `bun run build`.
- [x] Run local production browser smoke test.
- [x] Update worklog.
- [x] Commit and push the fix.

Notes:
- Local production preview requested reported models and textures from `/js-game-tf-lang-run/...` and returned 200/304 instead of root-path 404s.
