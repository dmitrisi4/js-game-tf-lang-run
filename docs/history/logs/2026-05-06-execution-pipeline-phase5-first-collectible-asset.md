# 2026-05-06 Stage 5 First Collectible Asset

## Summary
Started asset integration by replacing primitive-only collectibles with the first imported 3D collectible path and a runtime fallback.

## Changes
- added `public/models/collectibles/collectible-letter-crystal.gltf` as the first runtime-loadable collectible asset
- introduced `AssetLetterCollectible.tsx` to load the asset through Babylon `SceneLoader`
- kept `LetterCollectible.tsx` as the fallback placeholder when the asset is still loading or unavailable
- updated `LetterCollectibles.tsx` so discovery pickups now prefer imported visuals instead of always rendering procedural spheres

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Notes
- the asset is currently a lightweight embedded `gltf` prototype rather than a final Blender-exported `glb`
- build size increased because the runtime now pulls the glTF loader path into the bundle

## Status
Stage 5 is now in progress with a working asset import path for collectibles
