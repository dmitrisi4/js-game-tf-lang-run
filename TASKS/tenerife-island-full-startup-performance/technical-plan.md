# Technical Plan

## Current Code Paths

- `src/scenes/MainScene.tsx` waits for environment readiness before mounting the player in Tenerife mode.
- `src/scenes/environment/Environment.tsx` selects the `terrain=island-full` path and mounts full island terrain, ocean, mountain trees, safety layer, roads, and optional buildings.
- `src/scenes/environment/puertoCityConfig.ts` resolves road/building defaults from URL params.
- `src/scenes/environment/TenerifeGeoRoadLayers.tsx` builds procedural road ribbons and junction pads.
- `src/scenes/environment/tenerifeGeoData.ts` fetches runtime roads and generates roadside buildings.
- `src/scenes/environment/TenerifeFullIslandTerrain.tsx` imports the GLB and rebuilds the heightfield.

## Suspected Data Flow

1. Full-island terrain GLB loads and builds a heightfield.
2. Runtime road JSON loads for all Tenerife modes.
3. `terrain=island-full` defaults to `roads=mesh`.
4. Road layers build layered meshes from thousands of OSM road lines.
5. The original full-island grounding path preferred per-sample terrain raycasts.
6. Default generated roadside building placement runs from the road layer data.

## Proposed Fix

- Keep default full-island road mode as `mesh` so Puerto roads and generated roadside houses remain visible.
- Delay full-island road/house overlay loading until after the full-island terrain is ready.
- Use terrain raycast road grounding by default on `terrain=island-full` so roads conform to the visible mesh.
- Keep cheaper heightfield grounding available through `&roadGrounding=heightfield` for performance comparison only.
- Do not create Havok bodies for generated roadside visual houses.
- Update tests so the default full-island URL documents the restored visual contract and cheaper grounding path.

## Risks

- Browser smoke may still reveal GLB-side processing cost from UV/color/heightfield work.
- Terrain raycast grounding is more expensive than the heightfield approximation, but it avoids visibly floating road ribbons on slopes.
- If startup remains slow after skipping roads, follow-up work should move terrain processing or city streaming off the critical path.

## Verification Commands

- `bun run test -- src/scenes/environment/puertoCityConfig.test.ts src/scenes/environment/tenerifeRoadLayers.test.ts src/scenes/environment/tenerifeFullIslandConfig.test.ts`
- `bun run check`
- `bun run build`
- Browser smoke: `http://localhost:5173/js-game-tf-lang-run/?tenerife=1&terrain=island-full`

## Measurement Notes

- The default full-island URL resolves to `roads=mesh`.
- A temporary `roads=none` fast default was rejected because it removed roads and houses.
- A temporary `roadGrounding=heightfield` fast default was rejected because it made roads float above the terrain on visible slopes.
- `public/data/tenerife/roads-runtime.json` is about 451 KB and contains 3427 line strings / 12902 road points.
- `public/data/tenerife/puerto-building-footprints-runtime.json` is about 377 KB and contains 1400 buildings.
- Generated roadside houses are capped at 180 placements.
- The local Vite URL returned `200 OK`.
- Browser tooling was blocked in this environment: the in-app browser reported `iab` unavailable, and DevTools MCP reported an already-running Chrome profile.
