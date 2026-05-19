# Full Tenerife Island Analysis

Date: 2026-05-18

## Scope

Analyzed `public/models/land/tenerife._islas_canarias.glb` as the foundation for a complete Tenerife island runtime mode with ocean, reachable Teide terrain, and Puerto de la Cruz placed as a detailed city patch.

## References Used

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

## Findings

- The source asset is a Sketchfab GLB titled `Tenerife. Islas Canarias` by `Unknown08tf`.
- License is `CC-BY-4.0`; attribution is required before production use.
- Source URL is `https://sketchfab.com/3d-models/tenerife-islas-canarias-628865c6fe29460bb2f6a8ba8d223087`.
- File size is about `42 MB`.
- The asset contains 6 terrain tiles, about `368k` vertices and `720k` triangles.
- The embedded base-color texture is `8192 x 8192`.
- Model bounds are about `122 km x 122 km`, with max elevation around `3653 m`, matching Teide-scale terrain.
- Blender imports the asset successfully outside the default sandbox.
- The current `?tenerife=1&terrain=real` mode remains a Puerto patch, not a full island.

## Planning Output

Created `TASKS/full-tenerife-island-integration/` with:

- product plan
- roadmap
- technical plan
- asset intake
- texture budget
- physics plan
- task checklist

## Normalization Pass

Added `scripts/blender/normalize_tenerife_full_island.py` and generated:

- `public/models/environment/tenerife-full-island-normalized.glb`
- `public/data/tenerife/full-island-metadata.json`

The normalized GLB is about `24 MB`, down from the `42 MB` source GLB. The pass keeps the source file untouched, renames terrain tiles with stable semantic names, downscales the embedded albedo texture to `4096 x 4096`, and records CC-BY-4.0 attribution metadata.

Remaining normalization issue: the exported hierarchy still contains Sketchfab wrapper nodes. This does not block runtime loading, but it should be flattened before final integration.

## Runtime First Pass

Added a separate full-island terrain mode:

- `?tenerife=1&terrain=island-full`

Main runtime changes:

- `src/scenes/environment/tenerifeFullIslandConfig.ts`
- `src/scenes/environment/TenerifeFullIslandTerrain.tsx`
- `src/scenes/environment/TenerifeOcean.tsx`
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/puertoCityConfig.ts`
- `src/scenes/environment/tenerifePreviewConfig.ts`
- `src/scenes/player/roofParkourController.ts`

The first pass loads the normalized full-island GLB, marks the six terrain tiles as pickable, adds static mesh physics to the terrain tiles, and uses a separate ocean/seabed layer. The player reset path now recognizes full-island terrain tile names and uses a temporary Puerto-area spawn derived from Teide-relative real-world offsets.

Puerto OSM road ribbons and placeholder buildings are disabled by default in `island-full` mode until the city patch transform is calibrated.

Validation:

- `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- Targeted Biome check for touched TypeScript files passed.
- `bun run build` passed with the existing Vite large chunk warning.
- `bun run check` still fails on pre-existing unrelated formatting/import issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- HTTP smoke for `http://127.0.0.1:5174/?tenerife=1&terrain=island-full` returned `200`.
- HTTP smoke for the normalized full-island GLB returned `200` and `Content-Length: 25290800`.

Visual browser QA is pending because the browser MCP Chrome profile was locked by an existing browser process during this session.

## Decision

Use the found GLB as a source asset, not as a direct runtime import. The next implementation phase should normalize it in Blender, add a separate full-island runtime mode, then align the existing Puerto city patch onto the north coast.

## Follow-up Runtime Correction

The first browser visual pass showed the full island in the distance but left the player standing on a flat brown slab. The source GLB contained a large flat sea/background mesh, so the normalizer now removes faces below `1.5m` elevation before export. The normalized runtime GLB is now about `8.0 MB`.

Runtime changes after that visual pass:

- cache-busted the normalized GLB URL with `v=2026-05-18-land-cut-spawn-pass`
- made the reserve seabed invisible and non-pickable
- moved the temporary full-island spawn to the Teide-area terrain at about `x=-627, y=75, z=-12`
- kept the ocean visual collision-free and just below sea level

