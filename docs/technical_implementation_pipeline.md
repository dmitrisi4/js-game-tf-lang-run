# Key Arena technical implementation pipeline

## Purpose

This file turns the realism/RPG direction into an implementation sequence that can be executed safely in small vertical slices. The goal is to keep the codebase data-driven: world content should live in typed data modules, while scene components render and simulate that data.

## Current Implementation Slice

Implemented:

1. **World Zones Foundation**.
2. **Zone-Aware Terrain Ground**.

Why first:

- terrain needs zone boundaries;
- lighting/fog needs zone ambience;
- foliage density needs zone identity;
- NPCs and creatures need home zones;
- quests and discovery waves need semantic locations;
- HUD/debug tools need a stable location label.

## Technical Principles

1. Prefer data modules over hardcoded JSX.
2. Keep `MainScene` orchestration-focused.
3. Make each system testable without rendering Babylon.
4. Add gameplay state only when a rendered feature needs it.
5. Keep validation commands green after every slice:
   - `npm run check`;
   - `npm test`;
   - `npm run build`.

## Slice 1 - World Zones Foundation

Files:

- `src/scenes/environment/worldZones.ts`
- `src/scenes/environment/worldZones.test.ts`
- `src/scenes/MainScene.tsx`
- `src/ui/GameHud.tsx`

Implementation:

1. Define stable zone ids:
   - `starter-clearing`;
   - `ember-camp`;
   - `north-grove`;
   - `east-ruins`;
   - `west-ridge`.
2. Add typed zone metadata:
   - display name;
   - center;
   - radius;
   - terrain material key;
   - ambient color;
   - fog density;
   - linked discovery waves.
3. Add helper APIs:
   - `getZoneById`;
   - `getZoneForPosition`;
   - `getZoneForDiscoveryWave`;
   - `isPositionInsideWorldBounds`;
   - `isPositionInsideZone`.
4. Track current player zone in `MainScene`.
5. Display current zone in HUD.
6. Add unit tests for ids, bounds, representative positions, and discovery-wave bindings.

Acceptance criteria:

- current zone is visible in HUD;
- every discovery wave can map to a semantic zone;
- zone APIs are independent from Babylon rendering;
- tests cover the zone contract.

## Slice 2 - Zone-Aware Ground Materials

Status: implemented.

Files:

- `src/scenes/environment/TerrainGround.tsx`
- `src/scenes/environment/terrainData.ts`
- `src/scenes/environment/Ground.tsx`
- `src/scenes/environment/WorldScenery.tsx`

Implementation:

1. Extract current flat ground into a terrain module.
2. Add deterministic height helper:
   - clearing: almost flat;
   - ember camp: shallow depression;
   - north grove: soft mound;
   - west ridge: elevated ridge;
   - east ruins: flat stone platform.
3. Add testable height sampling.
4. Keep physics stable with a static terrain collider.
5. Add visual material bands through vertex colors.
6. Align world scenery, NPC placeholders, props, and ambient creatures to terrain height.

Acceptance criteria:

- player can traverse all zones;
- collectibles remain reachable;
- ground ray still detects grounded state;
- terrain helpers are covered by tests.

## Slice 3 - Zone-Aware Lighting

Files:

- `src/scenes/environment/Lighting.tsx`
- `src/scenes/environment/zoneAtmosphere.ts`

Implementation:

1. Add scene fog.
2. Add directional sun shadow setup.
3. Add zone atmosphere lookup from current player zone.
4. Lerp fog/ambient settings when moving between zones.
5. Keep collectibles readable with emissive material.

Acceptance criteria:

- no sudden lighting jumps at zone boundaries;
- camp, grove, ridge, and ruins read differently;
- production build remains green.

## Slice 4 - Foliage Scenery

Files:

- `src/scenes/environment/foliageData.ts`
- `src/scenes/environment/FoliageScenery.tsx`

Implementation:

1. Define foliage spawn records.
2. Add per-zone density presets.
3. Render grass, bushes, mushrooms, stumps, branches, flowers, and small stones.
4. Keep most foliage non-collidable.
5. Use instancing once object count grows.

Acceptance criteria:

- every zone gains distinct ground detail;
- player paths stay clear;
- performance does not regress materially.

## Slice 5 - NPC Interaction Layer

Files:

- `src/scenes/npc/npcData.ts`
- `src/scenes/npc/NpcInteractionBridge.tsx`
- `src/ui/DialogOverlay.tsx`

Implementation:

1. Promote NPC placeholders into data-backed actors.
2. Add nearest-NPC detection.
3. Add interaction priority over collectibles/props.
4. Add simple dialog overlay.
5. Let dialog read objective and crafted-word state.

Acceptance criteria:

- `E` interaction target is deterministic;
- NPC prompts do not conflict with collectible prompts;
- first dialog flow works with Alie and Mira.

## Slice 6 - Creature Behavior Controller

Files:

- `src/scenes/creatures/creatureData.ts`
- `src/scenes/creatures/CreatureController.tsx`

Implementation:

1. Add creature behavior state.
2. Add wander, curious, flee, and return-home states.
3. Update only nearby creatures.
4. Keep ambient creatures non-blocking until combat exists.

Acceptance criteria:

- creatures respond to player proximity;
- creatures return to home zone;
- no creature exits world bounds.

## Slice 7 - Interactable Props

Files:

- `src/scenes/interactions/interactableProps.ts`
- `src/scenes/interactions/PropInteractionBridge.tsx`

Implementation:

1. Add prop interaction definitions.
2. Support campfire, crate, obelisk, herb node, and chest actions.
3. Add prop state to store.
4. Add HUD prompt and action feedback.

Acceptance criteria:

- interactable props persist state;
- action text matches prop state;
- prop interaction does not conflict with NPC/collectible interaction.

## Slice 8 - Persistence

Files:

- `src/store/persistence.ts`
- `src/store/useGameStore.ts`

Implementation:

1. Add save schema version.
2. Persist inventory, crafted words, completed objectives, prop states, discovered zones.
3. Add migration-safe load.
4. Add reset save.

Acceptance criteria:

- reload keeps meaningful progress;
- invalid saves fail safely;
- tests cover migrations and reset.

## Slice 9 - Audio and Feedback

Files:

- `src/audio/audioData.ts`
- `src/audio/AudioManager.ts`

Implementation:

1. Add event audio.
2. Add loop audio.
3. Add positional campfire/obelisk audio.
4. Add movement footstep timing.

Acceptance criteria:

- sounds do not duplicate after reload;
- loops dispose correctly;
- mute/volume can be added later.

## Slice 10 - Performance and Browser Smoke Test

Files:

- `tests/e2e/scene-smoke.spec.ts` or matching local convention.

Implementation:

1. Add scene load smoke test.
2. Track mesh count and console errors.
3. Convert repeated scenery to instances where needed.
4. Add distance-based update gates.

Acceptance criteria:

- scene loads in browser automation;
- no startup console errors;
- large Babylon chunk warning is tracked separately from correctness.
