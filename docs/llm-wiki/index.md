# LLM Wiki Index

Read this file before broad repository scans. This wiki is a compact project map for new LLM sessions; it complements `AGENTS.md` and does not replace it.

## Read Order
- Start with `AGENTS.md` for mandatory standards.
- Read this index to choose the relevant page.
- Open only the task-relevant source files listed by that page.
- Avoid scanning `node_modules`, `dist`, large asset folders, and generated output unless the task explicitly requires it.

## Pages
### Orientation
- [Project Map](./project-map.md) - directory map, current runtime entry points, and files to inspect first.
- [Scene Architecture](./scene-architecture.md) - how React, Babylon, physics, environment, player, collectibles, and HUD are composed.
- [Validation](./validation.md) - commands to run and when to use each.

### Gameplay
- [Gameplay Loop](./gameplay-loop.md) - discovery waves, inventory, crafting, progression, and state ownership.
- [World Building](./world-building.md) - how to add trees, props, buildings, houses, NPCs, and static world data.

### Assets
- [Asset Pipeline](./asset-pipeline.md) - `glb`, Blender cleanup, runtime placement, licenses, scale, pivots, colliders, and loading notes.
- `docs/templates/asset-intake.md`, `docs/templates/texture-budget.md`, `docs/templates/physics-object.md`, and `docs/templates/behavior-agent.md` - required templates for new gameplay-relevant assets, textures, physics objects, and NPC/agent behavior.
- `wikibest/` - official-source research archive behind current asset, texture, physics, and behavior policies.

### Project Memory
- [Decisions](./decisions.md) - short architecture and workflow decisions that should guide future edits.
- [Log](./log.md) - append-only LLM-wiki maintenance log.

## Update Rules
- Prefer updating an existing page over creating a duplicate page.
- Add a new page only when the topic will be reused by future sessions.
- Keep pages short and navigational; link to source files and canonical docs instead of copying large sections.
- When the wiki changes materially, update this index and append to [Log](./log.md).
