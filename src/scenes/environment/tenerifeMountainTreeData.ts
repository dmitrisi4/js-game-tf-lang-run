import {
	TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS,
	TENERIFE_FULL_ISLAND_TEIDE_POSITION,
} from '@/scenes/environment/tenerifeFullIslandConfig';

export type TenerifeMountainTreePositionType = {
	x: number;
	z: number;
};

export type TenerifeMountainTreeTerrainSampleType = {
	height: number;
	slope: number;
};

export type TenerifeMountainTreePlacementType = {
	heightOffset?: number;
	id: string;
	position: TenerifeMountainTreePositionType;
	regionId: string;
	scale: number;
	terrainSample: TenerifeMountainTreeTerrainSampleType;
	yaw: number;
};

export type TenerifeMountainTreeHeightProviderType = (
	position: TenerifeMountainTreePositionType,
) => number | null;

export type TenerifeMountainTreePlacementGenerationOptionsType = {
	bounds: TenerifeMountainTreePlacementBoundsType;
	getHeightAtPosition: TenerifeMountainTreeHeightProviderType;
};

type TenerifeMountainTreePlacementBoundsType = {
	maxX: number;
	maxZ: number;
	minX: number;
	minZ: number;
};

type TenerifeMountainForestRegionType = {
	focus: TenerifeMountainTreePositionType;
	id: string;
	maxCount: number;
	maxHeight: number;
	maxSlope: number;
	minHeight: number;
	minSpacing: number;
	minSlope: number;
	scaleBase: number;
	scanStep: number;
	slopeStep: number;
	xMax: number;
	xMin: number;
	yawSeed: number;
	zMax: number;
	zMin: number;
};

type TenerifeMountainTreeCandidateType = TenerifeMountainTreePlacementType & {
	score: number;
};

export const TENERIFE_TEIDE_DRY_ZONE_RADIUS = 390;
export const TENERIFE_MOUNTAIN_TREE_PLAYABLE_BOUNDS = TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS;
export const TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_HEIGHT = 22;
export const TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_HEIGHT = 72;
export const TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_SLOPE = 0.018;
export const TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_SLOPE = 0.75;
export const TENERIFE_MOUNTAIN_TREE_MIN_TOTAL_COUNT = 200;

const TREE_SCALE_VARIANTS = [-0.018, 0.006, 0.018, -0.006, 0.012, -0.012, 0.024, 0];
const TREE_YAW_STEP = 2.399963229728653;

const TENERIFE_MOUNTAIN_FOREST_REGIONS: TenerifeMountainForestRegionType[] = [
	{
		id: 'upper-mountain-belt',
		focus: { x: -260, z: -240 },
		maxCount: 900,
		maxHeight: TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_HEIGHT,
		maxSlope: TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_SLOPE,
		minHeight: TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_HEIGHT,
		minSpacing: 8,
		minSlope: TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_SLOPE,
		scaleBase: 0.32,
		scanStep: 10,
		slopeStep: 15,
		xMax: 1320,
		xMin: -1320,
		yawSeed: 1.18,
		zMax: 1320,
		zMin: -1320,
	},
];

/** Returns the horizontal runtime distance from an authored placement to Teide. */
export const getDistanceToTenerifeTeide = ({ x, z }: TenerifeMountainTreePositionType): number =>
	Math.hypot(x - TENERIFE_FULL_ISLAND_TEIDE_POSITION.x, z - TENERIFE_FULL_ISLAND_TEIDE_POSITION.z);

/** Keeps the immediate Teide volcanic desert clear of mountain trees. */
export const isInsideTenerifeTeideDryZone = (position: TenerifeMountainTreePositionType): boolean =>
	getDistanceToTenerifeTeide(position) < TENERIFE_TEIDE_DRY_ZONE_RADIUS;

