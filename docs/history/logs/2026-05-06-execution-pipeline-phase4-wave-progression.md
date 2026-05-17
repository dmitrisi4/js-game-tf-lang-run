# 2026-05-06 Stage 4 Wave Progression

## Summary
Extended discovery progression beyond the first crafted word by unlocking a second collectible wave and a stronger recipe.

## Changes
- added `discoveryWaves.ts` so collectibles now come from named wave definitions instead of a single hardcoded starter set
- advanced the scene from the starter wave to the `ember` wave after crafting any starter word
- added recipe unlock rules in `discoveryRecipes.ts` and locked `FIRE` behind completion of a starter word
- updated the HUD objective text and inventory recipe states to reflect progression status
- added tests for wave cloning and recipe unlock behavior

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Status
Stage 4 now includes `starter word -> next collectible wave -> stronger recipe` progression instead of a single isolated craft action
