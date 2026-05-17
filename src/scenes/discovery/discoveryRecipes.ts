export type DiscoveryRecipe = {
	id: string;
	word: string;
	xpReward: number;
	requiredAnyOfWords?: string[];
};

export const STARTER_DISCOVERY_WORDS = ['are', 'ear', 'era'] as const;

export const DISCOVERY_RECIPES: DiscoveryRecipe[] = [
	{ id: 'starter-are', word: 'are', xpReward: 25 },
	{ id: 'starter-ear', word: 'ear', xpReward: 20 },
	{ id: 'starter-era', word: 'era', xpReward: 20 },
	{
		id: 'ember-fire',
		word: 'fire',
		xpReward: 45,
		requiredAnyOfWords: [...STARTER_DISCOVERY_WORDS],
	},
	{
		id: 'grove-grove',
		word: 'grove',
		xpReward: 70,
		requiredAnyOfWords: ['fire'],
	},
];

export const isRecipeUnlocked = (recipe: DiscoveryRecipe, craftedWords: string[]): boolean =>
	!recipe.requiredAnyOfWords ||
	recipe.requiredAnyOfWords.some((word) => craftedWords.includes(word));
