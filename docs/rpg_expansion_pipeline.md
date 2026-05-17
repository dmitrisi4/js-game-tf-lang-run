# RPG expansion pipeline

## Current baseline

The project is a compact Babylon.js RPG prototype with these foundations already in place:

- controllable player with physics and camera-relative movement;
- follow camera with pointer orbit;
- letter collectibles with asset fallback;
- inventory and word crafting;
- XP, HP, level progression;
- two-step discovery objective flow;
- simple HUD and inventory overlay.

The largest gap is not rendering tech, but content architecture. A full RPG needs the world, quests, NPCs, creatures, items, and encounters to be authored as data first, then rendered and simulated by reusable scene systems.

## Implemented in this pass

1. Expanded the playable world from a 48x48 arena to a 96x96 map.
2. Added a data-driven world layer in `src/scenes/environment/worldData.ts`.
3. Added static scenery:
   - 13 trees with trunk collision;
   - 7 rocks with collision;
   - campfire, crates, obelisk, and road totems;
   - low boundary walls around the expanded map.
4. Added inhabited world elements:
   - 3 NPC placeholders with names/roles in data;
   - 4 ambient creatures with simple patrol/bob animation.
5. Extended discovery progression:
   - starter wave: craft ARE/EAR/ERA;
   - ember wave: craft FIRE;
   - grove wave: craft GROVE.
6. Updated the HUD to show world population.
7. Added tests for expanded wave data and world data bounds.

## Full RPG pipeline

### Phase 1 - World grammar

Goal: make the map readable before adding complex gameplay.

- Define biomes/zones as data: clearing, ember camp, north grove, ridge, ruins.
- Give each zone spawn tables for trees, rocks, props, NPCs, creatures, resources, and collectibles.
- Add minimap/debug overlay for zone bounds and spawn ids.
- Add safe player spawn points and respawn points per zone.
- Add nav-safe authored paths so NPCs and creatures do not clip into dense scenery.

Acceptance criteria:

- every object is loaded from data;
- object ids are stable;
- all spawned objects are inside world bounds;
- the player can move between zones without falling, clipping, or losing camera framing.

### Phase 2 - NPC and dialog layer

Goal: convert visual NPCs into RPG actors.

- Add `npcData.ts` with name, faction, role, dialog tree id, shop/craft/quest capabilities.
- Add nearest-NPC detection similar to collectible detection.
- Add `E` interaction priority: NPC first, collectible second, prop third.
- Add dialog overlay with branching options.
- Add simple quest states: unavailable, offered, active, readyToTurnIn, complete.

Acceptance criteria:

- NPC interaction does not conflict with letter pickup;
- dialog can grant quests and rewards;
- quest state persists in the store;
- HUD shows current tracked quest.

### Phase 3 - Creatures and combat

Goal: add basic threat and reward loops.

- Split creatures into ambient and hostile definitions.
- Add creature stats: hp, damage, aggro radius, leash radius, XP reward, loot table.
- Add simple AI states: idle, patrol, investigate, chase, attack, return.
- Add player attack input and hit detection.
- Add damage feedback, defeat cleanup, XP grant, and loot drop.

Acceptance criteria:

- enemies cannot chase forever outside their zone;
- player can defeat a creature and receive XP;
- player death/low HP state is handled;
- combat remains readable with 3-5 creatures on screen.

### Phase 4 - Items, crafting, equipment

Goal: grow from letter crafting into RPG inventory.

- Add item definitions: materials, consumables, weapons, armor, quest items.
- Add inventory stacks and item metadata.
- Add equipment slots and stat modifiers.
- Add recipes with ingredients beyond letters.
- Add crafting stations tied to NPCs or world props.

Acceptance criteria:

- crafting consumes exact ingredients;
- equipped items affect player stats;
- item rewards are visible in HUD/inventory;
- invalid crafting paths fail cleanly.

### Phase 5 - Quest and progression arcs

Goal: create a playable 20-30 minute vertical slice.

- Add a quest chain that sends the player through all zones.
- Gate zones through crafted words/items, not invisible walls.
- Add boss/key encounter at the grove obelisk.
- Add milestone rewards: level, ability, equipment, story unlock.
- Add save/load for player state and quest progress.

Acceptance criteria:

- a new player has a clear first objective;
- each objective introduces one new mechanic;
- there is a complete loop: explore, collect, craft, fight/help, reward, unlock.

### Phase 6 - Production quality pass

Goal: make the prototype maintainable and content-friendly.

- Replace primitive placeholders with optimized GLB assets.
- Add LOD or instancing for trees/rocks.
- Add audio cues for pickup, dialog, combat, and biome ambience.
- Add automated scene smoke test with Playwright.
- Add performance budget: draw calls, meshes, frame time.
- Add editor-friendly world authoring format.

Acceptance criteria:

- expanded map keeps stable FPS on target hardware;
- scene loads without asset errors;
- content additions do not require edits in `MainScene`;
- tests cover data bounds, quest transitions, combat reward paths, and crafting.
