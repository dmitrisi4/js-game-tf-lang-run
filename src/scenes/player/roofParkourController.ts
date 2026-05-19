import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { isTenerifeFullIslandTerrainMeshName } from '@/scenes/environment/tenerifeFullIslandConfig';
import { getCapsuleCenterYForFloor, PLAYER_CAPSULE_HALF_HEIGHT } from './playerCapsuleMetrics';
import {
	getPlanarFacingDirection,
	isPuertoCityBuildingMeshName,
	type RoofLandingPointType,
} from './roofTraversal';

export type RoofParkourProbeHitType = {
	meshName: string;
	normal: Vector3 | null;
	point: Vector3;
};

export type RoofParkourProbeAdapterType = {
	castRay: (origin: Vector3, direction: Vector3, length: number) => RoofParkourProbeHitType | null;
};

export type RoofParkourConfigType = {
	chestRayHeight: number;
	climbDurationMs: number;
	hangCenterYOffsetFromRoof: number;
	hangDurationMs: number;
	hangOutwardClearance: number;
	landingHintSearchRadius: number;
	maxClimbHeight: number;
	maxRoofDropFromProbe: number;
	roofInwardProbeDistance: number;
	roofSnapDistance: number;
	wallRayLength: number;
};

export type RoofParkourDebugPayloadType = {
	capsuleCenter: Vector3;
	hangCenter?: Vector3;
	landingCenter?: Vector3;
	roofHit?: Vector3;
	roofProbeEnd?: Vector3;
	roofProbeOrigin?: Vector3;
	state: string;
	visualFootY: number;
	wallHit?: Vector3;
	wallNormal?: Vector3;
	wallRayEnd?: Vector3;
	wallRayOrigin?: Vector3;
};

export type RoofParkourStateType =
	| { kind: 'idle'; debug?: RoofParkourDebugPayloadType }
	| {
			hangCenter: Vector3;
			kind: 'ledgeHang';
			landingCenter: Vector3;
			phaseStartedAt: number;
			roofY: number;
			debug: RoofParkourDebugPayloadType;
	  }
	| {
			hangCenter: Vector3;
			kind: 'climbUp';
			landingCenter: Vector3;
			phaseStartedAt: number;
			roofY: number;
			debug: RoofParkourDebugPayloadType;
	  }
	| {
			kind: 'roofSnap';
			landingCenter: Vector3;
			phaseStartedAt: number;
			roofY: number;
			debug: RoofParkourDebugPayloadType;
	  };

export type RoofParkourUpdateInputType = {
	capsuleCenter: Vector3;
	facingDirection: Vector3;
	isEnabled: boolean;
	isGrounded: boolean;
	jumpTriggered: boolean;
	landings: RoofLandingPointType[];
	now: number;
	probes: RoofParkourProbeAdapterType;
	state: RoofParkourStateType;
};

export type RoofParkourUpdateResultType = {
	consumeJump: boolean;
	controlledPosition: Vector3 | null;
	debug: RoofParkourDebugPayloadType | null;
	nextState: RoofParkourStateType;
	suppressMovement: boolean;
};

export const ROOF_PARKOUR_CONFIG: RoofParkourConfigType = {
	chestRayHeight: 1.05,
	climbDurationMs: 760,
	hangCenterYOffsetFromRoof: -0.26,
	hangDurationMs: 520,
	hangOutwardClearance: 0.82,
	landingHintSearchRadius: 18,
	maxClimbHeight: 80,
	maxRoofDropFromProbe: 90,
	roofInwardProbeDistance: 0.95,
	roofSnapDistance: 1.4,
	wallRayLength: 2.25,
};

const ZERO_DEBUG_POSITION = Vector3.Zero();

/** Resolves whether roof debug rendering should run for the current URL. */
export const shouldShowRoofParkourDebug = (search: string | undefined): boolean => {
	const params = new URLSearchParams(search ?? '');

	return params.get('roofDebug') === '1';
};

/** Resolves whether a mesh is a Puerto building wall or roof candidate. */
export const isRoofParkourBuildingMeshName = (meshName: string): boolean =>
	isPuertoCityBuildingMeshName(meshName);

/** Resolves whether a ground ray hit should count as floor for player grounding. */
export const isPlayerGroundMeshName = (meshName: string): boolean =>
	meshName === 'ground1' ||
	meshName === 'tenerife-seabed' ||
	meshName === 'tenerife-full-island-seabed' ||
	isTenerifeFullIslandTerrainMeshName(meshName) ||
	isRoofParkourBuildingMeshName(meshName);

/** Returns whether a normal is floor-like enough for standing. */
export const isFloorLikeNormal = (normal: Vector3 | null | undefined): boolean =>
	!normal || normal.y >= 0.45;

const withY = (vector: Vector3, y: number): Vector3 => new Vector3(vector.x, y, vector.z);

