export type PuertoRoadRenderMode = 'baked' | 'both' | 'mesh' | 'none';

export type PuertoTerrainMode = 'island' | 'island-full' | 'real';

export const PUERTO_CITY_TERRAIN_MODEL_URL =
	'/models/environment/puerto-de-la-cruz-terrain.glb?v=2026-05-17-puerto-building-scale-pass';
export const PUERTO_CITY_ALBEDO_TEXTURE_URL = '/textures/tenerife/puerto-city-albedo.png';
export const PUERTO_CITY_ROAD_MASK_TEXTURE_URL = '/textures/tenerife/puerto-city-road-mask.png';

const isRoadRenderMode = (value: string | null): value is PuertoRoadRenderMode =>
	value === 'baked' || value === 'both' || value === 'mesh' || value === 'none';

const getSearchParams = (search: string | undefined): URLSearchParams => {
	if (typeof search === 'string') {
		return new URLSearchParams(search);
	}

	if (typeof window === 'undefined') {
		return new URLSearchParams();
	}

	return new URLSearchParams(window.location.search);
};

/**
 * Resolves whether the Tenerife preview should use the real Puerto city terrain asset.
 */
export const getPuertoTerrainMode = (search?: string): PuertoTerrainMode => {
	const params = getSearchParams(search);
	const terrainMode = params.get('terrain');

	if (terrainMode === 'real' || terrainMode === 'island-full') {
		return terrainMode;
	}

	return 'island';
};

/**
 * Resolves road rendering for the current terrain mode.
 */
export const getPuertoRoadRenderMode = (
	terrainMode: PuertoTerrainMode,
	search?: string,
): PuertoRoadRenderMode => {
	const params = getSearchParams(search);
	const requestedMode = params.get('roads');

	if (isRoadRenderMode(requestedMode)) {
		return requestedMode;
	}

	if (terrainMode === 'real') {
		return 'baked';
	}

	if (terrainMode === 'island-full') {
		return 'baked';
	}

	return 'mesh';
};

/**
 * Checks whether runtime road ribbons should be rendered for the selected mode.
 */
export const shouldRenderRoadMeshes = (mode: PuertoRoadRenderMode): boolean =>
	mode === 'mesh' || mode === 'both';
