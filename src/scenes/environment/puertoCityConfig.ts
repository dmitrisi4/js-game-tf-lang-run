import { publicAssetUrl } from '@/utils/publicAssetUrl';
import { shouldRenderPuertoOnFullIsland } from './tenerifeFullIslandConfig';

export type PuertoRoadRenderMode = 'baked' | 'both' | 'mesh' | 'none';

export type PuertoRoadGroundingMode = 'heightfield' | 'raycast';

export type PuertoTerrainMode = 'island' | 'island-full' | 'real';

export type PuertoLayerPlanType = {
	renderFootprintBuildings: boolean;
	renderGeneratedRoadsideBuildings: boolean;
	renderManualPreviewBuildings: boolean;
	renderPuertoOverlay: boolean;
	renderRoadMeshes: boolean;
	roadGroundingMode: PuertoRoadGroundingMode;
	roadRenderMode: PuertoRoadRenderMode;
	terrainMode: PuertoTerrainMode;
};

export const PUERTO_CITY_TERRAIN_MODEL_URL = publicAssetUrl(
	'/models/environment/puerto-de-la-cruz-terrain.glb?v=2026-05-27-roadbed-pbr-pass',
);
export const PUERTO_CITY_ALBEDO_TEXTURE_URL = publicAssetUrl(
	'/textures/tenerife/puerto-city-albedo.png',
);
export const PUERTO_CITY_NORMAL_TEXTURE_URL = publicAssetUrl(
	'/textures/tenerife/puerto-city-normal.png',
);
export const PUERTO_CITY_ORM_TEXTURE_URL = publicAssetUrl('/textures/tenerife/puerto-city-orm.png');
export const PUERTO_CITY_ROAD_MASK_TEXTURE_URL = publicAssetUrl(
	'/textures/tenerife/puerto-city-road-mask.png',
);

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
		return 'mesh';
	}

	return 'mesh';
};

/**
 * Resolves how runtime road meshes should sample terrain height.
 */
export const getPuertoRoadGroundingMode = (
	_terrainMode: PuertoTerrainMode,
	search?: string,
): PuertoRoadGroundingMode => {
	const params = getSearchParams(search);
	const requestedMode = params.get('roadGrounding');

	if (requestedMode === 'heightfield' || requestedMode === 'raycast') {
		return requestedMode;
	}

	return 'raycast';
};

/**
 * Checks whether runtime road ribbons should be rendered for the selected mode.
 */
export const shouldRenderRoadMeshes = (mode: PuertoRoadRenderMode): boolean =>
	mode === 'mesh' || mode === 'both';

/** Resolves whether the full-island Puerto pass should render OSM footprint building volumes. */
export const shouldRenderPuertoBuildingsOnFullIsland = (search?: string): boolean => {
	const params = getSearchParams(search);

	return params.get('buildings') === '1';
};

/**
 * Resolves the Puerto-related scene layers for one query string.
 */
export const getPuertoLayerPlan = (search?: string): PuertoLayerPlanType => {
	const terrainMode = getPuertoTerrainMode(search);
	const roadRenderMode = getPuertoRoadRenderMode(terrainMode, search);
	const roadGroundingMode = getPuertoRoadGroundingMode(terrainMode, search);
	const renderPuertoOverlay =
		terrainMode !== 'island-full' || shouldRenderPuertoOnFullIsland(search);
	const renderRoadMeshes = shouldRenderRoadMeshes(roadRenderMode) && renderPuertoOverlay;

	return {
		renderFootprintBuildings:
			terrainMode === 'island-full' &&
			renderPuertoOverlay &&
			shouldRenderPuertoBuildingsOnFullIsland(search),
		renderGeneratedRoadsideBuildings:
			terrainMode === 'island-full' &&
			renderRoadMeshes &&
			!shouldRenderPuertoBuildingsOnFullIsland(search),
		renderManualPreviewBuildings: false,
		renderPuertoOverlay,
		renderRoadMeshes,
		roadGroundingMode,
		roadRenderMode,
		terrainMode,
	};
};
