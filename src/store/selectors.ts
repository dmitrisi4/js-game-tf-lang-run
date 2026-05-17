import type { GameState } from './useGameStore';

export const selectPlayerStats = (state: GameState) => state.playerStats;
export const selectInventory = (state: GameState) => state.inventory;
export const selectDiscovery = (state: GameState) => state.discovery;
export const selectUiState = (state: GameState) => state.ui;
export const selectInventoryLetters = (state: GameState) => state.inventory.letters;
export const selectInventoryWords = (state: GameState) => state.inventory.words;
export const selectDiscoveredLetters = (state: GameState) => state.discovery.letters;
export const selectDiscoveredWords = (state: GameState) => state.discovery.words;
export const selectIsInventoryOpen = (state: GameState) => state.ui.isInventoryOpen;
export const selectIsTalentTreeOpen = (state: GameState) => state.ui.isTalentTreeOpen;
export const selectPlayerHp = (state: GameState) => state.playerStats.hp;
export const selectPlayerXp = (state: GameState) => state.playerStats.xp;
export const selectPlayerNextLevelXp = (state: GameState) => state.playerStats.nextLevelXp;
