# Key Arena realism implementation pipeline

## Goal

Increase realism in `keyArena` without losing the current prototype loop: player movement, discovery letters, crafting, XP, HUD, and the expanded RPG map. The main direction is to move from a flat arena with decorative objects toward a reactive RPG world with authored zones, terrain, lighting, NPC interaction, creature behavior, sound, and persistence.

## Current baseline

- React + Vite + Babylon.js scene.
- Havok physics enabled.
- Controllable player with camera-relative movement.
- Follow camera.
- Expanded 96x96 map.
- Data-driven scenery in `worldData.ts`.
- Trees, rocks, props, NPC placeholders, and ambient creatures.
- Letter discovery waves: `starter`, `ember`, `grove`.
- Inventory, word crafting, HP, XP, and level progression.

## Phase 1 - World Zones

Purpose: make the map readable and give every object a semantic home.

Implementation:

1. Add `src/scenes/environment/worldZones.ts`.
2. Define zones:
   - `starter-clearing`;
   - `ember-camp`;
   - `north-grove`;
   - `east-ruins`;
   - `west-ridge`.
3. For each zone store:
   - id;
   - display name;
   - center;
   - radius or bounds;
   - ambient color;
   - fog settings;
   - terrain material weights;
   - allowed props;
   - allowed NPC ids;
   - allowed creature ids;
   - discovery wave ids.
4. Add helper functions:
   - `getZoneForPosition(position)`;
   - `isPositionInsideZone(position, zoneId)`;
   - `getZoneSpawnPoints(zoneId)`.
5. Add tests:
   - zone ids are unique;
   - zones stay inside `WORLD_SIZE`;
   - zone spawn points stay inside their zone.

Acceptance criteria:

- `MainScene` does not need hardcoded knowledge of map regions.
- Discovery waves and future quests can reference zone ids.
- HUD/debug tools can report the current zone.

## Phase 2 - Terrain Ground

Purpose: replace the flat arena feel with a believable landscape.

Implementation:

1. Add `src/scenes/environment/TerrainGround.tsx`.
2. Replace or wrap the current `Ground.tsx` implementation.
3. Start with a procedural grid or heightmap:
   - shallow center clearing;
   - southern camp depression;
   - northern grove mound;
   - western ridge elevation;
   - eastern ruin platform.
4. Add terrain color/material zones:
   - grass;
   - dirt path;
   - moss;
   - rock;
   - camp ash.
5. Keep physics stable:
   - static terrain collider;
   - player ground ray still works;
   - jump and landing remain predictable.
6. Add tests around authored height helpers if terrain is generated from data.

Acceptance criteria:

- player cannot fall through terrain;
- camera does not dip below terrain on slopes;
- collectibles remain reachable;
- traversal between zones feels continuous.

## Phase 3 - Lighting, Shadows, Atmosphere

Purpose: add visual depth and stronger location identity.

Implementation:

1. Update `src/scenes/environment/Lighting.tsx`.
2. Add or tune:
   - directional sun;
   - shadow generator;
   - hemispheric fill light;
   - scene fog;
   - warmer campfire point light;
   - subtle grove/ruin ambience.
3. Add zone-aware lighting data later:
   - grove: cooler green ambient;
   - camp: warm orange accent;
   - ruins: desaturated blue-gray;
   - ridge: clearer high-contrast daylight.
4. Ensure collectibles keep readable emissive material.

Acceptance criteria:

- player, NPCs, and collectibles are readable in all zones;
- shadows do not flicker under movement;
- fog improves distance depth without hiding objectives.

## Phase 4 - Foliage and Small Props

Purpose: fill dead space without hand-authoring JSX one object at a time.

Implementation:

1. Add `src/scenes/environment/foliageData.ts`.
2. Add object types:
   - grass clump;
   - bush;
   - mushroom;
   - stump;
   - fallen branch;
   - flower;
   - small stone;
   - herb node.
3. Add `src/scenes/environment/FoliageScenery.tsx`.
4. Spawn foliage from data:
   - position;
   - yaw;
   - scale;
   - color variant;
   - optional collision.
5. Keep most small foliage non-collidable.
6. Use instances or thin instances when object count grows.

Acceptance criteria:

- each zone has distinct ground clutter;
- FPS remains stable;
- foliage does not block core traversal unless explicitly marked as collision.

## Phase 5 - NPC Interaction

Purpose: convert NPC placeholders into actors the player can recognize and use.

Implementation:

1. Add `src/scenes/npc/npcData.ts`.
2. Add fields:
   - id;
   - name;
   - role;
   - zoneId;
   - homePosition;
   - lookAtPlayerRadius;
   - interactionRadius;
   - dialogTreeId;
   - capabilities: dialog, crafting, quest, shop.
3. Add `NpcInteractionBridge.tsx`.
4. Detect nearest NPC.
5. Add interaction priority:
   - NPC;
   - collectible;
   - interactable prop.
6. Add HUD prompt for NPCs.
7. Add basic dialog overlay.
8. Add idle behaviors:
   - sway;
   - turn toward player;
   - short patrol;
   - gesture loop.