const normalizeOrZero = (vector: Vector3): Vector3 => {
	if (vector.lengthSquared() === 0) {
		return Vector3.Zero();
	}

	return vector.normalize();
};

const getWallNormal = (
	hit: RoofParkourProbeHitType,
	capsuleCenter: Vector3,
	facingDirection: Vector3,
): Vector3 => {
	const pickedNormal = hit.normal ? getPlanarFacingDirection(hit.normal) : Vector3.Zero();

	if (pickedNormal.lengthSquared() > 0) {
		return pickedNormal;
	}

	const fallbackNormal = getPlanarFacingDirection(capsuleCenter.subtract(hit.point));

	if (fallbackNormal.lengthSquared() > 0) {
		return fallbackNormal;
	}

	return facingDirection.scale(-1);
};

const getDebugPayload = (
	state: string,
	capsuleCenter: Vector3,
	visualFootY: number,
	points: Partial<RoofParkourDebugPayloadType> = {},
): RoofParkourDebugPayloadType => ({
	capsuleCenter,
	state,
	visualFootY,
	...points,
});

const findNearestLandingHint = (
	landings: RoofLandingPointType[],
	point: Vector3,
	searchRadius: number,
): RoofLandingPointType | null => {
	let nearest: RoofLandingPointType | null = null;
	let nearestDistanceSquared = Number.POSITIVE_INFINITY;

	for (const landing of landings) {
		const dx = landing.position.x - point.x;
		const dz = landing.position.z - point.z;
		const distanceSquared = dx * dx + dz * dz;
		const allowedDistance = Math.max(searchRadius, landing.radius);

		if (distanceSquared > allowedDistance * allowedDistance) {
			continue;
		}

		if (distanceSquared < nearestDistanceSquared) {
			nearest = landing;
			nearestDistanceSquared = distanceSquared;
		}
	}

	return nearest;
};

const getRoofTarget = (
	input: RoofParkourUpdateInputType,
	config: RoofParkourConfigType,
): {
	debug: RoofParkourDebugPayloadType;
	hangCenter: Vector3;
	landingCenter: Vector3;
	roofY: number;
} | null => {
	const facingDirection = normalizeOrZero(input.facingDirection);

	if (
		!input.isEnabled ||
		!input.isGrounded ||
		!input.jumpTriggered ||
		facingDirection.lengthSquared() === 0
	) {
		return null;
	}

	const wallRayOrigin = input.capsuleCenter.add(new Vector3(0, config.chestRayHeight, 0));
	const wallRayEnd = wallRayOrigin.add(facingDirection.scale(config.wallRayLength));
	const wallHit = input.probes.castRay(wallRayOrigin, facingDirection, config.wallRayLength);
	const visualFootY = input.capsuleCenter.y - PLAYER_CAPSULE_HALF_HEIGHT;

	if (!wallHit || !isRoofParkourBuildingMeshName(wallHit.meshName)) {
		return null;
	}

	const wallNormal = getWallNormal(wallHit, input.capsuleCenter, facingDirection);
	const roofProbeOrigin = wallHit.point
		.add(wallNormal.scale(-config.roofInwardProbeDistance))
		.add(new Vector3(0, config.maxClimbHeight, 0));
	const roofProbeEnd = roofProbeOrigin.add(Vector3.DownReadOnly.scale(config.maxRoofDropFromProbe));
	const roofHit = input.probes.castRay(
		roofProbeOrigin,
		Vector3.DownReadOnly,
		config.maxRoofDropFromProbe,
	);
	const landingHint = findNearestLandingHint(
		input.landings,
		wallHit.point,
		config.landingHintSearchRadius,
	);

	const baseDebug = getDebugPayload('ledgeProbe', input.capsuleCenter, visualFootY, {
		roofProbeEnd,
		roofProbeOrigin,
		wallHit: wallHit.point,
		wallNormal,
		wallRayEnd,
		wallRayOrigin,
	});

	if (
		!landingHint &&
		(!roofHit ||
			!isRoofParkourBuildingMeshName(roofHit.meshName) ||
			!isFloorLikeNormal(roofHit.normal))
	) {
		return null;
	}

	const roofY = landingHint?.roofY ?? roofHit?.point.y ?? wallHit.point.y;
	const climbHeight = roofY - input.capsuleCenter.y;

	if (climbHeight > config.maxClimbHeight || climbHeight < -1.2) {
		return null;
	}

	const landingPoint = landingHint
		? withY(new Vector3(landingHint.position.x, 0, landingHint.position.z), roofY)
		: (roofHit?.point ?? wallHit.point);
	const landingCenter = new Vector3(
		landingPoint.x,
		getCapsuleCenterYForFloor(roofY),
		landingPoint.z,
	);
	const playerSideDirection = getPlanarFacingDirection(input.capsuleCenter.subtract(wallHit.point));
	const hangOutwardDirection =
		playerSideDirection.lengthSquared() > 0 ? playerSideDirection : wallNormal;
	const hangCenter = new Vector3(
		wallHit.point.x + hangOutwardDirection.x * config.hangOutwardClearance,
		roofY + config.hangCenterYOffsetFromRoof,
		wallHit.point.z + hangOutwardDirection.z * config.hangOutwardClearance,
	);
	const debug = {
		...baseDebug,
		hangCenter,
		landingCenter,
		roofHit: roofHit?.point ?? landingPoint,
	};

	return { debug, hangCenter, landingCenter, roofY };
};

