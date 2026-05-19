# Full Tenerife Island Integration Epic

Status: Planning complete, implementation not started

Priority: High. This supersedes treating the Puerto de la Cruz patch as the island.

## Problem

`?tenerife=1&terrain=real` currently loads a Puerto de la Cruz city patch. That patch contains a decorative Atlantic plane and a Teide backdrop, but it is not a complete Tenerife island. The ocean is not readable from the player route, and Teide is not reachable because it is a background mesh rather than the island's central terrain.

The project now has a stronger candidate source asset:

- `public/models/land/tenerife._islas_canarias.glb`
- Sketchfab title: `Tenerife. Islas Canarias`
- Author: `Unknown08tf`
- License: `CC-BY-4.0`
- Source: `https://sketchfab.com/3d-models/tenerife-islas-canarias-628865c6fe29460bb2f6a8ba8d223087`

This model should become the full-island terrain foundation after normalization, with Puerto de la Cruz added as a detailed city patch on the north coast.

## Goal

Build a believable playable Tenerife world where:

- the whole island reads as Tenerife from map and camera distance
- ocean surrounds the island and is visible at the coast
- Teide is real terrain that can be approached or reached through gameplay
- Puerto de la Cruz is placed on the island as the detailed starter city
- current Puerto city work remains available and is not discarded
- runtime performance stays within browser limits

## Documents

- [Product Plan](./product-plan.md)
- [Roadmap](./roadmap.md)
- [Technical Plan](./technical-plan.md)
- [Asset Intake](./asset-intake.md)
- [Texture Budget](./texture-budget.md)
- [Physics Plan](./physics-plan.md)
- [Tasks](./tasks.md)

## References Used

- `AGENTS.md`
- `docs/llm-wiki/index.md`
- `docs/llm-wiki/scene-architecture.md`
- `docs/llm-wiki/world-building.md`
- `docs/reference/project-vision.md`
- `docs/reference/asset-pipeline.md`
- `docs/reference/runtime-architecture.md`
- `docs/reference/scene-gameplay.md`
- `docs/reference/physics-collision.md`
- `docs/reference/tech-stack-validation.md`
- `docs/reference/documentation-maintenance.md`
