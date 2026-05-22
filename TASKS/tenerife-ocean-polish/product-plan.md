# Product Plan

## User-Visible Outcome

When players look from the Tenerife coast, the ocean should read as a living Atlantic surface instead of a flat blue background. The water should have layered color, soft wave movement, horizon depth, and glints that match the existing sky direction.

## Acceptance Criteria

- Full-island Tenerife mode renders a stylized ocean surface with visible motion and color depth.
- Legacy Tenerife preview mode uses the same visual ocean treatment inside its existing safety bounds.
- Water visuals remain collision-free and do not become player movement authority.
- Seabed/reset behavior remains owned by the existing safety layer.
- The implementation is isolated in small environment modules and keeps `Environment.tsx` as composition only.
- Focused tests cover ocean tuning helpers or config behavior.
- Validation commands are recorded with exact pass/fail status.

## Non-Goals

- No physically accurate fluid simulation.
- No expensive reflection/refraction pass in this slice.
- No shoreline mesh generation against exact terrain contours.
- No asset import or Blender work.
- No change to player reset bounds or movement rules unless required by rendering.

## Priority

1. Replace the flat blue box visual.
2. Preserve safety and reset behavior.
3. Share the visual treatment across Tenerife water modes.
4. Keep runtime cost low enough for the current browser scene.

