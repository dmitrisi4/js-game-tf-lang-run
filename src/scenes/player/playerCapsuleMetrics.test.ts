import { describe, expect, it } from 'vitest';
import {
	getCapsuleCenterYForFloor,
	getFloorYFromCapsuleCenter,
	getVisualFootYFromCapsuleCenter,
	PLAYER_CAPSULE_CONTACT_SKIN,
	PLAYER_CAPSULE_HALF_HEIGHT,
} from './playerCapsuleMetrics';

describe('playerCapsuleMetrics', () => {
	it('places the capsule center above a floor surface', () => {
		expect(getCapsuleCenterYForFloor(10)).toBeCloseTo(
			10 + PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_CAPSULE_CONTACT_SKIN,
		);
	});

	it('round-trips capsule center and floor height', () => {
		const centerY = getCapsuleCenterYForFloor(17.25);

		expect(getFloorYFromCapsuleCenter(centerY)).toBeCloseTo(17.25);
	});

	it('reports the visual foot baseline below capsule center', () => {
		expect(getVisualFootYFromCapsuleCenter(5)).toBeCloseTo(5 - PLAYER_CAPSULE_HALF_HEIGHT);
	});
});
