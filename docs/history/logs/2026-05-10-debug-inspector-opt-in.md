# 2026-05-10 - Debug Inspector Opt-In

## Summary
- Changed the Babylon Inspector behavior so it no longer opens automatically in development.
- The inspector remains available with the `I` key.

## Files Changed
- `src/scenes/debug/useSceneDebugLayer.ts`

## Notes
- Auto-opening the inspector could cover or squeeze the rendered scene, making the ground and player appear missing.
- This restores the intended dev-only, opt-in debug workflow.
