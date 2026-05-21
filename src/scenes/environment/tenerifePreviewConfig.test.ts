import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';

import {
	TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
	TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS,
	TENERIFE_FULL_ISLAND_PUERTO_START_POSITION,
} from './tenerifeFullIslandConfig';
import {
	type FullIslandGroundBoundsType,
	type FullIslandGroundSamplerType,
	getFullIslandHighestTerrainSpawnPositionFromSampler,
	getFullIslandPuertoSpawnPositionFromSampler,
	getTenerifePlayerResetPosition,
	shouldResetTenerifePlayer,
	TENERIFE_DEEP_WATER_RESET_Y,
	TENERIFE_PLAYABLE_BOUNDS,
	TENERIFE_WATER_BOUNDS,
} from './tenerifePreviewConfig';

const FULL_ISLAND_SEARCH = '?tenerife=1&terrain=island-full';
const FULL_ISLAND_TEST_BOUNDS: FullIslandGroundBoundsType = {
	maxX: 800,
	maxY: 90,
	maxZ: 800,
	minX: -800,
	minZ: -800,
};

describe('tenerifePreviewConfig', () => {
	it('keeps the normal island edge playable without a hard rectangular reset', () => {
		expect(
			shouldResetTenerifePlayer({
				x: TENERIFE_PLAYABLE_BOUNDS.maxX + 1,
				y: 2,
				z: 0,
			}),
		).toBe(false);
	});

	it('resets after the player sinks into deep water', () => {
		expect(
			shouldResetTenerifePlayer({
				x: 0,
				y: TENERIFE_DEEP_WATER_RESET_Y - 0.1,
				z: 0,
			}),
		).toBe(true);
	});

	it('resets when physics carries the player beyond the water safety area', () => {
		expect(
			shouldResetTenerifePlayer({
				x: TENERIFE_WATER_BOUNDS.maxX + 1,
				y: 2,
				z: 0,
			}),
		).toBe(true);
	});

	it('uses the calibrated Puerto de la Cruz full-island fallback position', () => {
		expect(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.x).toBeCloseTo(441.53, 2);
		expect(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.z).toBeCloseTo(-272.15, 2);
		expect(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.y).toBeGreaterThan(0);
	});

	it('resets full-island traversal from deep water and configured outer bounds', () => {
		expect(
			shouldResetTenerifePlayer(
				{
					x: 0,
					y: TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y - 0.1,
					z: 0,
				},
				FULL_ISLAND_SEARCH,
			),
		).toBe(true);
		expect(
			shouldResetTenerifePlayer(
				{
					x: TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS.maxX + 1,
					y: 2,
					z: 0,
				},
				FULL_ISLAND_SEARCH,
			),
		).toBe(true);
	});

	it('resolves full-island Puerto spawn from the primary marker when terrain exists there', () => {
		const sampler: FullIslandGroundSamplerType = {
			getBounds: () => FULL_ISLAND_TEST_BOUNDS,
			pickGroundAt: (_bounds, x, z) =>
				x === TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.x &&
				z === TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.z
					? new Vector3(x, 24, z)
					: null,
		};
		const spawn = getFullIslandPuertoSpawnPositionFromSampler(sampler);

		expect(spawn?.x).toBeCloseTo(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.x);
		expect(spawn?.y).toBeCloseTo(25.35);
		expect(spawn?.z).toBeCloseTo(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.z);
	});

	it('tries calibrated Puerto offsets before falling back to a different island spawn', () => {
		const calls: Array<{ x: number; z: number }> = [];
		const sampler: FullIslandGroundSamplerType = {
			getBounds: () => FULL_ISLAND_TEST_BOUNDS,
			pickGroundAt: (_bounds, x, z) => {
				calls.push({ x, z });

				return calls.length === 2 ? new Vector3(x, 18, z) : null;
			},
		};
		const spawn = getFullIslandPuertoSpawnPositionFromSampler(sampler);

		expect(calls).toHaveLength(2);
		expect(spawn?.x).toBeCloseTo(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.x + 36);
		expect(spawn?.y).toBeCloseTo(19.35);
	});

	it('falls back to the highest sampled full-island terrain point when Puerto grounding fails', () => {
		const sampler: FullIslandGroundSamplerType = {
			getBounds: () => FULL_ISLAND_TEST_BOUNDS,
			pickGroundAt: (bounds, x, z) =>
				x === bounds.maxX && z === bounds.maxZ ? new Vector3(x, 64, z) : null,
		};
		const spawn = getFullIslandHighestTerrainSpawnPositionFromSampler(sampler);

		expect(spawn?.x).toBe(FULL_ISLAND_TEST_BOUNDS.maxX);
		expect(spawn?.y).toBeCloseTo(65.35);
		expect(spawn?.z).toBe(FULL_ISLAND_TEST_BOUNDS.maxZ);
	});

	it('uses the configured full-island fallback position when no scene is available', () => {
		const fallback = getTenerifePlayerResetPosition(null, FULL_ISLAND_SEARCH);

		expect(fallback.x).toBeCloseTo(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.x);
		expect(fallback.y).toBeCloseTo(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.y);
		expect(fallback.z).toBeCloseTo(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.z);
	});
});
