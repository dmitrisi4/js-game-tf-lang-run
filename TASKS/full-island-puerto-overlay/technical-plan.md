# Technical Plan

## References Used

- `docs/llm-wiki/index.md`
- `docs/reference/project-vision.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
- `TASKS/full-tenerife-island-integration/technical-plan.md`
- `TASKS/puerto-real-terrain-city/technical-plan.md`

## Current Systems

- Full-island mode is composed in `src/scenes/environment/Environment.tsx`.
- Full-island Puerto marker is `TENERIFE_FULL_ISLAND_PUERTO_START_POSITION`.
- Runtime Puerto road data is loaded from `public/data/tenerife/roads-runtime.json`.
- Runtime Puerto road coordinates use `metersToWorld = 0.26`.
- Full-island map projection already validates Teide WGS84 against generated full-island map data.

## Implementation

- Add a full-island Puerto transform helper in `tenerifeFullIslandConfig.ts`.
- Derive overlay scale from:
	- Puerto projection center WGS84.
	- Teide WGS84 control point.
	- Full-island Puerto and Teide runtime points.
	- Puerto road `metersToWorld`.
- Reuse `PuertoCityTerrain` with optional transform props.
- Reuse `TenerifeGeoRoadLayers` with optional `positionOffset` and `scale`.
- Default `island-full` road mode to `both`, so mesh roads render with the city overlay.

## Risks

- Full-island and Puerto vertical terrain may z-fight near the overlay. First pass keeps a small positive height lift.
- Building mesh collision on the scaled overlay may need follow-up tuning.
- The transform is a first-pass similarity scale; final GIS alignment should use more control points if street-perfect placement is required.

## Verification Commands

- `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts`
- `bun run build`
