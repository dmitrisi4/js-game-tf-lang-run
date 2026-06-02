import type { WorldBuilding, WorldPosition } from './worldData';

type GroundingOptionsType = {
	footprintScale?: number;
	positionOffset?: WorldPosition;
};

export type WorldBuildingGroundSamplerType = (position: WorldPosition) => number | null | undefined;

const DEFAULT_POSITION_OFFSET = { x: 0, z: 0 };
const DEFAULT_FOOTPRINT_SAMPLE_SCALE = 1;
const MAX_FOOTPRINT_SUPPORT_DROP_FROM_CENTER = 0.65;
const FOUNDATION_DEPTH_RATIO = 0.18;
const MIN_FOUNDATION_DEPTH = 0.55;
const MAX_FOUNDATION_DEPTH = 1.1;
const FOOTPRINT_SAMPLE_OFFSETS = [
	{ x: 0, z: 0 },
	{ x: -1, z: -1 },
	{ x: 1, z: -1 },
	{ x: 1, z: 1 },
	{ x: -1, z: 1 },
	{ x: 0, z: -1 },
	{ x: 1, z: 0 },
	{ x: 0, z: 1 },
	{ x: -1, z: 0 },
] as const;

/** Resolves the building anchor after applying an optional X/Z placement offset. */
export const getWorldBuildingAnchorPosition = (
	building: WorldBuilding,
	positionOffset: WorldPosition = DEFAULT_POSITION_OFFSET,
): WorldPosition => ({
	x: building.position.x + positionOffset.x,
	z: building.position.z + positionOffset.z,
});

/**
 * Returns center, corner, and edge sample positions for a rotated building footprint.
 * Sampling the footprint keeps flat blockout houses from visibly floating on slopes.
 */
export const getWorldBuildingFootprintSamplePoints = (
	building: WorldBuilding,
	options: GroundingOptionsType = {},
): WorldPosition[] => {
	const anchor = getWorldBuildingAnchorPosition(building, options.positionOffset);
	const footprintScale = options.footprintScale ?? DEFAULT_FOOTPRINT_SAMPLE_SCALE;
	const halfWidth = (building.collider.width * footprintScale) / 2;
	const halfDepth = (building.collider.depth * footprintScale) / 2;
	const cosYaw = Math.cos(building.yaw);
	const sinYaw = Math.sin(building.yaw);

	return FOOTPRINT_SAMPLE_OFFSETS.map((offset) => {
		const localX = offset.x * halfWidth;
		const localZ = offset.z * halfDepth;

		return {
			x: anchor.x + localX * cosYaw + localZ * sinYaw,
			z: anchor.z - localX * sinYaw + localZ * cosYaw,
		};
	});
};

/**
 * Resolves the support Y for a building footprint.
 * The lowest valid sample is preferred so the uphill side embeds slightly instead of
 * leaving a visible air gap under the downhill side.
 */
export const getWorldBuildingFootprintGroundY = (
	building: WorldBuilding,
	sampleGroundY: WorldBuildingGroundSamplerType,
	options: GroundingOptionsType = {},
): number | null => {
	let supportY = Number.POSITIVE_INFINITY;
	let centerY: number | null = null;

	for (const [index, point] of getWorldBuildingFootprintSamplePoints(building, options).entries()) {
		const groundY = sampleGroundY(point);

		if (typeof groundY !== 'number' || !Number.isFinite(groundY)) {
			continue;
		}

		if (index === 0) {
			centerY = groundY;
		}

		supportY = Math.min(supportY, groundY);
	}

	if (!Number.isFinite(supportY)) {
		return null;
	}

	return centerY === null
		? supportY
		: Math.max(supportY, centerY - MAX_FOOTPRINT_SUPPORT_DROP_FROM_CENTER);
};

/** Returns the fallback box center Y for a building resting on the supplied ground Y. */
export const getWorldBuildingFallbackCenterY = (building: WorldBuilding, groundY: number): number =>
	groundY + (building.heightOffset ?? 0) + building.collider.height * 0.42;

/** Returns a shallow visual foundation depth that can bridge small slope gaps under box houses. */
export const getWorldBuildingFoundationDepth = (building: WorldBuilding): number =>
	Math.max(
		MIN_FOUNDATION_DEPTH,
		Math.min(MAX_FOUNDATION_DEPTH, building.collider.height * FOUNDATION_DEPTH_RATIO),
	);

/** Returns the visual foundation center Y below the fallback box body. */
export const getWorldBuildingFoundationCenterY = (
	building: WorldBuilding,
	groundY: number,
): number => groundY + (building.heightOffset ?? 0) - getWorldBuildingFoundationDepth(building) / 2;

/** Returns the primitive collider center Y for a building resting on the supplied ground Y. */
export const getWorldBuildingColliderCenterY = (building: WorldBuilding, groundY: number): number =>
	groundY + (building.heightOffset ?? 0) + building.collider.height / 2;
