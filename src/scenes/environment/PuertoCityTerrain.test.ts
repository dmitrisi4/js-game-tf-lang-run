import { describe, expect, it } from 'vitest';
import { isPuertoCityBuildingMeshName } from './PuertoCityTerrain';

describe('PuertoCityTerrain', () => {
	it('identifies the baked Puerto city building mesh for static wall collision', () => {
		expect(isPuertoCityBuildingMeshName('puerto-osm-city-buildings')).toBe(true);
		expect(isPuertoCityBuildingMeshName('puerto-osm-city-buildings.001')).toBe(true);
		expect(isPuertoCityBuildingMeshName('ground1')).toBe(false);
	});
});
