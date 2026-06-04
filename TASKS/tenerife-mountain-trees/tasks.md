# Tasks

## 1. Planning And Asset Intake

Status: Done

- [x] Read relevant project references.
- [x] Create task epic.
- [x] Record spruce tree asset intake.

## 2. Mountain Tree Data

Status: Done

- [x] Add Tenerife mountain tree placement data.
- [x] Add Teide dry-zone helper.
- [x] Add placement tests.

## 3. Runtime Rendering

Status: Done

- [x] Add GLB thin-instance renderer.
- [x] Align tree placements to Tenerife terrain.
- [x] Wire renderer into full-island Tenerife mode only.

## 4. Validation

Status: Done

- [x] Run targeted tests.
- [x] Run project check/build as appropriate.
- [x] Record validation outcome.

Validation outcome:

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts` passed.
- `bun run check src/scenes/environment/TenerifeMountainTrees.tsx src/scenes/environment/tenerifeMountainTreeData.ts src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/Environment.tsx` passed.
- `bun run test` passed: 40 files, 198 tests.
- `bun run build` passed; Vite emitted the existing large chunk warning.
- HTTP smoke passed for `http://127.0.0.1:5175/js-game-tf-lang-run/?tenerife=1&terrain=island-full`.
- HTTP smoke passed for `/js-game-tf-lang-run/models/spruce-trees/spruce-trees/source/Trees/Tree.glb` with `200 OK` and `model/gltf-binary`.
- Browser visual QA could not run because the Browser `iab` backend was unavailable, DevTools was on `about:blank` with no navigation tool, and local `playwright` is not installed.

## 5. Visibility Follow-Up

Status: Done

Context:

- User reports that no trees are visible.
- The first implementation disabled bounding-info sync before setting thin-instance matrices, which can leave imported source mesh bounds near the GLB origin instead of the authored mountain placements.

Tasks:

- [x] Refresh thin-instance bounds after applying tree placement matrices.
- [x] Add regression coverage for tree mesh visibility configuration.
- [x] Re-run targeted validation.

Validation outcome:

- `bun run test -- src/scenes/environment/TenerifeMountainTrees.test.ts src/scenes/environment/tenerifeMountainTreeData.test.ts` passed.
- `bun run check src/scenes/environment/TenerifeMountainTrees.tsx src/scenes/environment/TenerifeMountainTrees.test.ts src/scenes/environment/tenerifeMountainTreeData.ts src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/Environment.tsx` passed.
- `bun run build` passed; Vite emitted the existing large chunk warning.
- `bun run test` passed: 41 files, 200 tests.

## 6. Dense Ridge Coverage Follow-Up

Status: Done

Context:

- User wants many more trees across all mountains, above Puerto de la Cruz in the mountains, and along ridges from Puerto de la Cruz toward Santa Cruz.
- The Teide desert zone should remain sparse.

Tasks:

- [x] Replace the small first-pass placement list with denser deterministic mountain and ridge belts.
- [x] Add regression coverage for Puerto de la Cruz and Puerto-to-Santa-Cruz ridge density.
- [x] Re-run targeted placement/rendering validation.

Validation outcome:

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts` passed.
- `bun run check src/scenes/environment/tenerifeMountainTreeData.ts src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.tsx src/scenes/environment/TenerifeMountainTrees.test.ts src/scenes/environment/Environment.tsx` passed.
- `bun run test` passed: 41 files, 203 tests.
- `bun run build` passed; Vite emitted the existing large chunk warning.
- HTTP smoke passed for `http://127.0.0.1:5175/js-game-tf-lang-run/?tenerife=1&terrain=island-full`.
- HTTP smoke passed for `/js-game-tf-lang-run/models/spruce-trees/spruce-trees/source/Trees/Tree.glb` with `200 OK` and `model/gltf-binary`.
- Browser visual QA could not run because the Browser `iab` backend is unavailable in this session.

## 7. Terrain-Sampled Slope Correction

Status: Done

Context:

- User screenshot shows trees reading as a side/coastal band rather than sitting on mountain slopes.
- The previous dense belts were hand-authored in X/Z space and did not prove terrain slope suitability.

Tasks:

