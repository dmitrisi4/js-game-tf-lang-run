import type { InputAxis2d, PlayerInputCommands } from './inputTypes';

export const createIdleInputCommands = (): PlayerInputCommands => ({
	move: { x: 0, y: 0 },
	look: { x: 0, y: 0 },
	jump: false,
	sprint: false,
	interact: false,
	openInventory: false,
	openTalents: false,
});

const hasKey = (pressedKeys: Set<string>, ...keys: string[]): boolean => {
	return keys.some((key) => pressedKeys.has(key.toLowerCase()));
};

export const getMoveAxisFromPressedKeys = (pressedKeys: Set<string>): InputAxis2d => {
	const left = hasKey(pressedKeys, 'a', 'arrowleft');
	const right = hasKey(pressedKeys, 'd', 'arrowright');
	const forward = hasKey(pressedKeys, 'w', 'arrowup');
	const backward = hasKey(pressedKeys, 's', 'arrowdown');

	return {
		x: Number(right) - Number(left),
		y: Number(forward) - Number(backward),
	};
};

export const createInputCommandsFromState = (
	pressedKeys: Set<string>,
	look: InputAxis2d,
	isGameplayInputEnabled = true,
): PlayerInputCommands => {
	const openInventory = hasKey(pressedKeys, 'tab');
	const openTalents = hasKey(pressedKeys, 't');

	if (!isGameplayInputEnabled) {
		return {
			...createIdleInputCommands(),
			openInventory,
			openTalents,
		};
	}

	return {
		move: getMoveAxisFromPressedKeys(pressedKeys),
		look,
		jump: hasKey(pressedKeys, ' '),
		sprint: hasKey(pressedKeys, 'shiftleft'),
		interact: hasKey(pressedKeys, 'e'),
		openInventory,
		openTalents,
	};
};
