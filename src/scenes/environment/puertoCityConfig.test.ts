import { describe, expect, it } from 'vitest';

import { publicAssetUrl } from '@/utils/publicAssetUrl';
import {
	getPuertoLayerPlan,
	getPuertoRoadRenderMode,
	getPuertoTerrainMode,
	PUERTO_CITY_ALBEDO_TEXTURE_URL,
	PUERTO_CITY_NORMAL_TEXTURE_URL,
	PUERTO_CITY_ORM_TEXTURE_URL,
	PUERTO_CITY_ROAD_MASK_TEXTURE_URL,
	shouldRenderPuertoBuildingsOnFullIsland,
	shouldRenderRoadMeshes,
} from './puertoCityConfig';

describe('puertoCityConfig', () => {
	it('uses the island preview by default', () => {
		expect(getPuertoTerrainMode('?tenerife=1')).toBe('island');
	});

	it('enables the real Puerto terrain with terrain=real', () => {
		expect(getPuertoTerrainMode('?tenerife=1&terrain=real')).toBe('real');
	});

	it('enables the full Tenerife island terrain with terrain=island-full', () => {
		expect(getPuertoTerrainMode('?tenerife=1&terrain=island-full')).toBe('island-full');
	});

	it('defaults road meshes for the legacy island terrain', () => {
		expect(getPuertoRoadRenderMode('island', '?tenerife=1')).toBe('mesh');
		expect(shouldRenderRoadMeshes(getPuertoRoadRenderMode('island', '?tenerife=1'))).toBe(true);
	});

	it('defaults full island Puerto overlay to visible OSM road meshes', () => {
		expect(getPuertoRoadRenderMode('island-full', '?tenerife=1&terrain=island-full')).toBe('mesh');
		expect(shouldRenderRoadMeshes(getPuertoRoadRenderMode('island-full'))).toBe(true);
	});

	it('keeps full island Puerto buildings opt-in while calibrating roads first', () => {
		expect(shouldRenderPuertoBuildingsOnFullIsland('?tenerife=1&terrain=island-full')).toBe(false);
		expect(
			shouldRenderPuertoBuildingsOnFullIsland('?tenerife=1&terrain=island-full&buildings=1'),
		).toBe(true);
	});

	it('defaults baked roads for the real Puerto terrain', () => {
		expect(getPuertoRoadRenderMode('real', '?tenerife=1&terrain=real')).toBe('baked');
		expect(shouldRenderRoadMeshes(getPuertoRoadRenderMode('real', '?tenerife=1&terrain=real'))).toBe(
			false,
		);
	});

	it('allows both baked texture and mesh roads for comparison', () => {
		expect(getPuertoRoadRenderMode('real', '?tenerife=1&terrain=real&roads=both')).toBe('both');
		expect(shouldRenderRoadMeshes('both')).toBe(true);
	});

	it('keeps full island Puerto roads and buildings behind the Puerto overlay switch', () => {
		expect(getPuertoLayerPlan('?tenerife=1&terrain=island-full&puerto=0&buildings=1')).toMatchObject({
			renderFootprintBuildings: false,
			renderGeneratedRoadsideBuildings: false,
			renderManualPreviewBuildings: false,
			renderPuertoOverlay: false,
			renderRoadMeshes: false,
		});
	});

	it('renders only one Puerto building source for each terrain mode', () => {
		expect(getPuertoLayerPlan('?tenerife=1')).toMatchObject({
			renderFootprintBuildings: false,
			renderGeneratedRoadsideBuildings: false,
			renderManualPreviewBuildings: true,
		});
		expect(getPuertoLayerPlan('?tenerife=1&terrain=real&roads=both')).toMatchObject({
			renderFootprintBuildings: false,
			renderGeneratedRoadsideBuildings: false,
			renderManualPreviewBuildings: false,
			renderRoadMeshes: true,
		});
		expect(getPuertoLayerPlan('?tenerife=1&terrain=island-full&buildings=1')).toMatchObject({
			renderFootprintBuildings: true,
			renderGeneratedRoadsideBuildings: false,
			renderManualPreviewBuildings: false,
			renderRoadMeshes: true,
		});
	});

	it('keeps generated Puerto material map URLs colocated with the terrain atlas', () => {
		expect(PUERTO_CITY_ALBEDO_TEXTURE_URL).toBe(
			publicAssetUrl('/textures/tenerife/puerto-city-albedo.png'),
		);
		expect(PUERTO_CITY_ROAD_MASK_TEXTURE_URL).toBe(
			publicAssetUrl('/textures/tenerife/puerto-city-road-mask.png'),
		);
		expect(PUERTO_CITY_ORM_TEXTURE_URL).toBe(
			publicAssetUrl('/textures/tenerife/puerto-city-orm.png'),
		);
		expect(PUERTO_CITY_NORMAL_TEXTURE_URL).toBe(
			publicAssetUrl('/textures/tenerife/puerto-city-normal.png'),
		);
	});
});
