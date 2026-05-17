# 2026-05-06 Stage 5 First Player Visual

## Summary
Added the first imported player-facing visual while keeping the physics-driven controller authoritative.

## Changes
- added `public/models/player/player-adventurer-prototype.gltf` as the first runtime-loadable player visual prototype
- introduced `AssetPlayerVisual.tsx` to import and follow the active player body
- updated `Player.tsx` so the imported visual follows the physics-controlled mesh while the cylinder remains the gameplay authority
- reduced the placeholder cylinder visibility so the imported mesh reads as the primary player presentation layer

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Notes
- this is still a prototype `gltf`, not the final Blender-exported player asset
- the architecture now has the correct split between controller body and imported player visual

## Status
Stage 5 now covers both the first collectible import path and the first player-facing visual import path
