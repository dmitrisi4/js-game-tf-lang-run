# Tasks

## 0. Planning Module

Status: Done

References used:
- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/reference/project-vision.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`

Tasks:
- [x] Create the full Tenerife island integration epic.
- [x] Record product outcome, acceptance criteria, non-goals, and priority.
- [x] Record technical architecture and URL mode strategy.
- [x] Record source asset statistics and licensing.
- [x] Record texture budget.
- [x] Record physics/collision strategy.
- [x] Record implementation roadmap.

## 1. Asset Normalization

Status: In progress

Tasks:
- [x] Write `scripts/blender/normalize_tenerife_full_island.py`.
- [x] Import `public/models/land/tenerife._islas_canarias.glb`.
- [x] Remove default cube.
- [ ] Remove Sketchfab wrapper clutter from the exported hierarchy.
- [x] Apply terrain object rotation/scale transforms for the runtime export.
- [x] Rename visual terrain meshes with stable semantic names.
- [ ] Decide whether to merge the 6 terrain tiles or preserve them for future LOD/streaming.
- [x] Downscale the embedded 8192 texture to the first-pass 4096 runtime budget.
- [x] Rebuild the runtime island with a 2048 texture budget for GPU-freeze testing.
- [x] Export `public/models/environment/tenerife-full-island-normalized.glb`.
- [x] Emit `public/data/tenerife/full-island-metadata.json`.
- [x] Add attribution to metadata.

Notes:
- Normalized GLB is `3.6 MB`, down from the `42 MB` source GLB.
- Terrain remains 6 tiles for now because that preserves a path toward LOD or streaming.
- The latest normalization pass removes the source asset's flat sea/background faces below `1.5m`; that flat mesh was the cause of the visible brown slab.
- Exported hierarchy still includes wrapper nodes (`Sketchfab_model`, `root`, `GLTF_SceneRootNode`, `MDT_5x5_1`); remove or flatten these in a follow-up normalizer pass before final runtime integration.

## 2. Runtime Full-Island Mode

Status: Implemented first pass

Tasks:
- [x] Extend terrain mode config with `island-full`.
- [x] Add tests for terrain mode selection and default fallback behavior.
- [x] Add `TenerifeFullIslandTerrain.tsx`.
- [x] Load normalized GLB and expose terrain raycast target.
- [x] Resolve first-pass spawn from imported terrain bounds instead of hard-coded coordinates.
- [x] Keep the existing `?tenerife=1&terrain=real` Puerto mode unchanged.
- [x] Add environment readiness handling for full island load.

Notes:
- Runtime URL: `http://127.0.0.1:5174/?tenerife=1&terrain=island-full` during local dev.
- First pass adds static mesh physics to the six normalized terrain tiles so player grounding can work. This must be replaced or narrowed with a simplified collider/height proxy before treating full-island traversal as production-ready.
- Puerto road ribbons and placeholder buildings are disabled by default in `island-full` mode until alignment is calibrated.
- The first temporary Puerto-relative spawn was too visually ambiguous and appeared near a flat edge/filler area. It was moved to the Teide-area terrain at about `x=-627, y=75, z=-12` runtime units for full-island visual QA.
- The follow-up spawn pass now scans the imported terrain meshes' actual world bounds and raycasts a grid onto the island, selecting the highest valid terrain hit. This avoids axis/sign mistakes from the source GLB coordinate conversion.
- The latest spawn pass restores the intended Puerto de la Cruz start. Full-island reset now raycasts at the calibrated Puerto marker position `x=441.53, z=-272.15`, searches nearby offsets if needed, and only falls back to the highest terrain hit when Puerto grounding fails.

## 3. Ocean And Safety

Status: Implemented first pass

Tasks:
- [x] Add a full-island ocean component or extend `TenerifeSafetyLayer` by mode.
- [x] Set first-pass water level from normalized island sea-level metadata.
- [x] Add seabed and deep-water reset bounds for full island.
- [x] Keep ocean visual mesh collision-free.
- [ ] Browser-check Puerto coast visibility.

Notes:
- Added `TenerifeOcean.tsx` for full-island mode.
- The reserve seabed is now invisible and non-pickable, so failed terrain grounding no longer presents as a brown floor.
- Existing `TenerifeSafetyLayer` remains for legacy island and Puerto patch modes.

## 4. Puerto Patch Placement

Status: Not started

