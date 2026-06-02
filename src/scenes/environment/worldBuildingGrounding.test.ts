import { describe, expect, it } from 'vitest';
import {
	getWorldBuildingAnchorPosition,
	getWorldBuildingColliderCenterY,
	getWorldBuildingFallbackCenterY,
	getWorldBuildingFootprintGroundY,
	getWorldBuildingFootprintSamplePoints,
	getWorldBuildingFoundationCenterY,
	getWorldBuildingFoundationDepth,
} from './worldBuildingGrounding';
import type { WorldBuilding } from './worldData';

const createBuilding = (overrides: Partial<WorldBuilding> = {}): WorldBuilding => ({
	collider: { depth: 8, height: 5, width: 4 },
	heightOffset: 0.1,
	id: 'sample-building',
	modelId: 'house-1',
	position: { x: 10, z: -20 },
	scale: 1,
	yaw: 0,
	...overrides,
});

describe('worldBuildingGrounding', () => {
	it('applies X/Z placement offsets to the building anchor', () => {
		expect(getWorldBuildingAnchorPosition(createBuilding(), { x: 3, z: -4 })).toEqual({
			x: 13,
			z: -24,
		});
	});

	it('samples center, corners, and edges around the rotated footprint', () => {
		const points = getWorldBuildingFootprintSamplePoints(
			createBuilding({ collider: { depth: 10, height: 5, width: 6 }, yaw: Math.PI / 2 }),
		);

		expect(points).toHaveLength(9);
		expect(points[0]).toEqual({ x: 10, z: -20 });
		expect(points[1].x).toBeCloseTo(5);
		expect(points[1].z).toBeCloseTo(-17);
	});

	it('caps support depth from center so sloped terrain does not bury buildings', () => {
		const building = createBuilding({ collider: { depth: 10, height: 5, width: 6 } });
		const groundY = getWorldBuildingFootprintGroundY(building, (position) => {
			if (position.z < -22) {
				return 7;
			}

			return position.x === 10 && position.z === -20 ? 11 : 9;
		});

		expect(groundY).toBeCloseTo(10.35);
		expect(getWorldBuildingFallbackCenterY(building, groundY ?? 0)).toBeCloseTo(12.55);
		expect(getWorldBuildingColliderCenterY(building, groundY ?? 0)).toBeCloseTo(12.95);
	});

	it('adds a shallow foundation below fallback boxes to bridge slope gaps', () => {
		const building = createBuilding();

		expect(getWorldBuildingFoundationDepth(building)).toBeCloseTo(0.9);
		expect(getWorldBuildingFoundationCenterY(building, 10)).toBeCloseTo(9.65);
	});

	it('ignores missing terrain samples when at least one footprint sample resolves', () => {
		const groundY = getWorldBuildingFootprintGroundY(createBuilding(), (position) =>
			position.x === 10 && position.z === -20 ? 4 : null,
		);

		expect(groundY).toBe(4);
	});
});
