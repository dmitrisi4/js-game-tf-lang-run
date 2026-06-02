import { Ray } from '@babylonjs/core/Culling/ray';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Observer } from '@babylonjs/core/Misc/observable';
import {
	PhysicsPrestepType,
	PhysicsShapeType,
} from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useScene } from 'react-babylonjs';
import {
	isTenerifeFullIslandMode,
	isTenerifeFullIslandTerrainMeshName,
	TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
} from '@/scenes/environment/tenerifeFullIslandConfig';
import { getTenerifeFullIslandHeightAtPosition } from '@/scenes/environment/tenerifeFullIslandHeightfield';
import { applyCollisionFilterToBody } from '@/scenes/physics/collisionLayers';
import AssetPlayerVisual from './AssetPlayerVisual';
import type { PlayerInputCommands } from './inputTypes';
import { resolveCameraRelativeMovement } from './PlayerController';
import {
	getCapsuleCenterYForFloor,
	PLAYER_CAPSULE_DIAMETER,
	PLAYER_CAPSULE_HEIGHT,
} from './playerCapsuleMetrics';
import {
	lerpVelocityXZ,
	projectOntoSurface,
	resolvePlayerGroundedState,
} from './playerMovementPhysics';
import {
	isFloorLikeNormal,
	isPlayerGroundMeshName,
	isRoofParkourBuildingMeshName,
	type RoofParkourProbeAdapterType,
	type RoofParkourStateType,
	shouldShowRoofParkourDebug,
	updateRoofParkourController,
} from './roofParkourController';
import {
	createRoofParkourDebugRenderer,
	type RoofParkourDebugRendererType,
} from './roofParkourDebug';
import {
	createRoofParkourMarkerRenderer,
	type RoofParkourMarkerRendererType,
} from './roofParkourMarkers';
import {
	getPlanarFacingDirection,
	PUERTO_ROOF_LANDINGS_URL,
	type RoofLandingPayloadType,
	type RoofLandingPointType,
	shouldLoadPuertoRoofTraversal,
} from './roofTraversal';
import { createWaterEntrySplash } from './waterEntryEffects';
import {
	getPlayerWaterState,
	getWaterAdjustedMoveSpeed,
	isEnteringWater,
} from './waterInteraction';

type PropsType = {
	commands: PlayerInputCommands;
	onCreated?: (mesh: Mesh) => void;
	spawnPosition?: Vector3;
};

const PLAYER_MOVE_SPEED = 4.5;
const PLAYER_SPRINT_SPEED = 7;
const PLAYER_JUMP_VELOCITY = 6.5;
/** Phase 3: reduced from 310 ms — jump fires within one render frame of press. */
const PLAYER_JUMP_PHYSICS_DELAY_MS = 80;
const PLAYER_JUMP_QUEUE_EXPIRE_MS = 180;
const PLAYER_GROUND_RAY_LENGTH = 1.8;
/**
 * Phase 2: distance-based grounded guard.
 * Two thresholds implement hysteresis:
 * - PLAYER_GROUND_MAX_DISTANCE (tight) — must be this close to ENTER grounded state.
 * - PLAYER_GROUND_STAY_DISTANCE (loose) — allowed to drift this far and STAY grounded.
 * The loose threshold absorbs micro-bouncing from the capsule's rounded bottom when
 * horizontal XZ velocity is high; without it isAirborne oscillates after landing.
 */