Tasks:
- [ ] Define `PUERTO_FULL_ISLAND_ANCHOR`.
- [ ] Add debug markers for Puerto and Teide.
- [ ] Add a debug flag for full island plus Puerto patch.
- [ ] Align city patch scale/yaw/height against island surface.
- [ ] Avoid z-fighting between island terrain and city patch.
- [ ] Preserve Puerto building collisions when patch mode is enabled.

## 5. Collision And Traversal

Status: In progress

Tasks:
- [ ] Build a simplified terrain collider or sampled height proxy.
- [x] Add first-pass full-island terrain support snap to prevent the capsule falling through mesh physics.
- [x] Replace hard snap during full-island traversal with smoothed terrain-follow support.
- [x] Limit full-island sprint on steep terrain normals.
- [x] Switch full-island traversal from Havok velocity to kinematic terrain-follow movement.
- [x] Build a runtime full-island heightfield from terrain vertices to remove per-frame GLB raycasts.
- [x] Route full-island visual foot anchoring through the heightfield instead of per-frame GLB raycasts.
- [x] Disable full-island GLB mesh physics and reserve seabed physics after heightfield became traversal authority.
- [x] Throttle full-island HUD/minimap/zone React state sync to avoid per-frame MainScene rerenders during movement.
- [x] Disable the player Havok capsule in full-island traversal so movement is fully kinematic on the heightfield.
- [x] Add a first-pass full-island render performance profile: lower device pixel ratio cost, freeze static island transforms/materials, and skip unrelated prototype props.
- [x] Export a low-runtime full-island GLB at about 24k triangles for diagnostics.
- [x] Restore the full-quality normalized GLB after the low-runtime test did not isolate the freeze source.
- [x] Restore full visual quality after performance diagnostics by re-enabling antialiasing, device pixel ratio rendering, PBR lighting, collectibles, and the prototype prop.
- [x] Keep full GLB/PBR quality but make native device pixel ratio opt-in for full-island mode with `render=retina`.
- [x] Stop repeated keydown events and unused pointer look deltas from causing React state churn during movement/camera control.
- [x] Disable Babylon pointer-move picking in full-island mode to avoid mouse camera movement raycasting against the island.
- [x] Fix Puerto-area full-island player grounding so the visual model stands on the rendered terrain instead of heightfield-biased air.
- [ ] Test player grounding near Puerto.
- [ ] Test steep terrain behavior on Teide approach.
- [ ] Verify water reset from coastal fall.
- [ ] Measure physics cost before enabling full mesh collision.

## 6. Verification

Status: In progress

Tasks:
- [x] Run targeted config/runtime tests.
- [x] Run `bun run build`.
- [x] Run `bun run check` and separate baseline failures from new failures.
- [ ] Browser-check `?tenerife=1&terrain=island-full`.
- [ ] Browser-check `?tenerife=1&terrain=island-full&puerto=1`.
- [ ] Regression-check `?tenerife=1&terrain=real`.
- [ ] Capture screenshots for ocean, Puerto placement, and Teide terrain.

