// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlayerInput } from './usePlayerInput';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('usePlayerInput', () => {
	it('maps keyboard state into semantic movement input', () => {
		const { result } = renderHook(() => usePlayerInput());

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
		});

		expect(result.current.move).toEqual({ x: 1, y: 1 });

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));
		});

		expect(result.current.move).toEqual({ x: 0, y: 0 });
	});

	it('ignores repeated keydown events that do not change keyboard state', () => {
		const { result } = renderHook(() => usePlayerInput());

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', code: 'KeyW' }));
		});

		const firstMovingCommands = result.current;

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w', repeat: true }));
		});

		expect(result.current).toBe(firstMovingCommands);
		expect(result.current.move).toEqual({ x: 0, y: 1 });
	});

	it('maps left shift into sprint input', () => {
		const { result } = renderHook(() => usePlayerInput());

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' }));
		});

		expect(result.current.sprint).toBe(true);

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift', code: 'ShiftLeft' }));
		});

		expect(result.current.sprint).toBe(false);
	});

	it('maps t into talent tree input', () => {
		const { result } = renderHook(() => usePlayerInput());

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', code: 'KeyT' }));
		});

		expect(result.current.openTalents).toBe(true);

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keyup', { key: 't', code: 'KeyT' }));
		});

		expect(result.current.openTalents).toBe(false);
	});

	it('clears pressed keys on window blur', () => {
		const { result } = renderHook(() => usePlayerInput());

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
		});

		expect(result.current.openInventory).toBe(true);

		act(() => {
			window.dispatchEvent(new Event('blur'));
		});

		expect(result.current.openInventory).toBe(false);
	});

	it('publishes a transient look delta from pointer movement', () => {
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			return window.setTimeout(() => cb(0), 0);
		});
		vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
			window.clearTimeout(handle);
		});

		const { result } = renderHook(() => usePlayerInput());

		act(() => {
			window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 20 }));
			window.dispatchEvent(
				new PointerEvent('pointermove', {
					clientX: 18,
					clientY: 17,
					movementX: 8,
					movementY: -3,
				}),
			);
		});

		expect(result.current.look).toEqual({ x: 8, y: -3 });
	});

	it('can skip pointer look updates when camera owns pointer movement', () => {
		const { result } = renderHook(() => usePlayerInput(true, false));

		act(() => {
			window.dispatchEvent(
				new PointerEvent('pointermove', {
					clientX: 18,
					clientY: 17,
					movementX: 8,
					movementY: -3,
				}),
			);
		});

		expect(result.current.look).toEqual({ x: 0, y: 0 });
	});
});
