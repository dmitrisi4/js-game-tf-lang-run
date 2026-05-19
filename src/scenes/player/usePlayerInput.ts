import { useEffect, useRef, useState } from 'react';
import type { InputAxis2d, PlayerInputCommands } from './inputTypes';
import { createIdleInputCommands, createInputCommandsFromState } from './playerInputUtils';

/** Checks whether two two-dimensional input axes contain the same values. */
const areInputAxesEqual = (left: InputAxis2d, right: InputAxis2d): boolean =>
	left.x === right.x && left.y === right.y;

/** Checks whether two command snapshots are equivalent enough to skip React state work. */
const arePlayerInputCommandsEqual = (
	left: PlayerInputCommands,
	right: PlayerInputCommands,
): boolean =>
	areInputAxesEqual(left.move, right.move) &&
	areInputAxesEqual(left.look, right.look) &&
	left.jump === right.jump &&
	left.sprint === right.sprint &&
	left.interact === right.interact &&
	left.openInventory === right.openInventory &&
	left.openTalents === right.openTalents;

/**
 * Normalizes raw keyboard and mouse events into semantic player input commands.
 *
 * @param {boolean} isGameplayInputEnabled - Whether gameplay actions should be emitted.
 * @param {boolean} shouldPublishLookInput - Whether pointer movement should update command state.
 * @returns {PlayerInputCommands} The current semantic input snapshot.
 */
export const usePlayerInput = (
	isGameplayInputEnabled = true,
	shouldPublishLookInput = true,
): PlayerInputCommands => {
	const [commands, setCommands] = useState<PlayerInputCommands>(createIdleInputCommands);
	const pressedKeysRef = useRef<Set<string>>(new Set());
	const lastPointerPositionRef = useRef<InputAxis2d | null>(null);
	const isGameplayInputEnabledRef = useRef(isGameplayInputEnabled);
	const shouldPublishLookInputRef = useRef(shouldPublishLookInput);

	useEffect(() => {
		isGameplayInputEnabledRef.current = isGameplayInputEnabled;
		shouldPublishLookInputRef.current = shouldPublishLookInput;
		setCommands((currentCommands) => {
			const nextCommands = createInputCommandsFromState(
				new Set(pressedKeysRef.current),
				{ x: 0, y: 0 },
				isGameplayInputEnabled,
			);

			return arePlayerInputCommandsEqual(currentCommands, nextCommands)
				? currentCommands
				: nextCommands;
		});
	}, [isGameplayInputEnabled, shouldPublishLookInput]);

	useEffect(() => {
		const syncCommands = (look: InputAxis2d = { x: 0, y: 0 }) => {
			setCommands((currentCommands) => {
				const nextCommands = createInputCommandsFromState(
					new Set(pressedKeysRef.current),
					look,
					isGameplayInputEnabledRef.current,
				);

				return arePlayerInputCommandsEqual(currentCommands, nextCommands)
					? currentCommands
					: nextCommands;
			});
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const normalizedKey = e.key.toLowerCase();
			const normalizedCode = e.code.toLowerCase();
			const hadNormalizedKey = pressedKeysRef.current.has(normalizedKey);
			const hadNormalizedCode = normalizedCode ? pressedKeysRef.current.has(normalizedCode) : true;

			if (normalizedKey === 'tab') {
				e.preventDefault();
			}

			if (hadNormalizedKey && hadNormalizedCode) {
				return;
			}

			pressedKeysRef.current.add(normalizedKey);
			if (normalizedCode) {
				pressedKeysRef.current.add(normalizedCode);
			}
			syncCommands();
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			const didDeleteKey = pressedKeysRef.current.delete(e.key.toLowerCase());
			const didDeleteCode = pressedKeysRef.current.delete(e.code.toLowerCase());

			if (!didDeleteKey && !didDeleteCode) {
				return;
			}

			syncCommands();
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (!shouldPublishLookInputRef.current) {
				return;
			}

			const previousPointerPosition = lastPointerPositionRef.current;
			const fallbackDelta = previousPointerPosition
				? {
						x: e.clientX - previousPointerPosition.x,
						y: e.clientY - previousPointerPosition.y,
					}
				: { x: 0, y: 0 };
			const look = {
				x: e.movementX || fallbackDelta.x,
				y: e.movementY || fallbackDelta.y,
			};
			lastPointerPositionRef.current = { x: e.clientX, y: e.clientY };

			syncCommands(look);
			requestAnimationFrame(() => {
				syncCommands();
			});
		};

		const resetTransientState = () => {
			pressedKeysRef.current.clear();
			lastPointerPositionRef.current = null;
			syncCommands();
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('blur', resetTransientState);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('blur', resetTransientState);
		};
	}, []);

	return commands;
};
