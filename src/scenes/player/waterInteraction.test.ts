import { describe, expect, it } from 'vitest';

import {
	getPlayerWaterState,
	getWaterAdjustedMoveSpeed,
	isEnteringWater,
	PLAYER_WATER_ENTRY_MOVE_SPEED_MULTIPLIER,
	PLAYER_WATER_MOVE_SPEED_MULTIPLIER,
} from './waterInteraction';

describe('waterInteraction', () => {
	it('keeps dry terrain out of the water movement state', () => {
		const waterState = getPlayerWaterState({
			floorY: 4,
			waterSurfaceY: 2,
		});

		expect(waterState.depthAtFeet).toBe(0);
		expect(waterState.isInWater).toBe(false);
	});

	it('enters water only after the feet are meaningfully submerged', () => {
		expect(
			getPlayerWaterState({
				floorY: 1.8,
				waterSurfaceY: 2,
			}).isInWater,
		).toBe(false);
		expect(
			getPlayerWaterState({
				floorY: 1.6,
				waterSurfaceY: 2,
			}).isInWater,
		).toBe(true);
	});

	it('holds the swim center and visual anchor around the waterline', () => {
		const waterState = getPlayerWaterState({
			floorY: -4,
			timeSeconds: 0,
			waterSurfaceY: 2,
		});

		expect(waterState.swimCenterY).toBeGreaterThan(2);
		expect(waterState.visualAnchorY).toBeLessThan(2);
		expect(waterState.visualAnchorY).toBeGreaterThan(1);
	});

	it('slows movement while in water', () => {
		expect(getWaterAdjustedMoveSpeed(10, false)).toBe(10);
		expect(getWaterAdjustedMoveSpeed(10, true)).toBe(10 * PLAYER_WATER_MOVE_SPEED_MULTIPLIER);
	});

	it('applies stronger resistance on the water entry frame', () => {
		expect(isEnteringWater(false, true)).toBe(true);
		expect(isEnteringWater(true, true)).toBe(false);
		expect(getWaterAdjustedMoveSpeed(10, true, true)).toBe(
			10 * PLAYER_WATER_ENTRY_MOVE_SPEED_MULTIPLIER,
		);
	});
});
