# keyArena MVP Implementation Plan

## Goal
Deliver a playable vertical slice of the "crafting through discovery" loop:
- Third-person movement in a stable 3D scene.
- Collect letters and words from the world.
- Craft valid words from collected letters.
- Reflect gameplay state in a minimal React HUD.

## Architecture Invariants
- React owns app composition, overlays, and non-frame-critical state rendering.
- Babylon owns scene graph, camera rig, physics bodies, raycasts, and per-frame updates.
- Zustand is the single source of truth for persistent gameplay state:
	- player stats
	- inventory
	- progression
	- UI visibility
- Transient scene events are not stored as durable state:
	- collision enter/exit
	- pickup VFX/SFX triggers
	- camera shake requests
- An event bus is allowed only for ephemeral side effects. It must not duplicate inventory, HP, XP, or interaction state already stored in Zustand.
- World scale is fixed at `1 unit = 1 meter`.
- New gameplay features must ship with tests in the same phase, not as end-of-project cleanup.

## Target Module Map
- `src/scenes/MainScene.tsx`
	- Composition root only.
	- Wires engine, scene, and top-level feature modules.
- `src/assets/`
	- `models/`
	- `textures/`
	- `animations/`
	- `audio/`
- `src/scenes/environment/`
	- `Environment.tsx`
	- `Lighting.tsx`
	- `Ground.tsx`
- `src/scenes/player/`
	- `Player.tsx`
	- `PlayerController.ts`
	- `PlayerCamera.ts`
	- `usePlayerInput.ts`
- `src/scenes/collectibles/`
	- `Collectible.tsx`
	- `CollectibleRegistry.ts`
- `src/store/`
	- `useGameStore.ts`
	- `selectors.ts`
- `src/gameplay/`
	- `crafting.ts`
	- `dictionary.ts`
	- `events.ts`
- `src/ui/`
	- `Hud.tsx`
	- `InventoryOverlay.tsx`

## 3D Asset Pipeline
Reference workflow: `docs/ai_asset_workflow.md`

### Asset format and layout
- Default runtime model format is `glb`.
- Source DCC files such as `.blend` or `.ma` are not runtime dependencies and should not be loaded by the app.
- Runtime assets should be grouped by type:
	- `src/assets/models`
	- `src/assets/textures`
	- `src/assets/animations`
- File naming should be stable and semantic:
	- `player-adventurer.glb`
	- `collectible-letter-a.glb`
	- `environment-ruins-column.glb`
- Large optional asset sets should be organized by feature or biome, not dumped into one flat folder.

### Loading contract
- Critical gameplay assets should preload before gameplay starts:
	- player model
	- core animations
	- essential collectibles
- Optional environment props may be lazy-loaded after scene boot.
- Asset loading must be wrapped behind a narrow loader layer rather than spread across scene components.
- Loader responsibilities:
	- resolve URL/path
	- load model/container
	- surface loading and failure state
	- expose instantiated meshes/animation groups to scene modules
- Runtime code should prefer cloned or instantiated assets from loaded containers instead of re-importing the same file multiple times.

### Player model contract
- Player runtime entity is split into:
	- physics capsule as authoritative locomotion body
	- visual mesh as presentation child or follower
- Visual mesh must not become the source of truth for collisions or movement.
- Player asset requirements:
	- root transform aligned to world forward convention
	- scale authored to meters
	- separate animation clips or animation groups for:
		- idle
		- locomotion
		- interact
		- damage or hit reaction if available
- If the imported model skeleton or clip naming is inconsistent, normalize it once in the asset layer instead of scattering mapping logic across gameplay code.

### Collectible and prop contract
- Interactive asset requirements:
	- predictable root node
	- centered or documented pivot
	- authored scale in meters
	- clear visual silhouette at gameplay distance
- Collectibles should use simple collider shapes for interaction, not triangle mesh collisions by default.
- Static environment props may use simplified authored collision meshes or primitive colliders, depending on cost and importance.

### Animation contract
- Animation state should be driven by gameplay/controller intent, not by direct component-local toggles.
- Use a narrow animation state machine or mapping layer for:
	- idle
	- move
	- interact
	- damaged
- Clip naming mismatches from imported assets should be normalized into project-level semantic names.
- Blending rules should be defined in one place to avoid divergent transitions across entities.

### Material and lighting contract
- Prefer Babylon-compatible PBR materials for imported assets.
- Lighting decisions must be tested against the actual material response of imported assets, not only primitive meshes.
- Shadow-casting policy should be explicit:
	- player casts shadows
	- large hero props may cast shadows
	- small collectibles should cast shadows only if the cost is acceptable

### Performance budgets
- MVP should target modest scene budgets appropriate for desktop-first development with a future mobile path.
- Initial guardrails:
	- avoid unnecessary unique materials
	- prefer instancing for repeated props
	- limit real-time shadow casters
	- avoid mesh colliders for dynamic gameplay entities
	- keep texture sizes intentional rather than defaulting to oversized imports
- Before expanding content density, validate scene behavior with representative imported assets instead of only Babylon primitives.

## State Ownership
### Zustand owns
- `playerStats`: `{ hp, maxHp, level, xp, nextLevelXp }`
- `inventory`: `{ letters: string[], words: string[] }`
- `ui`: `{ isInventoryOpen: boolean }`
- pure actions:
	- `collectLetter(letter)`
	- `collectWord(word)`
	- `craftWord(word)`
	- `grantXp(amount)`
	- `takeDamage(amount)`
	- `toggleInventory()`