const PLAYER_GROUND_MAX_DISTANCE = 1.35;
const PLAYER_GROUND_STAY_DISTANCE = 1.65;
const TENERIFE_FULL_ISLAND_SUPPORT_RAY_HEIGHT = 80;
const TENERIFE_FULL_ISLAND_SUPPORT_RAY_LENGTH = 180;
const TENERIFE_FULL_ISLAND_OBSTACLE_CLEARANCE = 0.16;
const TENERIFE_FULL_ISLAND_OBSTACLE_SIDE_RAY_OFFSET = PLAYER_CAPSULE_DIAMETER * 0.36;
const TENERIFE_FULL_ISLAND_OBSTACLE_Y_OFFSETS = [
	-PLAYER_CAPSULE_HEIGHT * 0.18,
	PLAYER_CAPSULE_HEIGHT * 0.16,
];
const PLAYER_MAX_FALL_SPEED = -18;
/** Phase 4: acceleration / deceleration exponent rates (higher = snappier). */
const PLAYER_MOVE_ACCELERATION = 18;
const PLAYER_STOP_DECELERATION = 24;
/** Phase 5: fraction of full ground control available while airborne (0–1). */
const PLAYER_AIR_CONTROL = 0.35;
/**
 * How long after a jump the grounded-ray check is suppressed.
 * Prevents the capsule from being detected as still-on-ground the very next
 * frame after the jump impulse fires, which would immediately freeze Y.
 */
const PLAYER_POST_JUMP_COYOTE_MS = 200;
const PLAYER_SPAWN_POSITION = new Vector3(-7, 1.5, -6);
const PLAYER_PHYSICS_OPTIONS = {
	mass: 1,
	restitution: 0,
	friction: 0.08,
};
const ZERO_VELOCITY = Vector3.Zero();

const getRoofTraversalSearch = (): string | undefined =>
	typeof window === 'undefined' ? undefined : window.location.search;

const getIsRoofParkourEnabled = (): boolean =>
	shouldLoadPuertoRoofTraversal(getRoofTraversalSearch());

const getIsTenerifeFullIslandEnabled = (): boolean =>
	isTenerifeFullIslandMode(getRoofTraversalSearch());

/** Moves the visible player mesh and its physics body to the same controlled position. */
const teleportPlayerPhysicsBody = (playerMesh: Mesh, position: Vector3): void => {
	const physicsBody = playerMesh.physicsBody;

	playerMesh.position.copyFrom(position);
	playerMesh.rotationQuaternion = Quaternion.Identity();
	playerMesh.rotation.copyFromFloats(0, 0, 0);
	playerMesh.computeWorldMatrix(true);

	if (!physicsBody) {
		return;
	}

	physicsBody.setPrestepType(PhysicsPrestepType.TELEPORT);
	physicsBody.setTargetTransform(position, Quaternion.Identity());
	physicsBody.setLinearVelocity(ZERO_VELOCITY);
	physicsBody.setAngularVelocity(ZERO_VELOCITY);
};

const setPlayerPhysicsPrestepDisabled = (playerMesh: Mesh): void => {
	playerMesh.physicsBody?.setPrestepType(PhysicsPrestepType.DISABLED);
};

type TenerifeFullIslandSupportType = {
	floorY: number;
	normal: Vector3 | null;
	supportedCenterY: number;
};

/** Resolves the full-island terrain height under the player capsule. */
export const getTenerifeFullIslandSupportAtPosition = (
	position: Vector3,
	scene: BabylonScene,
): TenerifeFullIslandSupportType | null => {
	const supportHit = scene.pickWithRay(
		new Ray(
			position.add(new Vector3(0, TENERIFE_FULL_ISLAND_SUPPORT_RAY_HEIGHT, 0)),
			Vector3.DownReadOnly,
			TENERIFE_FULL_ISLAND_SUPPORT_RAY_LENGTH,
		),
		(mesh) => isTenerifeFullIslandTerrainMeshName(mesh.name) && mesh.isEnabled() && mesh.isPickable,
	);

	if (supportHit?.hit && supportHit.pickedPoint) {
		const supportedCenterY = getCapsuleCenterYForFloor(supportHit.pickedPoint.y);

		return {
			floorY: supportHit.pickedPoint.y,
			normal: supportHit.getNormal(true, false),
			supportedCenterY,
		};
	}

	const heightfieldY = getTenerifeFullIslandHeightAtPosition(position);
	if (heightfieldY !== null) {
		return {
			floorY: heightfieldY,
			normal: null,
			supportedCenterY: getCapsuleCenterYForFloor(heightfieldY),
		};
	}

	return null;
};

