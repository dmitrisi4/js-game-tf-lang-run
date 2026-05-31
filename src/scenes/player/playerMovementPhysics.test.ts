import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import {
	lerpVelocityXZ,
	projectOntoSurface,
	resolvePlayerGroundedState,
} from './playerMovementPhysics';

// ---------------------------------------------------------------------------
// projectOntoSurface
// ---------------------------------------------------------------------------

describe('projectOntoSurface', () => {
	it('returns the original direction unchanged on flat ground (normal = up)', () => {
		const dir = new Vector3(1, 0, 0);
		const normal = Vector3.UpReadOnly;
		const result = projectOntoSurface(dir, normal);

		expect(result.x).toBeCloseTo(1);
		expect(result.y).toBeCloseTo(0);
		expect(result.z).toBeCloseTo(0);
	});

	it('projects direction onto a 45-degree forward slope', () => {
		// Normal tilted 45° backward (slope rising in +Z direction)
		const normal = new Vector3(0, Math.SQRT1_2, -Math.SQRT1_2);
		const dir = new Vector3(0, 0, 1); // moving forward into the slope
		const result = projectOntoSurface(dir, normal);

		// Result must be unit length
		expect(result.length()).toBeCloseTo(1);
		// Y component must be positive (going upward along the slope)
		expect(result.y).toBeGreaterThan(0);
		// Z component preserved direction
		expect(result.z).toBeGreaterThan(0);
	});

	it('returns a unit-length vector for any valid slope normal', () => {
		const normals = [
			new Vector3(0, 1, 0),
			new Vector3(0, 0.9, 0.44).normalize(),
			new Vector3(0.3, 0.95, 0).normalize(),
		];

		for (const normal of normals) {
			const dir = new Vector3(1, 0, 0);
			const result = projectOntoSurface(dir, normal);
			expect(result.length()).toBeCloseTo(1, 4);
		}
	});

	it('falls back to the original direction when projection collapses', () => {
		// Direction perfectly parallel to the normal → projection = zero
		const dir = new Vector3(0, 1, 0);
		const normal = new Vector3(0, 1, 0);
		const result = projectOntoSurface(dir, normal);

		// Should return original direction clone, not a zero vector
		expect(result.length()).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// lerpVelocityXZ
// ---------------------------------------------------------------------------

describe('lerpVelocityXZ', () => {
	const ACCEL = 18;
	const DECEL = 24;
	const DELTA = 1 / 60; // 60 fps frame

	it('moves current toward target within a single frame', () => {
		const current = Vector3.Zero();
		const target = new Vector3(4.5, 0, 0);
		const result = lerpVelocityXZ(current, target, ACCEL, DECEL, DELTA);

		expect(result.x).toBeGreaterThan(0);
		expect(result.x).toBeLessThan(4.5);
		expect(result.y).toBe(0);
	});

	it('converges to target after many frames', () => {
		let current = Vector3.Zero();
		const target = new Vector3(4.5, 0, 0);

		for (let i = 0; i < 120; i++) {
			current = lerpVelocityXZ(current, target, ACCEL, DECEL, DELTA);
		}

		expect(current.x).toBeCloseTo(4.5, 2);
	});

	it('decelerates to near zero when input released', () => {
		let current = new Vector3(4.5, 0, 0);
		const target = Vector3.Zero();

		for (let i = 0; i < 120; i++) {
			current = lerpVelocityXZ(current, target, ACCEL, DECEL, DELTA);
		}

		expect(Math.abs(current.x)).toBeLessThan(0.01);
	});

	it('always returns Y=0 regardless of input Y', () => {
		const current = new Vector3(1, 5, 1);
		const target = new Vector3(2, 10, 2);
		const result = lerpVelocityXZ(current, target, ACCEL, DECEL, DELTA);

		expect(result.y).toBe(0);
	});

	it('is frame-rate independent: 2x frames at half delta ≈ 1x frame at full delta', () => {
		const currentA = new Vector3(0, 0, 0);
		const target = new Vector3(4.5, 0, 0);

		const resultOneFrame = lerpVelocityXZ(currentA, target, ACCEL, DECEL, DELTA);

		let currentB = Vector3.Zero();
		currentB = lerpVelocityXZ(currentB, target, ACCEL, DECEL, DELTA / 2);
		currentB = lerpVelocityXZ(currentB, target, ACCEL, DECEL, DELTA / 2);

		expect(currentB.x).toBeCloseTo(resultOneFrame.x, 4);
	});
});

// ---------------------------------------------------------------------------
// resolvePlayerGroundedState
// ---------------------------------------------------------------------------

describe('resolvePlayerGroundedState', () => {
	const BASE_INPUT = {
		distance: 1.04,
		enterDistance: 1.35,
		floorLike: true,
		landingDistance: 1.65,
		lastJumpFiredAt: null,
		now: 1000,
		postJumpSuppressionMs: 200,
		stayDistance: 1.65,
		verticalVelocity: 0,
		wasGrounded: false,
	};

	it('suppresses ground re-entry during the immediate post-jump window', () => {
		const result = resolvePlayerGroundedState({
			...BASE_INPUT,
			lastJumpFiredAt: 900,
			now: 1000,
		});

		expect(result.isWithinPostJumpSuppression).toBe(true);
		expect(result.isGrounded).toBe(false);
	});

	it('uses the tight entry threshold while rising', () => {
		const result = resolvePlayerGroundedState({
			...BASE_INPUT,
			distance: 1.5,
			verticalVelocity: 2.5,
		});

		expect(result.distanceThreshold).toBe(1.35);
		expect(result.isGrounded).toBe(false);
	});

	it('uses the loose landing threshold while descending after a moving jump', () => {
		const result = resolvePlayerGroundedState({
			...BASE_INPUT,
			distance: 1.5,
			lastJumpFiredAt: 700,
			now: 1000,
			verticalVelocity: -1.2,
			wasGrounded: false,
		});

		expect(result.distanceThreshold).toBe(1.65);
		expect(result.isGrounded).toBe(true);
	});

	it('keeps the loose stay-grounded threshold after landing', () => {
		const result = resolvePlayerGroundedState({
			...BASE_INPUT,
			distance: 1.55,
			verticalVelocity: 0.4,
			wasGrounded: true,
		});

		expect(result.distanceThreshold).toBe(1.65);
		expect(result.isGrounded).toBe(true);
	});

	it('rejects non-floor hits even when distance is close', () => {
		const result = resolvePlayerGroundedState({
			...BASE_INPUT,
			floorLike: false,
		});

		expect(result.isGrounded).toBe(false);
	});
});
