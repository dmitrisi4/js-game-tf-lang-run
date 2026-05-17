# Map and forest expansion pipeline

## Goal

Expand the current 96x96 RPG prototype map into a larger exploratory space with a denser forest silhouette, while keeping the world data-driven and testable.

## Implemented Slice

1. Increase `WORLD_SIZE` from `96` to `144`.
2. Add outer semantic zones:
   - `northern-woods`;
   - `southern-wilds`.
3. Expand existing zone coverage:
   - move `east-ruins` and `west-ridge` farther outward;
   - slightly expand `ember-camp` and `north-grove`.
4. Add deterministic tree clusters:
   - deep north forest;
   - deep south forest;
   - east forest line;
   - west forest line;
   - inner grove thickening.
5. Raise tree count from 13 to 64.
6. Keep trees authored through data helpers instead of JSX duplication.
7. Update tests for:
   - world bounds;
   - tree population density;
   - zone resolution;
   - terrain material lookup in new zones.

## Next Slice - Forest Performance

The current implementation uses primitive tree meshes, which is acceptable for this prototype step. If tree count grows beyond roughly 100-150 visible trees, convert repeated tree parts to instances or thin instances.

Implementation order:

1. Create reusable trunk/canopy source meshes.
2. Render tree trunks as instances.
3. Render canopies as instances grouped by color/scale.
4. Keep collision only on nearby or major trunks.
5. Add distance-based collision simplification.
6. Track approximate mesh count in a scene smoke test.

## Next Slice - Forest Gameplay

After the larger map is stable, make forest space useful:

1. Add forage nodes.
2. Add hidden letter/word fragments.
3. Add creature home zones in outer woods.
4. Add props such as ruined markers, camp remains, and path signs.
5. Add minimap/debug zone overlay.

## Acceptance Criteria

- player has more traversal space;
- forest perimeter makes the map feel less like an arena;
- current HUD zone still updates correctly;
- all authored objects remain inside world bounds;
- validation remains green: `npm run check`, `npm test`, `npm run build`.
