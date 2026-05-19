import { describe, expect, it } from 'vitest';

import {
	getPuertoRoadRenderMode,
	getPuertoTerrainMode,
	shouldRenderRoadMeshes,
} from './puertoCityConfig';

describe('puertoCityConfig', () => {
	it('uses the island preview by default', () => {
		expect(getPuertoTerrainMode('?tenerife=1')).toBe('island');
	});

	it('enables the real Puerto terrain with terrain=real', () => {
		expect(getPuertoTerrainMode('?tenerife=1&terrain=real')).toBe('real');
	});

	it('enables the full Tenerife island terrain with terrain=island-full', () => {
		expect(getPuertoTerrainMode('?tenerife=1&terrain=island-full')).toBe('island-full');
	});

	it('defaults road meshes for the legacy island terrain', () => {
		expect(getPuertoRoadRenderMode('island', '?tenerife=1')).toBe('mesh');
		expect(shouldRenderRoadMeshes(getPuertoRoadRenderMode('island', '?tenerife=1'))).toBe(true);
	});

	it('defaults road meshes off for full island terrain until Puerto alignment is implemented', () => {
		expect(getPuertoRoadRenderMode('island-full', '?tenerife=1&terrain=island-full')).toBe('none');
		expect(shouldRenderRoadMeshes(getPuertoRoadRenderMode('island-full'))).toBe(false);
	});

	it('defaults baked roads for the real Puerto terrain', () => {
		expect(getPuertoRoadRenderMode('real', '?tenerife=1&terrain=real')).toBe('baked');
		expect(shouldRenderRoadMeshes(getPuertoRoadRenderMode('real', '?tenerife=1&terrain=real'))).toBe(
			false,
		);
	});

	it('allows both baked texture and mesh roads for comparison', () => {
		expect(getPuertoRoadRenderMode('real', '?tenerife=1&terrain=real&roads=both')).toBe('both');
		expect(shouldRenderRoadMeshes('both')).toBe(true);
	});
});
