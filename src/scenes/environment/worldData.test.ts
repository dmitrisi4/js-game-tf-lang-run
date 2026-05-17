import { describe, expect, it } from 'vitest';
import {
	getWorldPopulationSummary,
	TENERIFE_PREVIEW_BUILDINGS,
	TENERIFE_PREVIEW_ROADS,
	WORLD_BUILDINGS,
	WORLD_CREATURES,
	WORLD_HALF_EXTENT,
	WORLD_NPCS,
	WORLD_PROPS,
	WORLD_ROCKS,
	WORLD_TREES,
} from './worldData';

const expectInsideWorld = (position: { x: number; z: number }) => {
	expect(Math.abs(position.x)).toBeLessThan(WORLD_HALF_EXTENT);
	expect(Math.abs(position.z)).toBeLessThan(WORLD_HALF_EXTENT);
};

describe('world data', () => {
	it('keeps all authored objects inside the expanded map bounds', () => {
		for (const object of [
			...WORLD_TREES,
			...WORLD_BUILDINGS,
			...TENERIFE_PREVIEW_BUILDINGS,
			...WORLD_ROCKS,
			...WORLD_PROPS,
			...WORLD_NPCS,
			...WORLD_CREATURES,
		]) {
			expectInsideWorld(object.position);
		}

		for (const road of TENERIFE_PREVIEW_ROADS) {
			for (const point of road.points) {
				expectInsideWorld(point);
			}
		}
	});

	it('reports the visible RPG population summary', () => {
		expect(getWorldPopulationSummary()).toEqual({
			npcs: 3,
			creatures: 4,
			buildings: 6,
			trees: 64,
			props: 6,
		});
	});

	it('keeps a denser forest population after map expansion', () => {
		expect(WORLD_TREES.length).toBeGreaterThanOrEqual(60);
	});
});
