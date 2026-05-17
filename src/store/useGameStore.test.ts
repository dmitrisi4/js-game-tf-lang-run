import { afterEach, describe, expect, it } from 'vitest';
import {
	applyXpGain,
	canCraftWord,
	consumeLettersForWord,
	createInitialGameState,
	useGameStore,
} from './useGameStore';

const resetStore = () => {
	useGameStore.getState().resetGameState();
};

afterEach(() => {
	resetStore();
});

describe('useGameStore', () => {
	it('starts with the expected gameplay defaults', () => {
		const state = useGameStore.getState();

		expect(state.playerStats).toEqual(createInitialGameState().playerStats);
		expect(state.inventory).toEqual(createInitialGameState().inventory);
		expect(state.discovery).toEqual(createInitialGameState().discovery);
		expect(state.ui).toEqual(createInitialGameState().ui);
	});

	it('collects letters into inventory', () => {
		useGameStore.getState().collectLetter('A');
		useGameStore.getState().collectLetter('b');

		expect(useGameStore.getState().inventory.letters).toEqual(['a', 'b']);
		expect(useGameStore.getState().discovery.letters).toEqual(['a', 'b']);
	});

	it('collects full words into inventory', () => {
		useGameStore.getState().collectWord('Flame');

		expect(useGameStore.getState().inventory.words).toEqual(['flame']);
		expect(useGameStore.getState().discovery.words).toEqual(['flame']);
	});

	it('crafts a word only when enough letters are available', () => {
		useGameStore.getState().collectLetter('f');
		useGameStore.getState().collectLetter('i');
		useGameStore.getState().collectLetter('r');
		useGameStore.getState().collectLetter('e');

		expect(useGameStore.getState().craftWord('fire')).toBe(true);
		expect(useGameStore.getState().inventory.letters).toEqual([]);
		expect(useGameStore.getState().inventory.words).toEqual(['fire']);
		expect(useGameStore.getState().discovery.letters).toEqual(['f', 'i', 'r', 'e']);
		expect(useGameStore.getState().discovery.words).toEqual(['fire']);
	});

	it('rejects crafting when letters are missing', () => {
		useGameStore.getState().collectLetter('f');
		useGameStore.getState().collectLetter('i');

		expect(useGameStore.getState().craftWord('fire')).toBe(false);
		expect(useGameStore.getState().inventory.words).toEqual([]);
	});

	it('applies damage without dropping hp below zero', () => {
		useGameStore.getState().takeDamage(30);
		useGameStore.getState().takeDamage(999);

		expect(useGameStore.getState().playerStats.hp).toBe(0);
	});

	it('toggles inventory visibility', () => {
		useGameStore.getState().toggleInventory();
		expect(useGameStore.getState().ui.isInventoryOpen).toBe(true);

		useGameStore.getState().toggleInventory();
		expect(useGameStore.getState().ui.isInventoryOpen).toBe(false);
	});

	it('toggles talent tree visibility and closes inventory', () => {
		useGameStore.getState().toggleInventory();
		useGameStore.getState().toggleTalentTree();

		expect(useGameStore.getState().ui.isInventoryOpen).toBe(false);
		expect(useGameStore.getState().ui.isTalentTreeOpen).toBe(true);
	});
});

describe('gameplay helpers', () => {
	it('detects whether a word can be crafted from letters', () => {
		expect(canCraftWord(['f', 'i', 'r', 'e'], 'fire')).toBe(true);
		expect(canCraftWord(['f', 'i', 'r'], 'fire')).toBe(false);
		expect(canCraftWord(['a', 'a', 'b'], 'aba')).toBe(true);
	});

	it('consumes only the letters used by the crafted word', () => {
		expect(consumeLettersForWord(['a', 'b', 'a', 'c'], 'aba')).toEqual(['c']);
	});

	it('levels up when xp crosses the threshold', () => {
		const leveled = applyXpGain(
			{
				hp: 100,
				maxHp: 100,
				level: 1,
				xp: 90,
				nextLevelXp: 100,
			},
			20,
		);

		expect(leveled.level).toBe(2);
		expect(leveled.maxHp).toBe(120);
		expect(leveled.hp).toBe(120);
		expect(leveled.xp).toBe(10);
		expect(leveled.nextLevelXp).toBe(150);
	});

	it('can apply multiple level-ups from one large xp gain', () => {
		const leveled = applyXpGain(
			{
				hp: 100,
				maxHp: 100,
				level: 1,
				xp: 90,
				nextLevelXp: 100,
			},
			300,
		);

		expect(leveled.level).toBe(3);
		expect(leveled.maxHp).toBe(140);
		expect(leveled.hp).toBe(140);
		expect(leveled.xp).toBe(140);
		expect(leveled.nextLevelXp).toBe(225);
	});
});
