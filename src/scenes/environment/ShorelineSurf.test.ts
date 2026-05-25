import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';

import { shouldConnectShorelineSurfPoints } from './ShorelineSurf';

describe('ShorelineSurf', () => {
	it('rejects long shoreline gaps so foam does not bridge across terrain', () => {
		expect(shouldConnectShorelineSurfPoints(new Vector3(0, 0, 0), new Vector3(20, 0, 0), 48)).toBe(
			true,
		);
		expect(shouldConnectShorelineSurfPoints(new Vector3(0, 0, 0), new Vector3(240, 0, 0), 48)).toBe(
			false,
		);
	});
});
