import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { publicAssetUrl } from '@/utils/publicAssetUrl';
import type { TenerifeRoadTransformType } from './TenerifeGeoRoadLayers';
import type { WorldPosition } from './worldData';

export type PuertoFootprintBuildingType = {
	collider: {
		depth: number;
		height: number;
		width: number;
	};
	heightOffset?: number;
	id: string;
	position: WorldPosition;
	yaw: number;
};

export type PuertoFootprintBuildingsRuntimeDataType = {
	metrics: {
		runtimeBuildingCount: number;
		sourceFootprintCount: number;
	};
	runtimeBuildings: PuertoFootprintBuildingType[];
	version: number;
};

export type PuertoFootprintBuildingInstanceType = {
	depth: number;
	height: number;
	position: Vector3;
	width: number;
	yaw: number;
};

export type PuertoFootprintBuildingTransformOptionsType = {
	groundHeight: number | null;
	heightOffset?: number;
	horizontalScaleMultiplier?: number;
	verticalScaleMultiplier?: number;
};

export const PUERTO_BUILDING_FOOTPRINTS_RUNTIME_URL = publicAssetUrl(
	'/data/tenerife/puerto-building-footprints-runtime.json',
);
export const TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_HORIZONTAL_SCALE_MULTIPLIER = 0.72;
export const TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_VERTICAL_SCALE_MULTIPLIER = 12;

/**
 * Projects one Puerto-local footprint building into full-island runtime space.
 */
export const transformPuertoFootprintBuilding = (
	building: PuertoFootprintBuildingType,
	roadTransform: TenerifeRoadTransformType,
	options: PuertoFootprintBuildingTransformOptionsType,
): PuertoFootprintBuildingInstanceType => {
	const horizontalScale =
		roadTransform.scale *
		(options.horizontalScaleMultiplier ??
			TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_HORIZONTAL_SCALE_MULTIPLIER);
	const verticalScale =
		roadTransform.scale *
		(options.verticalScaleMultiplier ??
			TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_VERTICAL_SCALE_MULTIPLIER);
	const x = roadTransform.offset.x + building.position.x * roadTransform.scale;
	const z = roadTransform.offset.z + building.position.z * roadTransform.scale;
	const y =
		(options.groundHeight ?? 0) +
		(building.heightOffset ?? options.heightOffset ?? 0) * verticalScale;

	return {
		depth: Math.max(0.35, building.collider.depth * horizontalScale),
		height: Math.max(1.6, building.collider.height * verticalScale),
		position: new Vector3(x, y, z),
		width: Math.max(0.35, building.collider.width * horizontalScale),
		yaw: building.yaw,
	};
};
