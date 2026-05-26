import { describe, expect, it } from 'vitest';

import {
	getOceanMaterialConfig,
	getOceanSurfaceMetrics,
	getOceanWaveScale,
	getShorelineDepthGradientConfig,
	getShorelineSandSlopeConfig,
	getShorelineSurfConfig,
} from './oceanVisualConfig';

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

	it('resolves bounded water material waves for island-sized surfaces', () => {
		const config = getOceanMaterialConfig(2800, 2600);

		expect(config.waveHeight).toBeLessThanOrEqual(0.72);
		expect(config.waveHeight).toBeGreaterThan(0.18);
		expect(config.waveLength).toBeCloseTo(37.33, 2);
		expect(config.waveCount).toBeGreaterThan(12);
		expect(config.colorBlendFactor).toBeLessThan(config.colorBlendFactor2);
		expect(config.colorBlendFactor2).toBeGreaterThanOrEqual(0.68);
	});

	it('resolves a shoreline depth ramp inside the ocean footprint', () => {
		const config = getShorelineDepthGradientConfig(2800, 2600);

		expect(config.edgeRadiusX).toBeLessThan(1400);
		expect(config.edgeRadiusZ).toBeLessThan(1300);
		expect(config.foamWidth).toBeGreaterThan(20);
		expect(config.shallowEnd).toBeGreaterThan(config.foamWidth);
		expect(config.deepStart).toBeGreaterThan(config.shallowEnd);
	});

	it('resolves animated surf bands inside the shallow-water zone', () => {
		const depthConfig = getShorelineDepthGradientConfig(2800, 2600);
		const surfConfig = getShorelineSurfConfig(2800, 2600);

		expect(surfConfig.edgeRadiusX).toBe(depthConfig.edgeRadiusX);
		expect(surfConfig.edgeRadiusZ).toBe(depthConfig.edgeRadiusZ);
		expect(surfConfig.bandSpacing).toBeGreaterThan(20);
		expect(surfConfig.surfWidth).toBeGreaterThan(surfConfig.bandSpacing);
		expect(surfConfig.surfWidth).toBeLessThan(depthConfig.shallowEnd);
		expect(surfConfig.retreatSpeed).toBeGreaterThan(0);
	});

	it('resolves a sandy underwater slope inside the shallow-water zone', () => {
		const depthConfig = getShorelineDepthGradientConfig(2800, 2600);
		const sandConfig = getShorelineSandSlopeConfig(2800, 2600);

		expect(sandConfig.beachInset).toBeGreaterThan(80);
		expect(sandConfig.slopeWidth).toBeGreaterThan(sandConfig.beachInset);
		expect(sandConfig.slopeWidth).toBeLessThan(depthConfig.shallowEnd);
		expect(sandConfig.underwaterDrop).toBeGreaterThan(0);
		expect(sandConfig.maxSegmentLength).toBeGreaterThan(sandConfig.slopeWidth);
	});
});