Validation after the correction:

- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/tenerifePreviewConfig.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Terrain-Bounds Spawn Correction

The next visual pass still placed the player in the ocean with the island visible in the distance. The fix now resolves the full-island spawn from the imported terrain meshes themselves:

- collect world-space bounds from enabled `tenerife-full-island-terrain-tile-*` meshes with renderable vertices
- scan a grid across those bounds with downward raycasts
- choose the highest valid terrain hit above sea level
- include full-island terrain mesh names in the player visual ground probe

Validation:

- `bun run test -- src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bunx biome check src/scenes/environment/tenerifePreviewConfig.ts src/scenes/player/AssetPlayerVisual.tsx` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Full-Island Support Snap

The next visual pass spawned the player above the island but the capsule quickly fell through the terrain. That confirms the visual terrain raycast is correct, while the first-pass Havok mesh collider is not reliable enough for this large imported GLB.

Added a runtime support snap in `src/scenes/player/Player.tsx` for `?tenerife=1&terrain=island-full`:

- cast down from above the player against full-island terrain tiles
- calculate capsule center height from the hit floor height
- if the capsule has reached or passed that surface, teleport it back onto the terrain and zero vertical velocity

Validation:

- `bunx biome check src/scenes/player/Player.tsx` passed.
- `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Runtime Heightfield Traversal Optimization

Movement still froze because even the kinematic traversal used GLB raycasts while moving. Added `src/scenes/environment/tenerifeFullIslandHeightfield.ts`:

- builds a compact `192 x 192` heightfield once after the full-island GLB loads
- samples runtime world-space vertices from the terrain tiles
- fills empty cells by neighbor propagation
- serves O(1) height queries for player traversal
- keeps GLB raycast only as fallback before the heightfield exists

Validation:

- `bunx biome check src/scenes/environment/tenerifeFullIslandHeightfield.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/player/Player.tsx` passed.
- `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Kinematic Full-Island Traversal

The smoothed support layer still jittered because Havok velocity and the GLB mesh collider continued to fight the manual terrain correction. Full-island traversal now uses a kinematic terrain-follow path:

- in `?tenerife=1&terrain=island-full`, the player controller moves X/Z directly from semantic movement input
- the next Y is resolved from terrain raycast at the proposed X/Z location
- the physics body is teleported to that controlled transform with zero linear/angular velocity
- the regular physics velocity path remains unchanged outside full-island mode

This is a prototype traversal bridge until a simplified height proxy or collider is generated for Tenerife.

Validation:

- `bunx biome check src/scenes/player/Player.tsx` passed.
- `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Smoothed Full-Island Terrain Follow

Sprinting on the full island still jittered because the emergency support snap teleported the capsule back to terrain whenever Havok missed a contact. Replaced the hard snap behavior with a full-island-only terrain-follow layer:

- raycast full-island terrain under the player every frame
- smoothly clamp vertical correction instead of teleporting directly to the hit point
- preserve horizontal movement velocity during correction
- recover faster when the capsule has already slipped below the terrain
- disable sprint on very steep terrain normals to avoid rapid contact churn

Validation:

- `bunx biome check src/scenes/player/Player.tsx` passed.
- `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Full-Island Player Physics Bypass

After GLB terrain physics, seabed physics, visual raycasts, and React state sync were removed from the movement hot path, movement still froze while pressing movement keys. The remaining high-risk interaction was the player's Havok capsule itself: full-island traversal was already kinematic on the generated heightfield, but the capsule physics aggregate was still mounted and the frame loop still required a physics body before entering the full-island movement branch.

Updated `src/scenes/player/Player.tsx` so `?tenerife=1&terrain=island-full` does not mount the player physics aggregate. The full-island branch now moves the player mesh directly on the heightfield and keeps Pumpkinboy as the visual target. Other terrain modes still use the existing Havok capsule path.

Validation:

