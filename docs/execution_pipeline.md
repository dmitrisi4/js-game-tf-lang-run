# keyArena Execution Pipeline

## Purpose
Convert the implementation plan into an execution sequence that can be applied incrementally in the codebase with visible completion states.

## Execution Order
### Stage 1: Foundation
Goal:
- split the monolithic scene into composition modules
- isolate debug tooling from runtime composition
- establish stable validation gates

Deliverables:
- `MainScene.tsx` reduced to scene composition
- extracted environment modules
- extracted debug-layer lifecycle
- green `check`, `test`, `test:ci`, and `build`

Current status:
- completed

### Stage 2: Core Gameplay State
Goal:
- replace placeholder store shape with gameplay-oriented slices
- add selectors and first gameplay-focused tests

Deliverables:
- store state for player stats, inventory, and UI
- tested state transitions
- no gameplay-critical state hidden in component-local state

Current status:
- completed

### Stage 3: Input And Controller Layer
Goal:
- normalize input into semantic commands
- separate player behavior from scene markup

Deliverables:
- input abstraction for keyboard and future mobile adapters
- player controller modules
- camera-follow/controller modules

Current status:
- completed

### Stage 4: Discovery Loop
Goal:
- implement collectible interaction and crafting loop

Deliverables:
- collectible entities
- inventory mutations
- valid word crafting
- HUD and inventory overlay

Current status:
- in progress

### Stage 5: Asset Integration
Goal:
- move from primitive placeholders to real imported assets

Deliverables:
- first player model integration
- first collectible asset integration
- validated Blender-to-`glb` import path

Current status:
- pending

### Stage 6: Stabilization
Goal:
- confirm the vertical slice is buildable, testable, and documented

Deliverables:
- strict validation gates green
- architecture docs synced
- session logs current

Current status:
- pending

## Current Sprint
Active work:
1. Replace primitive collectibles with asset-backed pickups
2. Introduce the first imported player-facing visual asset
3. Validate the Blender-to-`glb` runtime path inside the existing loop

## Done Definition Per Stage
- code is modular and aligned with `GEMINI.md`
- validation commands relevant to the change pass
- documentation and logs are updated
