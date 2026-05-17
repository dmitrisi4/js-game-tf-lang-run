import { describe, expect, it } from 'vitest';
import { findNearestCollectibleInRange, LETTER_PICKUP_RADIUS } from './collectibleUtils';

describe('collectible utils', () => {
	it('finds the nearest collectible inside the pickup radius', () => {
		const collectible = findNearestCollectibleInRange(
			[
				{ id: 'far', letter: 'f', position: { x: 5, y: 1.2, z: 5 } },
				{ id: 'near', letter: 'n', position: { x: 1.2, y: 1.2, z: 0.4 } },
			],
			{ x: 0, y: 1.2, z: 0 },
		);

		expect(collectible?.id).toBe('near');
	});

	it('returns null when no collectible is inside range', () => {
		const collectible = findNearestCollectibleInRange(
			[{ id: 'far', letter: 'f', position: { x: 8, y: 1.2, z: 8 } }],
			{ x: 0, y: 1.2, z: 0 },
			LETTER_PICKUP_RADIUS,
		);

		expect(collectible).toBeNull();
	});
});
