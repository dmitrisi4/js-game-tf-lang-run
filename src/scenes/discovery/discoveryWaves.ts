import type { CollectibleSpawnPoint } from './collectibleTypes';

export type DiscoveryWaveId = 'starter' | 'ember' | 'grove';

const DISCOVERY_WAVES: Record<DiscoveryWaveId, CollectibleSpawnPoint[]> = {
	starter: [
		{ id: 'letter-a-01', letter: 'a', position: { x: -1.5, y: 1.2, z: -2 } },
		{ id: 'letter-r-01', letter: 'r', position: { x: -9, y: 1.2, z: 5 } },
		{ id: 'letter-e-01', letter: 'e', position: { x: 5.5, y: 1.2, z: 6 } },
	],
	ember: [
		{ id: 'letter-f-01', letter: 'f', position: { x: -6, y: 1.2, z: -18 } },
		{ id: 'letter-i-01', letter: 'i', position: { x: 2.5, y: 1.2, z: -23 } },
		{ id: 'letter-r-02', letter: 'r', position: { x: 14, y: 1.2, z: -13 } },
		{ id: 'letter-e-02', letter: 'e', position: { x: 24, y: 1.2, z: -6 } },
	],
	grove: [
		{ id: 'letter-g-01', letter: 'g', position: { x: -17, y: 1.2, z: 24 } },
		{ id: 'letter-r-03', letter: 'r', position: { x: -4, y: 1.2, z: 33 } },
		{ id: 'letter-o-01', letter: 'o', position: { x: 9, y: 1.2, z: 30 } },
		{ id: 'letter-v-01', letter: 'v', position: { x: 17, y: 1.2, z: 23 } },
		{ id: 'letter-e-03', letter: 'e', position: { x: 26, y: 1.2, z: 15 } },
	],
};

export const getCollectiblesForWave = (waveId: DiscoveryWaveId): CollectibleSpawnPoint[] =>
	DISCOVERY_WAVES[waveId].map((collectible) => ({
		...collectible,
		position: { ...collectible.position },
	}));
