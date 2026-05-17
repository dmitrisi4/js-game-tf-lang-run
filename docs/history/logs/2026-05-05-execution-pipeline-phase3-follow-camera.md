# 2026-05-05 Stage 3 Follow Camera Slice

## Summary
Extended the Stage 3 controller work from semantic input and placeholder movement to a shared player-target contract between the player runtime and the scene camera.

## Changes
- updated `MainScene.tsx` to store the authoritative player mesh reference
- wired the player mesh into `SceneCamera.tsx` as a follow target
- converted `SceneCamera.tsx` from a static bootstrap camera into a lightweight follow camera
- kept the player controller physics-driven so camera tracking follows the runtime body instead of detached markup state

## Validation
- `bun run check`
- `bun run test:ci`
- `bun run build`

## Status
Stage 3 remains in progress, but the controller stack now includes:
- semantic input normalization
- physics-driven player movement
- follow-camera behavior anchored to the player entity
