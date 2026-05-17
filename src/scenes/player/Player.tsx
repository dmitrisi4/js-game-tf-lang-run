import { Ray } from '@babylonjs/core/Culling/ray';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Observer } from '@babylonjs/core/Misc/observable';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useScene } from 'react-babylonjs';
import AssetPlayerVisual from './AssetPlayerVisual';
import type { PlayerInputCommands } from './inputTypes';
import { resolveCameraRelativeMovement } from './PlayerController';

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
const PLAYER_MAX_FALL_SPEED = -18;
const PLAYER_SPAWN_POSITION = new Vector3(-7, 1.5, -6);
const PLAYER_GROUND_MESH_NAMES = new Set(['ground1', 'tenerife-seabed']);
const PLAYER_PHYSICS_OPTIONS = {
	mass: 1,
	restitution: 0,
	friction: 0.08,
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
	const playerMeshRef = useRef<Mesh | null>(null);
	const commandsRef = useRef(commands);
	const isMovingRef = useRef(false);
	const isSprintingRef = useRef(false);
	const isAirborneRef = useRef(false);
	const facingYawRef = useRef(0);
	const previousJumpCommandRef = useRef(false);
	const pendingJumpPhysicsAtRef = useRef<number | null>(null);
	const [playerMesh, setPlayerMesh] = useState<Mesh | null>(null);
	const [isMoving, setIsMoving] = useState(false);
	const [isSprinting, setIsSprinting] = useState(false);
	const [isAirborne, setIsAirborne] = useState(false);
	const [jumpAnimationRequestId, setJumpAnimationRequestId] = useState(0);

	commandsRef.current = commands;

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

			if (!physicsBody) {
				return;
			}

			physicsBody.setAngularVelocity(Vector3.Zero());
			playerMeshRef.current.rotationQuaternion = Quaternion.Identity();
			playerMeshRef.current.rotation.copyFromFloats(0, 0, 0);

			const forward = scene.activeCamera.getForwardRay().direction;
			const right = Vector3.Cross(Vector3.UpReadOnly, forward);
			const movementDirection = resolveCameraRelativeMovement(
				commandsRef.current.move,
				forward,
				right,
			);
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
				(mesh) => PLAYER_GROUND_MESH_NAMES.has(mesh.name) && mesh.isEnabled() && mesh.isPickable,
			);
			const isGrounded =
				Boolean(groundHit?.hit) &&
				Math.abs(currentVerticalVelocity) <= PLAYER_GROUND_MAX_VERTICAL_SPEED;
			const now = performance.now();
			const pendingJumpPhysicsAt = pendingJumpPhysicsAtRef.current;
			const shouldTriggerJump =
				pendingJumpPhysicsAt !== null && now >= pendingJumpPhysicsAt && isGrounded;

			if (shouldTriggerJump) {
				pendingJumpPhysicsAtRef.current = null;
			} else if (
				pendingJumpPhysicsAt !== null &&
				now >= pendingJumpPhysicsAt + PLAYER_JUMP_QUEUE_EXPIRE_MS
			) {
				pendingJumpPhysicsAtRef.current = null;
			}

			const nextIsMoving = movementDirection.lengthSquared() > 0;
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

	return (
		<>
			<cylinder
				name='player-placeholder'
				height={1.8}
				diameter={0.8}
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
				<physicsAggregate type={PhysicsShapeType.CAPSULE} _options={PLAYER_PHYSICS_OPTIONS} />
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
