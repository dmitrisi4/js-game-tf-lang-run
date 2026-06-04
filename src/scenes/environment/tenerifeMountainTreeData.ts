import { getDistanceToTeide, isInsideTeideDesert } from '@/scenes/environment/tenerifeBiomeZones';
import { TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS } from '@/scenes/environment/tenerifeFullIslandConfig';

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

// Re-export from tenerifeBiomeZones for backward-compat (tests import these).
export { TENERIFE_TEIDE_DRY_ZONE_RADIUS } from '@/scenes/environment/tenerifeBiomeZones';

export const TENERIFE_MOUNTAIN_TREE_PLAYABLE_BOUNDS = TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS;
export const TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_HEIGHT = 12;
export const TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_HEIGHT = 72;
export const TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_SLOPE = 0.012;
export const TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_SLOPE = 0.82;
export const TENERIFE_MOUNTAIN_TREE_MIN_TOTAL_COUNT = 200;

const TREE_SCALE_VARIANTS = [-0.012, 0.004, 0.012, -0.004, 0.008, -0.008, 0.016, 0];
const TREE_YAW_STEP = 2.399963229728653;

/**
 * Forest regions covering all island slopes outside the Teide volcanic desert.
 *
 * Scale legend  (world units = metres, GLB tree base ≈ 1 m):
 *   0.18 → short low-slope tree  (~9 m tall)
 *   0.22 → medium slope tree    (~11 m tall)  ← default
 *   0.26 → tall ridge/crest tree (~13 m tall)
 *
 * Region spatial layout (approximate world-X / world-Z ranges):
 *   north-slopes   : z -1320 → 0   (humid laurel belt, north coast)
 *   south-slopes   : z 0 → 1320    (drier pine, banana belt at low alt)
 *   east-slopes    : x 0 → 1320    (gentle eastern foothills)
 *   west-slopes    : x -1320 → 0   (steeper anaga-adjacent ridges)
 *   upper-pine-belt: full island, high altitude pine forest
 */
const TENERIFE_MOUNTAIN_FOREST_REGIONS: TenerifeMountainForestRegionType[] = [
	// ── Upper pine belt (all aspects, high altitude) ──────────────────
	{
		id: 'upper-pine-belt',
		focus: { x: -400, z: -100 },
		maxCount: 1200,
		maxHeight: TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_HEIGHT,
		maxSlope: TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_SLOPE,
		minHeight: 42,
		minSpacing: 9,
		minSlope: 0.015,
		scaleBase: 0.22,
		scanStep: 11,
		slopeStep: 15,
		xMax: 1320,
		xMin: -1320,
		yawSeed: 1.18,
		zMax: 1320,
		zMin: -1320,
	},
	// ── North-slope laurel cloud forest (humid north coast) ───────────
	{
		id: 'north-laurel-forest',
		focus: { x: 200, z: -600 },
		maxCount: 900,
		maxHeight: 58,
		maxSlope: 0.75,
		minHeight: 18,
		minSpacing: 7,
		minSlope: 0.014,
		scaleBase: 0.2,
		scanStep: 9,
		slopeStep: 12,
		xMax: 1320,
		xMin: -1320,
		yawSeed: 2.41,
		zMax: 0,
		zMin: -1320,
	},
	// ── South-slope mixed pine / scrub ────────────────────────────────
	{
		id: 'south-pine-slopes',
		focus: { x: -100, z: 500 },
		maxCount: 800,
		maxHeight: 62,
		maxSlope: 0.78,
		minHeight: 16,
		minSpacing: 8,
		minSlope: 0.013,
		scaleBase: 0.21,
		scanStep: 10,
		slopeStep: 13,
		xMax: 1320,
		xMin: -1320,
		yawSeed: 0.77,
		zMax: 1320,
		zMin: 0,
	},
	// ── East foothills (gentle anaga / coastal ramps) ─────────────────
	{
		id: 'east-foothills',
		focus: { x: 800, z: 200 },
		maxCount: 600,
		maxHeight: 48,
		maxSlope: 0.65,
		minHeight: 12,
		minSpacing: 6,
		minSlope: 0.012,
		scaleBase: 0.18,
		scanStep: 9,
		slopeStep: 12,
		xMax: 1320,
		xMin: 200,
		yawSeed: 3.14,
		zMax: 1320,
		zMin: -1320,
	},
	// ── West ridges (steep Teno-adjacent terrain) ─────────────────────
	{
		id: 'west-ridges',
		focus: { x: -900, z: 100 },
		maxCount: 600,
		maxHeight: 60,
		maxSlope: 0.82,
		minHeight: 14,
		minSpacing: 7,
		minSlope: 0.016,
		scaleBase: 0.2,
		scanStep: 10,
		slopeStep: 13,
		xMax: -150,
		xMin: -1320,
		yawSeed: 1.57,
		zMax: 1320,
		zMin: -1320,
	},
];

/** Returns the horizontal runtime distance from an authored placement to Teide. */
export const getDistanceToTenerifeTeide = ({ x, z }: TenerifeMountainTreePositionType): number =>
	getDistanceToTeide(x, z);

/** Keeps the immediate Teide volcanic desert clear of mountain trees. */
export const isInsideTenerifeTeideDryZone = (position: TenerifeMountainTreePositionType): boolean =>
	isInsideTeideDesert(position.x, position.z);

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
