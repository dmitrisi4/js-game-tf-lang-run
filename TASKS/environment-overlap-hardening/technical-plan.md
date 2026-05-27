# Technical Plan

## Files And Systems
- `src/scenes/environment/worldData.ts`
	- authored placements for default arena and Tenerife preview.
- `src/scenes/environment/worldData.test.ts`
	- extend with clearance and placement contract tests.
- `src/scenes/environment/WorldBuildings.tsx`
	- keep rendering and primitive collider ownership; avoid adding placement decisions here.
- `src/scenes/environment/Environment.tsx`
	- simplify or test Puerto layer selection.
- `src/scenes/environment/Clouds.tsx`
	- clarify transparent material policy if screenshots implicate sky/cloud layering.
- `src/scenes/environment/WorldRoads.tsx`
	- keep roads visual-only; use road widths in placement clearance tests.

## Proposed Helpers
- `getBuildingFootprintRadius(building)`
- `getObjectClearanceRadius(object)`
- `findCircularFootprintOverlaps(objects, minimumClearance)`
- `findRoadClearanceViolations(buildings, roads, minimumClearance)`
- `getPuertoLayerPlan(searchParams)`

## Data Flow
1. Authored or generated placement data enters as typed arrays.
2. Pure validation helpers compute 2D footprints in world meters.
3. Tests enforce clearances and allowed mode combinations.
4. React components render only validated placement data.
5. Babylon owns final raycast grounding and physics objects.

## Risks
- Conservative circular footprints may report false positives for rotated rectangular buildings.
- Tight urban Tenerife streets may need lower clearance thresholds than default arena.
- Moving buildings can invalidate manually tuned camera screenshots and roof traversal assumptions.
- Full-island overlay scale multipliers can amplify small Puerto-local spacing errors.

## Verification Commands
- `bun run test src/scenes/environment/worldData.test.ts`
- `bun run test`
- `bun run check`
- `bun run build` if imports or mode-selection modules change
- Browser checks through local Vite URLs for each terrain mode

## References Used
- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/llm-wiki/world-building.md`
- `docs/llm-wiki/scene-architecture.md`
