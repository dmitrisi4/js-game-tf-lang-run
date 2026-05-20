# Roadmap

## Phase 1: Generate Island Map Data

- Add a deterministic Blender/script pass that projects normalized Tenerife terrain into map-space data.
- Output a compact runtime data file under `src/scenes/environment/` or `public/data/tenerife/`.
- Record runtime bounds and source provenance.

## Phase 2: HUD Integration

- Move map projection logic out of `GameHud.tsx` into a focused module.
- Use generated full-island map data only for `?tenerife=1&terrain=island-full`.
- Keep legacy Tenerife preview and arena map visuals unchanged.

## Phase 3: Verification

- Add unit coverage for projection and map data invariants.
- Run focused tests, build, and targeted Biome checks.
- Add a session log for the generated minimap workflow.

## Phase 4: City Markers

- Add WGS84-to-runtime projection for full-island city markers.
- Mark the requested north/northeast Tenerife cities on the full map.
- Verify the projection against the generated Teide control point and browser DOM positions.
