import { create } from 'zustand';

export type PlayerStats = {
	hp: number;
	maxHp: number;
	level: number;
	xp: number;
	nextLevelXp: number;
};

export type InventoryState = {
	letters: string[];
	words: string[];
};

export type DiscoveryState = {
	letters: string[];
	words: string[];
};

export type UiState = {
	isInventoryOpen: boolean;
	isTalentTreeOpen: boolean;
};

export type GameState = {
	playerStats: PlayerStats;
	inventory: InventoryState;
	discovery: DiscoveryState;
	ui: UiState;
	collectLetter: (letter: string) => void;
	collectWord: (word: string) => void;
	craftWord: (word: string) => boolean;
	grantXp: (amount: number) => void;
	takeDamage: (amount: number) => void;
	toggleInventory: () => void;
	toggleTalentTree: () => void;
	resetGameState: () => void;
};

export const createInitialPlayerStats = (): PlayerStats => ({
	hp: 100,
	maxHp: 100,
	level: 1,
	xp: 0,
	nextLevelXp: 100,
});

export const createInitialInventory = (): InventoryState => ({
	letters: [],
	words: [],
});

export const createInitialDiscovery = (): DiscoveryState => ({
	letters: [],
	words: [],
});

export const createInitialUiState = (): UiState => ({
	isInventoryOpen: false,
	isTalentTreeOpen: false,
});

export const createInitialGameState = () => ({
	playerStats: createInitialPlayerStats(),
	inventory: createInitialInventory(),
	discovery: createInitialDiscovery(),
	ui: createInitialUiState(),
});

/**
 * Returns whether the inventory contains enough letters to craft the target word.
 *
 * @param {string[]} letters - The currently owned letters.
 * @param {string} word - The requested craft target.
 * @returns {boolean} Whether crafting can succeed.
 */
export const canCraftWord = (letters: string[], word: string): boolean => {
	const normalizedLetters = [...letters];

	for (const character of word.toLowerCase()) {
		const letterIndex = normalizedLetters.indexOf(character);

		if (letterIndex === -1) {
			return false;
		}

		normalizedLetters.splice(letterIndex, 1);
	}

	return true;
};

/**
 * Removes the letters used to craft the target word.
 *
 * @param {string[]} letters - The currently owned letters.
 * @param {string} word - The crafted word.
 * @returns {string[]} The remaining letters after crafting.
 */
export const consumeLettersForWord = (letters: string[], word: string): string[] => {
	const remainingLetters = [...letters];

	for (const character of word.toLowerCase()) {
		const letterIndex = remainingLetters.indexOf(character);

		if (letterIndex !== -1) {
			remainingLetters.splice(letterIndex, 1);
		}
	}

	return remainingLetters;
};

/**
 * Applies XP gain and performs single-level progression when the threshold is reached.
 *
 * @param {PlayerStats} stats - The current player stats.
 * @param {number} amount - The XP to add.
 * @returns {PlayerStats} The updated player stats.
 */
export const applyXpGain = (stats: PlayerStats, amount: number): PlayerStats => {
	const safeAmount = Math.max(0, amount);
	let nextXp = stats.xp + safeAmount;
	let nextLevelXp = stats.nextLevelXp;
	let nextLevel = stats.level;
	let nextMaxHp = stats.maxHp;

	if (nextXp < nextLevelXp) {
		return {
			...stats,
			xp: nextXp,
		};
	}

	while (nextXp >= nextLevelXp) {
		nextXp -= nextLevelXp;
		nextLevel += 1;
		nextMaxHp += 20;
		nextLevelXp = Math.round(nextLevelXp * 1.5);
	}

	return {
		hp: nextMaxHp,
		maxHp: nextMaxHp,
		level: nextLevel,
		xp: nextXp,
		nextLevelXp,
	};
};

export const useGameStore = create<GameState>((set) => ({
	...createInitialGameState(),
	collectLetter: (letter) =>
		set((state) => ({
			discovery: {
				...state.discovery,
				letters: Array.from(new Set([...state.discovery.letters, letter.toLowerCase()])),
			},
			inventory: {
				...state.inventory,
				letters: [...state.inventory.letters, letter.toLowerCase()],
			},
		})),
	collectWord: (word) =>
		set((state) => ({
			discovery: {
				...state.discovery,
				words: Array.from(new Set([...state.discovery.words, word.toLowerCase()])),
			},
			inventory: {
				...state.inventory,
				words: [...state.inventory.words, word.toLowerCase()],
			},
		})),
	craftWord: (word) => {
		const normalizedWord = word.toLowerCase();
		const { inventory } = useGameStore.getState();

		if (!canCraftWord(inventory.letters, normalizedWord)) {
			return false;
		}

		set((state) => ({
			discovery: {
				...state.discovery,
				words: Array.from(new Set([...state.discovery.words, normalizedWord])),
			},
			inventory: {
				letters: consumeLettersForWord(state.inventory.letters, normalizedWord),
				words: [...state.inventory.words, normalizedWord],
			},
		}));

		return true;
	},
	grantXp: (amount) =>
		set((state) => ({
			playerStats: applyXpGain(state.playerStats, amount),
		})),
	takeDamage: (amount) =>
		set((state) => ({
			playerStats: {
				...state.playerStats,
				hp: Math.max(0, state.playerStats.hp - Math.max(0, amount)),
			},
		})),
	toggleInventory: () =>
		set((state) => ({
			ui: {
				...state.ui,
				isInventoryOpen: !state.ui.isInventoryOpen,
				isTalentTreeOpen: false,
			},
		})),
	toggleTalentTree: () =>
		set((state) => ({
			ui: {
				...state.ui,
				isInventoryOpen: false,
				isTalentTreeOpen: !state.ui.isTalentTreeOpen,
			},
		})),
	resetGameState: () =>
		set(() => ({
			...createInitialGameState(),
		})),
}));
