# Session Log: 2026-05-05 - GEMINI Protocol Refresh

## Objectives
- Bring the agent source-of-truth document in line with the current project reality.
- Reflect the new 3D asset, Blender, and AI-assisted workflow decisions in the agent protocol.

## Changes
- Rewrote `GEMINI.md` to reflect the actual current stack and project rules.
- Updated React version reference to React 19.
- Added explicit source-of-truth document links.
- Added runtime ownership rules for React, Babylon, Zustand, and ephemeral event flow.
- Added 3D asset governance rules for `glb`, asset placement, cleanup, and collider policy.
- Added AI and Blender policy for when AI-first asset generation is acceptable and when it is not.
- Updated validation guidance to reflect current known caveats in `bun run check` and `bun run test`.

## Why
- The previous `GEMINI.md` had drifted from the actual project state.
- New Blender and AI asset workflows had been documented, but not yet promoted into the primary agent protocol.
- Validation instructions needed to distinguish between ideal policy and the current repo baseline.

## Impact
- `CLAUDE.md` and `CODEX.md` continue to work as thin references.
- Future agents now have one aligned protocol document for:
	- architecture
	- asset workflow
	- validation behavior
	- documentation maintenance