- `bunx biome check src/scenes/player/Player.tsx` passed.
- `bun run test -- src/scenes/player/playerCapsuleMetrics.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Full-Island Render Performance Profile

The next report clarified that camera movement also froze, while player movement made it worse. That points to render/GPU cost as the baseline problem, with movement adding camera follow and animation work on top.

Added a first-pass full-island render profile:

- disable `adaptToDeviceRatio` and antialiasing for `?tenerife=1&terrain=island-full` to avoid retina-sized canvas rendering
- mark the imported island PBR material as unlit and freeze it after runtime tuning
- freeze full-island terrain world matrices and bounding info after scaling
- skip starter collectibles and the prototype physics donut in full-island mode while this mode is being validated

Validation:

- `bunx biome check src/scenes/MainScene.tsx src/scenes/environment/TenerifeFullIslandTerrain.tsx` passed.
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/player/playerCapsuleMetrics.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Low Runtime GLB And Pointer Move Picking Bypass

The render profile did not improve the user's local camera and movement freezes. Added two deeper mitigations:

- the Blender normalizer now also exports `public/models/environment/tenerife-full-island-runtime-low.glb`
- the low runtime export uses Blender decimation at `0.24`, reducing the active island from about `100542` triangles to about `24126` triangles
- `?tenerife=1&terrain=island-full` now loads the low-runtime GLB with cache bust `v=2026-05-19-runtime-low-24`
- while the full-island terrain is mounted, `scene.skipPointerMovePicking` is enabled so Babylon does not run automatic pointer-move picking against the large pickable island during mouse camera movement

Validation:

- `blender -b --python scripts/blender/normalize_tenerife_full_island.py` passed and wrote both GLBs.
- `bunx biome check src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/MainScene.tsx` passed.
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/player/playerCapsuleMetrics.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Full-Quality Island Restore

The low-runtime GLB did not improve the user's local freeze enough to justify a visual quality downgrade. Restored `?tenerife=1&terrain=island-full` to the full normalized island GLB:

- active model: `public/models/environment/tenerife-full-island-normalized.glb`
- diagnostic low model retained on disk for future A/B testing: `public/models/environment/tenerife-full-island-runtime-low.glb`
- `scene.skipPointerMovePicking` remains enabled while full-island terrain is mounted because it targets camera pointer-move overhead without reducing visual quality

Validation:

- `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx` passed.
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Full Visual Quality Restore

The full GLB was restored, but several render-quality diagnostics were still active. Restored the visual settings as well:

- re-enabled `antialias` and `adaptToDeviceRatio` on the Babylon engine
- restored the island material to lit PBR by removing the temporary `unlit` override
- restored full-island rendering of letter collectibles and the prototype physics prop
- kept `scene.skipPointerMovePicking` because it does not alter visual quality

Validation:

- `bunx biome check src/scenes/MainScene.tsx src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/tenerifeFullIslandConfig.ts` passed.
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Native Device Ratio Opt-In

After full visual restore, the severe freezes returned. That makes the device-pixel-ratio render target the most likely major cost: on a DPR 2 display, native device ratio renders about four times as many pixels as CSS-pixel rendering.

Adjusted full-island mode to keep the full normalized GLB, PBR lighting, antialiasing, collectibles, and prototype prop, but make native device ratio opt-in:

- default full-island URL renders at CSS pixel ratio for stability: `?tenerife=1&terrain=island-full`
- native device ratio comparison URL: `?tenerife=1&terrain=island-full&render=retina`

Validation:

- `bunx biome check src/scenes/MainScene.tsx src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts` passed.
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.

## Input State Churn Reduction

After the DPR change, the user still reported freezes while moving and smaller freezes while moving the camera. This shifted the likely cause from island asset quality alone to per-input-frame React state churn.

Reduced player input updates that do not change gameplay commands:

- repeated browser `keydown` events for already-held movement keys are ignored before command synchronization
- command snapshots are compared before committing state, so identical movement/action states reuse the current object
- the main scene disables unused pointer look command publishing because camera rotation is owned by `SceneCamera`
- Pumpkinboy remains rendered and the full-quality island model remains active

Validation:

- `bunx biome check src/scenes/player/usePlayerInput.ts src/scenes/player/usePlayerInput.test.ts src/scenes/MainScene.tsx` passed.
- `bun run test -- src/scenes/player/usePlayerInput.test.ts src/scenes/player/playerInputUtils.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts` passed.
- `bun run build` passed with the existing Vite large chunk warning.
