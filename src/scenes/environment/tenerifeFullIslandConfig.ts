import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export const TENERIFE_FULL_ISLAND_MODEL_URL =
	'/models/environment/tenerife-full-island-normalized.glb?v=2026-05-19-restored-full';
export const TENERIFE_FULL_ISLAND_TERRAIN_PREFIX = 'tenerife-full-island-terrain-tile-';
export const TENERIFE_FULL_ISLAND_RUNTIME_SCALE = 0.02;
export const TENERIFE_FULL_ISLAND_WATER_SURFACE_Y = -3.75;
export const TENERIFE_FULL_ISLAND_SEABED_Y = -12.5;
export const TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y = -10.6;
export const TENERIFE_FULL_ISLAND_OCEAN_SIZE = 2800;
export const TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS = {
	maxX: 1320,
	maxZ: 1320,
	minX: -1320,
	minZ: -1320,
};
export const TENERIFE_FULL_ISLAND_PUERTO_START_POSITION = new Vector3(441.53, 16, -272.15);
export const TENERIFE_FULL_ISLAND_TEIDE_POSITION = new Vector3(
	-31371.998046875 * TENERIFE_FULL_ISLAND_RUNTIME_SCALE,
	3653.411376953125 * TENERIFE_FULL_ISLAND_RUNTIME_SCALE,
	-611.14404296875 * TENERIFE_FULL_ISLAND_RUNTIME_SCALE,
);

/** Resolves whether a mesh belongs to the normalized full-island terrain. */
export const isTenerifeFullIslandTerrainMeshName = (meshName: string): boolean =>
	meshName.startsWith(TENERIFE_FULL_ISLAND_TERRAIN_PREFIX);

/** Resolves whether the full-island runtime mode is active. */
export const isTenerifeFullIslandMode = (search?: string): boolean => {
	const params = new URLSearchParams(
		search ?? (typeof window === 'undefined' ? '' : window.location.search),
	);

	return params.get('tenerife') === '1' && params.get('terrain') === 'island-full';
};

/** Resolves whether full-island mode should render at native device pixel ratio. */
export const shouldUseTenerifeFullIslandNativeDeviceRatio = (search?: string): boolean => {
	const params = new URLSearchParams(
		search ?? (typeof window === 'undefined' ? '' : window.location.search),
	);

	return isTenerifeFullIslandMode(search) && params.get('render') === 'retina';
};

/** Resolves whether the Puerto city overlay should render on top of the full island. */
export const shouldRenderPuertoOnFullIsland = (search?: string): boolean => {
	const params = new URLSearchParams(
		search ?? (typeof window === 'undefined' ? '' : window.location.search),
	);

	return isTenerifeFullIslandMode(search) && params.get('puerto') === '1';
};
