# Technical Plan

## Runtime Ownership

- `Environment.tsx` remains the composition owner.
- `TenerifeFullIslandTerrain.tsx` owns imported island mesh loading and imported mesh classification.
- A new ocean integration module owns visual ocean layers.
- `TenerifeSafetyLayer` / reset config own safety behavior only.
- Player movement and grounding remain untouched by visual ocean work.

## Proposed Files

New:
- `src/scenes/environment/ocean/oceanDebug.ts`
- `src/scenes/environment/ocean/fullIslandWaterMeshAudit.ts`
- `src/scenes/environment/ocean/fullIslandShorelineSampler.ts`
- `src/scenes/environment/ocean/FullIslandOcean.tsx`
- `src/scenes/environment/ocean/ShorelineFoam.tsx`
- `src/scenes/environment/ocean/oceanMaterialFactory.ts`
- `src/scenes/environment/ocean/oceanConfig.ts`
- `src/scenes/environment/ocean/*.test.ts`

Possible generated data:
- `public/data/tenerife/full-island-shoreline-samples.json`
- `public/data/tenerife/full-island-water-audit.json`

Updated:
- `src/scenes/environment/Environment.tsx`
- `src/scenes/environment/TenerifeFullIslandTerrain.tsx`
- `src/scenes/environment/TenerifeOcean.tsx` or replace with `FullIslandOcean`
- `src/scenes/environment/tenerifeFullIslandConfig.ts`
- `TASKS/full-tenerife-island-integration/tasks.md`
- `docs/history/logs/`

## Pipeline

### 1. Port And Runtime Verification

Goal: prove the browser is seeing the code being changed.

Implementation:
- Add development-only ocean debug metadata:
	- active URL
	- ocean component name
	- water surface Y
	- current mode
	- timestamp or build hash
- Add a browser-visible debug flag:
	- `?oceanDebug=1`
	- shows tiny non-HUD text or console group
- Record `curl -I` response and dev server port before screenshots.

Gate:
- Screenshot shows `oceanDebug` values matching source constants.

### 2. Imported Water Mesh Audit

Goal: identify every mesh/material that can look like water.

Implementation:
- At full-island GLB import, collect mesh names, material names, bounds, vertex counts, and average Y.
- Flag meshes with names/materials containing:
	- `water`
	- `ocean`
	- `sea`
	- `atlantic`
	- `disc`
	- `plane`
- Provide `?hideImportedWater=1` as default in full-island mode once confirmed.
- Provide `?showImportedWater=1` for debug comparison.

Gate:
- With `OceanSurface` disabled, no old blue slab remains.

### 3. Terrain Height And Coast Measurement

Goal: stop guessing sea level.

Implementation:
- Use the existing full-island heightfield as the first sampler.
- Sample around Puerto spawn and around coastline candidate rings.
- Record:
	- terrain Y at player spawn
	- minimum/median coastal Y
	- waterline candidate Y
	- camera-relative horizon behavior
- Add unit tests for pure sampling helpers with synthetic heightfields.

Gate:
- Technical note records measured Puerto terrain Y and chosen waterline Y with margin.

### 4. Shoreline Mask Generation

Goal: foam and shallow color follow the island, not a rectangle or radial center.

Implementation options:
- First pass: CPU-generated 2D signed distance texture from sampled heightfield waterline.
- Alternative: shoreline polyline/ribbon generated from marching squares over height samples.
- Use low resolution first:
	- `256 x 256` for mask
	- `512 x 512` only after performance check

Gate:
- Debug overlay can show coastline mask alignment over minimap/world.

### 5. Base Ocean Material Decision

Goal: choose between custom shader and Babylon `WaterMaterial` with evidence.

Option A: custom `ShaderMaterial`
- Pros:
	- exact control over shoreline mask
	- predictable cost
	- no reflection/refraction RTT overhead
- Cons:
	- more shader maintenance
	- less physically rich by default

Option B: Babylon `WaterMaterial`
- Pros:
	- official water material with waves, bump, reflection/refraction controls
	- proven Babylon API
- Cons:
	- RTT/reflection/refraction cost on full island
	- shoreline mask still custom

Recommended first production slice:
- Keep custom shader for base water.
- Add a `WaterMaterial` experiment behind `?oceanMaterial=babylon`.
- Decide after screenshots and frame timing.

Gate:
- Comparison table records visual quality and frame cost for both paths.

### 6. Shoreline Foam And Shallow Water

Goal: make the coast believable.

Implementation:
- Foam mask uses distance-to-coast and animated noise.
- Shallow tint uses distance-to-coast plus terrain depth below waterline.
- Deep water darkens offshore.
- Foam opacity fades with camera distance to reduce aliasing.

Gate:
- Puerto coast screenshot shows dry land, shallow turquoise edge, and narrow foam at actual coast.

### 7. Safety And Gameplay Separation

Goal: keep visual ocean from breaking player behavior.

Implementation:
- Visual water mesh remains `isPickable = false`.
- Seabed/reset meshes remain invisible safety systems.
- Reset bounds stay in config and tests.
- Avoid using water visual Y as the only reset threshold.

Gate:
- Unit tests confirm reset thresholds and visual water thresholds are independently named and documented.

### 8. Browser QA

Goal: capture evidence from the actual target URL.

Views:
- `http://localhost:5173/?tenerife=1&terrain=island-full&oceanDebug=1`
- Puerto spawn facing coast
- Puerto spawn facing inland
- High coastline slope
- Offshore horizon
- Debug view with ocean disabled
- Debug view with imported water disabled

Gate:
- Screenshots attached or logged in task notes with exact URL and timestamp.

## Risk Register

- Wrong dev server/port can invalidate visual QA.
- Imported GLB water plane can mask all code changes.
- Transparent water sorting can make terrain appear submerged even with correct Y.
- Full island scale may make small Y changes visually irrelevant if camera clips/sorting are wrong.
- WaterMaterial render targets can be too costly for full-island mode.
- Shoreline mask can alias if sampled too coarsely.

