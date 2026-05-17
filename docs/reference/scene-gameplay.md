# Scene And Gameplay Rules

- `MainScene.tsx` should be a composition root, not a dumping ground for gameplay logic.
- Player locomotion authority belongs to a physics capsule, not the visual mesh.
- Camera logic must live outside raw scene markup and remain isolated in controller modules.
- Input must be normalized into semantic commands before player movement consumes it.
- World scale is fixed at `1 unit = 1 meter`.
- High-frequency spawned objects such as pickups, projectiles, short-lived VFX, and damage indicators must be evaluated for pooling before repeated runtime create/destroy is introduced.
- NPC and enemy behavior must separate sensing, durable decision state, and scene action. Pathfinding or reachability checks must not run every frame unless a measured budget justifies it.
