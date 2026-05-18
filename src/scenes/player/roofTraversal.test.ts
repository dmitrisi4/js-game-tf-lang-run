import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import {
	findNearestRoofLandingPoint,
	getPlanarFacingDirection,
	getRoofLedgePosition,
	isPuertoCityBuildingMeshName,
	type RoofLandingPointType,
	shouldLoadPuertoRoofTraversal,
} from './roofTraversal';

const LANDINGS: RoofLandingPointType[] = [
	{
		id: 'near',
		position: { x: 4, y: 12, z: 0 },
		radius: 8,
		roofY: 10.65,
	},
	{
		id: 'far',
		position: { x: 80, y: 15, z: 0 },
		radius: 8,
		roofY: 13.65,
	},
];

describe('roofTraversal', () => {
	it('loads only for Tenerife real terrain mode', () => {
		expect(shouldLoadPuertoRoofTraversal('?tenerife=1&terrain=real')).toBe(true);
		expect(shouldLoadPuertoRoofTraversal('?tenerife=1')).toBe(false);
		expect(shouldLoadPuertoRoofTraversal('?terrain=real')).toBe(false);
	});

	it('identifies Puerto city building meshes', () => {
		expect(isPuertoCityBuildingMeshName('puerto-osm-city-buildings')).toBe(true);
		expect(isPuertoCityBuildingMeshName('puerto-osm-city-buildings.001')).toBe(true);
		expect(isPuertoCityBuildingMeshName('ground1')).toBe(false);
	});

	it('flattens camera facing to the ground plane', () => {
		const direction = getPlanarFacingDirection(new Vector3(1, -4, 1));

		expect(direction.y).toBe(0);
		expect(direction.length()).toBeCloseTo(1);
	});

	it('finds the nearest valid roof landing from a wall hit', () => {
		expect(findNearestRoofLandingPoint(LANDINGS, new Vector3(1, 4, 0))?.id).toBe('near');
		expect(findNearestRoofLandingPoint(LANDINGS, new Vector3(40, 4, 0), 6)).toBeNull();
	});

	it('places ledge grab near the roof before final landing', () => {
		const ledge = getRoofLedgePosition(new Vector3(0, 3, 0), LANDINGS[0], new Vector3(1, 0, 0));

		expect(ledge.x).toBeLessThan(0);
		expect(ledge.z).toBeCloseTo(0);
		expect(ledge.y).toBeCloseTo(11.65);
	});
});
