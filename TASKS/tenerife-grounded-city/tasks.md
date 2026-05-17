# Tasks

## 1. Diagnose Road And Island Fit

Status: Completed

Context:

- Screenshot shows road ribbons extending across a flat horizon/water-like area and not reading as attached to the island.
- Need to know whether the road network is too large, shifted, or simply unclipped.

Tasks:

- [x] Measure runtime road bounds from `public/data/tenerife/roads-runtime.json`.
- [x] Measure or inspect island mesh bounds in `TenerifeIslandPreview`.
- [x] Compare road bounds to island/playable bounds.
- [x] Decide whether first fix should be projection scale/offset, island scale, or road clipping.
- [x] Record decision in this file.

Decision:

- Runtime road bounds are about `x -766..766`, `z -502..502`, while Tenerife playable bounds are much larger.
- The immediate issue is not a globally oversized road dataset. The visible mismatch is caused by rendering the full road network over a non-rectangular island surface and by sampling old procedural terrain heights instead of the actual Tenerife `ground1` mesh.
- First fix is real-ground raycast placement plus a conservative city footprint filter. Island scale is deferred until browser verification proves it is still needed.

## 2. Tighten Road Ground Contact

Status: Implemented, needs browser re-check

Context:

- Road layer styles currently add positive height offsets.
- Road mesh creation samples terrain height at ribbon edge vertices and adds a hardcoded bias.

Tasks:

- [x] Reduce road layer height offsets to minimal values.
- [x] Replace hardcoded mesh road y bias with a named constant.
- [x] Tune the constant so roads are visible but not floating.
- [ ] Verify roads visually from third-person camera.

Implementation note:

- `TenerifeGeoRoadLayers` now waits for `ground1`.
- Road ribbon vertices now raycast against the actual `ground1` mesh.
- Road surface bias is now `0.012`.
- Follow-up: removed fallback procedural terrain height for road rendering. If a road segment cannot raycast onto real `ground1`, it is skipped instead of floating.

## 3. Fit Or Clip Roads To Valid Island Area

Status: Implemented with first-pass city footprint, pending browser verification

Context:

- Some roads appear to leave the island/map surface.
- Full GIS-accurate clipping is not required for this epic; a conservative footprint is acceptable.

Tasks:

- [x] Add a road visibility/placement bounds helper.
- [x] Filter rendered road segments or lines to accepted island/city footprint.
- [x] Ensure roadside building generation uses the same accepted road geometry.
- [ ] Verify no obvious road ribbons extend outside the island surface.

Implementation note:

- Added `isInsideTenerifeCityFootprint`.
- The first-pass footprint accepts 933 of 9,475 simplified road segments around the current city/play area.

## 4. Tune Island Scale If Needed

Status: Implemented, needs browser re-check

Context:

- User suggested the island model may need to be slightly larger.
- Scaling can affect spawn, minimap, safety, and collision, so it should follow diagnosis.

Tasks:

- [x] Identify current island scale and collision setup.
- [x] Test a small scale increase only if projection/clipping is insufficient.
- [x] Update player spawn/safety/minimap assumptions if island scale changes.
- [ ] Verify player still spawns correctly.

Implementation note:

- Island preview scale was increased from `30` to `48` after browser screenshot showed roads still floating outside the terrain footprint.
- Existing Puerto anchor math keeps the city anchor pinned while expanding the island around it.
- No safety bound change was needed because existing Tenerife playable bounds are already much larger than the road runtime bounds.

## 5. Increase Building Readability

Status: Implemented, needs browser re-check

Context:

- User wants houses slightly larger.
- Generated building scale is currently near `0.98` to `1.3`.

Tasks:

- [x] Increase generated roadside building base scale.
- [x] Adjust spacing/min-distance to account for larger buildings.
- [ ] Check colliders if generated buildings become physical later.
- [ ] Verify buildings read clearly from gameplay camera.

Implementation note:

- Generated building scale now starts at `1.42` and steps by `0.12`.
- Minimum generated building spacing increased to `23`.
- Roadside offset increased to account for larger building footprints.

## 6. Align Buildings Along Grounded Roads

Status: Implemented, pending browser verification

Context:

- Buildings should be placed along roads that are actually rendered and grounded.
- Placement should avoid invalid/out-of-footprint road segments.

Tasks:

- [x] Generate buildings from accepted road segments only.
- [x] Keep building yaw aligned with road tangent.
- [x] Keep side offset consistent with road width and building footprint.
- [x] Sample final terrain height at building position.
- [ ] Verify buildings sit beside roads rather than on top of roads.

Implementation note:

- Roadside building generation now skips road segments outside `isInsideTenerifeCityFootprint`.
- Building side offset increased to fit larger visual scale.
- Existing `WorldBuildings` ground ray alignment still handles final vertical placement on `ground1`.

## 7. Verification

Status: Partially complete; browser verification still needed

Tasks:

- [x] Run targeted Biome on edited files.
- [x] Run focused Tenerife tests if road data logic changes.
- [x] Run build.
- [ ] Browser-check the scene with `?tenerife=1`.
- [x] Update this file with completed statuses and remaining issues.

Verification note:

- `npx biome check src/scenes/environment/TenerifeGeoRoadLayers.tsx src/scenes/environment/tenerifeRoadLayers.ts TASKS/tenerife-grounded-city/tasks.md` checked the two source files; markdown is ignored by this project's Biome config.
- `npm run test -- src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/worldData.test.ts` passed.
- `npm run build` passed.
- Browser verification still needs a manual/user-visible check because local Playwright modules are not installed in this workspace and the browser automation plugin did not expose the needed runtime tool in this session.
