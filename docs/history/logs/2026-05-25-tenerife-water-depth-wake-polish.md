# 2026-05-25 Tenerife Water Depth And Wake Polish

## Summary

Responded to QA that reflection is visible, but the ocean still lacks visual depth and the player wake is not readable enough.

## Changes

- Applied the existing bounded ocean visual config to the runtime Babylon `WaterMaterial` instead of leaving hard-coded flat defaults.
- Added darker far-water color blending, stronger Fresnel separation, reflection-affecting bumps, world-coordinate wave deformation, and specular highlights for better depth cues.
- Raised and strengthened the player waterline disc so it renders above the transparent ocean surface.
- Strengthened the moving wake particle system, placed it behind the player's facing direction, and added a focused helper test for wake placement.
- Fixed the full-island open-water controller path so positions without terrain support are treated as swimming instead of returning `isInWater: false`.
- Made the full-island seabed visible and included it in the `WaterMaterial` render list so refraction has a dark depth layer under the surface.
- Recalibrated the full-island waterline from `-24` to `-3.75` after QA confirmed the ocean read as a reflected background instead of a reachable water surface.
- Recalibrated seabed/reset to `-12.5` and `-10.6`, snapped open-water traversal to swim center, and lowered the visual anchor so the hero reads as submerged.
- Replaced the uniform full-island seabed with `ShorelineDepthFloor`, a visual-only shader floor that approximates the island edge with an ellipse and blends from coast/shallow color to deep ocean color.
- Added `ShorelineSurf`, a visual-only animated foam ribbon above the water surface. It samples loaded full-island terrain vertices near the configured waterline, builds an ordered coastline ribbon, and animates the ribbon width/alpha so surf advances and recedes along the visible shore.
- Fixed a surf ribbon artifact where sparse shoreline samples could be connected across terrain. The ribbon no longer wraps across the island, skips segments above the maximum gap length, and renders in the normal depth-tested group.

## Validation

- Passed: `bun run test -- src/scenes/player/waterInteraction.test.ts src/scenes/player/waterMovementWaves.test.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterLineEffect.ts src/scenes/player/waterMovementWaves.ts src/scenes/player/waterMovementWaves.test.ts`
- Passed: `bun run check`
- Passed: `bun run build` with the existing large chunk warning.
- Passed: `bun run test -- src/scenes/player/Player.test.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterMovementWaves.test.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `bunx biome check src/scenes/player/Player.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/OceanSurface.tsx src/scenes/player/AssetPlayerVisual.tsx src/scenes/player/waterLineEffect.ts src/scenes/player/waterMovementWaves.ts src/scenes/player/waterMovementWaves.test.ts`
- Passed: `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts src/scenes/player/Player.test.ts src/scenes/player/waterInteraction.test.ts src/scenes/player/waterMovementWaves.test.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `bunx biome check src/scenes/environment/tenerifeFullIslandConfig.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/OceanSurface.tsx src/scenes/player/Player.tsx src/scenes/player/waterInteraction.ts src/scenes/player/waterInteraction.test.ts`
- Passed: `bun run test -- src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`
- Passed: `bunx biome check src/scenes/environment/ShorelineDepthFloor.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `bunx biome check src/scenes/environment/ShorelineSurf.tsx src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `bun run test -- src/scenes/environment/ShorelineSurf.test.ts src/scenes/environment/oceanVisualConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifePreviewConfig.test.ts`
- Passed: `bunx biome check src/scenes/environment/ShorelineSurf.tsx src/scenes/environment/ShorelineSurf.test.ts src/scenes/environment/TenerifeOcean.tsx src/scenes/environment/oceanVisualConfig.ts src/scenes/environment/oceanVisualConfig.test.ts`
- Passed: `curl -I 'http://127.0.0.1:5173/?tenerife=1&terrain=island-full'` returned `HTTP/1.1 200 OK`.
- Not run: headless Playwright visual smoke, because the `playwright` package is not installed in this workspace.

## References Used

- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/project-map.md`
- `docs/llm-wiki/scene-architecture.md`
