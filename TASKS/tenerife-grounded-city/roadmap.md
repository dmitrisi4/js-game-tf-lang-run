# Roadmap

## Phase 1: Diagnose Fit And Grounding

Confirm whether the visual mismatch comes from island scale, road projection scale, road y-offset, terrain height sampling, or missing clipping.

Deliverables:

- Screenshot/browser verification notes.
- Measured road bounds.
- Measured island/playable bounds.
- Decision on whether to scale the island, scale/recenter roads, or clip roads.

## Phase 2: Fix Road Ground Contact

Make road mesh vertices hug the terrain.

Deliverables:

- Road y-offset reduced to a minimal anti-z-fighting value.
- Ribbon mesh vertex heights sampled from final left/right edge positions.
- Road material still visible without floating.
- Optional small terrain conforming bias per layer.

## Phase 3: Fit Roads To Island Surface

Keep the visible road network inside the intended island surface.

Deliverables:

- Either adjusted projection scale/offset or island scale.
- Optional road bounds filter/clipping against a conservative island footprint.
- Updated minimap/preview alignment if needed.

## Phase 4: Improve Roadside Building Placement

Make buildings larger and place them along valid grounded roads.

Deliverables:

- Larger generated building scale.
- Placement based on accepted road segments only.
- Consistent side offsets and yaw along segment direction.
- Distance checks to reduce overlap.

## Phase 5: Verify And Tune

Validate visually and with targeted checks.

Deliverables:

- Browser screenshot verification.
- Focused tests/build where applicable.
- Updated task statuses.
- Follow-up notes for streaming epic.

## Phase 6: Add Real Terrain Building Blockers

Prevent the player from walking through the generated Puerto city buildings in `?tenerife=1&terrain=real`.

Deliverables:

- Static mesh collision on the baked `puerto-osm-city-buildings` mesh.
- Focused tests for identifying the baked city building mesh.
- Follow-up design notes for a later original building jump/climb mechanic.

## Phase 7: Add Roof Parkour Traversal

Let the player intentionally traverse from building walls to rooftops without turning normal jump into a global super jump.

Deliverables:

- Runtime roof landing points generated from the same Puerto building data used by the GLB.
- Wall-facing jump detection against the baked city building mesh.
- Short wall-jump, ledge-grab hold, and climb-up motion sequence.
- Focused tests for roof landing selection and traversal activation helpers.
