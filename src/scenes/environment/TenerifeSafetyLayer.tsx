import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import {
	PhysicsPrestepType,
	PhysicsShapeType,
} from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type { Scene } from '@babylonjs/core/scene';
import type React from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import {
	getTenerifePlayerResetPosition,
	shouldResetTenerifePlayer,
	TENERIFE_SEABED_Y,
	TENERIFE_WATER_BOUNDS,
	TENERIFE_WATER_SURFACE_Y,
} from './tenerifePreviewConfig';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	renderWaterVisuals?: boolean;
};

const SAFETY_PHYSICS_OPTIONS = { mass: 0, restitution: 0.02, friction: 0.62 };
const ZERO_VELOCITY = Vector3.Zero();

const teleportPlayerToCity = (playerMesh: AbstractMesh, scene: Scene | null): void => {
	const resetPosition = getTenerifePlayerResetPosition(scene);
	const physicsBody = playerMesh.physicsBody;

	playerMesh.position.copyFrom(resetPosition);
	playerMesh.rotationQuaternion = Quaternion.Identity();
	playerMesh.rotation.copyFromFloats(0, 0, 0);
	playerMesh.computeWorldMatrix(true);

	if (!physicsBody) {
		return;
	}

	physicsBody.setPrestepType(PhysicsPrestepType.TELEPORT);
	physicsBody.setTargetTransform(resetPosition, Quaternion.Identity());
	physicsBody.setLinearVelocity(ZERO_VELOCITY);
	physicsBody.setAngularVelocity(ZERO_VELOCITY);
};

/**
 * Adds water, seabed, and deep-water reset for the Tenerife city preview.
 *
 * @param {PropsType} props - Active physics plugin.
 * @returns {JSX.Element} Safety meshes for the preview island.
 */
const TenerifeSafetyLayer: React.FC<PropsType> = ({ havokPlugin, renderWaterVisuals = true }) => {
	const scene = useScene();

	useBeforeRender(() => {
		const playerMesh = scene?.getMeshByName('player-placeholder');

		if (!playerMesh) {
			return;
		}

		if (shouldResetTenerifePlayer(playerMesh.absolutePosition)) {
			teleportPlayerToCity(playerMesh, scene);
		}
	});

	if (!renderWaterVisuals) {
		return null;
	}

	const width = TENERIFE_WATER_BOUNDS.maxX - TENERIFE_WATER_BOUNDS.minX;
	const depth = TENERIFE_WATER_BOUNDS.maxZ - TENERIFE_WATER_BOUNDS.minZ;
	const centerX = (TENERIFE_WATER_BOUNDS.minX + TENERIFE_WATER_BOUNDS.maxX) / 2;
	const centerZ = (TENERIFE_WATER_BOUNDS.minZ + TENERIFE_WATER_BOUNDS.maxZ) / 2;

	return (
		<>
			<box
				name='tenerife-water-surface'
				position={new Vector3(centerX, TENERIFE_WATER_SURFACE_Y, centerZ)}
				scaling={new Vector3(width, 0.04, depth)}
				size={1}
				onCreated={(mesh) => {
					mesh.isPickable = false;
				}}
			>
				<standardMaterial
					name='tenerife-water-material'
					alpha={0.62}
					diffuseColor={Color3.FromHexString('#2f91b9')}
					specularColor={Color3.FromHexString('#b9eef8')}
				/>
			</box>
			<box
				name='tenerife-seabed'
				position={new Vector3(centerX, TENERIFE_SEABED_Y, centerZ)}
				scaling={new Vector3(width, 0.7, depth)}
				size={1}
			>
				<standardMaterial
					name='tenerife-seabed-material'
					diffuseColor={Color3.FromHexString('#82745b')}
					specularColor={Color3.FromHexString('#2d261d')}
				/>
				{havokPlugin && (
					<physicsAggregate type={PhysicsShapeType.BOX} _options={SAFETY_PHYSICS_OPTIONS} />
				)}
			</box>
		</>
	);
};

export default TenerifeSafetyLayer;
