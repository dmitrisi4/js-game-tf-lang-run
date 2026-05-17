import type React from 'react';
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import type { PlayerInputCommands } from './inputTypes';

type PropsType = {
	commands: PlayerInputCommands;
};

/**
 * Bridges semantic input into the current prototype gameplay state.
 *
 * This keeps input handling out of `MainScene` while providing a real
 * integration point for the current scene even before the full player
 * controller is implemented.
 *
 * @returns {null} This component does not render scene nodes.
 */
const PlayerInputBridge: React.FC<PropsType> = ({ commands }) => {
	const toggleInventory = useGameStore((state) => state.toggleInventory);
	const toggleTalentTree = useGameStore((state) => state.toggleTalentTree);
	const previousInventoryIntentRef = useRef(false);
	const previousTalentTreeIntentRef = useRef(false);

	useEffect(() => {
		if (commands.openInventory && !previousInventoryIntentRef.current) {
			toggleInventory();
		}

		previousInventoryIntentRef.current = commands.openInventory;
	}, [commands.openInventory, toggleInventory]);

	useEffect(() => {
		if (commands.openTalents && !previousTalentTreeIntentRef.current) {
			toggleTalentTree();
		}

		previousTalentTreeIntentRef.current = commands.openTalents;
	}, [commands.openTalents, toggleTalentTree]);

	return null;
};

export default PlayerInputBridge;
