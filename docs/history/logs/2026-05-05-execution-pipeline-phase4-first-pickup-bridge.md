# 2026-05-05 Stage 4 First Pickup Bridge

## Summary
Closed the Stage 3 controller deliverables and started the discovery loop with the first interactive letter pickups.

## Changes
- added discovery collectible types and nearest-pickup helper logic
- introduced `LetterCollectibles.tsx` and `LetterCollectible.tsx` as the first pickup-facing scene module
- added `PlayerInteractionBridge.tsx` to connect semantic `interact` input with runtime collectibles and store mutations
- wired `MainScene.tsx` so collected letters are removed from the scene and added to inventory with XP gain

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Status
- Stage 3 is complete
- Stage 4 is now in progress with the first collectible pickup loop in place
