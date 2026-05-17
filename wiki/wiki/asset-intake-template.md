# Asset Intake Template

## Purpose

Asset intake turns external, AI-generated, or DCC-authored assets into runtime-ready project assets with known scale, material, texture, and physics behavior. (source: ../../GEMINI.md; ../../wikibest/best-practices.md)

Use `../../docs/templates/asset-intake.md` before a new model becomes gameplay-relevant.

## Required Decisions

- source/license
- runtime path
- scale and pivot
- material model and texture maps
- texture budget
- collider strategy
- validation status
- instancing/pooling candidate status

## Acceptance Rule

An asset can be visual-only with minimal physics metadata. An asset used for gameplay must have a documented collider strategy and must be checked in Babylon or a glTF viewer, not only in Blender.

## Related

- [[asset-pipeline]]
- [[texture-budget]]
- [[physics-object-policy]]