const getClimbPosition = (
	hangCenter: Vector3,
	landingCenter: Vector3,
	elapsedMs: number,
	config: RoofParkourConfigType,
): Vector3 => {
	const t = Math.min(1, elapsedMs / config.climbDurationMs);

	if (t < 0.45) {
		const upT = t / 0.45;
		const mantleTop = new Vector3(hangCenter.x, landingCenter.y + 0.12, hangCenter.z);

		return Vector3.Lerp(hangCenter, mantleTop, upT);
	}

	const overT = (t - 0.45) / 0.55;
	const mantleTop = new Vector3(hangCenter.x, landingCenter.y + 0.12, hangCenter.z);

	return Vector3.Lerp(mantleTop, landingCenter, overT);
};

/** Updates the roof parkour state machine for one player frame. */
export const updateRoofParkourController = (
	input: RoofParkourUpdateInputType,
	config = ROOF_PARKOUR_CONFIG,
): RoofParkourUpdateResultType => {
	if (!input.isEnabled) {
		return {
			consumeJump: false,
			controlledPosition: null,
			debug: null,
			nextState: { kind: 'idle' },
			suppressMovement: false,
		};
	}

	if (input.state.kind === 'ledgeHang') {
		const elapsedMs = input.now - input.state.phaseStartedAt;
		const debug = { ...input.state.debug, state: 'ledgeHang' };

		if (elapsedMs >= config.hangDurationMs) {
			return {
				consumeJump: true,
				controlledPosition: input.state.hangCenter,
				debug,
				nextState: {
					...input.state,
					kind: 'climbUp',
					phaseStartedAt: input.now,
					debug,
				},
				suppressMovement: true,
			};
		}

		return {
			consumeJump: true,
			controlledPosition: input.state.hangCenter,
			debug,
			nextState: input.state,
			suppressMovement: true,
		};
	}

	if (input.state.kind === 'climbUp') {
		const elapsedMs = input.now - input.state.phaseStartedAt;
		const controlledPosition = getClimbPosition(
			input.state.hangCenter,
			input.state.landingCenter,
			elapsedMs,
			config,
		);
		const debug = {
			...input.state.debug,
			state: 'climbUp',
			landingCenter: input.state.landingCenter,
		};

		if (elapsedMs >= config.climbDurationMs) {
			return {
				consumeJump: true,
				controlledPosition: input.state.landingCenter,
				debug,
				nextState: {
					kind: 'roofSnap',
					landingCenter: input.state.landingCenter,
					phaseStartedAt: input.now,
					roofY: input.state.roofY,
					debug,
				},
				suppressMovement: true,
			};
		}

		return {
			consumeJump: true,
			controlledPosition,
			debug,
			nextState: input.state,
			suppressMovement: true,
		};
	}

	if (input.state.kind === 'roofSnap') {
		const snapOrigin = input.state.landingCenter.add(
			new Vector3(0, config.roofSnapDistance * 0.5, 0),
		);
		const snapHit = input.probes.castRay(snapOrigin, Vector3.DownReadOnly, config.roofSnapDistance);
		const roofY =
			snapHit && isRoofParkourBuildingMeshName(snapHit.meshName) && isFloorLikeNormal(snapHit.normal)
				? snapHit.point.y
				: input.state.roofY;
		const controlledPosition = withY(input.state.landingCenter, getCapsuleCenterYForFloor(roofY));
		const debug = {
			...input.state.debug,
			landingCenter: controlledPosition,
			roofHit: snapHit?.point ?? input.state.debug.roofHit ?? ZERO_DEBUG_POSITION,
			state: 'roofSnap',
		};

		return {
			consumeJump: true,
			controlledPosition,
			debug,
			nextState: { kind: 'idle', debug },
			suppressMovement: true,
		};
	}

	const roofTarget = getRoofTarget(input, config);

	if (!roofTarget) {
		return {
			consumeJump: false,
			controlledPosition: null,
			debug: null,
			nextState: { kind: 'idle' },
			suppressMovement: false,
		};
	}

	return {
		consumeJump: true,
		controlledPosition: roofTarget.hangCenter,
		debug: { ...roofTarget.debug, state: 'ledgeHang' },
		nextState: {
			debug: roofTarget.debug,
			hangCenter: roofTarget.hangCenter,
			kind: 'ledgeHang',
			landingCenter: roofTarget.landingCenter,
			phaseStartedAt: input.now,
			roofY: roofTarget.roofY,
		},
		suppressMovement: true,
	};
};
