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

export type OceanMaterialConfigType = {
	bumpHeight: number;
	colorBlendFactor: number;
	colorBlendFactor2: number;
	waveCount: number;
	waveHeight: number;
	waveLength: number;
	waveSpeed: number;
	windForce: number;
};

export type ShorelineDepthGradientConfigType = {
	deepStart: number;
	edgeRadiusX: number;
	edgeRadiusZ: number;
	foamWidth: number;
	shallowEnd: number;
};

export type ShorelineSurfConfigType = {
	bandSpacing: number;
	edgeRadiusX: number;
	edgeRadiusZ: number;
	retreatSpeed: number;
	surfWidth: number;
};

export type ShorelineSandSlopeConfigType = {
	beachInset: number;
	maxSegmentLength: number;
	slopeWidth: number;
	underwaterDrop: number;
};

const MIN_OCEAN_WAVE_SCALE = 18;
const OCEAN_WAVE_SCALE_DIVISOR = 54;
const OCEAN_WAVE_HEIGHT_DIVISOR = 1550;
const MIN_OCEAN_WAVE_HEIGHT = 0.18;
const MAX_OCEAN_WAVE_HEIGHT = 0.72;
const SHORELINE_EDGE_RATIO_X = 0.42;
const SHORELINE_EDGE_RATIO_Z = 0.36;
const SHORELINE_SHALLOW_BAND_RATIO = 0.07;
const SHORELINE_DEEP_BAND_RATIO = 0.22;
const SHORELINE_SURF_WIDTH_RATIO = 0.042;
const SHORELINE_SURF_BAND_SPACING_RATIO = 0.018;
const SHORELINE_SAND_SLOPE_WIDTH_RATIO = 0.052;
const SHORELINE_SAND_BEACH_INSET_RATIO = 0.045;
const SHORELINE_SAND_UNDERWATER_DROP_RATIO = 0.0026;
const SHORELINE_SAND_MAX_SEGMENT_MULTIPLIER = 2.2;

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

/** Resolves OceanMaterialPlugin wave parameters for the current ocean footprint. */
export const getOceanMaterialConfig = (width: number, depth: number): OceanMaterialConfigType => {
	const largestSide = Math.max(width, depth);
	const waveScale = getOceanWaveScale(width, depth);

	return {
		bumpHeight: 0.18,
		colorBlendFactor: 0.18,
		colorBlendFactor2: 0.68,
		waveCount: Math.max(12, largestSide / waveScale),
		waveHeight: Math.min(
			MAX_OCEAN_WAVE_HEIGHT,
			Math.max(MIN_OCEAN_WAVE_HEIGHT, largestSide / OCEAN_WAVE_HEIGHT_DIVISOR),
		),
		waveLength: waveScale * 0.72,
		waveSpeed: 0.92,
		windForce: 6.5,
	};
};

/** Resolves an approximate island-edge depth ramp for the full-island ocean floor. */
export const getShorelineDepthGradientConfig = (
	width: number,
	depth: number,
): ShorelineDepthGradientConfigType => {
	const shortestSide = Math.min(width, depth);

	return {
		deepStart: SHORELINE_DEEP_BAND_RATIO * shortestSide,
		edgeRadiusX: width * SHORELINE_EDGE_RATIO_X,
		edgeRadiusZ: depth * SHORELINE_EDGE_RATIO_Z,
		foamWidth: shortestSide * 0.012,
		shallowEnd: SHORELINE_SHALLOW_BAND_RATIO * shortestSide,
	};
};

/** Resolves animated shoreline surf band tuning for the current ocean footprint. */
export const getShorelineSurfConfig = (width: number, depth: number): ShorelineSurfConfigType => {
	const shortestSide = Math.min(width, depth);

	return {
		bandSpacing: shortestSide * SHORELINE_SURF_BAND_SPACING_RATIO,
		edgeRadiusX: width * SHORELINE_EDGE_RATIO_X,
		edgeRadiusZ: depth * SHORELINE_EDGE_RATIO_Z,
		retreatSpeed: shortestSide * 0.012,
		surfWidth: shortestSide * SHORELINE_SURF_WIDTH_RATIO,
	};
};

/** Resolves the sandy underwater shelf dimensions for the current ocean footprint. */
export const getShorelineSandSlopeConfig = (
	width: number,
	depth: number,
): ShorelineSandSlopeConfigType => {
	const shortestSide = Math.min(width, depth);
	const slopeWidth = shortestSide * SHORELINE_SAND_SLOPE_WIDTH_RATIO;

	return {
		beachInset: shortestSide * SHORELINE_SAND_BEACH_INSET_RATIO,
		maxSegmentLength: slopeWidth * SHORELINE_SAND_MAX_SEGMENT_MULTIPLIER,
		slopeWidth,
		underwaterDrop: shortestSide * SHORELINE_SAND_UNDERWATER_DROP_RATIO,
	};
};
