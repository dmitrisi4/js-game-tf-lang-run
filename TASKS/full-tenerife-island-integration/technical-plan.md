# Technical Plan

## Current Baseline

Current Tenerife environment modes:

- `?tenerife=1`
	- Uses `TenerifeIslandPreview`.
	- Loads `public/models/environment/tenerife-island-location.glb`.
	- Lightweight procedural terrain only.
	- Ocean comes from `TenerifeSafetyLayer`, not from the GLB.

- `?tenerife=1&terrain=real`
	- Uses `PuertoCityTerrain`.
	- Loads `public/models/environment/puerto-de-la-cruz-terrain.glb`.
	- This is a Puerto city patch, not the full island.
	- Contains `puerto-atlantic-ocean`, `puerto-volcanic-coast`, `puerto-teide-volcano`, and `puerto-teide-summit-cap`.
	- Teide is a backdrop mesh, not reachable full-island terrain.

New source candidate:

- `public/models/land/tenerife._islas_canarias.glb`
- File size: `42 MB`
- Mesh count: `6`
- Total terrain vertices: `368,587`
- Approx triangles: `720,000`
- Embedded base-color PNG: `8192 x 8192`, about `23.8 MB`
- Combined source bounds: about `122,228 m x 122,228 m x 3,653 m`
- Maximum height matches Teide-scale terrain.
- Blender import succeeds outside sandbox and crashes inside the default sandbox, so normalization scripts should run with approved Blender execution.

## Runtime Mode Decision

Add a new mode instead of replacing existing modes immediately:

- Existing: `?tenerife=1` for lightweight island preview.
- Existing: `?tenerife=1&terrain=real` for Puerto city patch.
- New: `?tenerife=1&terrain=island-full` for normalized full island.
- Optional debug: `?tenerife=1&terrain=island-full&puerto=1` for full island plus Puerto patch.

This keeps rollback simple and avoids breaking current roof traversal and Puerto city work.

## Proposed Files

New scripts:

- `scripts/blender/normalize_tenerife_full_island.py`
- Optional later: `scripts/geo/align_puerto_to_full_island.mjs`

New runtime assets:

- `public/models/environment/tenerife-full-island-normalized.glb`
- Optional: `public/models/environment/tenerife-full-island-collider.glb`
- Optional extracted textures:
	- `public/textures/tenerife/full-island-albedo-4096.jpg`
	- `public/textures/tenerife/full-island-albedo-2048.jpg`

New docs/metadata:

- `public/data/tenerife/full-island-metadata.json`
- `TASKS/full-tenerife-island-integration/asset-intake.md`
- `TASKS/full-tenerife-island-integration/texture-budget.md`
- `TASKS/full-tenerife-island-integration/physics-plan.md`

Runtime code:

- `src/scenes/environment/tenerifeFullIslandConfig.ts`
- `src/scenes/environment/TenerifeFullIslandTerrain.tsx`
- `src/scenes/environment/TenerifeOcean.tsx`
- Update `src/scenes/environment/puertoCityConfig.ts` to include `island-full`.
- Update `src/scenes/environment/Environment.tsx` composition only.
- Add tests:
	- `src/scenes/environment/tenerifeFullIslandConfig.test.ts`
	- update `src/scenes/environment/puertoCityConfig.test.ts`

## Coordinate Model

The Sketchfab asset appears to be near real-meter scale:

- source horizontal span around `122 km`
- source maximum elevation around `3653 m`

Project invariant remains `1 unit = 1 meter`. The first normalized asset should preserve meter scale unless browser precision or gameplay speed requires a documented compression factor.

Recommended approach:

1. Normalize orientation and origin in Blender.
2. Keep `Y` as height in Babylon.
3. Center island near world origin only for the visual mode.
4. Store a metadata transform that maps:
	- source asset coordinates
	- normalized island coordinates
	- Puerto patch coordinates
	- gameplay spawn coordinates

## Puerto Placement Strategy

Treat Puerto de la Cruz as a detailed local overlay, not as the island base.

Placement inputs:

- Current Puerto patch AOI world bounds from `public/data/tenerife/puerto-city-metadata.json`.
- Existing projection center:
	- lat `28.40330075`
	- lon `-16.5453185`
	- `metersToWorld = 0.26`
- Full island normalized coordinate system from Blender output.
- Known Puerto location on the north coast from the island texture and WGS84 data.

First-pass alignment:

- Add a `PUERTO_FULL_ISLAND_ANCHOR` config with position, yaw, scale, and height offset.
- Render only debug markers first.
- Then render city patch slightly above island terrain.
- If z-fighting appears, either hide a rectangular local island area under the city patch or lift the city patch enough to avoid flicker.

Correct long-term alignment:

- Use georeferenced control points:
	- Puerto de la Cruz
	- Teide summit
	- Santa Cruz or another east/north-east control point
- Solve 2D similarity transform: scale, rotation, translation.
- Use island height sampling for final Y placement.

## Ocean Strategy

Do not rely on the model's background plane. Create ocean in Babylon:

- large plane or disc around normalized island
- sea level aligned to terrain minimum near coastline
- PBR or standard material with blue/green water color, controlled alpha, and specular
- optional simple animated normal texture later
- no gameplay collision on visual water
- seabed/reset layer remains separate

This makes the ocean readable and controllable regardless of imported model texture.

## Collision Strategy

Do not make the high-poly visual asset the only gameplay authority by default.

Allowed first-pass options:

1. Static mesh collision on a decimated island collider.
2. Height sampling from a simplified grid.
3. Static mesh collision only near active spawn/route area while the rest is visual-only.

Puerto city patch keeps its own building collision strategy where needed.

## Performance Risks

- 42 MB GLB is large for first load.
- Embedded 8192 PNG can cost significant memory after GPU upload.
- 720k triangles are acceptable for a desktop visual test, but risky with mesh collision and other city content.
- Full-island plus Puerto patch plus road/building overlays may exceed comfortable browser budgets without LOD.

Mitigation:

- Downscale texture for first runtime pass.
- Keep high-res source asset untouched.
- Normalize to a runtime asset with explicit material settings.
- Disable detailed Puerto overlay by default in the first full-island mode.
- Measure before adding physics to the whole island.

## Validation Commands

Use the subset matching the phase:

- `bun run test -- src/scenes/environment/puertoCityConfig.test.ts`
- `bun run test -- src/scenes/environment/tenerifeFullIslandConfig.test.ts`
- `bun run build`
- `bun run check`

Browser checks:

- `http://127.0.0.1:5173/?tenerife=1&terrain=island-full`
- `http://127.0.0.1:5173/?tenerife=1&terrain=island-full&puerto=1`
- `http://127.0.0.1:5173/?tenerife=1&terrain=real` to confirm existing mode still works
