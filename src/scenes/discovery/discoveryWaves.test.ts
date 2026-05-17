import { describe, expect, it } from 'vitest';
import { getCollectiblesForWave } from './discoveryWaves';

describe('discovery waves', () => {
	it('returns starter wave collectibles', () => {
		expect(getCollectiblesForWave('starter').map((collectible) => collectible.letter)).toEqual([
			'a',
			'r',
			'e',
		]);
	});

	it('returns cloned collectible definitions for each request', () => {
		const firstWave = getCollectiblesForWave('ember');
		const secondWave = getCollectiblesForWave('ember');

		firstWave[0].position.x = 999;

		expect(secondWave[0].position.x).not.toBe(999);
	});

	it('supports the grove expansion wave', () => {
		expect(getCollectiblesForWave('grove').map((collectible) => collectible.letter)).toEqual([
			'g',
			'r',
			'o',
			'v',
			'e',
		]);
	});
});
