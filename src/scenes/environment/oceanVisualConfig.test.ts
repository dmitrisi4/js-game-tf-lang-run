import { describe, expect, it } from 'vitest';

import { getOceanSurfaceMetrics, getOceanWaveScale } from './oceanVisualConfig';

describe('oceanVisualConfig', () => {
	it('resolves centered ocean mesh metrics from world bounds', () => {
		const metrics = getOceanSurfaceMetrics(
			{
				maxX: 20,
				maxZ: 14,
				minX: -10,
				minZ: -6,
			},
			-2,
		);

		expect(metrics.width).toBe(30);
		expect(metrics.depth).toBe(20);
		expect(metrics.center.x).toBe(5);
		expect(metrics.center.y).toBe(-2);
		expect(metrics.center.z).toBe(4);
	});

	it('keeps small ocean patches from using over-tight wave frequency', () => {
		expect(getOceanWaveScale(100, 120)).toBe(18);
	});

	it('scales wave frequency with island-sized water surfaces', () => {
		expect(getOceanWaveScale(2800, 2600)).toBeCloseTo(51.85, 2);
	});
});
