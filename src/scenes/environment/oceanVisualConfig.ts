import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type OceanBoundsType = {
	maxX: number;
	maxZ: number;
	minX: number;
	minZ: number;
};

export type OceanSurfaceMetricsType = {
	center: Vector3;
	depth: number;
	width: number;
};

const MIN_OCEAN_WAVE_SCALE = 18;
const OCEAN_WAVE_SCALE_DIVISOR = 54;

/** Resolves the centered mesh metrics for a rectangular ocean surface. */
export const getOceanSurfaceMetrics = (
	bounds: OceanBoundsType,
	surfaceY: number,
): OceanSurfaceMetricsType => {
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxZ - bounds.minZ;

	return {
		center: new Vector3((bounds.minX + bounds.maxX) / 2, surfaceY, (bounds.minZ + bounds.maxZ) / 2),
		depth,
		width,
	};
};

/** Keeps procedural wave frequency proportional to the physical ocean footprint. */
export const getOceanWaveScale = (width: number, depth: number): number =>
	Math.max(MIN_OCEAN_WAVE_SCALE, Math.max(width, depth) / OCEAN_WAVE_SCALE_DIVISOR);
