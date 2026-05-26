import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';

import {
	buildShorelineSandSlopePositions,
	shouldConnectShorelineSandSlopePoints,
} from './ShorelineSandSlope';

describe('ShorelineSandSlope', () => {
	it('rejects long shoreline gaps so sand shelves do not bridge across terrain', () => {
		expect(
			shouldConnectShorelineSandSlopePoints(new Vector3(0, 0, 0), new Vector3(20, 0, 0), 48),
		).toBe(true);
		expect(
			shouldConnectShorelineSandSlopePoints(new Vector3(0, 0, 0), new Vector3(240, 0, 0), 48),
		).toBe(false);
	});

	it('builds a shoreline shelf that descends outward from the waterline', () => {
		const positions = buildShorelineSandSlopePositions(
			[{ angle: 0, point: new Vector3(100, -3.75, 0) }],
			-3.75,
			15,
			120,
			6,
		);

		expect(positions.length).toBe(18);
		expect(positions[0]).toBeLessThan(100);
		expect(positions[1]).toBeGreaterThan(-3.75);
		expect(positions[15]).toBeGreaterThan(100);
		expect(positions[16]).toBeCloseTo(-9.75);
	});
});