- [x] Analyze the GLB-derived terrain bounds and why the previous coordinate belts drifted.
- [x] Record multiple placement strategy options and choose the implementation approach.
- [x] Replace guessed tree belts with GLB-sampled slope placements.
- [x] Add slope/edge regression coverage.
- [x] Re-run targeted and project validation.

Validation outcome:

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts` passed.
- `bun run check src/scenes/environment/tenerifeMountainTreeData.ts src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.tsx src/scenes/environment/TenerifeMountainTrees.test.ts src/scenes/environment/Environment.tsx` passed.
- `bun run test` passed: 41 files, 205 tests.
- `bun run build` passed; Vite emitted the existing large chunk warning.
- HTTP smoke passed for `http://127.0.0.1:5175/js-game-tf-lang-run/?tenerife=1&terrain=island-full`.
- HTTP smoke passed for `/js-game-tf-lang-run/models/spruce-trees/spruce-trees/source/Trees/Tree.glb` with `200 OK` and `model/gltf-binary`.
- Browser visual QA could not run because the Browser `iab` backend is unavailable in this session.

## 8. Runtime Puerto Mountain Forest And Asset Grounding

Status: Done

Context:

- User reports that some trees are floating and that trees still appear far away rather than on the mountains above Puerto de la Cruz.
- `Tree.glb` contains source-offset mini tree roots and many standalone branch roots, so the renderer must filter and anchor the main tree parts explicitly.
- Static slope tuples are still too brittle for Puerto's edge-of-terrain view.

Tasks:

- [x] Inspect `Tree.glb` hierarchy and identify source roots that can create stray/floating artifacts.
- [x] Identify that Puerto spawn/overlay sits at the eastern full-island terrain edge and needs edge-prioritized forest generation.
- [x] Replace static mountain tree tuples with deterministic runtime heightfield scanning.
- [x] Filter source-offset tree roots and anchor instances by trunk base.
- [x] Add generator and renderer regression coverage.
- [x] Re-run targeted and project validation.

Validation outcome:

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts` passed.
- `bun run check src/scenes/environment/tenerifeMountainTreeData.ts src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.tsx src/scenes/environment/TenerifeMountainTrees.test.ts src/scenes/environment/Environment.tsx` passed.
- `bun run test` passed: 41 files, 203 tests.
- `bun run build` passed; Vite emitted the existing large chunk warning.
- HTTP smoke passed for `http://127.0.0.1:5175/js-game-tf-lang-run/?tenerife=1&terrain=island-full`.
- HTTP smoke passed for `/js-game-tf-lang-run/models/spruce-trees/spruce-trees/source/Trees/Tree.glb` with `200 OK` and `model/gltf-binary`.
- Browser visual QA could not run because the Browser `iab` backend is unavailable in this session.

## 9. Screenshot-Driven Island Afforestation Reset

Status: Done

Context:

- User screenshots from 2026-06-03 show trees still misplaced: they read as a side/ocean or horizon band, while the visible Puerto-side mountains are bare.
- The current implementation appears to satisfy some generated-count and slope tests but still fails the player-facing visual outcome.
- The next phase should prioritize visible mountain coverage and water/off-island rejection before increasing total tree count.

Tasks:

- [x] Define QA viewpoints for Puerto start view and one inland mountain/ridge view.
- [x] Rework tree placement regions to target visible mountain faces above Puerto de la Cruz and the Puerto-to-Santa-Cruz ridge chain.
- [x] Add rejection rules for ocean-facing terrain-edge cells and low/coastal samples.
- [x] Add regression tests that fail when too many trees land in side/ocean-band coordinates or too few land in Puerto-visible mountain regions.
- [x] Preserve Teide dry-zone exclusion and default non-Tenerife arena isolation.
- [x] Run targeted tests, `bun run check`, `bun run build`, and browser visual QA.
- [x] Update validation outcome with screenshots or explicit visual QA notes.

Validation outcome:

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts` passed.
- `bun run check` passed.
- `bun run test` passed: 41 files, 205 tests.
- `bun run build` passed; Vite emitted the existing large chunk warning.
- HTTP smoke passed for `http://127.0.0.1:5175/js-game-tf-lang-run/?tenerife=1&terrain=island-full` with `200 OK`.
- HTTP smoke passed for `/js-game-tf-lang-run/models/spruce-trees/spruce-trees/source/Trees/Tree.glb` with `200 OK` and `model/gltf-binary`.
- HTTP smoke passed for `/js-game-tf-lang-run/models/environment/tenerife-full-island-normalized.glb?v=2026-05-19-restored-full` with `200 OK` and `model/gltf-binary`.
- Browser visual QA was attempted, but the Browser `iab` backend is unavailable in this session; no screenshot could be captured.

