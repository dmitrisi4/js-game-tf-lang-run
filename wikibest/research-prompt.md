# Improved Research Prompt

## Goal

Собрать практическую wiki по best practices для 3D game development, применимую к `keyArena`: React + Babylon.js + Havok + GLB/Blender pipeline + открытый RPG-мир.

## Scope

Исследовать только первичные или официальные источники, где это возможно:
- движки: Babylon.js, Unity, Unreal Engine, Godot
- форматы и ассеты: Khronos glTF/KTX, Blender glTF exporter
- физика: NVIDIA PhysX, Unity Physics, Godot Physics, Babylon/Havok
- AI/поведение: NavMesh, Behavior Trees, crowd/pathfinding
- runtime-производительность: текстуры, материалы, draw calls, инстансинг, LOD, стриминг, коллизии, object pooling

## Research Questions

1. Какие практики повторяются в нескольких движках и поэтому являются переносимыми?
2. Какие практики особенно важны для web/Babylon runtime?
3. Как должен выглядеть дисциплинированный pipeline для текстур, GLB, материалов и коллизий?
4. Как проектировать физику предметов: collider shape, mass, inertia, sleeping, collision layers, timestep, continuous collision detection?
5. Как организовать поведение объектов и NPC: state machines, behavior trees, navmesh, sensing, path queries, update budget?
6. Какие практики стоит немедленно закрепить в `keyArena`, а какие оставить как будущие optimization gates?

## Output Requirements

- Писать коротко и практически.
- Каждый принцип должен ссылаться на источник из `sources.md`.
- Разделять:
  - hard rules: применять всегда
  - heuristics: применять после профилирования
  - project actions: конкретные изменения для `keyArena`
- Не переносить Unity/Unreal API напрямую в Babylon; извлекать engine-agnostic принцип.
- Для `keyArena` считать `GEMINI.md` локальным стандартом проекта.

## Search Terms Used

- official game development best practices textures physics optimization
- Unity texture optimization mipmap streaming physics optimization object pooling NavMesh
- Unreal texture streaming physics Behavior Tree optimization
- Babylon.js optimize scene Havok physics glTF materials
- Khronos glTF KTX PBR texture compression asset validation
- Blender glTF exporter materials textures official manual
- Godot navigation performance physics collision shapes
- NVIDIA PhysX rigid body collision shapes dynamics