/** Keeps deterministic authored yaw values inside Babylon's expected yaw range. */
const normalizeTreeYaw = (yaw: number): number => {
	const fullTurn = Math.PI * 2;
	return ((((yaw + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI;
};

/** Formats generated tree ids with stable ordering for tests and snapshots. */
const formatTreeIndex = (index: number): string => String(index + 1).padStart(3, '0');

/** Keeps scan regions inside the currently loaded terrain bounds. */
const clampRegionToBounds = (
	region: TenerifeMountainForestRegionType,
	bounds: TenerifeMountainTreePlacementBoundsType,
): TenerifeMountainForestRegionType | null => {
	const clampedRegion = {
		...region,
		xMax: Math.min(region.xMax, bounds.maxX),
		xMin: Math.max(region.xMin, bounds.minX),
		zMax: Math.min(region.zMax, bounds.maxZ),
		zMin: Math.max(region.zMin, bounds.minZ),
	};

	if (clampedRegion.xMin > clampedRegion.xMax || clampedRegion.zMin > clampedRegion.zMax) {
		return null;
	}

	return clampedRegion;
};

/** Samples local height gradient around a tree candidate. */
const getTerrainSlopeAtPosition = (
	position: TenerifeMountainTreePositionType,
	step: number,
	getHeightAtPosition: TenerifeMountainTreeHeightProviderType,
): number | null => {
	const east = getHeightAtPosition({ x: position.x + step, z: position.z });
	const west = getHeightAtPosition({ x: position.x - step, z: position.z });
	const north = getHeightAtPosition({ x: position.x, z: position.z - step });
	const south = getHeightAtPosition({ x: position.x, z: position.z + step });

	if (east === null || west === null || north === null || south === null) {
		return null;
	}

	return Math.hypot((east - west) / (step * 2), (south - north) / (step * 2));
};

/** Gives stable sub-grid jitter without runtime randomness. */
const getCandidateJitter = (x: number, z: number, salt: number): number => {
	const value = Math.sin(x * 12.9898 + z * 78.233 + salt * 37.719) * 43758.5453;
	return value - Math.floor(value);
};

/** Rounds generated positions so tests and logs stay stable. */
const roundTreeNumber = (value: number, precision = 3): number => Number(value.toFixed(precision));

/** Slightly scales upper-slope trees without losing deterministic placement. */
const getTreeScale = (scaleBase: number, index: number, terrainHeight: number): number => {
	const heightBoost = Math.min(0.018, Math.max(0, (terrainHeight - 8) * 0.001));
	return Number(
		(scaleBase + TREE_SCALE_VARIANTS[index % TREE_SCALE_VARIANTS.length] + heightBoost).toFixed(3),
	);
};

/** Scores trees so steep, high mountain cells win first. */
const getCandidateScore = (
	_position: TenerifeMountainTreePositionType,
	height: number,
	slope: number,
	_region: TenerifeMountainForestRegionType,
): number => {
	const highMountainScore = Math.min(height, 45) * 2;
	const slopeScore = slope * 78;

	return highMountainScore + slopeScore;
};

/** Builds one deterministic candidate for a scanned mountain cell. */
const createTreeCandidate = (
	position: TenerifeMountainTreePositionType,
	height: number,
	slope: number,
	region: TenerifeMountainForestRegionType,
	index: number,
): TenerifeMountainTreeCandidateType => ({
	id: `tenerife-mountain-spruce-${region.id}-${formatTreeIndex(index)}`,
	position: {
		x: roundTreeNumber(position.x),
		z: roundTreeNumber(position.z),
	},
	regionId: region.id,
	scale: getTreeScale(region.scaleBase, index, height),
	score: getCandidateScore(position, height, slope, region),
	terrainSample: {
		height: roundTreeNumber(height, 2),
		slope: roundTreeNumber(slope, 3),
	},
	yaw: normalizeTreeYaw(
		region.yawSeed + index * TREE_YAW_STEP + position.x * 0.011 + position.z * 0.007,
	),
});

/** Reports whether two tree positions are close enough to read as the same clump. */
const isTooCloseToSelectedTree = (
	position: TenerifeMountainTreePositionType,
	selectedTrees: TenerifeMountainTreePlacementType[],
	minSpacing: number,
): boolean =>
	selectedTrees.some(
		(selectedTree) =>
			Math.hypot(selectedTree.position.x - position.x, selectedTree.position.z - position.z) <
			minSpacing,
	);

/** Collects valid mountain tree candidates for one terrain-scanned region. */
const collectRegionCandidates = (
	region: TenerifeMountainForestRegionType,
	getHeightAtPosition: TenerifeMountainTreeHeightProviderType,
): TenerifeMountainTreeCandidateType[] => {
	const candidates: TenerifeMountainTreeCandidateType[] = [];
	let candidateIndex = 0;

	for (let x = region.xMin; x <= region.xMax; x += region.scanStep) {
		for (let z = region.zMin; z <= region.zMax; z += region.scanStep) {
			const jitterX = getCandidateJitter(x, z, candidateIndex) * region.scanStep * 0.32;
			const jitterZ = getCandidateJitter(z, x, candidateIndex + 11) * region.scanStep * 0.32;
			const position = {
				x: x + jitterX,
				z: z + jitterZ,
			};
			const height = getHeightAtPosition(position);

			if (height === null || height < region.minHeight || height > region.maxHeight) {
				continue;
			}

			const slope = getTerrainSlopeAtPosition(position, region.slopeStep, getHeightAtPosition);

			if (
				slope === null ||
				slope < region.minSlope ||
				slope > region.maxSlope ||
				isInsideTenerifeTeideDryZone(position)
			) {
				continue;
			}

			candidates.push(createTreeCandidate(position, height, slope, region, candidateIndex));
			candidateIndex += 1;
		}
	}

	return candidates.sort((a, b) => b.score - a.score);
};

/** Selects deterministic, non-overlapping trees for one region. */
const selectRegionTrees = (
	region: TenerifeMountainForestRegionType,
	candidates: TenerifeMountainTreeCandidateType[],
	selectedTrees: TenerifeMountainTreePlacementType[],
): TenerifeMountainTreePlacementType[] => {
	const regionTrees: TenerifeMountainTreePlacementType[] = [];

	for (const candidate of candidates) {
		if (regionTrees.length >= region.maxCount) {
			break;
		}

		if (
			isTooCloseToSelectedTree(candidate.position, regionTrees, region.minSpacing) ||
			isTooCloseToSelectedTree(candidate.position, selectedTrees, region.minSpacing * 0.75)
		) {
			continue;
		}

		const { score: _score, ...tree } = candidate;
		regionTrees.push({
			...tree,
			id: `tenerife-mountain-spruce-${region.id}-${formatTreeIndex(regionTrees.length)}`,
		});
	}

	return regionTrees;
};

/** Generates deterministic mountain trees from the loaded full-island heightfield. */
export const createTenerifeMountainTreePlacements = ({
	bounds,
	getHeightAtPosition,
}: TenerifeMountainTreePlacementGenerationOptionsType): TenerifeMountainTreePlacementType[] => {
	const selectedTrees: TenerifeMountainTreePlacementType[] = [];

	for (const sourceRegion of TENERIFE_MOUNTAIN_FOREST_REGIONS) {
		const region = clampRegionToBounds(sourceRegion, bounds);

		if (!region) {
			continue;
		}

		const candidates = collectRegionCandidates(region, getHeightAtPosition);
		const regionTrees = selectRegionTrees(region, candidates, selectedTrees);
		selectedTrees.push(...regionTrees);
	}

	return selectedTrees;
};
