# Roadmap

## Phase 1: Planning And Asset Intake

Status: Done

- Record product, roadmap, technical plan, task checklist, and asset intake.
- Confirm the tree asset runtime path and current project asset constraints.

## Phase 2: Data And Rendering

Status: Done

- Add authored Tenerife mountain tree placements.
- Add a Tenerife-only tree renderer that loads the GLB once and places thin instances on terrain.
- Keep the Teide dry zone empty.

## Phase 3: Validation

Status: Done

- Add focused tests for placement bounds, uniqueness, and Teide exclusion.
- Run targeted tests and project checks.

## Phase 4: Dense Ridge Coverage

Status: Done

- Expand the authored placement data into deterministic mountain and ridge belts.
- Emphasize slopes above Puerto de la Cruz and the Puerto de la Cruz to Santa Cruz ridge chain.
- Preserve the Teide dry-zone exclusion while increasing mountain density.
- Add tests that lock the expected dense coverage regions.

## Phase 5: Terrain-Sampled Slope Correction

Status: Done

- Analyze the full-island terrain GLB coordinate space and current placement failure.
- Compare placement strategies and choose a deterministic slope-sampled approach.
- Replace guessed belts with terrain-sampled slope belts.
- Add tests for slope metadata, coastal-edge exclusion, and Puerto/Santa-Cruz coverage.

## Phase 6: Runtime Puerto Mountain Forest And Asset Grounding

Status: Done

- Diagnose floating tree artifacts from the provided `Tree.glb` hierarchy.
- Filter out source-offset mini tree roots and dry branch roots that create stray visual artifacts.
- Ground the instanced source by the trunk base instead of the lowest stray branch vertex.
- Replace static slope tuples with a deterministic runtime forest generator that scans the loaded full-island heightfield.
- Prioritize dense Puerto-side mountain cells while still filling other non-Teide mountain regions.

## Phase 7: Screenshot-Driven Island Afforestation Reset

Status: Not started

- Treat the 2026-06-03 screenshots as failing evidence for the existing placement strategy.
- Add visual acceptance gates for the Puerto start view and at least one inland ridge view.
- Replace edge-biased placement with region definitions that target actual visible mountain faces, not coastline or terrain-edge cells.
- Add water/off-island rejection based on heightfield availability, minimum elevation, and distance from ocean-facing terrain edges.
- Keep Teide dry-zone exclusion and non-Tenerife arena isolation.
- Re-run focused tests, project validation, and browser visual QA when implementation begins.
