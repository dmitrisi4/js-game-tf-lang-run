import type { CollectibleSpawnPoint } from './collectibleTypes';

export const LETTER_PICKUP_RADIUS = 2;

/**
 * Finds the nearest collectible that can be picked up from the current player position.
 *
 * @param {CollectibleSpawnPoint[]} collectibles - Active collectible definitions.
 * @param {{ x: number; y: number; z: number }} playerPosition - Current player position.
 * @param {number} pickupRadius - Maximum interaction distance.
 * @returns {CollectibleSpawnPoint | null} The nearest collectible in range.
 */
export const findNearestCollectibleInRange = (
	collectibles: CollectibleSpawnPoint[],
	playerPosition: { x: number; y: number; z: number },
	pickupRadius = LETTER_PICKUP_RADIUS,
): CollectibleSpawnPoint | null => {
	const pickupRadiusSquared = pickupRadius * pickupRadius;
	let nearestCollectible: CollectibleSpawnPoint | null = null;
	let nearestDistanceSquared = Number.POSITIVE_INFINITY;

	for (const collectible of collectibles) {
		const deltaX = collectible.position.x - playerPosition.x;
		const deltaY = collectible.position.y - playerPosition.y;
		const deltaZ = collectible.position.z - playerPosition.z;
		const distanceSquared = deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;

		if (distanceSquared > pickupRadiusSquared || distanceSquared >= nearestDistanceSquared) {
			continue;
		}

		nearestCollectible = collectible;
		nearestDistanceSquared = distanceSquared;
	}

	return nearestCollectible;
};
