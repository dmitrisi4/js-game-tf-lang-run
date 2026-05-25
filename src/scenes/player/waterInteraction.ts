import { PLAYER_CAPSULE_HALF_HEIGHT } from './playerCapsuleMetrics';

export type PlayerWaterStateType = {
	depthAtFeet: number;
	isInWater: boolean;
	swimCenterY: number;
	visualAnchorY: number;
};

export type PlayerWaterStateInputType = {
	floorY: number;
	timeSeconds?: number;
	waterSurfaceY: number;
};

const WATER_ENTRY_DEPTH_THRESHOLD = 0.28;
const WATER_SURFACE_CENTER_OFFSET = PLAYER_CAPSULE_HALF_HEIGHT * 0.34;
const WATER_VISUAL_SUBMERGE_DEPTH = 0.95;
const WATER_BOB_AMPLITUDE = 0.045;
const WATER_BOB_SPEED = 2.4;
export const PLAYER_WATER_ENTRY_MOVE_SPEED_MULTIPLIER = 0.16;
export const PLAYER_WATER_MOVE_SPEED_MULTIPLIER = 0.3;

/** Resolves whether the player should use water movement at the current floor height. */
export const getPlayerWaterState = ({
	floorY,
	timeSeconds = 0,
	waterSurfaceY,
}: PlayerWaterStateInputType): PlayerWaterStateType => {
	const depthAtFeet = Math.max(0, waterSurfaceY - floorY);
	const isInWater = depthAtFeet >= WATER_ENTRY_DEPTH_THRESHOLD;
	const bobOffset = isInWater ? Math.sin(timeSeconds * WATER_BOB_SPEED) * WATER_BOB_AMPLITUDE : 0;

	return {
		depthAtFeet,
		isInWater,
		swimCenterY: waterSurfaceY + WATER_SURFACE_CENTER_OFFSET + bobOffset,
		visualAnchorY: waterSurfaceY - WATER_VISUAL_SUBMERGE_DEPTH + bobOffset,
	};
};

/** Resolves whether a dry-to-wet crossing happened this frame. */
export const isEnteringWater = (wasInWater: boolean, isInWater: boolean): boolean =>
	!wasInWater && isInWater;

/** Applies the current water drag model to player movement speed. */
export const getWaterAdjustedMoveSpeed = (
	moveSpeed: number,
	isInWater: boolean,
	isEntryFrame = false,
): number => {
	if (isEntryFrame) {
		return moveSpeed * PLAYER_WATER_ENTRY_MOVE_SPEED_MULTIPLIER;
	}

	return isInWater ? moveSpeed * PLAYER_WATER_MOVE_SPEED_MULTIPLIER : moveSpeed;
};
