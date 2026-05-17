# Decisions

## 2026-05-10 - Add LLM Wiki
Decision: maintain a compact `docs/llm-wiki/` navigation layer for future LLM sessions.

Reason:
- New chats need fast orientation without scanning the whole repository.
- `GEMINI.md` remains the authoritative project standard.
- The wiki points to task-relevant files and canonical docs instead of duplicating large content.

Implication:
- Read `docs/llm-wiki/index.md` before broad implementation searches.
- Keep wiki pages short, stable, and updated when architecture or workflows change.

## 2026-05-10 - Current Asset Paths Stay In Place
Decision: current runtime model loading from `public/models/` remains documented as the active implementation path.

Reason:
- Existing player, collectible, environment, and hero assets are already under `public/models/`.
- Moving assets into `src/assets/` would be a separate refactor with import/build implications.

Implication:
- New asset work should follow the current loader pattern unless the task explicitly asks for an asset-layout refactor.
- Asset policy still requires `glb`, Blender normalization, scale sanity, pivot sanity, and explicit collider strategy.

## 2026-05-10 - Building Pack Integrated As OBJ Runtime Assets
Decision: use `public/models/build/buildings-pack-jan2019/OBJ/` directly for the first static house/building placements.

Reason:
- The added pack contains OBJ/FBX/Blend files but no GLB exports yet.
- Babylon can load OBJ via `@babylonjs/loaders/OBJ`.
- Direct OBJ loading gets the houses into the scene now while keeping collision authority on simple box colliders.

Implication:
- `WorldBuildings.tsx` owns building visual loading and cached asset containers.
- `worldData.ts` owns `WORLD_BUILDINGS` placement data.
- A later asset cleanup pass can convert the selected OBJ/Blend files to normalized GLB without changing placement data.

## 2026-05-13 - wikibest Practices Promoted To Project Policy
Decision: integrate the `wikibest/` official-source research into `GEMINI.md`, project wiki pages, reusable templates, and initial physics/collision metadata primitives.

Reason:
- Asset, texture, physics, and behavior rules should be enforceable project guidance, not only a research note.
- Future GLB/world/NPC work needs consistent intake metadata before runtime integration.
- Collision layers and physics policy types give code a stable vocabulary without changing current scene behavior.

Implication:
- New gameplay-relevant assets should use `docs/templates/asset-intake.md`.
- New texture sets should use `docs/templates/texture-budget.md`.
- New physics objects should use `docs/templates/physics-object.md`.
- New NPCs/enemies/autonomous props should use `docs/templates/behavior-agent.md`.
- Runtime collision layer names start in `src/scenes/physics/collisionLayers.ts`.
