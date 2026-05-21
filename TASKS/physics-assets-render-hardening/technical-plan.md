# Technical Plan

## Phase 1: Full-Island Safety And Reset

Files:
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/TenerifeOcean.tsx`
- `src/scenes/environment/TenerifeSafetyLayer.tsx`
- `src/scenes/environment/tenerifePreviewConfig.ts`
- `src/scenes/environment/tenerifePreviewConfig.test.ts`

Implementation:
- Keep `TenerifeOcean` as a visual-only full-island ocean component.
- Render `TenerifeSafetyLayer` for all Tenerife modes so the reset loop runs regardless of ocean component.
- Add a prop to `TenerifeSafetyLayer` to suppress legacy water/seabed visuals when full-island ocean is already rendered.
- Update `teleportPlayerToCity` to mirror `Player.tsx` teleport behavior:
	- copy mesh position
	- reset rotation
	- compute world matrix
	- set `PhysicsPrestepType.TELEPORT`
	- call `setTargetTransform(resetPosition, Quaternion.Identity())`
	- zero linear and angular velocity
- Add tests around reset mode predicates where possible; behavior-heavy scene tests stay focused on pure helpers.

Risks:
- Duplicating water surfaces if composition is not explicit.
- React render order can create a short period before the player mesh exists; the safety loop must tolerate that.

Verification:
- `bun run test -- src/scenes/environment/tenerifePreviewConfig.test.ts`
- `bun run build`

## Phase 2: Heightfield Validity And Spawn Tests

Files:
- `src/scenes/environment/tenerifeFullIslandHeightfield.ts`
- `src/scenes/environment/tenerifeFullIslandHeightfield.test.ts`
- `src/scenes/environment/tenerifePreviewConfig.ts`
- `src/scenes/environment/tenerifePreviewConfig.test.ts`

Implementation:
- Track source coverage separately from filled heights:
	- keep `sourceDistances` or equivalent coverage metadata
	- fill only for interpolation stability
	- reject sampled positions whose nearest source cell is farther than the allowed local gap radius
- Keep small discretization holes playable near real terrain.
- Return `null` for large empty spans so player movement falls back/reset logic can recover instead of standing on invisible support.
- Extract or expose a pure heightfield builder that can be tested with synthetic point grids.
- Expand Puerto spawn tests with fake scene/pick adapters or exported pure helpers:
	- direct Puerto marker hit
	- offset fallback after primary miss
	- highest terrain fallback
	- configured fallback when no terrain exists

Risks:
- Too strict a coverage radius can make sparse valid slopes unsupported.
- Too loose a coverage radius preserves the invisible-water bug.

Verification:
- `bun run test -- src/scenes/environment/tenerifeFullIslandHeightfield.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`
- `bun run build`

## Phase 3: Physics Authority And Collision Filters

Files:
- `src/scenes/physics/collisionLayers.ts`
- `src/scenes/physics/collisionLayers.test.ts`
- `src/scenes/environment/TenerifeSafetyLayer.tsx`
- `src/scenes/environment/TerrainGround.tsx`
- `src/scenes/environment/PuertoCityTerrain.tsx`
- `src/scenes/environment/TenerifeIslandPreview.tsx`
- `src/scenes/player/Player.tsx`

Implementation:
- Add helper functions:
	- `applyCollisionFilterToShape(shape, layer, mask?)`
	- `applyCollisionFilterToBody(body, layer, mask?)`
	- `applyCollisionFilterToAggregate(aggregate, layer, mask?)`
- Apply filters to imperative aggregate creation sites first because they expose the aggregate immediately.
- Apply filters to player body once its physics body/shape exists.
- Apply explicit `ground`, `player`, and `worldBounds` layers to touched objects.
- Keep full-island scripted movement marked as a controlled technical debt if a full capsule migration would destabilize the prototype in this pass.

Risks:
- `react-babylonjs` aggregate creation timing may require applying filters after the first physics body is attached.
- Over-narrow masks can break existing broad interactions, so apply only the default masks for known layers first.

Verification:
- `bun run test -- src/scenes/physics/collisionLayers.test.ts src/scenes/player/playerCapsuleMetrics.test.ts`
- `bun run build`

## Phase 4: Runtime Packaging

Files:
- `package.json`
- `scripts/prune-public-assets.mjs`
- `scripts/prune-public-assets.test.mjs`

Implementation:
- Add a post-build prune script that removes known source-only and unused files from `dist`, not from `public`.
- Prune file extensions and paths:
	- `.blend`
	- `.fbx`
	- `.obj`
	- source `.zip`
	- `models/player/source`
	- source land model copies not referenced by runtime
	- unused texture maps such as `NormalDX`, displacement, source material formats where matching runtime code does not load them
- Keep runtime-loaded files:
	- normalized full-island GLB
	- Puerto terrain GLB
	- runtime hero GLB or current fallback source GLB until visual migration is complete
	- texture maps referenced by code
- Unit-test prune policy with representative paths.

Risks:
- Over-pruning can break direct runtime asset URLs.
- Vite copies all `public` assets before pruning; this improves deployment package size but does not yet fix repo layout.

Verification:
- `bun run test -- scripts/prune-public-assets.test.mjs`
- `bun run build`
- spot-check pruned files are absent from `dist`

## Phase 5: Player Model And Animation Hardening

Files:
- `src/scenes/player/AssetPlayerVisual.tsx`
- `src/scenes/player/playerAnimationRegistry.ts`
- `src/scenes/player/playerAnimationRegistry.test.ts`

Implementation:
- Add a small animation registry helper:
	- normalize clip names once
	- map states `idle`, `walk`, `sprint`, `jump` to candidate clip patterns
	- keep a deterministic fallback to the first group
- Replace inline substring search in `AssetPlayerVisual` with the registry.
- Prefer `public/models/player/player-hero-rigged.glb` if it contains usable animation groups; keep current Pumpkinboy source path as fallback if it does not.
- Keep root-motion stripping centralized and documented because imported hero assets are not yet final.

Risks:
- The runtime player GLB may not contain the same animation set as Pumpkinboy.
- Switching the default model path can silently change scale/pivot behavior; only switch after a test or runtime smoke confirms animations load.

Verification:
- `bun run test -- src/scenes/player/playerAnimationRegistry.test.ts`
- `bun run build`

## Phase 6: Dependency And Documentation Closure

Files:
- `package.json`
- `bun.lock`
- `docs/history/logs/<date>-physics-assets-render-hardening.md`
- Existing TASKS files in this epic.

Implementation:
- If the package cache already has React 19 type packages, update `@types/react` and `@types/react-dom` with Bun and commit lockfile changes.
- If network/package update is unavailable, leave a Deferred checklist item with the exact blocker.
- Add a session log covering references, changes, validation, and remaining risks.
- Update task statuses immediately after each phase.

Verification:
- `bun run test`
- `bun run build`
- `bun run check`, with baseline issues separated from introduced issues
