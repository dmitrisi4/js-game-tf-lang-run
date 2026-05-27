# 2026-05-27 Environment Overlap Research

## Summary
Created a task epic for environment overlap hardening after reviewing official collision and scene-management guidance, current project docs, and the environment code paths.

## References
- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/world-building.md`
- `docs/llm-wiki/scene-architecture.md`
- Babylon.js collision and trigger docs
- Unity collider and occlusion culling manuals
- Unreal Engine simple versus complex collision docs

## Findings
- Default arena has at least one likely authored scenery overlap: `building-west-ridge-tower` and `rock-ridge-01`.
- Tenerife preview building data has many likely footprint conflicts because the list is manually dense and lacks clearance tests.
- Existing tests cover bounds and counts but not placement clearance, road clearance, duplicate city layers, or transparent render policy.

## Output
- Added `TASKS/environment-overlap-hardening/` with:
	- official-source research guide
	- project review
	- product plan
	- roadmap
	- technical plan
	- execution checklist

## Implementation
- Added pure placement validation helpers for oriented building footprints and mixed circular static blockers.
- Added tests for default arena blocker intersections and Tenerife preview building footprint clearance.
- Moved `rock-ridge-01` away from `building-west-ridge-tower`.
- Filtered dense legacy Tenerife preview buildings through deterministic non-overlap selection before rendering.
- Added `getPuertoLayerPlan` so Puerto road/building layers are resolved in one pure config path.
- Updated `Environment` to honor the full-island `puerto=0` overlay switch for road meshes as well as buildings.
- Disabled the generated roadside building layer in the legacy Tenerife preview path so it does not stack with the filtered manual preview buildings.
- Clarified `Clouds` transparent render policy by using the sky rendering group and a named Babylon alpha mode.

## Road Ribbon Follow-Up
User screenshot review showed that Tenerife roads still read as scattered chunks. The road issue was traced to `TenerifeGeoRoadLayers`, where each polyline segment was rendered as an independent rectangular quad and extended at both ends. That created visible piles of overlapping road pieces at bends and intersections.

Updated the renderer to build continuous ribbon strips:
- one left/right vertex pair per centerline point
- smoothed normals at joins
- shared indices between adjacent centerline samples
- no per-segment end extension
- a unit test proving a three-point road creates one connected strip instead of two independent rectangles

## Road Junction Follow-Up
Added junction pads on shared OSM road nodes so intersections render as unified paved areas instead of simple ribbon crossings. Pads are generated only for shoulder/surface passes, not centerline passes, so yellow centerlines do not become blobs at intersections.

The junction geometry uses:
- quantized transformed road-node keys
- count-based shared node detection
- terrain-aligned circular fan meshes
- the same material path as the corresponding road pass

## Validation
- Passed: `bun run test src/scenes/environment/worldData.test.ts src/scenes/environment/puertoCityConfig.test.ts`
- Passed: `bun run test src/scenes/environment/tenerifeRoadLayers.test.ts`
- Passed: `bun run test`
- Passed: `bun run check`
- Passed: `bun run build`
- Dev server smoke: `curl -I http://127.0.0.1:5173/` returned `200 OK`.
- Browser screenshot capture was blocked because the Browser Node control tool was not exposed by discovery and this checkout does not have a local Playwright package installed.
