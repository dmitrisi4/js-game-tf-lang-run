import { useEffect, useRef, useState } from 'react';
import type { InputAxis2d, PlayerInputCommands } from './inputTypes';
import { createIdleInputCommands, createInputCommandsFromState } from './playerInputUtils';

/**
 * Normalizes raw keyboard and mouse events into semantic player input commands.
 *
 * @returns {PlayerInputCommands} The current semantic input snapshot.
 */
export const usePlayerInput = (isGameplayInputEnabled = true): PlayerInputCommands => {
	const [commands, setCommands] = useState<PlayerInputCommands>(createIdleInputCommands);
	const pressedKeysRef = useRef<Set<string>>(new Set());
	const lastPointerPositionRef = useRef<InputAxis2d | null>(null);
	const isGameplayInputEnabledRef = useRef(isGameplayInputEnabled);

	useEffect(() => {
		isGameplayInputEnabledRef.current = isGameplayInputEnabled;
		setCommands(
			createInputCommandsFromState(
				new Set(pressedKeysRef.current),
				{ x: 0, y: 0 },
				isGameplayInputEnabled,
			),
		);
	}, [isGameplayInputEnabled]);

	useEffect(() => {
		const syncCommands = (look: InputAxis2d = { x: 0, y: 0 }) => {
			setCommands(
				createInputCommandsFromState(
					new Set(pressedKeysRef.current),
					look,
					isGameplayInputEnabledRef.current,
				),
			);
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const normalizedKey = e.key.toLowerCase();
			const normalizedCode = e.code.toLowerCase();

			if (normalizedKey === 'tab') {
				e.preventDefault();
			}

			pressedKeysRef.current.add(normalizedKey);
			pressedKeysRef.current.add(normalizedCode);
			syncCommands();
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			pressedKeysRef.current.delete(e.key.toLowerCase());
			pressedKeysRef.current.delete(e.code.toLowerCase());
			syncCommands();
		};

		const handlePointerMove = (e: PointerEvent) => {
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
