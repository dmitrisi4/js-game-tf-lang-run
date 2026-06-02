import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import { getCapsuleCenterYForFloor } from './playerCapsuleMetrics';
import {
	isFloorLikeNormal,
	isPlayerGroundMeshName,
	isRoofParkourBuildingMeshName,
	isTenerifeRoadsideBuildingMeshName,
	type RoofParkourProbeAdapterType,
	type RoofParkourProbeHitType,
	shouldShowRoofParkourDebug,
	updateRoofParkourController,
} from './roofParkourController';

const BUILDING_MESH_NAME = 'puerto-osm-city-buildings';

const getProbeAdapter = (): RoofParkourProbeAdapterType => ({
	castRay: (origin, direction): RoofParkourProbeHitType | null => {
		if (direction.y < -0.9) {
			return {
				meshName: BUILDING_MESH_NAME,
				normal: Vector3.Up(),
				point: new Vector3(origin.x, 3, origin.z),
			};
		}

		return {
			meshName: BUILDING_MESH_NAME,
			normal: new Vector3(-1, 0, 0),
			point: new Vector3(1, 1.1, 0),
		};
	},
});

describe('roofParkourController', () => {
	it('parses roof debug flag', () => {
		expect(shouldShowRoofParkourDebug('?roofDebug=1')).toBe(true);
		expect(shouldShowRoofParkourDebug('?roofDebug=0')).toBe(false);
	});

	it('classifies roof floor and wall normals', () => {
		expect(isPlayerGroundMeshName('ground1')).toBe(true);
		expect(isPlayerGroundMeshName(BUILDING_MESH_NAME)).toBe(true);
		expect(isTenerifeRoadsideBuildingMeshName('tenerife-roadside-building-01-fallback')).toBe(true);
		expect(isRoofParkourBuildingMeshName('tenerife-roadside-building-01-fallback')).toBe(true);
		expect(isPlayerGroundMeshName('tenerife-roadside-building-01-fallback')).toBe(true);
		expect(isPlayerGroundMeshName('letter')).toBe(false);
		expect(isFloorLikeNormal(new Vector3(0, 1, 0))).toBe(true);
		expect(isFloorLikeNormal(new Vector3(1, 0, 0))).toBe(false);
	});

	it('starts a ledge hang instead of returning a wall-jump impulse', () => {
		const result = updateRoofParkourController({
			capsuleCenter: new Vector3(0, 0.94, 0),
			facingDirection: new Vector3(1, 0, 0),
			isEnabled: true,
			isGrounded: true,
			jumpTriggered: true,
			landings: [],
			now: 100,
			probes: getProbeAdapter(),
			state: { kind: 'idle' },
		});

		expect(result.consumeJump).toBe(true);
		expect(result.suppressMovement).toBe(true);
		expect(result.nextState.kind).toBe('ledgeHang');
		expect(result.controlledPosition?.y).toBeCloseTo(2.74);
		expect(result.controlledPosition?.x).toBeLessThan(1);
	});

	it('uses a nearby landing hint when the roof downcast misses', () => {
		const probes: RoofParkourProbeAdapterType = {
			castRay: (_origin, direction): RoofParkourProbeHitType | null => {
				if (direction.y < -0.9) {
					return null;
				}

				return {
					meshName: BUILDING_MESH_NAME,
					normal: new Vector3(-1, 0, 0),
					point: new Vector3(1, 1.1, 0),
				};
			},
		};
		const result = updateRoofParkourController({
			capsuleCenter: new Vector3(0, 0.94, 0),
			facingDirection: new Vector3(1, 0, 0),
			isEnabled: true,
			isGrounded: true,
			jumpTriggered: true,
			landings: [
				{
					id: 'arcade-roof',
					position: { x: 2, y: 13, z: 0 },
					radius: 8,
					roofY: 12,
				},
			],
			now: 100,
			probes,
			state: { kind: 'idle' },
		});

		expect(result.consumeJump).toBe(true);
		expect(result.nextState.kind).toBe('ledgeHang');
		expect(result.debug?.roofHit?.y).toBe(12);
	});

	it('transitions from hang to climb and then roof snap', () => {
		const first = updateRoofParkourController({
			capsuleCenter: new Vector3(0, 0.94, 0),
			facingDirection: new Vector3(1, 0, 0),
			isEnabled: true,
			isGrounded: true,
			jumpTriggered: true,
			landings: [],
			now: 100,
			probes: getProbeAdapter(),
			state: { kind: 'idle' },
		});
		const second = updateRoofParkourController({
			capsuleCenter: first.controlledPosition ?? Vector3.Zero(),
			facingDirection: new Vector3(1, 0, 0),
			isEnabled: true,
			isGrounded: false,
			jumpTriggered: false,
			landings: [],
			now: 700,
			probes: getProbeAdapter(),
			state: first.nextState,
		});
		const third = updateRoofParkourController({
			capsuleCenter: second.controlledPosition ?? Vector3.Zero(),
			facingDirection: new Vector3(1, 0, 0),
			isEnabled: true,
			isGrounded: false,
			jumpTriggered: false,
			landings: [],
			now: 1500,
			probes: getProbeAdapter(),
			state: second.nextState,
		});
		const fourth = updateRoofParkourController({
			capsuleCenter: third.controlledPosition ?? Vector3.Zero(),
			facingDirection: new Vector3(1, 0, 0),
			isEnabled: true,
			isGrounded: false,
			jumpTriggered: false,
			landings: [],
			now: 1516,
			probes: getProbeAdapter(),
			state: third.nextState,
		});

		expect(second.nextState.kind).toBe('climbUp');
		expect(third.nextState.kind).toBe('roofSnap');
		expect(fourth.nextState.kind).toBe('idle');
		expect(fourth.controlledPosition?.y).toBeCloseTo(getCapsuleCenterYForFloor(3));
	});
});
