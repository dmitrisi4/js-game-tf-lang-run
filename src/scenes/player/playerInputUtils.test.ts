import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import { resolveCameraRelativeMovement } from './PlayerController';
import {
	createIdleInputCommands,
	createInputCommandsFromState,
	getMoveAxisFromPressedKeys,
} from './playerInputUtils';

describe('player input utils', () => {
	it('creates an idle command snapshot', () => {
		expect(createIdleInputCommands()).toEqual({
			move: { x: 0, y: 0 },
			look: { x: 0, y: 0 },
			jump: false,
			sprint: false,
			interact: false,
			openInventory: false,
			openTalents: false,
		});
	});

	it('normalizes keyboard movement keys into semantic axes', () => {
		const pressedKeys = new Set(['w', 'd']);

		expect(getMoveAxisFromPressedKeys(pressedKeys)).toEqual({
			x: 1,
			y: 1,
		});
	});

	it('creates command state from pressed keys and look input', () => {
		const commands = createInputCommandsFromState(
			new Set(['arrowup', 'e', 'tab', 'shiftleft', 't']),
			{
				x: 12,
				y: -4,
			},
		);

		expect(commands).toEqual({
			move: { x: 0, y: 1 },
			look: { x: 12, y: -4 },
			jump: false,
			sprint: true,
			interact: true,
			openInventory: true,
			openTalents: true,
		});
	});

	it('preserves inventory toggle but suppresses gameplay input when disabled', () => {
		const commands = createInputCommandsFromState(
			new Set(['w', 'e', 'tab', ' ']),
			{
				x: 12,
				y: -4,
			},
			false,
		);

		expect(commands).toEqual({
			move: { x: 0, y: 0 },
			look: { x: 0, y: 0 },
			jump: false,
			sprint: false,
			interact: false,
			openInventory: true,
			openTalents: false,
		});
	});

	it('resolves a normalized camera-relative movement vector', () => {
		const result = resolveCameraRelativeMovement(
			{ x: 1, y: 1 },
			new Vector3(0, 0, 1),
			new Vector3(1, 0, 0),
		);

		expect(result.x).toBeCloseTo(Math.SQRT1_2);
		expect(result.y).toBe(0);
		expect(result.z).toBeCloseTo(Math.SQRT1_2);
	});
});