/** Checks whether the full-island kinematic player would enter a building box. */
const isTenerifeFullIslandPlanarMoveBlocked = (
	scene: BabylonScene,
	currentPosition: Vector3,
	planarOffset: Vector3,
): boolean => {
	if (planarOffset.lengthSquared() <= 0.0001) {
		return false;
	}

	const direction = new Vector3(planarOffset.x, 0, planarOffset.z).normalize();
	const right = new Vector3(-direction.z, 0, direction.x);
	const rayLength =
		Math.hypot(planarOffset.x, planarOffset.z) +
		PLAYER_CAPSULE_DIAMETER / 2 +
		TENERIFE_FULL_ISLAND_OBSTACLE_CLEARANCE;
	const lateralOffsets = [
		0,
		TENERIFE_FULL_ISLAND_OBSTACLE_SIDE_RAY_OFFSET,
		-TENERIFE_FULL_ISLAND_OBSTACLE_SIDE_RAY_OFFSET,
	];

	for (const lateralOffset of lateralOffsets) {
		for (const yOffset of TENERIFE_FULL_ISLAND_OBSTACLE_Y_OFFSETS) {
			const origin = currentPosition.add(right.scale(lateralOffset)).add(new Vector3(0, yOffset, 0));
			const hit = scene.pickWithRay(
				new Ray(origin, direction, rayLength),
				(mesh) => mesh.isEnabled() && mesh.isPickable && isRoofParkourBuildingMeshName(mesh.name),
			);

			if (hit?.hit) {
				return true;
			}
		}
	}

	return false;
};

/** Resolves a requested full-island planar move, sliding along one axis when a wall blocks it. */
const resolveTenerifeFullIslandPlanarOffset = (
	scene: BabylonScene,
	currentPosition: Vector3,
	movementDirection: Vector3,
	moveDistance: number,
): Vector3 => {
	const requestedOffset = new Vector3(
		movementDirection.x * moveDistance,
		0,
		movementDirection.z * moveDistance,
	);

	if (!isTenerifeFullIslandPlanarMoveBlocked(scene, currentPosition, requestedOffset)) {
		return requestedOffset;
	}

	const xOnlyOffset = new Vector3(requestedOffset.x, 0, 0);
	if (!isTenerifeFullIslandPlanarMoveBlocked(scene, currentPosition, xOnlyOffset)) {
		return xOnlyOffset;
	}

	const zOnlyOffset = new Vector3(0, 0, requestedOffset.z);
	if (!isTenerifeFullIslandPlanarMoveBlocked(scene, currentPosition, zOnlyOffset)) {
		return zOnlyOffset;
	}

	return Vector3.Zero();
};

