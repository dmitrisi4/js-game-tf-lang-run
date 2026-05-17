# LLM Wiki Log

Append-only record for changes to `docs/llm-wiki/`.

Format:

```md
## [YYYY-MM-DD] <type> | <short title>
- pages touched: ...
- notes: ...
```

---

## [2026-05-10] init | project LLM wiki created
- pages touched: index.md, project-map.md, scene-architecture.md, world-building.md, asset-pipeline.md, gameplay-loop.md, validation.md, decisions.md, log.md
- notes: created compact orientation wiki for future LLM sessions; linked from `GEMINI.md`.

## [2026-05-10] update | building pack integration documented
- pages touched: world-building.md, decisions.md, log.md
- notes: documented `WORLD_BUILDINGS`, `WorldBuildings.tsx`, and the January 2019 OBJ building pack path.

## [2026-05-11] update | buildings shared with Tenerife preview
- pages touched: scene-architecture.md, world-building.md, log.md
- notes: documented that `WorldBuildings` is rendered alongside `TenerifeIslandPreview` in `?tenerife=1` mode.

## [2026-05-11] update | Tenerife-specific building placements
- pages touched: scene-architecture.md, world-building.md, log.md
- notes: replaced shared arena building placement in Tenerife mode with a separate visual-only `TENERIFE_PREVIEW_BUILDINGS` set.

## [2026-05-11] update | Tenerife building ground alignment
- pages touched: world-building.md, log.md
- notes: `WorldBuildings` can raycast-align preview buildings to the Tenerife `ground1` mesh.

## [2026-05-11] update | Tenerife building height offsets
- pages touched: world-building.md, log.md
- notes: Tenerife preview buildings raycast-align to the `ground1` island mesh and keep visual `heightOffset` tuning for the current preview camera.

## [2026-05-11] update | building OBJ pivot normalization
- pages touched: world-building.md, log.md
- notes: documented that `WorldBuildings.tsx` normalizes imported OBJ meshes so model lower bounds sit on placement anchors.

## [2026-05-12] update | Tenerife city roads and preloader
- pages touched: scene-architecture.md, world-building.md, log.md
- notes: documented the scene preloader readiness gate, Tenerife preview roads, and denser road-aligned building placement.

## [2026-05-13] update | OSM Puerto city alignment and safety layer
- pages touched: scene-architecture.md, world-building.md, log.md
- notes: documented OSM-derived Puerto roads/buildings, exact Tenerife terrain mesh detection, disabled baked GLB Puerto detail, shared Tenerife spawn/reset config, water/seabed bounds, and fall reset.

## [2026-05-13] fix | Tenerife player waits for ground
- pages touched: scene-architecture.md, log.md
- notes: documented that Tenerife player creation is gated on environment readiness and spawn height is raycast from loaded `ground1`.

## [2026-05-13] update | wikibest practices integrated
- pages touched: index.md, asset-pipeline.md, decisions.md, log.md
- notes: documented new templates, promoted wikibest asset/texture/physics/behavior guidance, and linked the initial physics/collision metadata primitives.

## [2026-05-13] fix | Tenerife soft island edge
- pages touched: scene-architecture.md, log.md
- notes: documented that Tenerife safety uses water/seabed plus deep-water reset instead of hard invisible boundary walls.

## [2026-05-16] update | AGENTS.md canonical protocol
- pages touched: index.md, log.md
- notes: updated wiki orientation to name `AGENTS.md` as the canonical agent protocol now that `GEMINI.md`, `CLAUDE.md`, and `CODEX.md` are symlinks.
