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

type PropsType = {
	commands: PlayerInputCommands;
	onCreated?: (mesh: Mesh) => void;
	spawnPosition?: Vector3;
};

const PLAYER_MOVE_SPEED = 4.5;
const PLAYER_SPRINT_SPEED = 7;
const PLAYER_JUMP_VELOCITY = 6.5;
const PLAYER_JUMP_PHYSICS_DELAY_MS = 310;
const PLAYER_JUMP_QUEUE_EXPIRE_MS = 260;
const PLAYER_GROUND_RAY_LENGTH = 1.28;
const PLAYER_GROUND_MAX_VERTICAL_SPEED = 0.45;
const TENERIFE_FULL_ISLAND_SUPPORT_RAY_HEIGHT = 80;
const TENERIFE_FULL_ISLAND_SUPPORT_RAY_LENGTH = 180;
const TENERIFE_FULL_ISLAND_KINEMATIC_FALLBACK_STEP_DOWN = 1.2;
const PLAYER_MAX_FALL_SPEED = -18;
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
	normal: Vector3 | null;
	supportedCenterY: number;
};

/** Resolves the full-island terrain height under the player capsule. */
const getTenerifeFullIslandSupportAtPosition = (
	position: Vector3,
	scene: BabylonScene,
): TenerifeFullIslandSupportType | null => {
	const heightfieldY = getTenerifeFullIslandHeightAtPosition(position);

	if (heightfieldY !== null) {
		return {
			normal: null,
			supportedCenterY: getCapsuleCenterYForFloor(heightfieldY),
		};
	}

	const supportHit = scene.pickWithRay(
		new Ray(
			position.add(new Vector3(0, TENERIFE_FULL_ISLAND_SUPPORT_RAY_HEIGHT, 0)),
			Vector3.DownReadOnly,
			TENERIFE_FULL_ISLAND_SUPPORT_RAY_LENGTH,
		),
		(mesh) => isTenerifeFullIslandTerrainMeshName(mesh.name) && mesh.isEnabled() && mesh.isPickable,
	);

	if (!supportHit?.hit || !supportHit.pickedPoint) {
		return null;
	}

	const supportedCenterY = getCapsuleCenterYForFloor(supportHit.pickedPoint.y);

	return {
		normal: supportHit.getNormal(true, false),
		supportedCenterY,
	};
};

/** Moves the player body vertically without resetting its horizontal movement state. */
const movePlayerPhysicsBodyVertically = (playerMesh: Mesh, nextY: number): void => {
	const physicsBody = playerMesh.physicsBody;
	const nextPosition = new Vector3(
		playerMesh.absolutePosition.x,
		nextY,
		playerMesh.absolutePosition.z,
	);

	playerMesh.position.copyFrom(nextPosition);
	playerMesh.rotationQuaternion = Quaternion.Identity();
	playerMesh.rotation.copyFromFloats(0, 0, 0);
	playerMesh.computeWorldMatrix(true);

	if (!physicsBody) {
		return;
	}

	physicsBody.setPrestepType(PhysicsPrestepType.TELEPORT);
	physicsBody.setTargetTransform(nextPosition, Quaternion.Identity());
	physicsBody.setAngularVelocity(ZERO_VELOCITY);
};

/** Moves the full-island player as a terrain-following kinematic body. */
const moveTenerifeFullIslandPlayer = (
	playerMesh: Mesh,
	scene: BabylonScene,
	movementDirection: Vector3,
	moveSpeed: number,
): { isSupported: boolean; normal: Vector3 | null } => {
	const deltaSeconds = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
	const currentPosition = playerMesh.absolutePosition;
	const nextPlanarPosition = new Vector3(
		currentPosition.x + movementDirection.x * moveSpeed * deltaSeconds,
		currentPosition.y,
		currentPosition.z + movementDirection.z * moveSpeed * deltaSeconds,
	);
	const support =
		getTenerifeFullIslandSupportAtPosition(nextPlanarPosition, scene) ??
		getTenerifeFullIslandSupportAtPosition(currentPosition, scene);

	if (!support) {
		movePlayerPhysicsBodyVertically(
			playerMesh,
			currentPosition.y - TENERIFE_FULL_ISLAND_KINEMATIC_FALLBACK_STEP_DOWN * deltaSeconds,
		);

		return { isSupported: false, normal: null };
	}

	const nextPosition = new Vector3(
		nextPlanarPosition.x,
		support.supportedCenterY,
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

	return { isSupported: true, normal: support.normal };
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
	const facingYawRef = useRef(0);
	const previousJumpCommandRef = useRef(false);
	const pendingJumpPhysicsAtRef = useRef<number | null>(null);
	const roofLandingsRef = useRef<RoofLandingPointType[]>([]);
	const roofParkourStateRef = useRef<RoofParkourStateType>({ kind: 'idle' });
	const roofParkourDebugRef = useRef<RoofParkourDebugRendererType | null>(null);
	const roofParkourMarkerRef = useRef<RoofParkourMarkerRendererType | null>(null);
	const [playerMesh, setPlayerMesh] = useState<Mesh | null>(null);
	const [isMoving, setIsMoving] = useState(false);
	const [isSprinting, setIsSprinting] = useState(false);
	const [isAirborne, setIsAirborne] = useState(false);
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
				const nextMoveSpeed = nextIsSprinting ? PLAYER_SPRINT_SPEED : PLAYER_MOVE_SPEED;
				const kinematicSupport = moveTenerifeFullIslandPlayer(
					playerMeshRef.current,
					scene,
					movementDirection,
					nextMoveSpeed,
				);
				const nextFullIslandIsAirborne = !kinematicSupport.isSupported;

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
			const isGrounded =
				Boolean(groundHit?.hit) &&
				isFloorLikeNormal(groundNormal) &&
				Math.abs(currentVerticalVelocity) <= PLAYER_GROUND_MAX_VERTICAL_SPEED;

			const now = performance.now();
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
			} else if (
				pendingJumpPhysicsAt !== null &&
				now >= pendingJumpPhysicsAt + PLAYER_JUMP_QUEUE_EXPIRE_MS
			) {
				pendingJumpPhysicsAtRef.current = null;
			}

			const nextIsSprinting = nextIsMoving && commandsRef.current.sprint;
			const nextMoveSpeed = nextIsSprinting ? PLAYER_SPRINT_SPEED : PLAYER_MOVE_SPEED;
			const nextIsAirborne = shouldTriggerJump || !isGrounded;

			physicsBody.setLinearVelocity(
				new Vector3(
					movementDirection.x * nextMoveSpeed,
					shouldTriggerJump ? PLAYER_JUMP_VELOCITY : nextVerticalVelocity,
					movementDirection.z * nextMoveSpeed,
				),
			);

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
				isMoving={isMoving}
				isSprinting={isSprinting}
				jumpAnimationRequestId={jumpAnimationRequestId}
				targetMesh={playerMesh}
			/>
		</>
	);
};

export default Player;