/** Moves the full-island player as a terrain-following kinematic body. */
const moveTenerifeFullIslandPlayer = (
	playerMesh: Mesh,
	scene: BabylonScene,
	movementDirection: Vector3,
	moveSpeed: number,
	wasInWater: boolean,
): {
	isEnteringWater: boolean;
	isInWater: boolean;
	isSupported: boolean;
	normal: Vector3 | null;
} => {
	const deltaSeconds = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
	const currentPosition = playerMesh.absolutePosition;
	const supportProbeOffset = resolveTenerifeFullIslandPlanarOffset(
		scene,
		currentPosition,
		movementDirection,
		moveSpeed * deltaSeconds,
	);
	const candidatePlanarPosition = new Vector3(
		currentPosition.x + supportProbeOffset.x,
		currentPosition.y,
		currentPosition.z + supportProbeOffset.z,
	);
	const support =
		getTenerifeFullIslandSupportAtPosition(candidatePlanarPosition, scene) ??
		getTenerifeFullIslandSupportAtPosition(currentPosition, scene);

	if (!support) {
		// Heightfield may not be built yet (first frames after spawn) or the player
		// has walked off the island into open water. Treat that case as swimming so
		// water drag and surface effects stay active even without a terrain hit.
		const nextIsEnteringWater = !wasInWater;
		const adjustedMoveSpeed = getWaterAdjustedMoveSpeed(moveSpeed, true, nextIsEnteringWater);
		const waterState = getPlayerWaterState({
			floorY: TENERIFE_FULL_ISLAND_WATER_SURFACE_Y - 2,
			timeSeconds: performance.now() * 0.001,
			waterSurfaceY: TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
		});
		const waterPlanarOffset = resolveTenerifeFullIslandPlanarOffset(
			scene,
			currentPosition,
			movementDirection,
			adjustedMoveSpeed * deltaSeconds,
		);
		const nextPosition = new Vector3(
			currentPosition.x + waterPlanarOffset.x,
			waterState.swimCenterY,
			currentPosition.z + waterPlanarOffset.z,
		);
		playerMesh.position.copyFrom(nextPosition);
		playerMesh.rotationQuaternion = Quaternion.Identity();
		playerMesh.rotation.copyFromFloats(0, 0, 0);
		playerMesh.computeWorldMatrix(true);

		if (playerMesh.physicsBody) {
			playerMesh.physicsBody.setPrestepType(PhysicsPrestepType.TELEPORT);
			playerMesh.physicsBody.setTargetTransform(nextPosition, Quaternion.Identity());
			playerMesh.physicsBody.setLinearVelocity(ZERO_VELOCITY);
			playerMesh.physicsBody.setAngularVelocity(ZERO_VELOCITY);
			setPlayerPhysicsPrestepDisabled(playerMesh);
		}

		return { isEnteringWater: nextIsEnteringWater, isInWater: true, isSupported: true, normal: null };
	}

	const waterState = getPlayerWaterState({
		floorY: support.floorY,
		timeSeconds: performance.now() * 0.001,
		waterSurfaceY: TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
	});
	const nextIsEnteringWater = isEnteringWater(wasInWater, waterState.isInWater);
	const adjustedMoveSpeed = getWaterAdjustedMoveSpeed(
		moveSpeed,
		waterState.isInWater,
		nextIsEnteringWater,
	);
	const planarOffset = resolveTenerifeFullIslandPlanarOffset(
		scene,
		currentPosition,
		movementDirection,
		adjustedMoveSpeed * deltaSeconds,
	);
	const nextPlanarPosition = new Vector3(
		currentPosition.x + planarOffset.x,
		currentPosition.y,
		currentPosition.z + planarOffset.z,
	);
	const nextPosition = new Vector3(
		nextPlanarPosition.x,
		waterState.isInWater
			? Math.max(support.supportedCenterY, waterState.swimCenterY)
			: support.supportedCenterY,
		nextPlanarPosition.z,
	);

	playerMesh.position.copyFrom(nextPosition);
	playerMesh.rotationQuaternion = Quaternion.Identity();
	playerMesh.rotation.copyFromFloats(0, 0, 0);
	playerMesh.computeWorldMatrix(true);

	if (playerMesh.physicsBody) {
		playerMesh.physicsBody.setPrestepType(PhysicsPrestepType.TELEPORT);
		playerMesh.physicsBody.setTargetTransform(nextPosition, Quaternion.Identity());
		playerMesh.physicsBody.setLinearVelocity(ZERO_VELOCITY);
		playerMesh.physicsBody.setAngularVelocity(ZERO_VELOCITY);
		setPlayerPhysicsPrestepDisabled(playerMesh);
	}

	return {
		isEnteringWater: nextIsEnteringWater,
		isInWater: waterState.isInWater,
		isSupported: true,
		normal: support.normal,
	};
};

/**
 * Provides the first controllable placeholder player entity.
 *
 * This is not yet the final physics-driven controller, but it establishes the
 * runtime boundary where semantic input is consumed by a dedicated player module.
 *
 * @param {PropsType} props - Player input props.
 * @returns {JSX.Element} The placeholder player entity.
 */
