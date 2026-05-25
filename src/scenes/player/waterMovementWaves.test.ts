import { describe, expect, it } from 'vitest';

import { getWakeEmitterPosition } from './waterMovementWaves';

describe('waterMovementWaves', () => {
	it('places the moving wake behind the player facing direction', () => {
		const northWake = getWakeEmitterPosition({
			facingYaw: 0,
			waterSurfaceY: -24,
			x: 10,
			z: 20,
		});
		const eastWake = getWakeEmitterPosition({
			facingYaw: Math.PI / 2,
			waterSurfaceY: -24,
			x: 10,
			z: 20,
		});

		expect(northWake.x).toBeCloseTo(10);
		expect(northWake.y).toBeGreaterThan(-24);
		expect(northWake.z).toBeLessThan(20);
		expect(eastWake.x).toBeLessThan(10);
		expect(eastWake.z).toBeCloseTo(20);
	});
});
