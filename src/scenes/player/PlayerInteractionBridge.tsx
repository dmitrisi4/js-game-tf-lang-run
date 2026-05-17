import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type React from 'react';
import { useEffect, useRef } from 'react';
import type { CollectibleSpawnPoint } from '@/scenes/discovery/collectibleTypes';
import { findNearestCollectibleInRange } from '@/scenes/discovery/collectibleUtils';
import { useGameStore } from '@/store/useGameStore';
import type { PlayerInputCommands } from './inputTypes';

type PropsType = {
	collectibles: CollectibleSpawnPoint[];
	commands: PlayerInputCommands;
	playerMesh: Mesh | null;
	onCollect: (collectibleId: string) => void;
};

/**
 * Bridges semantic interaction input into the discovery loop.
 *
 * @param {PropsType} props - Interaction bridge props.
 * @returns {null} This component does not render scene nodes.
 */
const PlayerInteractionBridge: React.FC<PropsType> = ({
	collectibles,
	commands,
	playerMesh,
	onCollect,
}) => {
	const collectLetter = useGameStore((state) => state.collectLetter);
	const grantXp = useGameStore((state) => state.grantXp);
	const previousInteractIntentRef = useRef(false);

	useEffect(() => {
		if (!commands.interact || previousInteractIntentRef.current || !playerMesh) {
			previousInteractIntentRef.current = commands.interact;
			return;
		}

		const collectible = findNearestCollectibleInRange(collectibles, playerMesh.absolutePosition);

		if (collectible) {
			collectLetter(collectible.letter);
			grantXp(10);
			onCollect(collectible.id);
		}

		previousInteractIntentRef.current = commands.interact;
	}, [collectLetter, collectibles, commands.interact, grantXp, onCollect, playerMesh]);

	useEffect(() => {
		if (commands.interact) {
			return;
		}

		previousInteractIntentRef.current = false;
	}, [commands.interact]);

	return null;
};

export default PlayerInteractionBridge;
