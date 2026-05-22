# 2026-05-22 Tenerife Ocean Debug Audit Implementation

## Summary

Implemented the first runtime-truth and imported-water audit slice for the full-island Tenerife ocean integration. This adds a visible `?oceanDebug=1` readout, query flags to isolate custom and imported ocean layers, and a GLB mesh/material audit that hides water-looking imported meshes by default.

## References Used

- `AGENTS.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `TASKS/tenerife-ocean-island-integration/tasks.md`

## Changes

- Added `src/scenes/environment/ocean/oceanDebug.ts`.
- Added `src/scenes/environment/ocean/oceanDebug.test.ts`.
- Updated `TenerifeFullIslandTerrain.tsx` to audit imported GLB meshes and hide water-like meshes unless `?showImportedWater=1` is set.
- Updated `TenerifeOcean.tsx` to support `?hideCustomOcean=1` and publish active ocean config to the debug overlay.
- Updated `TASKS/tenerife-ocean-island-integration/tasks.md` with implementation status and verification notes.

## Runtime Flags

- `?oceanDebug=1` shows the active URL, full-island waterline values, custom/imported water visibility, and imported-water audit summary.
- `?hideCustomOcean=1` disables the custom `OceanSurface`.
- `?showImportedWater=1` keeps water-like imported GLB meshes visible.
- `?hideImportedWater=1` explicitly hides water-like imported GLB meshes.

## Port Finding

The previous visual mismatch was consistent with a stale listener on `localhost:5173`. Local inspection showed an old IPv6 listener on `[::1]:5173` and a newer Vite listener on `127.0.0.1:5173`. The stale process was killed, then Vite was restarted with `npm run dev -- --host localhost --port 5173`.

## Validation

- Passed: `bun run test -- src/scenes/environment/ocean/oceanDebug.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bunx biome check src/scenes/environment/ocean/oceanDebug.ts src/scenes/environment/ocean/oceanDebug.test.ts src/scenes/environment/TenerifeFullIslandTerrain.tsx src/scenes/environment/TenerifeOcean.tsx`.
- Passed: `bun run build` with the existing large chunk warning.
- Started dev server: `npm run dev -- --host localhost --port 5173`.
- Verified: `curl -6 -I 'http://localhost:5173/?tenerife=1&terrain=island-full&oceanDebug=1'` returned `HTTP/1.1 200 OK`.

## Depth Sorting Follow-Up

The water still appeared high after large waterline changes, which indicates the failure mode was depth/sorting rather than only sea-level configuration. Updated `OceanSurface` to render in group `0` and keep depth writes enabled so terrain and the player can occlude water that is physically behind or below them.

Additional validation:
- Passed: `bunx biome check src/scenes/environment/OceanSurface.tsx`.
- Passed: `bun run test -- src/scenes/environment/ocean/oceanDebug.test.ts src/scenes/environment/oceanVisualConfig.test.ts`.
- Passed: `bun run build` with the existing large chunk warning.
