import { describe, expect, it } from 'vitest';

import {
	COLLISION_LAYERS,
	type CollisionLayerName,
	createCollisionMask,
	getDefaultCollisionMask,
} from './collisionLayers';

describe('collisionLayers', () => {
	it('assigns one unique bit per collision layer', () => {
		const values = Object.values(COLLISION_LAYERS);
		const uniqueValues = new Set(values);

		expect(uniqueValues.size).toBe(values.length);
		expect(values.every((value) => value > 0 && (value & (value - 1)) === 0)).toBe(true);
	});

	it('builds masks from readable layer names', () => {
		const mask = createCollisionMask(['ground', 'staticWorld', 'enemy']);

		expect(mask).toBe(
			COLLISION_LAYERS.ground | COLLISION_LAYERS.staticWorld | COLLISION_LAYERS.enemy,
		);
	});

	it('keeps default masks narrow for trigger-only objects', () => {
		const triggerMask = getDefaultCollisionMask('trigger');

		expect(triggerMask & COLLISION_LAYERS.player).not.toBe(0);
		expect(triggerMask & COLLISION_LAYERS.staticWorld).toBe(0);
	});

	it('defines defaults for every registered layer', () => {
		const layerNames = Object.keys(COLLISION_LAYERS) as CollisionLayerName[];

		expect(layerNames.every((layerName) => getDefaultCollisionMask(layerName) >= 0)).toBe(true);
	});
});
