import { describe, expect, it } from 'vitest';
import runtimeBuildingsRaw from '../../../public/data/tenerife/puerto-building-footprints-runtime.json?raw';
import {
	type PuertoFootprintBuildingsRuntimeDataType,
	transformPuertoFootprintBuilding,
} from './puertoFootprintBuildingData';

const runtimeBuildings = JSON.parse(runtimeBuildingsRaw) as PuertoFootprintBuildingsRuntimeDataType;

describe('Puerto footprint buildings', () => {
	it('publishes compact runtime placements from OSM building footprints', () => {
		expect(runtimeBuildings.version).toBe(1);
		expect(runtimeBuildings.metrics.sourceFootprintCount).toBeGreaterThan(3_000);
		expect(runtimeBuildings.metrics.runtimeBuildingCount).toBe(1_400);
		expect(runtimeBuildings.runtimeBuildings).toHaveLength(1_400);
		expect(runtimeBuildings.runtimeBuildings[0].id).toMatch(/^puerto-osm-building-/);
	});

	it('transforms Puerto-local buildings onto the full-island overlay frame', () => {
		const instance = transformPuertoFootprintBuilding(
			{
				collider: { depth: 8, height: 6, width: 12 },
				heightOffset: 0.1,
				id: 'sample',
				position: { x: 20, z: -40 },
				yaw: 0.5,
			},
			{
				offset: { x: 100, z: -50 },
				scale: 0.25,
			},
			{
				groundHeight: 3,
				horizontalScaleMultiplier: 2,
				verticalScaleMultiplier: 8,
			},
		);

		expect(instance.position.x).toBe(105);
		expect(instance.position.y).toBe(3.2);
		expect(instance.position.z).toBe(-60);
		expect(instance.width).toBe(6);
		expect(instance.height).toBe(12);
		expect(instance.depth).toBe(4);
		expect(instance.yaw).toBe(0.5);
	});

	it('keeps full-island footprints from becoming flat slabs', () => {
		const instance = transformPuertoFootprintBuilding(
			{
				collider: { depth: 20, height: 2, width: 30 },
				id: 'sample-slab-risk',
				position: { x: 0, z: 0 },
				yaw: 0,
			},
			{
				offset: { x: 0, z: 0 },
				scale: 0.225,
			},
			{
				groundHeight: 0,
			},
		);

		expect(instance.width).toBeCloseTo(4.86);
		expect(instance.depth).toBeCloseTo(3.24);
		expect(instance.height).toBeCloseTo(5.4);
		expect(instance.height / instance.width).toBeGreaterThan(0.5);
	});

	it('spreads full-island Puerto placements enough to leave street space visible', () => {
		const west = transformPuertoFootprintBuilding(
			{
				collider: { depth: 8, height: 2, width: 12 },
				id: 'west',
				position: { x: -20, z: 0 },
				yaw: 0,
			},
			{
				offset: { x: 100, z: -50 },
				scale: 0.225,
			},
			{ groundHeight: 0 },
		);
		const east = transformPuertoFootprintBuilding(
			{
				collider: { depth: 8, height: 2, width: 12 },
				id: 'east',
				position: { x: 20, z: 0 },
				yaw: 0,
			},
			{
				offset: { x: 100, z: -50 },
				scale: 0.225,
			},
			{ groundHeight: 0 },
		);

		const centerDistance = east.position.x - west.position.x;
		const combinedHalfWidth = west.width / 2 + east.width / 2;

		expect(centerDistance).toBe(9);
		expect(combinedHalfWidth).toBeLessThan(2);
	});
});
