
---

## 2026-05-27 — Realistic Road Surface Shader

**Goal**: Replace flat `StandardMaterial` road ribbons with procedural surface shader.

**Changes**:
- `[NEW] src/scenes/environment/roadSurfaceShader.ts` — GLSL `ShaderMaterial` for roads:
  - **Cobblestone** (`uSurfaceMode=0`): Voronoi cell grid with mortar gaps, warm grey Canarian stone. Used for `main` roads inside city footprint.
  - **Dirt road** (`uSurfaceMode=1`): warm brown volcanic earth, FBM noise, subtle tire ruts near edges. Used for `main` + `service` outside city + all `service` roads.
  - **Packed earth** (`uSurfaceMode=2`): dry lighter path. Used for `walk` paths.
  - **Edge fade**: `smoothstep` from 0..0.12 and 0.88..1.0 in cross-road UV — surfaces fade to transparent at edges, blending into terrain.
  - Along-road UV tiled every 4 world units.

- `[MODIFIED] src/scenes/environment/TenerifeGeoRoadLayers.tsx` — generates UV coords along road centerline; `surface` passes use `ShaderMaterial`; `shoulder`/`centerline` passes keep `StandardMaterial` with earthy colors.

- `[MODIFIED] src/scenes/environment/tenerifeRoadLayers.ts` — added `surfaceType: RoadSurfaceType` to `TenerifeRoadLayerStyle`.

**Verification**: `bun run check` clean, 155/155 tests pass.
