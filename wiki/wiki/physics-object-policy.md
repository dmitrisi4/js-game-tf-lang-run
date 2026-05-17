# Physics Object Policy

## Purpose

Physics must be explicit, cheap, and separate from presentation. Visual meshes are not gameplay authority by default. (source: ../../GEMINI.md; ../../wikibest/best-practices.md)

## Required Fields

Every gameplay physics object needs:
- body type: static, kinematic, dynamic, trigger, or visual-only
- gameplay authority
- collider shape
- collision layer and mask
- mass/damping/friction/restitution when simulated
- sleeping policy
- CCD or swept-collision need
- pooling reset behavior when reused

Use `../../docs/templates/physics-object.md` for new physics objects.

## Collider Rules

- Prefer primitive or compound primitive colliders for dynamic gameplay objects.
- Use convex colliders only when primitives cannot represent the interaction.
- Use mesh colliders mainly for static environment queries and only with a documented reason.
- Imported visual meshes must not silently become colliders.

## Runtime Registry

Collision layers and metadata types live in `../../src/scenes/physics/collisionLayers.ts` and `../../src/scenes/physics/physicsMetadata.ts`.

## Related

- [[collision-layers]]
- [[asset-pipeline]]
- [[scene-architecture]]
