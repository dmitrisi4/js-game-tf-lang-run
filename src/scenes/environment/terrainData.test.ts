import { describe, expect, it } from 'vitest';
import {
	getTerrainHeightAt,
	getTerrainMaterialAt,
	getTerrainSampleAt,
	TERRAIN_MAX_HEIGHT,
	TERRAIN_MIN_HEIGHT,
} from './terrainData';

describe('terrain data', () => {
	it('keeps authored terrain heights inside the supported physics range', () => {
		const samplePoints = [
			{ x: 0, z: 0 },
			{ x: 0, z: -24 },
			{ x: 8, z: 27 },
			{ x: 30, z: 2 },
			{ x: -34, z: 17 },
			{ x: -46, z: -46 },
			{ x: 46, z: 46 },
			{ x: -68, z: -68 },
			{ x: 68, z: 68 },
		];

		for (const point of samplePoints) {
			const height = getTerrainHeightAt(point);

			expect(height).toBeGreaterThanOrEqual(TERRAIN_MIN_HEIGHT);
			expect(height).toBeLessThanOrEqual(TERRAIN_MAX_HEIGHT);
		}
	});

	it('makes key zones feel different through height', () => {
		const clearingHeight = getTerrainHeightAt({ x: 0, z: 0 });
		const emberHeight = getTerrainHeightAt({ x: 0, z: -24 });
		const groveHeight = getTerrainHeightAt({ x: 8, z: 27 });
		const ridgeHeight = getTerrainHeightAt({ x: -34, z: 17 });

		expect(emberHeight).toBeLessThan(clearingHeight);
		expect(groveHeight).toBeGreaterThan(clearingHeight);
		expect(ridgeHeight).toBeGreaterThan(groveHeight);
	});

	it('resolves terrain material from the current world zone', () => {
		expect(getTerrainMaterialAt({ x: 0, z: 0 })).toBe('grass');
		expect(getTerrainMaterialAt({ x: 0, z: -24 })).toBe('ash');
		expect(getTerrainMaterialAt({ x: 8, z: 27 })).toBe('moss');
		expect(getTerrainMaterialAt({ x: 42, z: 2 })).toBe('rock');
		expect(getTerrainMaterialAt({ x: 0, z: 61 })).toBe('moss');
		expect(getTerrainMaterialAt({ x: 0, z: -63 })).toBe('grass');
	});

	it('returns combined terrain samples for rendering and future gameplay systems', () => {
		expect(getTerrainSampleAt({ x: 8, z: 27 })).toMatchObject({
			material: 'moss',
		});
	});
});
