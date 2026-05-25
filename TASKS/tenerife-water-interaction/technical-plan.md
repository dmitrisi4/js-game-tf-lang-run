# Technical Plan

## Official Source Findings

- Babylon.js is already the project engine; the official package includes `@babylonjs/materials/water/WaterMaterial` with wave properties such as `windForce`, `waveHeight`, `waveLength`, `waveSpeed`, `waveCount`, bump texture, and reflection/refraction render lists.
- Babylon Fluid Renderer renders particle systems as fluid visuals. It is not the right first choice for an island-scale ocean physics controller.
- Babylon Particle System supports emitter-based effects and is appropriate for short entry splashes.
- Existing project physics uses Havok, but the full-island player controller is currently kinematic terrain-following rather than a dynamic capsule. Water behavior should therefore live in player movement authority, not as a second physics truth.

## Files

- `src/scenes/environment/OceanSurface.tsx`
	- replace custom `ShaderMaterial` with `WaterMaterial`
	- generate procedural bump texture
	- keep mesh visual-only and non-pickable
- `src/scenes/environment/oceanVisualConfig.ts`
	- keep surface metric helpers
	- add water material tuning helpers
- `src/scenes/player/waterInteraction.ts`
	- pure water-state and movement helpers
- `src/scenes/player/waterEntryEffects.ts`
	- one-shot splash particle effect
- `src/scenes/player/Player.tsx`
	- use water-state helpers in full-island traversal
	- emit splash on transition into water
- `src/scenes/player/AssetPlayerVisual.tsx`
	- anchor the visual at waterline while in full-island water
- Tests:
	- `src/scenes/player/waterInteraction.test.ts`
	- extend `src/scenes/environment/oceanVisualConfig.test.ts`

## Data Flow

1. Full-island movement resolves terrain support under player.
2. Water helper compares floor height with `TENERIFE_FULL_ISLAND_WATER_SURFACE_Y`.
3. If submerged enough, controller uses swim center Y and water speed multiplier.
4. Transition from dry to wet triggers splash.
5. Visual anchor uses water surface rather than underwater terrain while swimming.

## Risks

- `WaterMaterial` render targets can be costly for a huge ocean. First slice avoids adding a large render list and keeps the mesh visual-only.
- Without a dedicated swim animation the character will still reuse locomotion clips, but movement will no longer read as running on blue ground.
- Splash particles create/dispose on low-frequency entry transitions. Pooling is not required for this phase but should be revisited if wave/shoreline VFX become continuous.

## Verification Commands

- `bun run test -- src/scenes/player/waterInteraction.test.ts src/scenes/environment/oceanVisualConfig.test.ts`
- `bun run check`
- `bun run build`
