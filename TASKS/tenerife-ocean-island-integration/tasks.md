# Tasks

## 0. Research And Planning

Status: Done

References used:
- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- Babylon.js official docs: https://doc.babylonjs.com/
- Babylon.js package docs: https://doc.babylonjs.com/setup/frameworkPackages/
- Babylon.js local `WaterMaterial` API: `node_modules/@babylonjs/materials/water/waterMaterial.d.ts`
- MDN WebGL shader docs: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders
- NVIDIA GPU Gems water caustics chapter: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics

Tasks:
- [x] Create epic directory.
- [x] Add product plan.
- [x] Add source/current-code analysis.
- [x] Add technical plan.
- [x] Add roadmap.
- [x] Add implementation task pool.

## 1. Runtime Truth

Status: In progress

Tasks:
- [x] Add `?oceanDebug=1` runtime marker with active waterline values.
- [x] Log active URL, dev port, and ocean component at scene startup in development mode.
- [x] Add a QA checklist entry requiring screenshot URL and timestamp.
- [x] Verify `localhost:5173` serves the current branch/worktree before visual QA.

Acceptance:
- A screenshot can prove which waterline constant and ocean component rendered.

Notes:
- Added `src/scenes/environment/ocean/oceanDebug.ts`.
- `?oceanDebug=1` renders a fixed debug readout with active URL, custom/imported water visibility, waterline, seabed, reset threshold, and imported-water audit summary.
- Console logging is enabled only when `?oceanDebug=1` is present.
- Found and killed a stale IPv6 `node` listener on `[::1]:5173`, then restarted Vite on `http://localhost:5173/`.
- `lsof -nP -iTCP:5173 -sTCP:LISTEN` showed only the current Vite `node` process after cleanup.

## 2. Imported Water Mesh Audit

Status: In progress

Tasks:
- [x] Add a full-island GLB mesh/material audit helper.
- [x] Record mesh names, material names, vertex counts, and average Y.
- [x] Flag water-like imported meshes.
- [x] Add `?hideImportedWater=1` and `?showImportedWater=1`.
- [x] Add `?hideCustomOcean=1` to isolate imported water.
- [ ] Store audit output in `public/data/tenerife/full-island-water-audit.json` or task notes.

Acceptance:
- With custom ocean hidden, there is no unexplained blue water plane unless explicitly documented.

Notes:
- Imported water-like meshes are hidden by default unless `?showImportedWater=1` is present.
- `?hideCustomOcean=1&oceanDebug=1` isolates imported or stale water layers.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/ocean/oceanDebug.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/ocean/oceanDebug.ts src/scenes/environment/ocean/oceanDebug.test.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/TenerifeOcean.tsx`.
- Passed: `bun run build` with the existing large chunk warning.
- Started: `npm run dev -- --host localhost --port 5173`.
- Verified: `curl -6 -I 'http://localhost:5173/?tenerife=1&terrain=island-full&oceanDebug=1'` returned `HTTP/1.1 200 OK`.

## 3. Measured Waterline

Status: Not started

Tasks:
- [ ] Sample terrain height around Puerto spawn from the active heightfield.
- [ ] Sample likely coastline cells near the full-island waterline.
- [ ] Generate a height report with min/median/max values.
- [ ] Choose visual waterline from measured terrain with a documented dry-land margin.
- [ ] Split config names:
	- visual ocean waterline
	- seabed visual/safety level
	- deep-water reset threshold
- [ ] Add tests for waterline selection helpers.

Acceptance:
- Ocean Y is no longer hand-tuned from screenshots.

## 4. Shoreline Mask Or Ribbon

Status: Not started

Tasks:
- [ ] Decide mask texture versus mesh ribbon for first implementation.
- [ ] Implement low-resolution shoreline extraction from terrain samples.
- [ ] Add debug view for shoreline alignment.
- [ ] Add regeneration command and provenance notes.
- [ ] Add tests for pure shoreline extraction on synthetic terrain data.

Acceptance:
- Foam follows the actual coast shape, not radial distance from the ocean plane center.

## 5. Base Ocean Material

Status: Not started

Tasks:
- [ ] Keep current custom shader as baseline.
- [ ] Add material factory abstraction for ocean material modes.
- [ ] Add optional Babylon `WaterMaterial` experiment behind `?oceanMaterial=babylon`.
- [ ] Test WaterMaterial render target sizes `256` and `512`.
- [ ] Record visual/performance comparison.

Acceptance:
- Default material choice is justified by screenshots and measured runtime behavior.

## 6. Shoreline Visual Polish

Status: In progress

Tasks:
- [ ] Add foam band driven by shoreline distance.
- [ ] Add shallow-water tint near shore.
- [ ] Add offshore darkening.
- [ ] Add camera-distance fade for foam aliasing.
- [ ] Add optional caustics texture/pass only if cost is acceptable.
- [x] Fix transparent ocean depth/sorting so water below terrain does not render as a screen-space overlay over player and dry coast.

Acceptance:
- Puerto coast reads as dry land + shallow edge + Atlantic water, not as a submerged island.

Notes:
- `OceanSurface` now renders in group `0` and keeps depth writes enabled. This addresses the observed symptom where lowering `waterSurfaceY` did not change the apparent player submersion, because the transparent water was able to draw over nearer scene geometry.

## 7. Gameplay Safety Separation

Status: Not started

Tasks:
- [ ] Confirm ocean visual mesh is non-pickable and has no physics aggregate.
- [ ] Keep seabed/reset in safety config.
- [ ] Add tests ensuring visual waterline and reset threshold stay independently configured.
- [ ] Validate player reset from real water fall.

Acceptance:
- Visual ocean changes cannot accidentally become movement authority.

## 8. Browser QA

Status: Not started

Tasks:
- [ ] Capture Puerto coast screenshot with `?oceanDebug=1`.
- [ ] Capture screenshot with custom ocean hidden.
- [ ] Capture screenshot with imported water hidden.
- [ ] Capture offshore horizon screenshot.
- [ ] Capture mobile-ish viewport screenshot if performance is acceptable.
- [ ] Record exact URL, port, timestamp, and validation commands.

Acceptance:
- QA evidence is tied to the exact target URL: `http://localhost:5173/?tenerife=1&terrain=island-full`.
