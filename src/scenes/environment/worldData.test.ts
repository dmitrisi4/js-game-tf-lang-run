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
import {
	type CircularPlacementType,
	findBuildingFootprintOverlaps,
	findCircularPlacementOverlaps,
} from './worldPlacementValidation';

const expectInsideWorld = (position: { x: number; z: number }) => {
	expect(Math.abs(position.x)).toBeLessThan(WORLD_HALF_EXTENT);
	expect(Math.abs(position.z)).toBeLessThan(WORLD_HALF_EXTENT);
};

const getBuildingClearancePlacement = (building: (typeof WORLD_BUILDINGS)[number]) => ({
	id: building.id,
	position: building.position,
	radius: (Math.hypot(building.collider.width, building.collider.depth) * building.scale) / 2,
});

const getRockClearancePlacement = (rock: (typeof WORLD_ROCKS)[number]) => ({
	id: rock.id,
	position: rock.position,
	radius: Math.max(rock.scale.x, rock.scale.z) / 2,
});

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

	it('keeps authored default blockers from intersecting each other', () => {
		const placements: CircularPlacementType[] = [
			...WORLD_BUILDINGS.map(getBuildingClearancePlacement),
			...WORLD_ROCKS.map(getRockClearancePlacement),
		];

		expect(findCircularPlacementOverlaps(placements)).toEqual([]);
	});

	it('keeps Tenerife preview building footprints from overlapping', () => {
		expect(findBuildingFootprintOverlaps(TENERIFE_PREVIEW_BUILDINGS, 0.75)).toEqual([]);
	});
});
