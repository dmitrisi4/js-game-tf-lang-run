# Scene Architecture

## Ownership
- React owns app composition, UI overlays, and non-frame-critical state rendering.
- Babylon owns scene graph, physics, camera transforms, raycasts, and per-frame updates.
- Zustand owns durable gameplay state.

## Runtime Flow
- `src/main.tsx` mounts React.
- `src/App.tsx` hosts the app shell.
- `src/scenes/MainScene.tsx` creates the Babylon `Engine` and `Scene`.
- `MainScene` initializes Havok, enables physics, and renders scene modules only when physics is ready.
- `MainScene` keeps the loading overlay visible until physics, environment assets, player setup, and a ready render frame have completed.
- `GameHud` is rendered outside the Babylon `Scene`, fed by current scene/store state.

## MainScene Composition
`MainScene.tsx` currently wires:
- `PlayerInputBridge`
- `PlayerInteractionBridge`
- `SceneCamera`
- `Environment`
- `Player`
- `LetterCollectibles`
- `PrototypeDonut`
- `GameHud`

Keep this file as an orchestration root. Move feature behavior into focused modules.

## Environment Composition
`src/scenes/environment/Environment.tsx` renders:
- `SkyDome`
- `Lighting`
- default `Ground` + `WorldScenery`
- or `TenerifeIslandPreview` + `TenerifeSafetyLayer` + runtime Puerto de la Cruz roads/buildings when `?tenerife=1` is present
- `?tenerife=1` renders OSM-derived Puerto roads before the building layer and raycast-aligns both roads and buildings to `ground1`.
- Tenerife player spawn/reset constants live in `src/scenes/environment/tenerifePreviewConfig.ts`; keep `MainScene`, `TenerifeIslandPreview`, and `TenerifeSafetyLayer` on that shared config.

## Tenerife Preview
- `TenerifeIslandPreview` loads `public/models/environment/tenerife-island-location.glb` and only treats `env_tenerife_full_island_terrain_1unit_1km` as gameplay terrain.
- Do not identify terrain by vertex count: the GLB contains dense non-terrain meshes.
- The baked Puerto de la Cruz detail from the GLB (`city_puerto_cruz_*`, `puerto_cruz_osm_*`, `env_atlantic_ocean_disc`) is disabled at runtime so it does not overlap the runtime OSM roads/building-pack houses.
- In Tenerife mode, `MainScene` must wait for environment readiness before mounting `Player`; compute the spawn/reset height with `getTenerifePlayerResetPosition(scene)` after `ground1` exists.
- `TenerifeSafetyLayer` owns low water, seabed, and deep-water/far-water reset. It intentionally avoids hard invisible boundary walls so the player does not jitter against rectangular edge colliders near the island edge.

## Static Scenery
`src/scenes/environment/WorldScenery.tsx` maps static data from `worldData.ts` into Babylon meshes:
- boundary walls
- trees
- buildings
- rocks
- props
- NPC placeholder figures
- ambient creatures

Static physical obstacles use primitive `physicsAggregate` shapes. Imported visual meshes should not silently become gameplay-authoritative colliders.

## Terrain
Terrain height helpers live in `src/scenes/environment/terrainData.ts`. Static world placement should use terrain height helpers instead of hard-coding Y values where possible.
