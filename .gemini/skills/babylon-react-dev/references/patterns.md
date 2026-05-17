# Babylon.js & React Game Patterns

## 🚀 Engine & Scene Lifecycle

### 1. Engine Initialization
Always use the `<Engine>` component from `react-babylonjs`. Ensure `antialias` and `adaptToDeviceRatio` are enabled for quality.

### 2. Physics (Havok) Setup
Havok must be initialized asynchronously. Use the following pattern in your scene component:

```tsx
const [havokPlugin, setHavokPlugin] = useState<HavokPlugin | null>(null);

useEffect(() => {
	const initHavok = async () => {
		const havokInstance = await HavokPhysics();
		const plugin = new HavokPlugin(true, havokInstance);
		setHavokPlugin(plugin);
	};
	initHavok();
}, []);

// In JSX:
<Scene enablePhysics={havokPlugin ? [new Vector3(0, -9.81, 0), havokPlugin] : undefined}>
    {/* Render physics-dependent objects only when havokPlugin is ready */}
</Scene>
```

## 🏗 Component Architecture

### 1. Scene Decomposition
Divide large scenes into small, functional components:
- `Environment.tsx`: Lights, skybox, ground.
- `Player.tsx`: Character mesh, input handling, camera follow.
- `LevelGeometry.tsx`: Static obstacles and structures.

### 2. Declarative Props
Use `react-babylonjs` props for simple properties (position, rotation, scaling). For complex logic or manual mesh manipulation, use the `onMeshReady` or `assignTo` props to get a reference to the underlying Babylon object.

## 🛠 Best Practices

- **Performance**: Use `instances` for repetitive meshes (e.g., forest, crowd).
- **Cleanup**: `react-babylonjs` handles most cleanup, but if you create resources manually (textures, custom shaders), dispose of them in a `useEffect` cleanup function.
- **State Integration**: Connect `zustand` stores to components to drive game logic (e.g., updating UI or moving objects based on game state).
- **Types**: Always use `type PropsType = { ... }`.
- **Documentation**: Use JSDoc for all functional components and logic hooks.
