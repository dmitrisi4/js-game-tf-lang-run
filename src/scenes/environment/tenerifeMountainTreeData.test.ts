import { describe, expect, it } from 'vitest';
import {
	createTenerifeMountainTreePlacements,
	getDistanceToTenerifeTeide,
	isInsideTenerifeTeideDryZone,
	TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_HEIGHT,
	TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_SLOPE,
	TENERIFE_MOUNTAIN_TREE_MAX_WATER_FACING_X,
	TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_HEIGHT,
	TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_SLOPE,
	TENERIFE_MOUNTAIN_TREE_MIN_TOTAL_COUNT,
	TENERIFE_MOUNTAIN_TREE_MIN_WATER_FACING_Z,
	TENERIFE_TEIDE_DRY_ZONE_RADIUS,
	type TenerifeMountainTreeHeightProviderType,
	type TenerifeMountainTreePlacementType,
} from '@/scenes/environment/tenerifeMountainTreeData';

const SYNTHETIC_TERRAIN_BOUNDS = {
	maxX: 1320,
	maxZ: 1320,
	minX: -1320,
	minZ: -1320,
};

const isInside = (
	position: { x: number; z: number },
	bounds: { maxX: number; maxZ: number; minX: number; minZ: number },
): boolean =>
	position.x >= bounds.minX &&
	position.x <= bounds.maxX &&
	position.z >= bounds.minZ &&
	position.z <= bounds.maxZ;

const createPlanarRegionHeightProvider = (
	bounds = SYNTHETIC_TERRAIN_BOUNDS,
): TenerifeMountainTreeHeightProviderType => {
	// A simple height provider that generates a mountain shape peaking at the center
	return (position) => {
		if (!isInside(position, bounds)) {
			return null;
		}

		// Distance from center determines height (cone shape)
		const dist = Math.hypot(position.x, position.z);
		// Center height is 100, drops to 0 at distance 1500
		const height = Math.max(0, 100 - (dist / 1500) * 100);
		return height;
	};
};

const getGeneratedTrees = (): TenerifeMountainTreePlacementType[] =>
	createTenerifeMountainTreePlacements({
		bounds: SYNTHETIC_TERRAIN_BOUNDS,
		getHeightAtPosition: createPlanarRegionHeightProvider(),
	});

describe('tenerife mountain tree data', () => {
	it('generates deterministic mountain tree ids', () => {
		const firstRun = getGeneratedTrees();
		const secondRun = getGeneratedTrees();
		const ids = firstRun.map((tree) => tree.id);

		expect(firstRun.map((tree) => tree.id)).toEqual(secondRun.map((tree) => tree.id));
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('keeps generated trees inside terrain bounds and outside the Teide dry zone', () => {
		for (const tree of getGeneratedTrees()) {
			expect(isInside(tree.position, SYNTHETIC_TERRAIN_BOUNDS)).toBe(true);
			expect(isInsideTenerifeTeideDryZone(tree.position)).toBe(false);
			expect(getDistanceToTenerifeTeide(tree.position)).toBeGreaterThanOrEqual(
				TENERIFE_TEIDE_DRY_ZONE_RADIUS,
			);
		}
	});

	it('keeps generated trees on accepted mountain height and slope samples', () => {
		for (const tree of getGeneratedTrees()) {
			expect(tree.terrainSample.height).toBeGreaterThanOrEqual(
				TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_HEIGHT,
			);
			expect(tree.terrainSample.height).toBeLessThanOrEqual(TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_HEIGHT);
			expect(tree.terrainSample.slope).toBeGreaterThanOrEqual(TENERIFE_MOUNTAIN_TREE_MIN_SAMPLE_SLOPE);
			expect(tree.terrainSample.slope).toBeLessThanOrEqual(TENERIFE_MOUNTAIN_TREE_MAX_SAMPLE_SLOPE);
		}
	});

	it('generates enough trees on inland mountain terrain without water-facing bands', () => {
		const trees = getGeneratedTrees();

		expect(trees.length).toBeGreaterThanOrEqual(TENERIFE_MOUNTAIN_TREE_MIN_TOTAL_COUNT);
		expect(trees.some((tree) => tree.position.x < -500)).toBe(true);
		expect(trees.some((tree) => tree.position.z < -300)).toBe(true);
		expect(trees.every((tree) => tree.position.x <= TENERIFE_MOUNTAIN_TREE_MAX_WATER_FACING_X)).toBe(
			true,
		);
		expect(trees.every((tree) => tree.position.z >= TENERIFE_MOUNTAIN_TREE_MIN_WATER_FACING_Z)).toBe(
			true,
		);
	});
});
