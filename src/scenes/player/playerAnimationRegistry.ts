export type PlayerAnimationStateType = 'idle' | 'jump' | 'sprint' | 'walk';

export type PlayerAnimationGroupLikeType = {
	name: string;
};

export type PlayerAnimationStateInputType = {
	hasPendingJumpAnimationRequest: boolean;
	isAirborne: boolean;
	isMoving: boolean;
	isSprinting: boolean;
	useImportedLocomotionAnimation: boolean;
};

const PLAYER_ANIMATION_PATTERNS: Record<PlayerAnimationStateType, string[]> = {
	idle: ['idle'],
	jump: ['jump'],
	sprint: ['sprint', 'run'],
	walk: ['walk', 'move', 'run'],
};

/** Resolves the desired high-level player animation state from controller flags. */
export const resolvePlayerAnimationState = ({
	hasPendingJumpAnimationRequest,
	isAirborne,
	isMoving,
	isSprinting,
	useImportedLocomotionAnimation,
}: PlayerAnimationStateInputType): PlayerAnimationStateType => {
	if (isAirborne || hasPendingJumpAnimationRequest) {
		return 'jump';
	}

	if (isSprinting && useImportedLocomotionAnimation) {
		return 'sprint';
	}

	if (isMoving && useImportedLocomotionAnimation) {
		return 'walk';
	}

	return 'idle';
};

/** Selects the best imported animation group for a player animation state. */
export const selectPlayerAnimationGroup = <AnimationGroupType extends PlayerAnimationGroupLikeType>(
	animationGroups: AnimationGroupType[],
	state: PlayerAnimationStateType,
): AnimationGroupType | null => {
	const patterns = PLAYER_ANIMATION_PATTERNS[state];
	const targetAnimation =
		animationGroups.find((animationGroup) => {
			const normalizedName = animationGroup.name.toLowerCase();

			return patterns.some((pattern) => normalizedName.includes(pattern));
		}) ?? null;

	return targetAnimation ?? animationGroups[0] ?? null;
};
