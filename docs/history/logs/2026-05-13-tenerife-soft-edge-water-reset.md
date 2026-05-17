# 2026-05-13 - Tenerife Soft Edge Water Reset

## Summary

Fixed the Tenerife edge behavior where approaching the island edge could cause jitter and camera/player visual separation.

## Changes

- Replaced hard invisible rectangular physics boundary walls with soft water safety bounds.
- Kept the visible water plane and physical seabed around the island.
- Added deep-water reset so the player respawns in the city after sinking below the water threshold.
- Teleport reset now updates the player transform and switches the Havok body prestep mode to `TELEPORT` before zeroing velocities.
- Player ground and visual foot raycasts now recognize `tenerife-seabed` in addition to `ground1`.
- Added tests for the Tenerife soft edge and deep-water reset behavior.

## Validation

- `./node_modules/.bin/biome check src/scenes/environment/TenerifeSafetyLayer.tsx src/scenes/environment/tenerifePreviewConfig.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/player/Player.tsx src/scenes/player/AssetPlayerVisual.tsx` passed.
- `bun run test` passed: 15 files, 62 tests.
- `bun run build` passed with the existing Vite large chunk warning.

## Manual Check

Local dev server could not be started in the sandbox because binding `127.0.0.1:5173` failed with `EPERM`, and escalation was unavailable. Manual browser verification is still needed in a normal local shell.
