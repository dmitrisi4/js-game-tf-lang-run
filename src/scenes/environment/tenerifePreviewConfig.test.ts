import { describe, expect, it } from 'vitest';

import {
	shouldResetTenerifePlayer,
	TENERIFE_DEEP_WATER_RESET_Y,
	TENERIFE_PLAYABLE_BOUNDS,
	TENERIFE_WATER_BOUNDS,
} from './tenerifePreviewConfig';

describe('tenerifePreviewConfig', () => {
	it('keeps the normal island edge playable without a hard rectangular reset', () => {
		expect(
			shouldResetTenerifePlayer({
				x: TENERIFE_PLAYABLE_BOUNDS.maxX + 1,
				y: 2,
				z: 0,
			}),
		).toBe(false);
	});

	it('resets after the player sinks into deep water', () => {
		expect(
			shouldResetTenerifePlayer({
				x: 0,
				y: TENERIFE_DEEP_WATER_RESET_Y - 0.1,
				z: 0,
			}),
		).toBe(true);
	});

	it('resets when physics carries the player beyond the water safety area', () => {
		expect(
			shouldResetTenerifePlayer({
				x: TENERIFE_WATER_BOUNDS.maxX + 1,
				y: 2,
				z: 0,
			}),
		).toBe(true);
	});
});
