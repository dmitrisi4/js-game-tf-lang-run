# Technical Plan

## Files

- Add `src/scenes/environment/tenerifeMountainTreeData.ts` for placement data and Teide dry-zone helpers.
- Add `src/scenes/environment/TenerifeMountainTrees.tsx` for GLB loading, terrain alignment, and thin instance matrices.
- Update `src/scenes/environment/Environment.tsx` to render mountain trees only in Tenerife full-island mode after the terrain is ready.
- Add `src/scenes/environment/tenerifeMountainTreeData.test.ts`.
- Add this epic's `asset-intake.md`.
- Expand `src/scenes/environment/tenerifeMountainTreeData.ts` with deterministic belt generators for dense mountain coverage.
- Replace coordinate-guessed belts with GLB-sampled slope belts containing compact terrain sample metadata.
- Replace static slope tuples with a deterministic runtime placement generator driven by the loaded full-island heightfield.
- Filter and ground imported tree source roots in `TenerifeMountainTrees.tsx`.
- Add or update placement-region definitions in `src/scenes/environment/tenerifeMountainTreeData.ts` so Puerto-visible mountains and inland ridges are selected before terrain-edge cells.
- Add tests in `src/scenes/environment/tenerifeMountainTreeData.test.ts` that reject ocean/edge bands and require visible Puerto mountain coverage.
- If needed, add a small debug/export helper for generated tree positions so browser screenshots can be compared against accepted QA viewpoints without relying on manual counting.

## Data Flow

- `Environment` detects Tenerife full-island mode and waits for `isTenerifeIslandReady`.
- `TenerifeMountainTrees` loads `Tree.glb` from `public/models/spruce-trees/...`.
- The component resolves ground Y from the full-island heightfield first, with raycast fallback against Tenerife terrain meshes.
- A single matrix buffer is applied to the imported tree meshes as thin instances.
- Dense follow-up placement is generated from named belt definitions so tests can verify region coverage without hand-counting every tree object.
- Slope-corrected placement uses offline terrain samples stored as `[x, z, height, slope]`; runtime still only consumes X/Z, yaw, scale, and height alignment.
- Runtime dense forest placement scans configured mountain regions after the heightfield is ready and emits deterministic placements with region ids, slope metadata, yaw, and scale.
- `TenerifeMountainTrees` hides all imported source roots, keeps only the main tree roots for thin instancing, and anchors the source by the `tree trunk` mesh base.
- The follow-up placement reset should add a stricter candidate pipeline:
	1. require full-island heightfield availability at the candidate and its slope-neighbor sample points;
	2. reject low/coastal cells before scoring;
	3. reject ocean-facing terrain-edge cells that create side or horizon bands from the Puerto camera;
	4. score candidates by visible mountain-face coverage first, global island fill second;
	5. keep deterministic yaw, scale, and spacing so tests remain stable.

## Risks

- The provided GLB appears to be a multi-tree source file with many child meshes, so first-pass rendering may have a moderate draw-call count.
- The provided GLB contains `mini_tree_*` roots and many separate branch roots; unfiltered instancing can create side-offset/floating artifacts.
- Source/license is not yet known and must be resolved before final production use.
- No Blender cleanup has been confirmed; scale and pivot are first-pass runtime normalization.
- Heightfield bounds may include terrain-edge samples that are technically valid land but look like ocean-side placement from the player camera.
- Count-based tests can pass while visual composition still fails; screenshot or browser QA gates are required for this phase.

## Migration Notes

- No state migration.
- No gameplay collision migration.
- If the full-island terrain GLB changes, regenerate or audit the stored slope samples before trusting the tree positions.
- Runtime scanning reduces sensitivity to terrain coordinate drift, but region bounds should still be reviewed if the island model or Puerto overlay transform changes.
- Any change to Tenerife terrain scale, spawn transform, or Puerto overlay alignment should trigger a tree-placement visual review.

## Verification Commands

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts`
- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts`
- `bun run check`
- `bun run build`
- Browser QA at `http://127.0.0.1:<port>/js-game-tf-lang-run/?tenerife=1&terrain=island-full` with screenshots from the Puerto start view and an inland ridge view.
