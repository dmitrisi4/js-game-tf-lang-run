export const PLAYER_CAPSULE_HEIGHT = 1.8;
export const PLAYER_CAPSULE_DIAMETER = 0.8;
export const PLAYER_CAPSULE_RADIUS = PLAYER_CAPSULE_DIAMETER / 2;
export const PLAYER_CAPSULE_HALF_HEIGHT = PLAYER_CAPSULE_HEIGHT / 2;
export const PLAYER_CAPSULE_CONTACT_SKIN = 0.04;
export const PLAYER_VISUAL_FOOT_OFFSET_FROM_CAPSULE_CENTER = -PLAYER_CAPSULE_HALF_HEIGHT;

/** Converts a floor surface height to the player capsule center height. */
export const getCapsuleCenterYForFloor = (floorY: number): number =>
	floorY + PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_CAPSULE_CONTACT_SKIN;

/** Converts a player capsule center height to the floor surface height under it. */
export const getFloorYFromCapsuleCenter = (centerY: number): number =>
	centerY - PLAYER_CAPSULE_HALF_HEIGHT - PLAYER_CAPSULE_CONTACT_SKIN;

/** Returns the visual foot baseline for the current capsule center height. */
export const getVisualFootYFromCapsuleCenter = (centerY: number): number =>
	centerY + PLAYER_VISUAL_FOOT_OFFSET_FROM_CAPSULE_CENTER;
