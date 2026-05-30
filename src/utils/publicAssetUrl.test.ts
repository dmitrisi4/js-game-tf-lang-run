import { describe, expect, it } from 'vitest';

import { publicAssetUrl } from './publicAssetUrl';

describe('publicAssetUrl', () => {
	it('keeps root deployment asset URLs absolute', () => {
		expect(publicAssetUrl('/models/environment/island.glb', '/')).toBe(
			'/models/environment/island.glb',
		);
	});

	it('prefixes asset URLs with the Vite deployment base path', () => {
		expect(publicAssetUrl('/textures/waterbump.png', '/js-game-tf-lang-run/')).toBe(
			'/js-game-tf-lang-run/textures/waterbump.png',
		);
	});

	it('normalizes missing slashes while preserving query strings', () => {
		expect(publicAssetUrl('models/hero/player.glb?v=2026-05-30', '/js-game-tf-lang-run')).toBe(
			'/js-game-tf-lang-run/models/hero/player.glb?v=2026-05-30',
		);
	});
});
