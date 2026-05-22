import { describe, expect, it } from 'vitest';

import {
	isWaterLikeImportedMesh,
	shouldHideCustomOcean,
	shouldHideImportedWater,
	shouldShowImportedWater,
	shouldShowOceanDebug,
} from './oceanDebug';

describe('oceanDebug', () => {
	it('resolves ocean debug query flags', () => {
		expect(shouldShowOceanDebug('?tenerife=1&terrain=island-full&oceanDebug=1')).toBe(true);
		expect(shouldHideCustomOcean('?hideCustomOcean=1')).toBe(true);
	});

	it('hides imported water by default unless explicitly shown', () => {
		expect(shouldHideImportedWater('?tenerife=1&terrain=island-full')).toBe(true);
		expect(shouldShowImportedWater('?showImportedWater=1')).toBe(true);
		expect(shouldHideImportedWater('?showImportedWater=1')).toBe(false);
		expect(shouldHideImportedWater('?showImportedWater=1&hideImportedWater=1')).toBe(true);
	});

	it('identifies likely imported water meshes by mesh or material name', () => {
		expect(isWaterLikeImportedMesh('env_atlantic_ocean_disc')).toBe(true);
		expect(isWaterLikeImportedMesh('terrain_tile_01', 'Sea plane material')).toBe(true);
		expect(isWaterLikeImportedMesh('tenerife-full-island-terrain-tile-01', 'ground')).toBe(false);
	});
});
