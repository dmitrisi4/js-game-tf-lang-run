# keyArena Wiki Index

Content catalog for the nested project wiki. Read this before wiki work, then open only task-relevant pages and source files.

## Read Order

- Start with `../../GEMINI.md` for project standards.
- Read this index to choose the relevant wiki page.
- For broad project refreshes, use [CLAUDE.md](../CLAUDE.md) project-scan rules.
- Avoid scanning `../../node_modules`, `../../dist`, generated output, and large asset folders unless the task requires it.

## Orientation

<!-- Project maps, repo entry points, runtime ownership. -->

- [Project Map](./project-map.md) - source map, first files, and paths to avoid during broad orientation.

## Architecture

<!-- Runtime architecture, scene composition, state ownership, data flow. -->

- [Scene Architecture](./scene-architecture.md) - React/Babylon/Zustand ownership, runtime flow, and environment composition.
- [Physics Object Policy](./physics-object-policy.md) - body kinds, collider choices, authority, sleeping, CCD, and pooling reset rules.
- [Collision Layers](./collision-layers.md) - project collision layer registry and filtering rules.
- [Behavior And AI Policy](./behavior-ai-policy.md) - sensing/decision/action split, path query budget, and NPC behavior guidance.

## Gameplay

<!-- Gameplay loop, discovery, inventory, crafting, progression, controls. -->

- [Gameplay Loop](./gameplay-loop.md) - letter/word discovery loop, state ownership, and files to inspect for gameplay changes.

## Assets

<!-- 3D models, Blender/GLB workflow, placement, collision and scaling notes. -->

- [Asset Pipeline](./asset-pipeline.md) - GLB, Blender normalization, AI asset limits, and collider rules.
- [Asset Intake Template](./asset-intake-template.md) - required metadata before assets become gameplay-relevant.
- [Texture Budget](./texture-budget.md) - texture size, mipmap, compression, color/data, and loading policy.
- [World Streaming Performance](./world-streaming-performance.md) - separation of visuals, colliders, navigation, and texture budgets for large world layers.

## External Sources

<!-- Per-source summary pages from raw/. Format: - [title](path.md) - one-line summary (date). -->

_(no raw sources ingested yet)_
- [wikibest research pack](../../wikibest/best-practices.md) - official-source game development best practices integrated into project rules on 2026-05-13.

## Decisions

<!-- Stable project decisions and conventions. -->

- [Decisions](./decisions.md) - active project standards and runtime boundaries from `GEMINI.md`.

## Open Questions

<!-- Unknowns, contradictions, and items that need human/project confirmation. -->

_(empty)_

## Maintenance

- [Validation](./validation.md) - Bun validation commands and when to run each.
- [Log](./log.md) - append-only wiki maintenance log.
