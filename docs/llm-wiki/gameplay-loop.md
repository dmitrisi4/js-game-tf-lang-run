# Gameplay Loop

## Core Loop
The prototype loop is discovery-driven:
- player explores the scene
- player collects letters from world pickups
- letters enter Zustand inventory
- player crafts valid words
- crafted words unlock later discovery waves or objectives

## Key Files
- `src/scenes/MainScene.tsx` - active wave state, collectible list, objective label, player position tracking.
- `src/scenes/discovery/discoveryWaves.ts` - collectible spawn definitions by wave.
- `src/scenes/discovery/discoveryRecipes.ts` - starter word recipes.
- `src/scenes/discovery/collectibleUtils.ts` - nearest collectible lookup.
- `src/scenes/player/PlayerInteractionBridge.tsx` - interaction bridge from player/input to pickup collection.
- `src/store/useGameStore.ts` - inventory, discovery, UI state, and crafting actions.
- `src/store/selectors.ts` - HUD/UI-facing store reads.
- `src/ui/GameHud.tsx` - current objective, zone, nearby collectible, and player position display.

## State Ownership
- Zustand stores durable inventory, crafted words, discovery state, and UI state.
- `MainScene` stores current active wave and scene-local active collectible instances.
- Babylon owns physical movement, transforms, and frame-level scene behavior.

## Progression
Current wave progression is orchestrated in `MainScene.tsx`:
- `starter` begins active.
- completing starter crafting and collecting advances to `ember`.
- crafting `fire` after ember collectibles advances to `grove`.
- crafting `grove` after grove collectibles completes the current arena objective.

When expanding progression, avoid burying new rules directly in scene markup. Prefer extracting pure progression helpers with tests if the rules grow.

## Tests To Check
- `src/store/useGameStore.test.ts`
- `src/store/selectors.test.ts`
- `src/scenes/discovery/discoveryWaves.test.ts`
- `src/scenes/discovery/discoveryRecipes.test.ts`
- `src/scenes/discovery/collectibleUtils.test.ts`