const Player: React.FC<PropsType> = ({
	commands,
	onCreated,
	spawnPosition = PLAYER_SPAWN_POSITION,
}) => {
	const scene = useScene();
	const isFullIslandTraversalEnabled = getIsTenerifeFullIslandEnabled();
	const playerMeshRef = useRef<Mesh | null>(null);
	const commandsRef = useRef(commands);
	const isMovingRef = useRef(false);
	const isSprintingRef = useRef(false);
	const isAirborneRef = useRef(false);
	const isInWaterRef = useRef(false);
	const facingYawRef = useRef(0);
	const previousJumpCommandRef = useRef(false);
	const pendingJumpPhysicsAtRef = useRef<number | null>(null);
	/**
	 * Timestamp (performance.now) when the most recent jump impulse fired.
	 * Used to suppress the grounded-ray for PLAYER_POST_JUMP_COYOTE_MS so that
	 * the capsule cannot be re-grounded one frame after launch, which froze Y.
	 */
	const lastJumpFiredAtRef = useRef<number | null>(null);
	/**
	 * Hysteresis flag: true when the player was considered grounded last frame.
	 * Switches between PLAYER_GROUND_MAX_DISTANCE (to enter grounded) and
	 * PLAYER_GROUND_STAY_DISTANCE (to stay grounded) so micro-bounces from
	 * horizontal movement do not flip isAirborne on each stride.
	 */
	const wasGroundedRef = useRef(false);
	/** Phase 4: tracks the last lerped XZ velocity so inertia is continuous across frames. */
	const smoothedHorizontalVelocityRef = useRef(Vector3.Zero());
	const roofLandingsRef = useRef<RoofLandingPointType[]>([]);
	const roofParkourStateRef = useRef<RoofParkourStateType>({ kind: 'idle' });
	const roofParkourDebugRef = useRef<RoofParkourDebugRendererType | null>(null);
	const roofParkourMarkerRef = useRef<RoofParkourMarkerRendererType | null>(null);
	const [playerMesh, setPlayerMesh] = useState<Mesh | null>(null);
	const [isMoving, setIsMoving] = useState(false);
	const [isSprinting, setIsSprinting] = useState(false);
	const [isAirborne, setIsAirborne] = useState(false);
	const [isInWater, setIsInWater] = useState(false);
	const [jumpAnimationRequestId, setJumpAnimationRequestId] = useState(0);

	commandsRef.current = commands;

	useEffect(() => {
		if (!getIsRoofParkourEnabled()) {
			roofLandingsRef.current = [];
			return undefined;
		}

		let isDisposed = false;

		fetch(PUERTO_ROOF_LANDINGS_URL)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to load Puerto roof landings: ${response.status}`);
				}

				return response.json() as Promise<RoofLandingPayloadType>;
			})
			.then((payload) => {
				if (!isDisposed) {
					roofLandingsRef.current = payload.landings;
				}
			})
			.catch((error: unknown) => {
				console.error('[Player] Failed to load Puerto roof traversal data', error);
			});

		return () => {
			isDisposed = true;
			roofLandingsRef.current = [];
		};
	}, []);

	useEffect(() => {
		if (!scene || !shouldShowRoofParkourDebug(getRoofTraversalSearch())) {
			roofParkourDebugRef.current?.dispose();
			roofParkourDebugRef.current = null;
			return undefined;
		}

		roofParkourDebugRef.current = createRoofParkourDebugRenderer(scene);

		return () => {
			roofParkourDebugRef.current?.dispose();
			roofParkourDebugRef.current = null;
		};
	}, [scene]);

	useEffect(() => {
		if (!scene || !getIsRoofParkourEnabled()) {
			roofParkourMarkerRef.current?.dispose();
			roofParkourMarkerRef.current = null;
			return undefined;
		}

		roofParkourMarkerRef.current = createRoofParkourMarkerRenderer(scene);

		return () => {
			roofParkourMarkerRef.current?.dispose();
			roofParkourMarkerRef.current = null;
		};
	}, [scene]);

	useEffect(() => {
		if (commands.jump && !previousJumpCommandRef.current && !isAirborneRef.current) {
			setJumpAnimationRequestId((requestId) => requestId + 1);
			pendingJumpPhysicsAtRef.current = performance.now() + PLAYER_JUMP_PHYSICS_DELAY_MS;
		}

		previousJumpCommandRef.current = commands.jump;
	}, [commands.jump]);

	useEffect(() => {
		if (!scene) {
			return;
		}

		let observer: Observer<BabylonScene> | null = null;

		observer = scene.onBeforeRenderObservable.add(() => {
			if (!playerMeshRef.current || !scene.activeCamera) {
				return;
			}

			const physicsBody = playerMeshRef.current.physicsBody;

			playerMeshRef.current.rotationQuaternion = Quaternion.Identity();
			playerMeshRef.current.rotation.copyFromFloats(0, 0, 0);

			const forward = scene.activeCamera.getForwardRay().direction;
			const facingDirection = getPlanarFacingDirection(forward);
			const right = Vector3.Cross(Vector3.UpReadOnly, forward);
			const movementDirection = resolveCameraRelativeMovement(
				commandsRef.current.move,
				forward,
				right,
			);
			const nextIsMoving = movementDirection.lengthSquared() > 0;
			const isFullIslandTraversal = getIsTenerifeFullIslandEnabled();

			if (isFullIslandTraversal) {
				const nextIsSprinting = nextIsMoving && commandsRef.current.sprint;
				const dryMoveSpeed = nextIsSprinting ? PLAYER_SPRINT_SPEED : PLAYER_MOVE_SPEED;
				const kinematicSupport = moveTenerifeFullIslandPlayer(
					playerMeshRef.current,
					scene,
					movementDirection,
					dryMoveSpeed,
					isInWaterRef.current,
				);
				const nextFullIslandIsAirborne = !kinematicSupport.isSupported;
				const nextIsInWater = kinematicSupport.isInWater;

				if (kinematicSupport.isEnteringWater) {
					createWaterEntrySplash(
						scene,
						new Vector3(
							playerMeshRef.current.absolutePosition.x,
							TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
							playerMeshRef.current.absolutePosition.z,
						),
					);
				}

				if (isMovingRef.current !== nextIsMoving) {
					isMovingRef.current = nextIsMoving;
					setIsMoving(nextIsMoving);
				}

				if (isSprintingRef.current !== nextIsSprinting) {
					isSprintingRef.current = nextIsSprinting;
					setIsSprinting(nextIsSprinting);
				}

				if (isAirborneRef.current !== nextFullIslandIsAirborne) {
					isAirborneRef.current = nextFullIslandIsAirborne;
					setIsAirborne(nextFullIslandIsAirborne);
				}

				if (isInWaterRef.current !== nextIsInWater) {
					isInWaterRef.current = nextIsInWater;
					setIsInWater(nextIsInWater);
				}

				if (nextIsMoving) {
					facingYawRef.current = Math.atan2(movementDirection.x, movementDirection.z);
				}

				return;
			}

			if (!physicsBody) {
				return;
			}

			physicsBody.setAngularVelocity(Vector3.Zero());

			const currentVelocity = physicsBody.getLinearVelocity();
			const currentVerticalVelocity = currentVelocity?.y ?? 0;
			const nextVerticalVelocity = Math.max(currentVerticalVelocity, PLAYER_MAX_FALL_SPEED);
			const groundRay = new Ray(
				playerMeshRef.current.absolutePosition.add(new Vector3(0, 0.1, 0)),
				Vector3.DownReadOnly,
				PLAYER_GROUND_RAY_LENGTH,
			);
			const groundHit = scene.pickWithRay(
				groundRay,
				(mesh) => isPlayerGroundMeshName(mesh.name) && mesh.isEnabled() && mesh.isPickable,
			);
			const groundNormal = groundHit?.getNormal(true, false) ?? null;
			const now = performance.now();
			const groundedState = resolvePlayerGroundedState({
				distance: groundHit?.hit ? (groundHit.distance ?? null) : null,
				enterDistance: PLAYER_GROUND_MAX_DISTANCE,
				floorLike: isFloorLikeNormal(groundNormal),
				landingDistance: PLAYER_GROUND_STAY_DISTANCE,
				lastJumpFiredAt: lastJumpFiredAtRef.current,
				now,
				postJumpSuppressionMs: PLAYER_POST_JUMP_COYOTE_MS,
				stayDistance: PLAYER_GROUND_STAY_DISTANCE,
				verticalVelocity: currentVerticalVelocity,
				wasGrounded: wasGroundedRef.current,
			});
			const isGrounded = groundedState.isGrounded;
			wasGroundedRef.current = isGrounded;

			const pendingJumpPhysicsAt = pendingJumpPhysicsAtRef.current;
			const shouldTriggerJump =
				pendingJumpPhysicsAt !== null && now >= pendingJumpPhysicsAt && isGrounded;
			const probeAdapter: RoofParkourProbeAdapterType = {
				castRay: (origin, direction, length) => {
					const hit = scene.pickWithRay(
						new Ray(origin, direction, length),
						(mesh) => mesh.isEnabled() && mesh.isPickable && isRoofParkourBuildingMeshName(mesh.name),
					);

					if (!hit?.hit || !hit.pickedPoint || !hit.pickedMesh) {
						return null;
					}

					return {
						meshName: hit.pickedMesh.name,
						normal: hit.getNormal(true, false),
						point: hit.pickedPoint,
					};
				},
			};
			const parkourResult = updateRoofParkourController({
				capsuleCenter: playerMeshRef.current.absolutePosition,
				facingDirection,
				isEnabled: getIsRoofParkourEnabled(),
				isGrounded,
				jumpTriggered: shouldTriggerJump,
				landings: roofLandingsRef.current,
				now,
				probes: probeAdapter,
				state: roofParkourStateRef.current,
			});

			roofParkourStateRef.current = parkourResult.nextState;
			roofParkourDebugRef.current?.render(parkourResult.debug);
			roofParkourMarkerRef.current?.render(parkourResult.debug);

			if (parkourResult.consumeJump) {
				pendingJumpPhysicsAtRef.current = null;
			}

			if (parkourResult.controlledPosition) {
				teleportPlayerPhysicsBody(playerMeshRef.current, parkourResult.controlledPosition);

				if (parkourResult.nextState.kind === 'idle') {
					setPlayerPhysicsPrestepDisabled(playerMeshRef.current);
				}
			}

			if (parkourResult.suppressMovement) {
				if (isAirborneRef.current) {
					isAirborneRef.current = false;
					setIsAirborne(false);
				}

				return;
			}

			if (shouldTriggerJump) {
				pendingJumpPhysicsAtRef.current = null;
				lastJumpFiredAtRef.current = now;
			} else if (
				pendingJumpPhysicsAt !== null &&
				now >= pendingJumpPhysicsAt + PLAYER_JUMP_QUEUE_EXPIRE_MS
			) {
				pendingJumpPhysicsAtRef.current = null;
			}

			const nextIsSprinting = nextIsMoving && commandsRef.current.sprint;
			const nextMoveSpeed = nextIsSprinting ? PLAYER_SPRINT_SPEED : PLAYER_MOVE_SPEED;
			const nextIsAirborne = shouldTriggerJump || !isGrounded;
			const deltaSeconds = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);

			/**
			 * Phase 1: project movement direction onto the ground surface so the player
			 * follows slopes instead of wedging horizontally into them.
			 * On flat ground (normal = up) this is a no-op.
			 */
			const slopeAdjustedDirection =
				groundNormal && isGrounded
					? projectOntoSurface(movementDirection, groundNormal)
					: movementDirection;

			/**
			 * Keep target speed based on input. Airborne steering is limited by reducing
			 * acceleration, and deceleration is disabled while airborne to preserve jump
			 * momentum if the player releases movement mid-air.
			 */
			const targetXZ = new Vector3(
				slopeAdjustedDirection.x * nextMoveSpeed,
				0,
				slopeAdjustedDirection.z * nextMoveSpeed,
			);

			const currentAcceleration = nextIsAirborne
				? PLAYER_MOVE_ACCELERATION * PLAYER_AIR_CONTROL
				: PLAYER_MOVE_ACCELERATION;

			const currentDeceleration = nextIsAirborne ? 0 : PLAYER_STOP_DECELERATION;

			smoothedHorizontalVelocityRef.current = lerpVelocityXZ(
				smoothedHorizontalVelocityRef.current,
				targetXZ,
				currentAcceleration,
				currentDeceleration,
				deltaSeconds,
			);

			if (shouldTriggerJump) {
				/**
				 * Jump frame: set full velocity including the upward impulse.
				 * After this we let Havok gravity drive Y on its own.
				 */
				physicsBody.setLinearVelocity(
					new Vector3(
						smoothedHorizontalVelocityRef.current.x,
						PLAYER_JUMP_VELOCITY,
						smoothedHorizontalVelocityRef.current.z,
					),
				);
			} else if (nextIsAirborne) {
				/**
				 * Mid-air: only update XZ. Let Havok integrate gravity on Y naturally.
				 * We only clamp Y to prevent infinite fall speed.
				 */
				const clampedY = Math.max(currentVerticalVelocity, PLAYER_MAX_FALL_SPEED);
				physicsBody.setLinearVelocity(
					new Vector3(
						smoothedHorizontalVelocityRef.current.x,
						clampedY,
						smoothedHorizontalVelocityRef.current.z,
					),
				);
			} else {
				/**
				 * On the ground: write full XZ + preserve Y from physics
				 * (lets the capsule stay pressed against slopes without fighting gravity).
				 */
				physicsBody.setLinearVelocity(
					new Vector3(
						smoothedHorizontalVelocityRef.current.x,
						nextVerticalVelocity,
						smoothedHorizontalVelocityRef.current.z,
					),
				);
			}

			if (isMovingRef.current !== nextIsMoving) {
				isMovingRef.current = nextIsMoving;
				setIsMoving(nextIsMoving);
			}

			if (isSprintingRef.current !== nextIsSprinting) {
				isSprintingRef.current = nextIsSprinting;
				setIsSprinting(nextIsSprinting);
			}

			if (isAirborneRef.current !== nextIsAirborne) {
				isAirborneRef.current = nextIsAirborne;
				setIsAirborne(nextIsAirborne);
			}

			if (nextIsMoving) {
				facingYawRef.current = Math.atan2(movementDirection.x, movementDirection.z);
			}
		});

		return () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}
		};
	}, [scene]);

	useEffect(() => {
		if (!scene || !playerMesh || isFullIslandTraversalEnabled) {
			return;
		}

		let observer: Observer<BabylonScene> | null = null;

		observer = scene.onBeforeRenderObservable.add(() => {
			if (!observer || !applyCollisionFilterToBody(playerMesh.physicsBody, 'player')) {
				return;
			}

			scene.onBeforeRenderObservable.remove(observer);
			observer = null;
		});

		return () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}
		};
	}, [isFullIslandTraversalEnabled, playerMesh, scene]);

	return (
		<>
			<cylinder
				name='player-placeholder'
				height={PLAYER_CAPSULE_HEIGHT}
				diameter={PLAYER_CAPSULE_DIAMETER}
				position={spawnPosition}
				visibility={0}
				onCreated={(instance) => {
					playerMeshRef.current = instance;
					setPlayerMesh(instance);
					onCreated?.(instance);
				}}
			>
				<standardMaterial
					name='player-placeholder-material'
					alpha={0}
					diffuseColor={Color3.FromHexString('#d96c3f')}
					specularColor={Color3.FromHexString('#2d211d')}
				/>
				{!isFullIslandTraversalEnabled && (
					<physicsAggregate type={PhysicsShapeType.CAPSULE} _options={PLAYER_PHYSICS_OPTIONS} />
				)}
			</cylinder>
			<AssetPlayerVisual
				facingYawRef={facingYawRef}
				isAirborne={isAirborne}
				isInWater={isInWater}
				isMoving={isMoving}
				isSprinting={isSprinting}
				jumpAnimationRequestId={jumpAnimationRequestId}
				targetMesh={playerMesh}
			/>
		</>
	);
};

export default Player;
