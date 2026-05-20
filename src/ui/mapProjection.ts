import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { getTenerifeFullIslandHeightfieldBounds } from '@/scenes/environment/tenerifeFullIslandHeightfield';
import { TENERIFE_FULL_ISLAND_MAP_DATA } from '@/scenes/environment/tenerifeFullIslandMapData';
import { WORLD_HALF_EXTENT } from '@/scenes/environment/worldData';

export type MapBoundsType = {
	maxX: number;
	maxZ: number;
	minX: number;
	minZ: number;
};

export type MapPointType = {
	left: number;
	top: number;
};

export type MapModeType = 'arena' | 'tenerife-preview' | 'tenerife-full-island';

export type GeoPointType = {
	lat: number;
	lon: number;
};

export type GeoBoundsType = {
	east: number;
	north: number;
	south: number;
	west: number;
};

export type MapPercentOffsetType = {
	left?: number;
	top?: number;
};

const TENERIFE_PREVIEW_SCALE = 30;
const TENERIFE_CITY_ANCHOR = { x: -10, z: 0 };
const TENERIFE_PUERTO_LOCAL_POSITION = { x: 6.25, z: 15.58 };
const TENERIFE_ROOT_OFFSET = {
	x: TENERIFE_CITY_ANCHOR.x - TENERIFE_PUERTO_LOCAL_POSITION.x * TENERIFE_PREVIEW_SCALE,
	z: TENERIFE_CITY_ANCHOR.z - TENERIFE_PUERTO_LOCAL_POSITION.z * TENERIFE_PREVIEW_SCALE,
};

export const TENERIFE_PREVIEW_MAP_BOUNDS: MapBoundsType = {
	maxX: 42,
	maxZ: 19.5,
	minX: -45,
	minZ: -19,
};

export const ARENA_MAP_BOUNDS: MapBoundsType = {
	maxX: WORLD_HALF_EXTENT,
	maxZ: WORLD_HALF_EXTENT,
	minX: -WORLD_HALF_EXTENT,
	minZ: -WORLD_HALF_EXTENT,
};

export const TENERIFE_FULL_ISLAND_GEO_BOUNDS: GeoBoundsType = {
	east: -16.117,
	north: 28.595,
	south: 27.992,
	west: -16.925,
};

/** Clamps projected map coordinates inside the visible map surface. */
export const clampMapValue = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

/** Converts world or local map coordinates into HUD percentage coordinates. */
export const toMapPoint = (x: number, z: number, bounds: MapBoundsType): MapPointType => ({
	left: clampMapValue(((x - bounds.minX) / (bounds.maxX - bounds.minX)) * 100, 1, 99),
	top: clampMapValue((1 - (z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * 100, 1, 99),
});

/** Projects WGS84 Tenerife coordinates into the mirrored full-island runtime map space. */
export const projectTenerifeGeoToFullIslandWorldPoint = (
	point: GeoPointType,
	bounds: MapBoundsType = TENERIFE_FULL_ISLAND_MAP_DATA.bounds,
	geoBounds: GeoBoundsType = TENERIFE_FULL_ISLAND_GEO_BOUNDS,
): { x: number; z: number } => {
	const lonRatio = (point.lon - geoBounds.west) / (geoBounds.east - geoBounds.west);
	const latRatio = (point.lat - geoBounds.south) / (geoBounds.north - geoBounds.south);

	return {
		x: bounds.maxX - lonRatio * (bounds.maxX - bounds.minX),
		z: bounds.maxZ - latRatio * (bounds.maxZ - bounds.minZ),
	};
};

/** Applies a visual map-space calibration offset while preserving the marker's world projection. */
export const offsetWorldPointByMapPercent = (
	point: { x: number; z: number },
	offset: MapPercentOffsetType,
	bounds: MapBoundsType = TENERIFE_FULL_ISLAND_MAP_DATA.bounds,
): { x: number; z: number } => ({
	x: point.x + ((offset.left ?? 0) / 100) * (bounds.maxX - bounds.minX),
	z: point.z - ((offset.top ?? 0) / 100) * (bounds.maxZ - bounds.minZ),
});

/** Resolves the active map mode from gameplay mode and URL search params. */
export const getMapMode = (isTenerifeModeEnabled: boolean, search = ''): MapModeType => {
	if (!isTenerifeModeEnabled) {
		return 'arena';
	}

	return new URLSearchParams(search).get('terrain') === 'island-full'
		? 'tenerife-full-island'
		: 'tenerife-preview';
};

/** Returns the coordinate bounds used by the current HUD map projection. */
export const getMapBounds = (mapMode: MapModeType): MapBoundsType => {
	if (mapMode === 'tenerife-full-island') {
		return getTenerifeFullIslandHeightfieldBounds() ?? TENERIFE_FULL_ISLAND_MAP_DATA.bounds;
	}

	if (mapMode === 'tenerife-preview') {
		return TENERIFE_PREVIEW_MAP_BOUNDS;
	}

	return ARENA_MAP_BOUNDS;
};

/** Projects the player position onto the active HUD map surface. */
export const getPlayerMapPoint = (
	playerPosition: Vector3 | null,
	isTenerifeModeEnabled: boolean,
	search = typeof window === 'undefined' ? '' : window.location.search,
): MapPointType | null => {
	if (!playerPosition) {
		return null;
	}

	const mapMode = getMapMode(isTenerifeModeEnabled, search);

	if (mapMode === 'tenerife-full-island') {
		return toMapPoint(playerPosition.x, playerPosition.z, getMapBounds(mapMode));
	}

	if (mapMode === 'tenerife-preview') {
		return toMapPoint(
			(playerPosition.x - TENERIFE_ROOT_OFFSET.x) / TENERIFE_PREVIEW_SCALE,
			(playerPosition.z - TENERIFE_ROOT_OFFSET.z) / TENERIFE_PREVIEW_SCALE,
			TENERIFE_PREVIEW_MAP_BOUNDS,
		);
	}

	return toMapPoint(playerPosition.x, playerPosition.z, ARENA_MAP_BOUNDS);
};
