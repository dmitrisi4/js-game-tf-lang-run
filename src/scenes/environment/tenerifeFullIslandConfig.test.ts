import { describe, expect, it } from 'vitest';
import {
	getTenerifeFullIslandPuertoOverlayTransform,
	isTenerifeFullIslandMode,
	isTenerifeFullIslandTerrainMeshName,
	projectGeoToTenerifeFullIslandWorld,
	shouldRenderPuertoOnFullIsland,
	shouldUseTenerifeFullIslandNativeDeviceRatio,
	TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
	TENERIFE_FULL_ISLAND_PUERTO_START_POSITION,
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

	it('renders the calibrated Puerto overlay by default while keeping an opt-out', () => {
		expect(shouldRenderPuertoOnFullIsland('?tenerife=1&terrain=island-full')).toBe(true);
		expect(shouldRenderPuertoOnFullIsland('?tenerife=1&terrain=island-full&puerto=1')).toBe(true);
		expect(shouldRenderPuertoOnFullIsland('?tenerife=1&terrain=island-full&puerto=0')).toBe(false);
	});

	it('projects WGS84 controls into the full-island runtime map space', () => {
		const teide = projectGeoToTenerifeFullIslandWorld({ lat: 28.2723, lon: -16.6425 });

		expect(teide.x).toBeGreaterThan(620);
		expect(teide.x).toBeLessThan(630);
		expect(teide.z).toBeGreaterThan(-30);
		expect(teide.z).toBeLessThan(-20);
	});

	it('derives a compact Puerto overlay transform from full-island control points', () => {
		const transform = getTenerifeFullIslandPuertoOverlayTransform();

		expect(transform.position.x).toBeCloseTo(434.88, 2);
		expect(transform.position.y).toBeCloseTo(TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.y + 0.18, 3);
		expect(transform.position.z).toBeCloseTo(-248.36, 2);
		expect(transform.scale).toBeGreaterThan(0.07);
		expect(transform.scale).toBeLessThan(0.08);
	});

	it('anchors the Puerto overlay vertically to sampled full-island terrain height', () => {
		const transform = getTenerifeFullIslandPuertoOverlayTransform(4);

		expect(transform.position.y).toBeGreaterThan(1.8);
		expect(transform.position.y).toBeLessThan(1.9);
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
		expect(TENERIFE_FULL_ISLAND_WATER_SURFACE_Y).toBeLessThan(0);
		expect(TENERIFE_FULL_ISLAND_WATER_SURFACE_Y).toBeGreaterThan(
			TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
		);
	});
});
