import { describe, expect, it } from 'vitest';
import {
	getTenerifeRoadOverlayMeshName,
	isTenerifeRoadOverlayMeshName,
	isTenerifeRoadVisualSupportMeshName,
} from './tenerifeRoadMeshNames';

describe('tenerife road mesh names', () => {
	it('publishes stable overlay mesh names for runtime roads', () => {
		expect(getTenerifeRoadOverlayMeshName('main', 'surface')).toBe('tenerife-geo-roads-main-surface');
		expect(isTenerifeRoadOverlayMeshName('tenerife-geo-roads-service-shoulder')).toBe(true);
		expect(isTenerifeRoadOverlayMeshName('ground1')).toBe(false);
	});

	it('keeps centerline decorations out of visual foot support', () => {
		expect(isTenerifeRoadVisualSupportMeshName('tenerife-geo-roads-main-surface')).toBe(true);
		expect(isTenerifeRoadVisualSupportMeshName('tenerife-geo-roads-main-shoulder')).toBe(true);
		expect(isTenerifeRoadVisualSupportMeshName('tenerife-geo-roads-main-centerline')).toBe(false);
	});
});