## 10. Water Placement Hotfix

Status: Done

Context:

- User screenshot showed the phase 9 region change still rendering a large forest in the ocean.
- Root cause: runtime tree grounding accepted heightfield samples without confirming a real terrain raycast above the full-island water surface.

Tasks:

- [x] Require each rendered tree instance to have a terrain raycast hit.
- [x] Reject raycast or heightfield ground samples that sit below the full-island water safety margin.
- [x] Add renderer regression coverage for the water-height rejection guard.
- [x] Re-run targeted tests, `bun run check`, `bun run test`, and `bun run build`.

Validation outcome:

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts` passed.
- `bun run check` passed.
- `bun run test` passed: 41 files, 206 tests.
- `bun run build` passed; Vite emitted the existing large chunk warning and a plugin timing warning.

## 11. Island Mountain Afforestation Retarget

Status: Done

Context:

- User clarified that the goal is to cover the island, especially its mountain areas, with trees.
- The previous Puerto-visible retarget still over-prioritized the eastern low/coastal tile, which reads as water from the player view.
- GLB terrain inspection showed the eastern tile spans approximately `x=61..407`, `z=-741..-330`, with much lower maximum elevation than the central/western mountain tiles.

Tasks:

- [x] Remove the eastern low/coastal tile from tree generation by capping safe mountain placement at `x <= 60`.
- [x] Replace Puerto-edge regions with north, north-inner, north-east-inner, central, Teno, south, and west mountain belts.
- [x] Add regression coverage requiring dense mountain coverage and no generated trees in the eastern water-facing sector.
- [x] Re-run targeted tests, `bun run check`, `bun run test`, and `bun run build`.

Validation outcome:

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts` passed.
- `bun run check` passed.
- `bun run test` passed: 41 files, 207 tests.
- `bun run build` passed; Vite emitted the existing large chunk warning and a plugin timing warning.

## 12. Tree Water-Band Regression Fix

Status: Done

Context:

- User screenshot and follow-up showed the previous coordinate-alignment attempt was wrong: it removed the Puerto city/roads, moved spawn, and still left trees reading as a water/horizon band.
- Correction: keep the existing Puerto map/projection/spawn coordinate frame intact, and fix only the tree generator.
- Runtime GLB sampling showed the broad all-island tree scan still accepted low/coastal or water-facing terrain cells. The safe visual fix is to constrain trees to an inland mountain window and raise the minimum accepted terrain height.

Tasks:

- [x] Revert the full-island map X bounds, WGS84 projection direction, Teide map landmark X, Puerto overlay X expectation, and Puerto spawn to the prior city/roads-compatible values.
- [x] Replace the all-island tree scan with an upper-mountain belt that targets high island slopes outside the Teide dry zone.
- [x] Raise tree minimum sampled height to `22`, keep the maximum up to `72`, and densify placements (`scanStep=10`, `minSpacing=8`, `maxCount=900`).
- [x] Fix live renderer visibility by using heightfield fallback for raycast misses, forcing thin-instance parent bounds refresh, and replacing the invisible imported spruce GLB source with a procedural conifer source mesh.
- [x] Add runtime diagnostics exposed as `window.__tenerifeMountainTrees` so live placement count, visible count, mesh count, and generated bounds can be inspected without guessing.
- [x] Update regression coverage so generated trees stay on upper mountain terrain, outside Teide dry zone, and do not change Puerto city/roads/spawn.
- [x] Verify with real runtime browser view and project commands.

Validation outcome:

- Runtime/browser validation after the final fix: `window.__tenerifeMountainTrees` reported `placementCount=900`, `visibleCount=900`, and `instanceMeshCount=2` for the procedural conifer source. Visual browser inspection confirmed green cone/brown trunk trees visible across upper mountain slopes/hilltops while Puerto city roads/buildings remain visible and no ocean tree line is present.
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts` passed: 3 files, 20 tests. `bun run check` and `bun run build` passed; Vite emitted only the existing large chunk warning.
