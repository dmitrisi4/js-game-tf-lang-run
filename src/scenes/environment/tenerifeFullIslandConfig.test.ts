import { describe, expect, it } from 'vitest';
import {
	isTenerifeFullIslandMode,
	isTenerifeFullIslandTerrainMeshName,
	shouldRenderPuertoOnFullIsland,
	shouldUseTenerifeFullIslandNativeDeviceRatio,
	TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
	TENERIFE_FULL_ISLAND_TEIDE_POSITION,
	TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
} from './tenerifeFullIslandConfig';

describe('tenerifeFullIslandConfig', () => {
	it('identifies normalized full-island terrain tiles', () => {
		expect(isTenerifeFullIslandTerrainMeshName('tenerife-full-island-terrain-tile-00')).toBe(true);
		expect(isTenerifeFullIslandTerrainMeshName('ground1')).toBe(false);
	});

	it('resolves full-island mode from the URL search params', () => {
		expect(isTenerifeFullIslandMode('?tenerife=1&terrain=island-full')).toBe(true);
		expect(isTenerifeFullIslandMode('?tenerife=1&terrain=real')).toBe(false);
	});

	it('keeps Puerto overlay opt-in until transform alignment is calibrated', () => {
		expect(shouldRenderPuertoOnFullIsland('?tenerife=1&terrain=island-full')).toBe(false);
		expect(shouldRenderPuertoOnFullIsland('?tenerife=1&terrain=island-full&puerto=1')).toBe(true);
	});

	it('keeps native device ratio opt-in for full-island performance testing', () => {
		expect(shouldUseTenerifeFullIslandNativeDeviceRatio('?tenerife=1&terrain=island-full')).toBe(
			false,
		);
		expect(
			shouldUseTenerifeFullIslandNativeDeviceRatio('?tenerife=1&terrain=island-full&render=retina'),
		).toBe(true);
	});

	it('records Teide as terrain-scale elevation instead of a backdrop-only marker', () => {
		expect(TENERIFE_FULL_ISLAND_TEIDE_POSITION.y).toBeGreaterThan(70);
	});

	it('keeps visual sea level below coastal player grounding but above deep-water reset', () => {
		expect(TENERIFE_FULL_ISLAND_WATER_SURFACE_Y).toBeLessThan(-20);
		expect(TENERIFE_FULL_ISLAND_WATER_SURFACE_Y).toBeGreaterThan(
			TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
		);
	});
});
