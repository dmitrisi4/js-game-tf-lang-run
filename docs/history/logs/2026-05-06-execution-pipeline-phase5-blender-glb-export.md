# 2026-05-06 Stage 5 Blender GLB Export

## Summary
Replaced the embedded prototype `gltf` files with actual Blender-exported `glb` runtime assets.

## Changes
- added `scripts/generate_prototype_assets.py` for repeatable headless Blender exports
- exported `public/models/collectibles/collectible-letter-crystal.glb`
- exported `public/models/player/player-adventurer-prototype.glb`
- switched collectible and player visual loaders from `.gltf` to `.glb`
- removed the previous embedded prototype `gltf` files from the active runtime path

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Notes
- Blender export had to run outside the sandbox in headless mode
- these are still prototype shapes, but the runtime path is now the same class of asset flow that final Blender exports will use

## Status
Stage 5 now uses Blender-exported `.glb` assets for both the collectible visual path and the player visual path