Verification notes:
- Passed: `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed: targeted Biome check for touched TypeScript files.
- Passed: `bun run build` with the existing Vite large chunk warning.
- Passed after latest ocean/spawn/cache-bust pass: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after latest ocean/spawn/cache-bust pass: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/tenerifePreviewConfig.ts`.
- Passed after latest ocean/spawn/cache-bust pass: `bun run build`.
- Passed after terrain-bounds spawn pass: `bun run test -- src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after terrain-bounds spawn pass: `bunx biome check src/scenes/environment/tenerifePreviewConfig.ts src/scenes/player/AssetPlayerVisual.tsx`.
- Passed after terrain-bounds spawn pass: `bun run build`.
- Passed after full-island support snap pass: `bunx biome check src/scenes/player/Player.tsx`.
- Passed after full-island support snap pass: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after full-island support snap pass: `bun run build`.
- Passed after smoothed terrain-follow pass: `bunx biome check src/scenes/player/Player.tsx`.
- Passed after smoothed terrain-follow pass: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after smoothed terrain-follow pass: `bun run build`.
- Passed after kinematic full-island traversal pass: `bunx biome check src/scenes/player/Player.tsx`.
- Passed after kinematic full-island traversal pass: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after kinematic full-island traversal pass: `bun run build`.
- Passed after runtime heightfield pass: `bunx biome check src/scenes/environment/tenerifeFullIslandHeightfield.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/player/Player.tsx`.
- Passed after runtime heightfield pass: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after runtime heightfield pass: `bun run build`.
- Passed after visual heightfield pass: `bunx biome check src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/Player.tsx src/scenes/environment/tenerifeFullIslandHeightfield.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx`.
- Passed after visual heightfield pass: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after visual heightfield pass: `bun run build`.
- Passed after disabling full-island mesh physics: `bunx biome check src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/Player.tsx src/scenes/environment/tenerifeFullIslandHeightfield.ts`.
- Passed after disabling full-island mesh physics: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after disabling full-island mesh physics: `bun run build`.
- Passed after 2048 texture budget rebuild: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/Player.tsx src/scenes/environment/tenerifeFullIslandHeightfield.ts`.
- Passed after 2048 texture budget rebuild: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed after 2048 texture budget rebuild: `bun run build`.
- Passed after full-island React sync throttle: `bunx biome check src/scenes/MainScene.tsx src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/Player.tsx src/scenes/environment/tenerifeFullIslandHeightfield.ts`.
- Passed after full-island React sync throttle: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed after full-island React sync throttle: `bun run build`.
- Passed after disabling the full-island player physics capsule: `bunx biome check src/scenes/player/Player.tsx`.
- Passed after disabling the full-island player physics capsule: `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed after disabling the full-island player physics capsule: `bun run build`.
- Passed after full-island render performance profile: `bunx biome check src/scenes/MainScene.tsx src/scenes/environment/TenerifeFullIslandTerrain.tsx`.
- Passed after full-island render performance profile: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/player/playerCapsuleMetrics.test.ts`.
- Passed after full-island render performance profile: `bun run build`.
- Passed after low-runtime GLB and pointer-move picking bypass: `bunx biome check src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/MainScene.tsx`.
- Passed after low-runtime GLB and pointer-move picking bypass: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/player/playerCapsuleMetrics.test.ts`.
- Passed after low-runtime GLB and pointer-move picking bypass: `bun run build`.
- Passed after restoring full-quality GLB: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx`.
- Passed after restoring full-quality GLB: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after restoring full-quality GLB: `bun run build`.
- Passed after restoring full visual quality: `bunx biome check src/scenes/MainScene.tsx src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/tenerifeFullIslandConfig.ts`.
- Passed after restoring full visual quality: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after restoring full visual quality: `bun run build`.
- Passed after full-island native device ratio opt-in: `bunx biome check src/scenes/MainScene.tsx src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed after full-island native device ratio opt-in: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after full-island native device ratio opt-in: `bun run build`.
- Passed after input state churn reduction: `bunx biome check src/scenes/player/usePlayerInput.ts src/scenes/player/usePlayerInput.test.ts src/scenes/MainScene.tsx`.
- Passed after input state churn reduction: `bun run test -- src/scenes/player/usePlayerInput.test.ts src/scenes/player/playerInputUtils.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after input state churn reduction: `bun run build`.
- Passed after Puerto full-island spawn pass: `bun run test -- src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed after Puerto full-island spawn pass: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifePreviewConfig.ts src/scenes/environment/tenerifePreviewConfig.test.ts`.
- Passed after Puerto full-island spawn pass: `bun run build`.
- Browser smoke after Puerto full-island spawn pass confirmed player marker at `left: 53.4282%; top: 64.9839%`, within `0.006%` of the Puerto de la Cruz marker.
- Passed after Puerto full-island grounding fix: `/Users/dmytrosichkar/.bun/bin/bun run test -- src/scenes/player/Player.test.ts src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`.
- Passed after Puerto full-island grounding fix: `/Users/dmytrosichkar/.bun/bin/bunx biome check src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/Player.test.ts TASKS/full-tenerife-island-integration/tasks.md`.
- Passed after Puerto full-island grounding fix: `/Users/dmytrosichkar/.bun/bin/bun run build` with the existing Vite large chunk warning.
- Local HTTP smoke after Puerto full-island grounding fix returned `200 OK` for `http://127.0.0.1:5173/?tenerife=1&terrain=island-full`.
- Browser MCP visual screenshot was not run because the Browser plugin's Node REPL execution tool was not available after tool discovery in this session.
- Still failing after Puerto full-island grounding fix: `/Users/dmytrosichkar/.bun/bin/bun run check` on the pre-existing unrelated Biome issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- `bun run check` still fails on pre-existing unrelated formatting/import issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Local HTTP smoke passed for `http://127.0.0.1:5174/?tenerife=1&terrain=island-full`.
- Local HTTP smoke passed for `http://127.0.0.1:5174/models/environment/tenerife-full-island-normalized.glb?v=2026-05-18-land-cut-spawn-pass`.
- Browser MCP could not start because its Chrome profile was already locked by an existing browser process, so visual screenshot QA is still pending.
