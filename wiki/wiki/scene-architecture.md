# Scene Architecture

## Ownership

- React owns app composition, UI overlays, and non-frame-critical rendering. (source: ../../GEMINI.md)
- Babylon owns scene graph, physics, camera transforms, raycasts, and per-frame updates. (source: ../../GEMINI.md)
- Zustand owns durable gameplay state such as inventory, progression, player stats, and UI visibility. (source: ../../GEMINI.md)
- The event bus is for one-shot signals only and must not become a second source of truth. (source: ../../GEMINI.md)

## Runtime Flow

- `src/main.tsx` mounts React. (source: ../../src/main.tsx)
- `src/App.tsx` hosts the app shell. (source: ../../src/App.tsx)
- `src/scenes/MainScene.tsx` creates the Babylon engine/scene composition and gates runtime modules on readiness. (source: ../../src/scenes/MainScene.tsx)
- `GameHud` is rendered as React UI outside the Babylon scene and receives scene/store state. (source: ../../src/scenes/MainScene.tsx; ../../src/ui/)

## Main Scene Composition

`MainScene.tsx` should stay an orchestration root, not a gameplay dumping ground. Feature behavior belongs in focused modules. (source: ../../GEMINI.md; ../../src/scenes/MainScene.tsx)

Key scene modules:
- player input and interaction bridges
- scene camera
- environment
- player
- letter collectibles
- prototype objects
- game HUD

## Environment

Environment work starts in `src/scenes/environment/`. The current architecture separates sky, lighting, terrain/ground, scenery, Tenerife preview, and safety/runtime city layers. (source: ../../docs/llm-wiki/scene-architecture.md; ../../src/scenes/environment/)

Imported visual meshes should not silently become gameplay-authoritative colliders. Static obstacles should use explicit collider strategy. (source: ../../GEMINI.md)

## Related

- [[project-map]]
- [[asset-pipeline]]
- [[validation]]
