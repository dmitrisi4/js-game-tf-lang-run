import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import { TENERIFE_FULL_ISLAND_MAP_DATA } from '@/scenes/environment/tenerifeFullIslandMapData';
import {
	ARENA_MAP_BOUNDS,
	getMapBounds,
	getMapMode,
	getPlayerMapPoint,
	offsetWorldPointByMapPercent,
	projectTenerifeGeoToFullIslandWorldPoint,
	TENERIFE_PREVIEW_MAP_BOUNDS,
	toMapPoint,
} from './mapProjection';

describe('mapProjection', () => {
	it('uses arena bounds when Tenerife mode is disabled', () => {
		expect(getMapMode(false, '?tenerife=1&terrain=island-full')).toBe('arena');
		expect(getMapBounds('arena')).toEqual(ARENA_MAP_BOUNDS);
		expect(getPlayerMapPoint(new Vector3(0, 0, 0), false, '')).toEqual({
			left: 50,
			top: 50,
		});
	});

	it('keeps legacy Tenerife preview projection anchored to the Puerto local map', () => {
		const point = getPlayerMapPoint(new Vector3(-10, 0, 0), true, '?tenerife=1');
		const expectedPoint = toMapPoint(6.25, 15.58, TENERIFE_PREVIEW_MAP_BOUNDS);

		expect(getMapMode(true, '?tenerife=1')).toBe('tenerife-preview');
		expect(point?.left).toBeCloseTo(expectedPoint.left, 3);
		expect(point?.top).toBeCloseTo(expectedPoint.top, 3);
	});

	it('uses generated model bounds for full-island projection', () => {
		const bounds = TENERIFE_FULL_ISLAND_MAP_DATA.bounds;
		const point = getPlayerMapPoint(
			new Vector3((bounds.minX + bounds.maxX) / 2, 0, (bounds.minZ + bounds.maxZ) / 2),
			true,
			'?tenerife=1&terrain=island-full',
		);

		expect(getMapMode(true, '?tenerife=1&terrain=island-full')).toBe('tenerife-full-island');
		expect(getMapBounds('tenerife-full-island')).toEqual(bounds);
		expect(point).toEqual({ left: 50, top: 50 });
		expect(bounds.maxX - bounds.minX).not.toBeCloseTo(bounds.maxZ - bounds.minZ, 0);
	});

	it('projects generated Teide landmark inside the full-island map surface', () => {
		const point = toMapPoint(
			TENERIFE_FULL_ISLAND_MAP_DATA.landmarks.teide.x,
			TENERIFE_FULL_ISLAND_MAP_DATA.landmarks.teide.z,
			TENERIFE_FULL_ISLAND_MAP_DATA.bounds,
		);

		expect(point.left).toBeGreaterThan(50);
		expect(point.left).toBeLessThan(80);
		expect(point.top).toBeGreaterThan(40);
		expect(point.top).toBeLessThan(70);
	});

	it('keeps WGS84 full-island city projection aligned with the generated Teide landmark', () => {
		const projectedTeide = projectTenerifeGeoToFullIslandWorldPoint({
			lat: 28.2723,
			lon: -16.6425,
		});
		const generatedTeide = TENERIFE_FULL_ISLAND_MAP_DATA.landmarks.teide;

		expect(Math.abs(projectedTeide.x - generatedTeide.x)).toBeLessThan(5);
		expect(Math.abs(projectedTeide.z - generatedTeide.z)).toBeLessThan(15);

		const santaCruzWorldPoint = projectTenerifeGeoToFullIslandWorldPoint({
			lat: 28.46824,
			lon: -16.25462,
		});
		const santaCruz = toMapPoint(
			santaCruzWorldPoint.x,
			santaCruzWorldPoint.z,
			TENERIFE_FULL_ISLAND_MAP_DATA.bounds,
		);

		expect(santaCruz.left).toBeLessThan(30);
		expect(santaCruz.top).toBeGreaterThan(70);
	});

	it('applies visual marker calibration in map-space percentages', () => {
		const puertoWorldPoint = projectTenerifeGeoToFullIslandWorldPoint({
			lat: 28.41397,
			lon: -16.54867,
		});
		const calibratedPuerto = offsetWorldPointByMapPercent(puertoWorldPoint, { top: -5 });
		const originalPoint = toMapPoint(
			puertoWorldPoint.x,
			puertoWorldPoint.z,
			TENERIFE_FULL_ISLAND_MAP_DATA.bounds,
		);
		const calibratedPoint = toMapPoint(
			calibratedPuerto.x,
			calibratedPuerto.z,
			TENERIFE_FULL_ISLAND_MAP_DATA.bounds,
		);

		expect(calibratedPoint.left).toBeCloseTo(originalPoint.left, 3);
		expect(calibratedPoint.top).toBeCloseTo(originalPoint.top - 5, 3);
	});
});
