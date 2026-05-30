import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { publicAssetUrl } from '@/utils/publicAssetUrl';
import { TENERIFE_FULL_ISLAND_MAP_DATA } from './tenerifeFullIslandMapData';

export type TenerifeFullIslandPuertoOverlayTransformType = {
	position: Vector3;
	scale: number;
};

type GeoPointType = {
	lat: number;
	lon: number;
};

type GeoBoundsType = {
	east: number;
	north: number;
	south: number;
	west: number;
};

export const TENERIFE_FULL_ISLAND_MODEL_URL = publicAssetUrl(
	'/models/environment/tenerife-full-island-normalized.glb?v=2026-05-19-restored-full',
);
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
const TENERIFE_FULL_ISLAND_GEO_BOUNDS: GeoBoundsType = {
	east: -16.117,
	north: 28.595,
	south: 27.992,
	west: -16.925,
};
const TENERIFE_FULL_ISLAND_PUERTO_VISUAL_TOP_OFFSET = -5;
const TENERIFE_FULL_ISLAND_PUERTO_OVERLAY_GROUND_LIFT = 0.08;
const TENERIFE_ROAD_PROJECTION_CENTER: GeoPointType = {
	lat: 28.40330075,
	lon: -16.5453185,
};
const TENERIFE_ROAD_PROJECTION_METERS_TO_WORLD = 0.26;
const TENERIFE_ROAD_PROJECTION_CENTER_HEIGHT = 29.009;
const TENERIFE_TEIDE_GEO_CONTROL_POINT: GeoPointType = {
	lat: 28.2723,
	lon: -16.6425,
};
const METERS_PER_LATITUDE_DEGREE = 111_320;

/** Resolves whether a mesh belongs to the normalized full-island terrain. */
export const isTenerifeFullIslandTerrainMeshName = (meshName: string): boolean =>
	meshName.startsWith(TENERIFE_FULL_ISLAND_TERRAIN_PREFIX);

/** Projects WGS84 coordinates into the normalized full-island runtime X/Z plane. */
export const projectGeoToTenerifeFullIslandWorld = (
	point: GeoPointType,
): { x: number; z: number } => {
	const bounds = TENERIFE_FULL_ISLAND_MAP_DATA.bounds;
	const lonRatio =
		(point.lon - TENERIFE_FULL_ISLAND_GEO_BOUNDS.west) /
		(TENERIFE_FULL_ISLAND_GEO_BOUNDS.east - TENERIFE_FULL_ISLAND_GEO_BOUNDS.west);
	const latRatio =
		(point.lat - TENERIFE_FULL_ISLAND_GEO_BOUNDS.south) /
		(TENERIFE_FULL_ISLAND_GEO_BOUNDS.north - TENERIFE_FULL_ISLAND_GEO_BOUNDS.south);

	return {
		x: bounds.maxX - lonRatio * (bounds.maxX - bounds.minX),
		z: bounds.maxZ - latRatio * (bounds.maxZ - bounds.minZ),
	};
};

const offsetFullIslandWorldPointByMapTopPercent = (
	point: { x: number; z: number },
	topOffset: number,
): { x: number; z: number } => {
	const bounds = TENERIFE_FULL_ISLAND_MAP_DATA.bounds;

	return {
		x: point.x,
		z: point.z - (topOffset / 100) * (bounds.maxZ - bounds.minZ),
	};
};

const projectRoadProjectionControlPoint = (point: GeoPointType): { x: number; z: number } => {
	const metersPerLongitudeDegree =
		METERS_PER_LATITUDE_DEGREE * Math.cos((TENERIFE_ROAD_PROJECTION_CENTER.lat * Math.PI) / 180);

	return {
		x:
			(point.lon - TENERIFE_ROAD_PROJECTION_CENTER.lon) *
			metersPerLongitudeDegree *
			TENERIFE_ROAD_PROJECTION_METERS_TO_WORLD,
		z:
			-(point.lat - TENERIFE_ROAD_PROJECTION_CENTER.lat) *
			METERS_PER_LATITUDE_DEGREE *
			TENERIFE_ROAD_PROJECTION_METERS_TO_WORLD,
	};
};

/** Resolves the first-pass similarity transform for the Puerto city overlay on the full island. */
export const getTenerifeFullIslandPuertoOverlayTransform = (
	fullIslandGroundY?: number,
): TenerifeFullIslandPuertoOverlayTransformType => {
	const overlayAnchor = offsetFullIslandWorldPointByMapTopPercent(
		projectGeoToTenerifeFullIslandWorld(TENERIFE_ROAD_PROJECTION_CENTER),
		TENERIFE_FULL_ISLAND_PUERTO_VISUAL_TOP_OFFSET,
	);
	const fullIslandTeidePoint = offsetFullIslandWorldPointByMapTopPercent(
		projectGeoToTenerifeFullIslandWorld(TENERIFE_TEIDE_GEO_CONTROL_POINT),
		TENERIFE_FULL_ISLAND_PUERTO_VISUAL_TOP_OFFSET,
	);
	const roadProjectionTeidePoint = projectRoadProjectionControlPoint(
		TENERIFE_TEIDE_GEO_CONTROL_POINT,
	);
	const fullIslandControlDistance = Math.hypot(
		fullIslandTeidePoint.x - overlayAnchor.x,
		fullIslandTeidePoint.z - overlayAnchor.z,
	);
	const roadProjectionControlDistance = Math.hypot(
		roadProjectionTeidePoint.x,
		roadProjectionTeidePoint.z,
	);
	const scale = fullIslandControlDistance / roadProjectionControlDistance;
	const y =
		typeof fullIslandGroundY === 'number'
			? fullIslandGroundY -
				TENERIFE_ROAD_PROJECTION_CENTER_HEIGHT * scale +
				TENERIFE_FULL_ISLAND_PUERTO_OVERLAY_GROUND_LIFT
			: TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.y + 0.18;

	return {
		position: new Vector3(overlayAnchor.x, y, overlayAnchor.z),
		scale,
	};
};

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

	return isTenerifeFullIslandMode(search) && params.get('puerto') !== '0';
};
