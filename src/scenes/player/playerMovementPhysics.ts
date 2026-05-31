import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type PlayerGroundedStateInputType = {
	distance: number | null;
	enterDistance: number;
	floorLike: boolean;
	landingDistance: number;
	lastJumpFiredAt: number | null;
	now: number;
	postJumpSuppressionMs: number;
	stayDistance: number;
	verticalVelocity: number;
	wasGrounded: boolean;
};

export type PlayerGroundedStateType = {
	distanceThreshold: number;
	isGrounded: boolean;
	isWithinPostJumpSuppression: boolean;
};

/**
 * Projects a movement direction vector onto a surface plane defined by its normal.
 * When the normal is straight up (flat ground) the result is identical to the input.
 * On slopes the projected vector follows the surface, eliminating the "wedge into
 * the slope" artifact caused by pure horizontal movement.
 *
 * @param direction - Normalized horizontal movement direction.
 * @param normal    - World-space surface normal (assumed unit length).
 * @returns A normalized vector parallel to the surface, or the original direction
 *          when the projection collapses to zero length.
 */
export const projectOntoSurface = (direction: Vector3, normal: Vector3): Vector3 => {
	const dot = Vector3.Dot(direction, normal);
	const projected = direction.subtract(normal.scale(dot));

	if (projected.lengthSquared() < 1e-6) {
		return direction.clone();
	}

	return projected.normalize();
};

/**
 * Smoothly lerps the XZ components of `current` toward `target` using
 * an exponential decay so the result is frame-rate independent.
 *
 * Acceleration is applied when moving toward a non-zero target; deceleration
 * is applied when the target is zero (input released).
 *
 * @param current       - Last applied XZ velocity (mutated in place, Y ignored).
 * @param target        - Desired XZ velocity this frame.
 * @param acceleration  - Ramp-up rate (units/s²-equivalent exponent).
 * @param deceleration  - Ramp-down rate when input is released.
 * @param deltaSeconds  - Frame delta time in seconds.
 * @returns New smoothed XZ velocity as a Vector3 (Y is always 0).
 */
export const lerpVelocityXZ = (
	current: Vector3,
	target: Vector3,
	acceleration: number,
	deceleration: number,
	deltaSeconds: number,
): Vector3 => {
	const isDecelerating = target.x === 0 && target.z === 0;
	const rate = isDecelerating ? deceleration : acceleration;
	const factor = 1 - Math.exp(-rate * deltaSeconds);

	return new Vector3(
		current.x + (target.x - current.x) * factor,
		0,
		current.z + (target.z - current.z) * factor,
	);
};

/**
 * Resolves whether the player capsule should be treated as grounded from the
 * current down-ray hit and previous grounded state.
 *
 * The landing threshold is intentionally looser than the first grounded-entry
 * threshold, but only while descending. This keeps a moving jump from staying in
 * airborne animation because of small post-landing capsule bounces, without
 * cancelling the upward jump impulse while the player is still rising.
 */
export const resolvePlayerGroundedState = ({
	distance,
	enterDistance,
	floorLike,
	landingDistance,
	lastJumpFiredAt,
	now,
	postJumpSuppressionMs,
	stayDistance,
	verticalVelocity,
	wasGrounded,
}: PlayerGroundedStateInputType): PlayerGroundedStateType => {
	const isWithinPostJumpSuppression =
		lastJumpFiredAt !== null && now - lastJumpFiredAt < postJumpSuppressionMs;
	const isDescendingOrLevel = verticalVelocity <= 0;
	const distanceThreshold = wasGrounded
		? stayDistance
		: isDescendingOrLevel
			? landingDistance
			: enterDistance;

	return {
		distanceThreshold,
		isGrounded:
			!isWithinPostJumpSuppression && floorLike && distance !== null && distance <= distanceThreshold,
		isWithinPostJumpSuppression,
	};
};
