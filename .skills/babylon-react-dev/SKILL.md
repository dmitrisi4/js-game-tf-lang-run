---
name: babylon-react-dev
description: Expert guidance for developing 3D games using Babylon.js and React (react-babylonjs). Use this skill when creating or modifying scenes, components, or game logic in the keyArena project.
---

# Babylon.js & React Development

This skill provides specialized patterns and workflows for building declarative 3D applications with `react-babylonjs` and Havok physics.

## 📋 Core Workflows

1. **Scene Creation**: Initialize engine and physics. See [patterns.md](./references/patterns.md).
2. **Component Modularity**: Break down scenes into focused sub-components (Environment, Player, Logic).
3. **State Management**: Use Zustand to bridge React UI and Babylon.js 3D state.
4. **Validation**: Always run `bun run check` and `bun run test` after changes.

## 🏗 Architectural Rules

- **Strict Types**: No `interface`, only `type`.
- **Naming**: Component props must be `PropsType`.
- **JSDoc**: Document all exported functions and components.
- **Modularity**: Keep files small (<200 lines).

## 🚀 Pro-Tips

- Use absolute imports: `@/scenes/...`.
- Prefer Havok for all physics-based interactions.
- Utilize `@babylonjs/inspector` for real-time scene debugging.
