# 2026-05-05 Stage 4 First Word Goal

## Summary
Extended the discovery loop from letter pickups to the first complete craftable word goal.

## Changes
- added `discoveryGoals.ts` with the starter word target and XP reward
- updated `GameHud.tsx` with a craft action for `ARE`
- disabled the craft action until the required letters are collected
- granted progression XP when the starter word is crafted successfully

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Status
Stage 4 now covers `pickup -> inventory -> craft -> XP reward` for the first starter word