### Babylon runtime owns
- physics bodies and aggregates
- camera transform and smoothing
- movement vectors derived from current input snapshot
- raycast hit results for current frame

### Event bus owns
- one-shot notifications such as:
	- `pickup:collected`
	- `player:damaged`
	- `craft:success`
- no persistent state

## Input Contract
- Input must be normalized into semantic commands, not raw device bindings.
- Initial command set:
	- `move: Vector2`
	- `look: Vector2`
	- `jump: boolean`
	- `interact: boolean`
	- `openInventory: boolean`
- Desktop and mobile adapters both publish the same command shape.
- Player movement is camera-relative.
- Input sampling happens before physics/movement application each frame.
- Pointer lock and focus loss must clear volatile look/move state to avoid stuck input.

## Camera And Physics Contract
- Use a physics-driven player capsule as the authoritative locomotion body.
- Movement should be implemented with velocity/impulse rules in one controller layer only.
- Continuous Collision Detection must be enabled for fast-moving dynamic bodies when needed.
- Camera logic must live outside `Player.tsx` rendering markup:
	- follow target smoothing
	- obstruction/collision handling
	- yaw/pitch limits
- Interaction uses forward raycasts from player/camera intent, not broad store polling.

## Phase 1: Foundation And Scene Decomposition
- [ ] Split the current monolithic scene into composition modules:
	- `MainScene.tsx` becomes a thin composition root.
	- Extract `Environment.tsx` with lighting, sky, and ground ownership.
- [ ] Define environment baseline:
	- directional + hemispheric light
	- shadow generator
	- larger physics-enabled ground
	- consistent world scale
- [ ] Gate debug tooling:
	- Babylon Inspector must be dev-only and opt-in
	- no always-on debug overlays in production path
- [ ] Establish asset pipeline baseline:
	- create asset directories and naming conventions
	- decide critical preload set
	- define loader abstraction boundary
- [ ] Add basic scene smoke tests or at minimum module-level tests for extracted pure logic.

### Phase 1 exit criteria
- Scene responsibilities are split into dedicated files.
- `MainScene.tsx` remains orchestration-only.
- Scene still renders with physics enabled.
- Asset loading strategy is documented before importing production models.

## Phase 2: Core State And Input
- [ ] Replace placeholder store with gameplay-oriented state slices.
- [ ] Add selectors for HUD-facing reads to keep React components narrow.
- [ ] Introduce semantic input layer:
	- one adapter for keyboard/mouse
	- one interface prepared for mobile joystick input
- [ ] Add a small event bus only for ephemeral effects.
- [ ] Add unit tests for:
	- store actions
	- selectors
	- input normalization
	- event bus behavior if introduced

### Phase 2 exit criteria
- No gameplay-critical state lives only in component-local React state.
- Input can be consumed by the player controller without direct DOM key checks.
- Tests exist for state transitions and input mapping.

## Phase 3: Player Controller
- [ ] Implement `Player.tsx` as scene entity markup only.
- [ ] Move behavior into controller modules:
	- capsule setup
	- grounded checks
	- movement integration
	- interaction raycasts
- [ ] Integrate first real player asset:
	- visual mesh follows physics capsule
	- animation mapping for idle and locomotion
- [ ] Implement third-person camera rig with smoothing and obstruction handling.
- [ ] Wire player events to Zustand actions:
	- damage
	- XP gain
	- pickup interaction
- [ ] Add tests for pure controller utilities and interaction rules where practical.

### Phase 3 exit criteria
- Player can move reliably with camera-relative controls.
- Camera does not clip aggressively through environment.
- Interaction path is defined through raycast -> gameplay action -> store update.
- Real player model works with physics body without turning the mesh into gameplay authority.

## Phase 4: Discovery And Crafting Loop
- [ ] Implement generic `Collectible` entity with:
	- presentation
	- collision/interaction registration
	- payload type: letter or word
- [ ] Integrate first non-primitive collectible assets and validate:
	- pivots
	- scale
	- collider fit
	- readability at gameplay distance
- [ ] Add collectible resolution flow:
	- detect collectible
	- validate pickup
	- update store
	- emit one-shot feedback event
- [ ] Implement dictionary-backed crafting logic as pure functions.
- [ ] Add HUD and inventory overlay in React.
- [ ] Add unit tests for:
	- collectible resolution rules
	- crafting validity
	- inventory mutations

### Phase 4 exit criteria
- Player can collect letters.
- Crafting a valid word updates inventory/state correctly.
- UI reflects inventory and progression state without querying Babylon objects directly.
- At least one imported player asset and one imported collectible asset are validated in the gameplay loop.

## Phase 5: Stabilization And Validation
- [ ] Align tooling with actual workflow:
	- `bun run check` should validate predictably
	- formatting and validation should not be conflated in CI gates
- [ ] Add a small regression suite covering the MVP gameplay loop.
- [ ] Validate representative 3D content under expected scene load:
	- imported player model
	- imported collectibles
	- imported environment props if present
- [ ] Document implemented architecture decisions in `docs/history/logs/`.
- [ ] Reconcile plan vs code structure after MVP completion.

### Phase 5 exit criteria
- `bun run check` passes.
- `bun run test --run` passes.
- MVP loop is covered by tests and documentation.
- Asset integration path is proven on real imported content, not only primitive placeholders.

## Delivery Order
1. Decompose the scene and lock module boundaries.
2. Replace placeholder state and introduce semantic input.
3. Add player controller and camera rig.
4. Add collectibles, crafting, and HUD.
5. Tighten validation and document the resulting architecture.
