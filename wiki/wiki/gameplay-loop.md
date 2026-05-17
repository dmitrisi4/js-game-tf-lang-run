# Gameplay Loop

## Core Loop

`keyArena` is built around a discovery/crafting loop: players loot letters and words from monsters, chests, or world interactions, collect letters into inventory, and craft valid words to unlock progress or power. (source: ../../GEMINI.md)

## Current Areas To Inspect

- Discovery and collectibles: `../../src/scenes/discovery/`
- Inventory and progression state: `../../src/store/`
- HUD and overlays: `../../src/ui/`
- Scene integration: `../../src/scenes/MainScene.tsx`

## State Ownership

- Durable gameplay data belongs in Zustand. (source: ../../GEMINI.md)
- One-shot feedback belongs on the event bus. (source: ../../GEMINI.md)
- Scene behavior should stay in Babylon-facing modules; React should own overlays and app composition. (source: ../../GEMINI.md)

## Implementation Notes

When changing discovery, crafting, inventory, or progression, inspect `src/scenes/discovery/`, `src/store/useGameStore.ts`, `src/store/selectors.ts`, and relevant tests before editing. (source: ../../docs/llm-wiki/project-map.md)

## Related

- [[scene-architecture]]
- [[validation]]
