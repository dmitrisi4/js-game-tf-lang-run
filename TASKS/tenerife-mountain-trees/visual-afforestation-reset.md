# Visual Afforestation Reset

## Problem

The current Tenerife mountain tree layer does not meet the player-facing outcome. In the 2026-06-03 screenshots, trees appear off to the side and some read as floating over ocean or horizon, while the visible mountain faces above Puerto de la Cruz are mostly empty.

This means terrain-derived count, slope, or bounds checks are not enough. The next implementation must validate where trees read from normal gameplay cameras.

## Product Goal

Make the island mountains read as planted from traversal scale:

- Puerto-side mountains should show clear tree coverage from the normal start/player view.
- The Puerto de la Cruz to Santa Cruz ridge chain should contain visible tree bands.
- Teide and the immediate volcanic desert remain intentionally sparse.
- No tree cluster should look like it is over water, detached from terrain, or sitting beyond the island edge.

## Placement Strategy

Use a stricter candidate pipeline:

1. Start from the loaded full-island heightfield, not guessed geography coordinates.
2. Require the candidate and slope-neighbor samples to return valid terrain heights.
3. Reject candidates below the mountain elevation threshold before scoring.
4. Reject ocean-facing edge cells and northern/side bands that read as off-island from the Puerto camera.
5. Score Puerto-visible mountain faces and ridges before global island fill.
6. Keep deterministic placement, yaw, scale, and spacing for test stability.

## Acceptance Gates

- Puerto start-view screenshot shows visible trees on the mountain slopes ahead of the player.
- Inland mountain/ridge screenshot shows coverage across slopes rather than a thin edge band.
- Automated tests prove minimum Puerto-visible coverage and maximum allowed edge-band placements.
- Teide dry-zone tests remain green.
- Default non-Tenerife arena remains unchanged.

## Verification

- `bun run test -- src/scenes/environment/tenerifeMountainTreeData.test.ts src/scenes/environment/TenerifeMountainTrees.test.ts`
- `bun run check`
- `bun run build`
- Browser QA at `http://127.0.0.1:<port>/js-game-tf-lang-run/?tenerife=1&terrain=island-full`

## References Used

- `docs/reference/project-vision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/documentation-maintenance.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/world-building.md`
