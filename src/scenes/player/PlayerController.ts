import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { InputAxis2d } from './inputTypes';

/**
 * Converts semantic 2D movement input into a camera-relative planar world vector.
 *
 * @param {InputAxis2d} move - The semantic move input.
 * @param {Vector3} forward - The camera forward vector.
 * @param {Vector3} right - The camera right vector.
 * @returns {Vector3} A normalized planar world movement vector.
 */
export const resolveCameraRelativeMovement = (
	move: InputAxis2d,
	forward: Vector3,
	right: Vector3,
): Vector3 => {
	const flattenedForward = new Vector3(forward.x, 0, forward.z);
	const flattenedRight = new Vector3(right.x, 0, right.z);

	if (flattenedForward.lengthSquared() > 0) {
		flattenedForward.normalize();
	}

	if (flattenedRight.lengthSquared() > 0) {
		flattenedRight.normalize();
	}

	const movement = flattenedRight.scale(move.x).add(flattenedForward.scale(move.y));

	if (movement.lengthSquared() === 0) {
		return Vector3.Zero();
	}

	return movement.normalize();
};
