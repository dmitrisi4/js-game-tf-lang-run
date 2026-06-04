# Product Plan

## User Outcome

Players exploring Tenerife full-island mode should see believable tree coverage on Puerto-side and island mountain slopes, while the area around Teide remains sparse and desert-like.

The current screenshots show a failed visual outcome: trees read as a misplaced side/ocean band and the visible mountains remain bare. This follow-up should make the mountains feel planted from normal traversal cameras, not only from a top-down data perspective.

## Acceptance Criteria

- Spruce tree visuals render in Tenerife mountain areas.
- No visible tree cluster appears over the ocean, outside the island terrain, or as a detached horizon-side band.
- The first Puerto de la Cruz player-facing mountain view contains obvious tree coverage on the slopes and ridges in front of the player.
- Mountain tree coverage is dense enough to read from traversal scale, including all major mountain bands, the slopes above Puerto de la Cruz, and the ridge chain from Puerto de la Cruz toward Santa Cruz.
- Authored trees must pass terrain-derived slope metadata checks so they do not form coastal or horizon-side bands.
- Placement must use a land/terrain availability gate, a minimum elevation gate, a slope gate, and explicit exclusion from water-facing edge cells.
- At least two screenshot or browser QA viewpoints must be defined for validation: Puerto-side start view and an inland mountain/ridge view.
- Puerto-side mountains should be visibly populated from the player start view, not only distant ridges.
- Tree asset parts must be grounded as one coherent main tree and must not render mini/source-offset tree parts as floating artifacts.
- No authored tree placement falls inside the protected Teide dry zone.
- Trees are loaded from the provided `public/models/spruce-trees` GLB asset.
- Tree rendering uses instancing or equivalent batching rather than importing one GLB per placement.
- Trees are visual-only for this pass and do not silently become gameplay collision authority.
- The default non-Tenerife arena remains unchanged.

## Non-Goals

- Biome-specific vegetation map or GIS-accurate forest coverage.
- Tree collision gameplay.
- LOD streaming or chunked vegetation.
- Blender cleanup or asset repackaging beyond runtime integration.
- Final species-accurate Tenerife vegetation art direction.

## Priority

High for visual readability in mountain traversal, but scoped as a first-pass scenic layer.
