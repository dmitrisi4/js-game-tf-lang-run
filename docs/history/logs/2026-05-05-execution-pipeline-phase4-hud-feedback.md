# 2026-05-05 Stage 4 HUD Feedback Slice

## Summary
Added the first visible gameplay feedback layer for the discovery loop.

## Changes
- introduced `GameHud.tsx` as a fixed React overlay outside the Babylon canvas
- surfaced player HP, level, XP progress, collected letters, collected words, and inventory state
- added a contextual interaction prompt when the player is close enough to collect a letter
- wired `MainScene.tsx` to track the nearest collectible in range for HUD feedback

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Status
Stage 4 now includes both the first pickup loop and visible player feedback for that loop
