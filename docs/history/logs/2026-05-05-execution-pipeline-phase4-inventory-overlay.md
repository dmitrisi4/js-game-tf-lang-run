# 2026-05-05 Stage 4 Inventory Overlay

## Summary
Upgraded the discovery loop UI from a compact HUD craft action to a dedicated inventory overlay.

## Changes
- added `InventoryOverlay.tsx` as a real crafting screen opened by the existing `Tab` inventory state
- introduced `discoveryRecipes.ts` for the first set of starter crafting recipes
- grouped collected letters inside the overlay and surfaced crafted words separately
- moved recipe crafting actions into the overlay while keeping the HUD focused on status and proximity feedback

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Status
Stage 4 now includes a real inventory/crafting screen instead of only HUD-level state feedback
