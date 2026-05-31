import { describe, expect, it } from 'vitest';
import {
	resolvePlayerAnimationState,
	selectPlayerAnimationGroup,
	shouldRecoverFromCompletedJumpAnimation,
} from './playerAnimationRegistry';

const animationGroups = [
	{ name: 'Idle_Loop' },
	{ name: 'WalkForward' },
	{ name: 'Run_Fast' },
	{ name: 'Jump_Start' },
];

describe('playerAnimationRegistry', () => {
	it('resolves controller flags into high-level animation states', () => {
		expect(
			resolvePlayerAnimationState({
				hasPendingJumpAnimationRequest: false,
				isAirborne: false,
				isMoving: false,
				isSprinting: false,
				useImportedLocomotionAnimation: true,
			}),
		).toBe('idle');
		expect(
			resolvePlayerAnimationState({
				hasPendingJumpAnimationRequest: false,
				isAirborne: false,
				isMoving: true,
				isSprinting: false,
				useImportedLocomotionAnimation: true,
			}),
		).toBe('walk');
		expect(
			resolvePlayerAnimationState({
				hasPendingJumpAnimationRequest: false,
				isAirborne: false,
				isMoving: true,
				isSprinting: true,
				useImportedLocomotionAnimation: true,
			}),
		).toBe('sprint');
		expect(
			resolvePlayerAnimationState({
				hasPendingJumpAnimationRequest: true,
				isAirborne: false,
				isMoving: true,
				isSprinting: true,
				useImportedLocomotionAnimation: true,
			}),
		).toBe('jump');
	});

	it('falls back to idle when imported locomotion is disabled', () => {
		expect(
			resolvePlayerAnimationState({
				hasPendingJumpAnimationRequest: false,
				isAirborne: false,
				isMoving: true,
				isSprinting: true,
				useImportedLocomotionAnimation: false,
			}),
		).toBe('idle');
	});

	it('selects current Pumpkinboy-style clips by state patterns', () => {
		expect(selectPlayerAnimationGroup(animationGroups, 'idle')?.name).toBe('Idle_Loop');
		expect(selectPlayerAnimationGroup(animationGroups, 'walk')?.name).toBe('WalkForward');
		expect(selectPlayerAnimationGroup(animationGroups, 'sprint')?.name).toBe('Run_Fast');
		expect(selectPlayerAnimationGroup(animationGroups, 'jump')?.name).toBe('Jump_Start');
	});

	it('uses a deterministic first-group fallback when no pattern matches', () => {
		const unknownGroups = [{ name: 'Clip_A' }, { name: 'Clip_B' }];

		expect(selectPlayerAnimationGroup(unknownGroups, 'idle')?.name).toBe('Clip_A');
		expect(selectPlayerAnimationGroup([], 'idle')).toBeNull();
	});

	it('recovers from a completed one-shot jump when already grounded', () => {
		expect(
			shouldRecoverFromCompletedJumpAnimation({
				activeState: 'jump',
				completedState: 'jump',
				isAirborne: false,
			}),
		).toBe(true);
		expect(
			shouldRecoverFromCompletedJumpAnimation({
				activeState: 'jump',
				completedState: 'jump',
				isAirborne: true,
			}),
		).toBe(false);
		expect(
			shouldRecoverFromCompletedJumpAnimation({
				activeState: 'walk',
				completedState: 'jump',
				isAirborne: false,
			}),
		).toBe(false);
	});
});
