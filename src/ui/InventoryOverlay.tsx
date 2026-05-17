import type React from 'react';
import { DISCOVERY_RECIPES, isRecipeUnlocked } from '@/scenes/discovery/discoveryRecipes';
import {
	selectInventoryLetters,
	selectInventoryWords,
	selectIsInventoryOpen,
} from '@/store/selectors';
import { canCraftWord, useGameStore } from '@/store/useGameStore';
import './gameHud.css';

const getWordRuneItems = (recipeId: string, word: string) => {
	const occurrenceCounts: Record<string, number> = {};

	return word.split('').map((letter) => {
		occurrenceCounts[letter] = (occurrenceCounts[letter] ?? 0) + 1;

		return {
			id: `${recipeId}-${letter}-${occurrenceCounts[letter]}`,
			letter,
		};
	});
};

/**
 * Renders the first real inventory overlay with craftable discovery recipes.
 *
 * @returns {JSX.Element | null} The inventory overlay when open.
 */
const InventoryOverlay: React.FC = () => {
	const isInventoryOpen = useGameStore(selectIsInventoryOpen);
	const letters = useGameStore(selectInventoryLetters);
	const words = useGameStore(selectInventoryWords);
	const craftWord = useGameStore((state) => state.craftWord);
	const grantXp = useGameStore((state) => state.grantXp);
	const letterCounts = letters.reduce<Record<string, number>>((counts, letter) => {
		counts[letter] = (counts[letter] ?? 0) + 1;
		return counts;
	}, {});
	const letterItems = Object.entries(letterCounts).map(([letter, count]) => ({
		id: `letter-${letter}`,
		kind: 'letter',
		label: letter.toUpperCase(),
		count,
	}));
	const wordItems = words.map((word) => ({
		id: `word-${word}`,
		kind: 'word',
		label: word.toUpperCase(),
		count: 1,
	}));
	const inventoryItems = [...letterItems, ...wordItems];
	const inventorySlots = Array.from({ length: Math.max(24, inventoryItems.length) }, (_, index) => ({
		id: `slot-${index}`,
		item: inventoryItems[index] ?? null,
	}));

	if (!isInventoryOpen) {
		return null;
	}

	return (
		<div className='inventory-overlay'>
			<div className='inventory-backdrop' />
			<section className='inventory-panel'>
				<header className='inventory-header'>
					<div>
						<p className='inventory-eyebrow'>Inventory</p>
						<h2>Satchel</h2>
					</div>
					<div className='inventory-gold-readout'>
						<span>Letters</span>
						<strong>{letters.length}</strong>
					</div>
				</header>

				<div className='inventory-layout'>
					<section className='inventory-character-pane'>
						<div className='inventory-portrait-frame'>
							<div className='inventory-portrait-rune'>K</div>
						</div>
						<div className='inventory-equipment-grid'>
							{['Head', 'Charm', 'Core', 'Word', 'Relic', 'Boots'].map((slot) => (
								<div className='inventory-equipment-slot' key={slot}>
									<span>{slot}</span>
								</div>
							))}
						</div>
						<div className='inventory-stat-list'>
							<div>
								<span>Words</span>
								<strong>{words.length}</strong>
							</div>
							<div>
								<span>Recipes</span>
								<strong>{DISCOVERY_RECIPES.length}</strong>
							</div>
						</div>
					</section>

					<section className='inventory-bag-pane'>
						<div className='inventory-pane-header'>
							<p className='inventory-section-title'>Bag</p>
							<span>{inventoryItems.length}/{inventorySlots.length}</span>
						</div>
						<div className='inventory-slot-grid'>
							{inventorySlots.map(({ id, item }) => (
								<div
									className={`inventory-item-slot${item ? ` inventory-item-slot-${item.kind}` : ''}`}
									key={id}
								>
									{item ? (
										<>
											<strong>{item.label}</strong>
											{item.count > 1 ? <span>x{item.count}</span> : null}
										</>
									) : null}
								</div>
							))}
						</div>
					</section>

					<section className='inventory-codex-pane'>
						<div className='inventory-pane-header'>
							<p className='inventory-section-title'>Codex</p>
							<span>{words.length} forged</span>
						</div>

						<div className='inventory-recipes-list'>
							{DISCOVERY_RECIPES.map((recipe) => {
								const alreadyCrafted = words.includes(recipe.word);
								const canCraftRecipe = canCraftWord(letters, recipe.word);
								const isUnlocked = isRecipeUnlocked(recipe, words);
								const runeItems = getWordRuneItems(recipe.id, recipe.word);

								return (
									<div
										className={`inventory-recipe-card${!isUnlocked ? ' inventory-recipe-card-locked' : ''}`}
										key={recipe.id}
									>
										<div className='inventory-recipe-meta'>
											<div>
												<p className='inventory-recipe-word'>{recipe.word.toUpperCase()}</p>
												<p className='inventory-recipe-reward'>+{recipe.xpReward} XP</p>
											</div>
											<span className='inventory-recipe-status'>
												{alreadyCrafted
													? 'Crafted'
													: !isUnlocked
														? 'Locked'
														: canCraftRecipe
															? 'Ready'
															: 'Missing'}
											</span>
										</div>
										<div className='inventory-recipe-runes'>
											{runeItems.map(({ id, letter }) => (
												<span key={id}>{letter.toUpperCase()}</span>
											))}
										</div>
										<button
											className='inventory-recipe-button'
											disabled={!isUnlocked || !canCraftRecipe || alreadyCrafted}
											onClick={() => {
												if (!isUnlocked || !canCraftRecipe || alreadyCrafted) {
													return;
												}

												if (craftWord(recipe.word)) {
													grantXp(recipe.xpReward);
												}
											}}
											type='button'
										>
											{alreadyCrafted
												? 'Completed'
												: !isUnlocked
													? 'Sealed'
													: `Forge ${recipe.word.toUpperCase()}`}
										</button>
									</div>
								);
							})}
						</div>
					</section>
				</div>
			</section>
		</div>
	);
};

export default InventoryOverlay;