Acceptance criteria:

- `E` interaction is deterministic when multiple targets overlap;
- NPC names and roles appear only when useful;
- dialog can read current objective/crafted words.

## Phase 6 - Creature Behavior

Purpose: make creatures feel alive instead of decorative.

Implementation:

1. Expand `WorldCreature`.
2. Add behavior fields:
   - behavior type: ambient, timid, curious, hostile later;
   - home position;
   - wander radius;
   - fear radius;
   - curiosity radius;
   - speed;
   - state.
3. Add `CreatureController.tsx`.
4. Implement states:
   - idle;
   - wander;
   - curious;
   - flee;
   - returnHome.
5. Update creatures only when near the player.
6. Keep ambient creatures non-blocking at first.

Acceptance criteria:

- creatures react to player distance;
- creatures do not leave map bounds;
- creatures return to home area after fleeing/wandering.

## Phase 7 - Sound Layer

Purpose: add environmental presence and feedback.

Implementation:

1. Add `src/audio/audioData.ts`.
2. Add `src/audio/AudioManager.ts`.
3. Add event sounds:
   - letter pickup;
   - craft success;
   - craft fail;
   - inventory open/close;
   - XP gain.
4. Add loop sounds:
   - forest ambience;
   - campfire;
   - obelisk hum.
5. Add movement sounds:
   - grass footsteps;
   - dirt footsteps;
   - stone footsteps.
6. Add volume/mute state later.

Acceptance criteria:

- sounds do not duplicate on hot reload;
- loops are disposed correctly;
- positional sounds fade with distance.

## Phase 8 - Player Animation Polish

Purpose: reduce mechanical movement.

Implementation:

1. Audit imported animation groups in `AssetPlayerVisual.tsx`.
2. Add animation state machine:
   - idle;
   - walk;
   - run;
   - jump;
   - fall;
   - land.
3. Add turn smoothing.
4. Add acceleration/deceleration to movement.
5. Add footstep timing.
6. Add camera collision/probe so the camera does not enter scenery.

Acceptance criteria:

- movement direction and visual facing stay aligned;
- animation transitions do not snap;
- player remains responsive.

## Phase 9 - Interactable Props

Purpose: make scenery gameplay-relevant.

Implementation:

1. Add `src/scenes/interactions/interactableProps.ts`.
2. Convert selected props:
   - campfire: rest/heal;
   - crate: loot;
   - obelisk: objective hint or zone unlock;
   - herb node: gather material;
   - chest: reward.
3. Add prop state:
   - inactive;
   - active;
   - depleted;
   - locked.
4. Add nearest prop detection.
5. Add HUD prompt.
6. Add store state for used/depleted props.

Acceptance criteria:

- props can be interacted with once or repeatedly depending on type;
- state persists after interaction;
- prompt text matches the available action.

## Phase 10 - Save and Progress Persistence

Purpose: support repeated sessions.

Implementation:

1. Extend Zustand store:
   - completed objectives;
   - collected collectibles;
   - interacted props;
   - discovered zones;
   - player position;
   - completed dialogs;
   - defeated creatures later.
2. Add localStorage persistence.
3. Add schema versioning.
4. Add reset save action.

Acceptance criteria:

- old saves fail safely or migrate;
- collected letters do not respawn unexpectedly;
- completed objectives remain complete after reload.

## Phase 11 - Performance Pass

Purpose: keep the larger world stable.

Implementation:

1. Measure:
   - mesh count;
   - draw calls;
   - frame time;
   - bundle size.
2. Convert repeated trees/rocks/foliage to instances.
3. Add distance-based creature updates.
4. Add LOD for large objects.
5. Split large Babylon imports where practical.
6. Add a browser smoke test for initial scene load.

Acceptance criteria:

- scene loads without console errors;
- FPS remains stable on target hardware;
- bundle warning is understood and tracked.

## Phase 12 - Vertical RPG Slice

Purpose: turn systems into a coherent 15-20 minute playable path.

Playable route:

1. Player spawns in `starter-clearing`.
2. Collects A/R/E.
3. Crafts ARE/EAR/ERA.
4. Talks to Alie.
5. Travels to `ember-camp`.
6. Collects F/I/R/E.
7. Crafts FIRE.
8. Uses campfire or obelisk to reveal `north-grove`.
9. Talks to Mira.
10. Collects G/R/O/V/E.
11. Crafts GROVE.
12. Activates grove obelisk.
13. Receives reward and slice completion.

Acceptance criteria:

- player always has a readable next objective;
- at least three zones are visually distinct;
- at least three NPC/prop interactions exist;
- at least two creature behaviors exist;
- full route is playable without debug tools.

## Recommended next implementation order

1. `worldZones.ts`.
2. `TerrainGround.tsx`.
3. `Lighting.tsx` realism pass.
4. `FoliageScenery.tsx`.
5. `NpcInteractionBridge.tsx`.
6. Dialog overlay.
7. Creature state controller.
8. Audio manager.
9. Player animation polish.
10. Interactable props.
11. Save/load.
12. Performance pass.
