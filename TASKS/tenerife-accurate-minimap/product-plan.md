# Product Plan

## User-Visible Outcome

Players in Tenerife full-island mode should see a minimap and full map whose island silhouette matches the playable terrain, with the player marker positioned against the same world-space bounds as the loaded island model.

## Acceptance Criteria

- The full-island HUD map uses a generated Tenerife island outline instead of the current approximate hand-authored SVG path.
- Player marker projection in full-island mode uses the same runtime world bounds as the generated map data.
- Legacy arena and lightweight Tenerife preview map behavior remains unchanged.
- The generated map data records source/model provenance and runtime transform assumptions.
- Focused tests cover world-to-map projection for arena, legacy Tenerife preview, and full-island Tenerife mode.
- Full-island map marks Puerto de la Cruz, Santa Cruz de Tenerife, Los Realejos, La Laguna, and La Orotava from WGS84 city coordinates.

## Non-Goals

- No live second Babylon scene or render target for the minimap.
- No final Puerto patch geospatial alignment in this slice.
- No road-perfect full-island atlas until road/control point data is generated for the whole island.

## Priority

High for the full Tenerife island mode, because the current square projection and hand-drawn island path make player location hard to trust.
