# Roof Parkour Traversal

## Summary

- Added a first-pass wall jump, ledge grab, and climb-up traversal mechanic for Puerto city buildings in `?tenerife=1&terrain=real`.
- Generated 2,506 runtime roof landing points from Puerto building footprints and DEM heights using the same building scale and spacing formulas as the Blender GLB generation.
- Added player-side traversal helpers for URL gating, building wall detection, roof landing selection, and ledge position calculation.
- Integrated traversal into the player physics loop so a grounded jump while facing `puerto-osm-city-buildings` can become a controlled roof climb instead of a normal jump.
- Corrected generated roof landing center height from an oversized visual lift to the player capsule half-height (`0.9` above `roofY`) after browser review showed the character standing too high above roof surfaces.
- Tuned the ledge grab after runtime feedback: ledge hold points are now placed outside the wall by capsule clearance, the wall-jump impulse duration is shorter, the ledge hold is longer, and player physics is explicitly moved with `setTargetTransform` during grab/climb phases.
- Restored wall-jump detection after follow-up feedback by keeping baked Puerto building meshes pickable; previously all imported meshes were made non-pickable and only terrain was re-enabled, so the traversal ray could not hit buildings.

## References Used

- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/world-building.md`

## Validation

- `bun run test src/scenes/player/roofTraversal.test.ts src/scenes/environment/PuertoCityTerrain.test.ts` passed.
- `bun run test src/scenes/player/roofTraversal.test.ts` passed after the landing height correction.
- `bun run test src/scenes/player/roofTraversal.test.ts` passed after the ledge-grab tuning.
- `bun run test src/scenes/environment/PuertoCityTerrain.test.ts src/scenes/player/roofTraversal.test.ts` passed after restoring building raycast pickability.
- Targeted `bunx biome check` passed for edited source/script files.
- `bunx biome check src/scenes/player/Player.tsx src/scenes/player/roofTraversal.ts src/scenes/player/roofTraversal.test.ts` passed after the ledge-grab tuning.
- `bunx biome check src/scenes/environment/PuertoCityTerrain.tsx src/scenes/player/Player.tsx` passed after restoring building raycast pickability.
- `bun run build` passed.
- `bun run check` still fails on pre-existing unrelated formatting issues in `src/store/selectors.test.ts`, `src/ui/InventoryOverlay.tsx`, and `src/ui/gameHud.css`.
- Existing dev server returned HTTP `200` for `/data/tenerife/puerto-roof-landings-runtime.json`.
