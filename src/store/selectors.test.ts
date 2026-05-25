import { describe, expect, it } from 'vitest';
import {
	selectDiscoveredLetters,
	selectDiscoveredWords,
	selectInventory,
	selectInventoryLetters,
	selectInventoryWords,
	selectIsInventoryOpen,
	selectIsTalentTreeOpen,
	selectPlayerHp,
	selectPlayerNextLevelXp,
	selectPlayerStats,
	selectPlayerXp,
	selectUiState,
} from './selectors';
import { createInitialGameState } from './useGameStore';

describe('store selectors', () => {
	it('returns the expected state slices', () => {
		const state = createInitialGameState();

		expect(selectPlayerStats({ ...state } as never)).toEqual(state.playerStats);
		expect(selectInventory({ ...state } as never)).toEqual(state.inventory);
		expect(selectUiState({ ...state } as never)).toEqual(state.ui);
	});

	it('returns focused inventory and player values', () => {
		const state = {
			...createInitialGameState(),
			playerStats: {
				hp: 75,
				maxHp: 100,
				level: 2,
				xp: 15,
				nextLevelXp: 150,
			},
			inventory: {
				letters: ['f', 'i', 'r', 'e'],
				words: ['ember'],
			},
			discovery: {
				letters: ['f', 'i', 'r', 'e'],
				words: ['fire'],
			},
			ui: {
				isInventoryOpen: true,
				isTalentTreeOpen: true,
			},
		};

		expect(selectInventoryLetters(state as never)).toEqual(['f', 'i', 'r', 'e']);
		expect(selectInventoryWords(state as never)).toEqual(['ember']);
		expect(selectDiscoveredLetters(state as never)).toEqual(['f', 'i', 'r', 'e']);
		expect(selectDiscoveredWords(state as never)).toEqual(['fire']);
		expect(selectIsInventoryOpen(state as never)).toBe(true);
		expect(selectIsTalentTreeOpen(state as never)).toBe(true);
		expect(selectPlayerHp(state as never)).toBe(75);
		expect(selectPlayerXp(state as never)).toBe(15);
		expect(selectPlayerNextLevelXp(state as never)).toBe(150);
	});
});
