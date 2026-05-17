import { describe, expect, it } from 'vitest';
import { DISCOVERY_RECIPES, isRecipeUnlocked } from './discoveryRecipes';

describe('discovery recipes', () => {
	it('keeps starter recipes unlocked by default', () => {
		expect(isRecipeUnlocked(DISCOVERY_RECIPES[0], [])).toBe(true);
	});

	it('locks the fire recipe until a starter word is crafted', () => {
		const fireRecipe = DISCOVERY_RECIPES.find((recipe) => recipe.word === 'fire');

		expect(fireRecipe).toBeDefined();

		if (!fireRecipe) {
			throw new Error('Expected fire recipe to exist');
		}

		expect(isRecipeUnlocked(fireRecipe, [])).toBe(false);
		expect(isRecipeUnlocked(fireRecipe, ['ear'])).toBe(true);
	});

	it('locks the grove recipe until fire is crafted', () => {
		const groveRecipe = DISCOVERY_RECIPES.find((recipe) => recipe.word === 'grove');

		expect(groveRecipe).toBeDefined();

		if (!groveRecipe) {
			throw new Error('Expected grove recipe to exist');
		}

		expect(isRecipeUnlocked(groveRecipe, ['ear'])).toBe(false);
		expect(isRecipeUnlocked(groveRecipe, ['fire'])).toBe(true);
	});
});
