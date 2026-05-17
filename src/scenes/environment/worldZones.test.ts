import { describe, expect, it } from 'vitest';
import {
	getZoneById,
	getZoneForDiscoveryWave,
	getZoneForPosition,
	isPositionInsideWorldBounds,
	isPositionInsideZone,
	WORLD_ZONES,
	type WorldZoneId,
} from './worldZones';

describe('world zones', () => {
	it('keeps zone ids unique', () => {
		const zoneIds = WORLD_ZONES.map((zone) => zone.id);

		expect(new Set(zoneIds).size).toBe(zoneIds.length);
	});

	it('keeps zone centers inside the authored world bounds', () => {
		for (const zone of WORLD_ZONES) {
			expect(isPositionInsideWorldBounds(zone.center)).toBe(true);
		}
	});

	it.each([
		['starter-clearing', { x: 0, z: 0 }],
		['ember-camp', { x: 1, z: -24 }],
		['north-grove', { x: 8, z: 27 }],
		['east-ruins', { x: 42, z: 1 }],
		['west-ridge', { x: -43, z: 14 }],
		['northern-woods', { x: 0, z: 61 }],
		['southern-wilds', { x: 0, z: -63 }],
	] satisfies Array<
		[WorldZoneId, { x: number; z: number }]
	>)('resolves %s for representative positions', (zoneId, position) => {
		expect(getZoneForPosition(position).id).toBe(zoneId);
	});

	it('binds discovery waves to their intended zones', () => {
		expect(getZoneForDiscoveryWave('starter')?.id).toBe('starter-clearing');
		expect(getZoneForDiscoveryWave('ember')?.id).toBe('ember-camp');
		expect(getZoneForDiscoveryWave('grove')?.id).toBe('north-grove');
	});

	it('resolves zone lookup by id', () => {
		const zone = getZoneById('north-grove');

		expect(zone.displayName).toBe('North Grove');
		expect(isPositionInsideZone(zone.center, zone)).toBe(true);
	});
});
