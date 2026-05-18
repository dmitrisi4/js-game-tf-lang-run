import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { Ray } from '@babylonjs/core/Culling/ray';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/glTF';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import { isRoofParkourBuildingMeshName } from './roofParkourController';

const PLAYER_MODEL_ROOT_URL = '/models/hero/pumkinboy-rigged-animated-character/source/';
const PLAYER_MODEL_FILENAME = 'Pumpkinboy_10Animations.glb';
const PLAYER_MODEL_TARGET_HEIGHT = 1.72;
const PLAYER_MODEL_FORWARD_OFFSET = 0;
const PLAYER_VISUAL_GROUND_CLEARANCE = 0.02;
const PLAYER_VISUAL_GROUND_RAY_HEIGHT = 4;
const PLAYER_VISUAL_GROUND_RAY_LENGTH = 8;
const USE_IMPORTED_LOCOMOTION_ANIMATION = true;
const ROOT_MOTION_NODE_NAMES = new Set([
	'Armature',
	'Character',
	'ControlBone',
	'ROOT',
	'Skateboard_ROOT',
]);
const BODY_CENTER_NODE_NAMES = ['ROOT', 'Back_Low', 'Leg_Up.l', 'Leg_Up.r'];
const FOOT_NODE_NAMES = ['Toe.l', 'Toe.r', 'Foot.l', 'Foot.r'];
const PLAYER_VISUAL_GROUND_MESH_NAMES = new Set(['ground1', 'tenerife-seabed']);

const isPlayerVisualGroundMeshName = (name: string): boolean =>
	PLAYER_VISUAL_GROUND_MESH_NAMES.has(name) || isRoofParkourBuildingMeshName(name);

type PropsType = {
	facingYawRef: React.RefObject<number>;
	isAirborne: boolean;
	isMoving: boolean;
	isSprinting: boolean;
	jumpAnimationRequestId: number;
	targetMesh: Mesh | null;
};

const hasRenderableGeometry = (mesh: AbstractMesh): mesh is Mesh =>
	mesh instanceof Mesh && mesh.getTotalVertices() > 0;

const getLocalBoundsForMeshes = (
	root: TransformNode,
	meshes: AbstractMesh[],
): { min: Vector3; max: Vector3 } | null => {
	const renderableMeshes = meshes.filter(hasRenderableGeometry);

	if (renderableMeshes.length === 0) {
		return null;
	}

	root.computeWorldMatrix(true);
	const invertedRootWorld = Matrix.Invert(root.getWorldMatrix());
	const min = new Vector3(
		Number.POSITIVE_INFINITY,
		Number.POSITIVE_INFINITY,
		Number.POSITIVE_INFINITY,
	);
	const max = new Vector3(
		Number.NEGATIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
	);

	for (const mesh of renderableMeshes) {
		mesh.computeWorldMatrix(true);

		for (const corner of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
			const localCorner = Vector3.TransformCoordinates(corner, invertedRootWorld);
			min.minimizeInPlace(localCorner);
			max.maximizeInPlace(localCorner);
		}
	}

	return { min, max };
};

const getLocalPointForNode = (root: TransformNode, node: TransformNode): Vector3 => {
	root.computeWorldMatrix(true);
	node.computeWorldMatrix(true);
	const invertedRootWorld = Matrix.Invert(root.getWorldMatrix());

	return Vector3.TransformCoordinates(node.getAbsolutePosition(), invertedRootWorld);
};

const getBodyAnchorForNodes = (
	root: TransformNode,
	transformNodes: TransformNode[],
): { centerX: number; centerZ: number; minY: number } | null => {
	const bodyNodes = BODY_CENTER_NODE_NAMES.map((nodeName) =>
		transformNodes.find((transformNode) => transformNode.name === nodeName),
	).filter((transformNode): transformNode is TransformNode => Boolean(transformNode));
	const footNodes = FOOT_NODE_NAMES.map((nodeName) =>
		transformNodes.find((transformNode) => transformNode.name === nodeName),
	).filter((transformNode): transformNode is TransformNode => Boolean(transformNode));

	if (bodyNodes.length === 0 || footNodes.length === 0) {
		return null;
	}

	const bodyPoints = bodyNodes.map((node) => getLocalPointForNode(root, node));
	const footPoints = footNodes.map((node) => getLocalPointForNode(root, node));
	const centerX = bodyPoints.reduce((sum, point) => sum + point.x, 0) / bodyPoints.length;
	const centerZ = bodyPoints.reduce((sum, point) => sum + point.z, 0) / bodyPoints.length;
	const minY = Math.min(...footPoints.map((point) => point.y));

	return { centerX, centerZ, minY };
};

const getVisualFootAnchorPosition = (targetMesh: Mesh, scene: BabylonScene): Vector3 => {
	const rayOrigin = targetMesh.absolutePosition.add(
		new Vector3(0, PLAYER_VISUAL_GROUND_RAY_HEIGHT, 0),
	);
	const groundHit = scene.pickWithRay(
		new Ray(rayOrigin, Vector3.DownReadOnly, PLAYER_VISUAL_GROUND_RAY_LENGTH),
		(mesh) => isPlayerVisualGroundMeshName(mesh.name) && mesh.isEnabled() && mesh.isPickable,
	);

	if (groundHit?.hit && groundHit.pickedPoint) {
		return new Vector3(
			targetMesh.absolutePosition.x,
			groundHit.pickedPoint.y + PLAYER_VISUAL_GROUND_CLEARANCE,
			targetMesh.absolutePosition.z,
		);
	}

	return new Vector3(
		targetMesh.absolutePosition.x,
		targetMesh.absolutePosition.y,
		targetMesh.absolutePosition.z,
	);
};

const stripRootMotion = (animationGroup: AnimationGroup): void => {
	const mutableTargetedAnimations = animationGroup.targetedAnimations as Array<
		(typeof animationGroup.targetedAnimations)[number]
	>;
	const filteredTargetedAnimations = mutableTargetedAnimations.filter((targetedAnimation) => {
		const targetName =
			'name' in targetedAnimation.target && typeof targetedAnimation.target.name === 'string'
				? targetedAnimation.target.name
				: null;

		if (!targetName) {
			return true;
		}

		if (targetName.startsWith('IK_')) {
			return false;
		}

		return !ROOT_MOTION_NODE_NAMES.has(targetName);
	});

	mutableTargetedAnimations.splice(
		0,
		mutableTargetedAnimations.length,
		...filteredTargetedAnimations,
	);
};

/**
 * Loads the first imported player-facing visual while leaving physics authority
 * on the runtime body owned by `Player.tsx`.
 *
 * @param {PropsType} props - Visual target props.
 * @returns {null} The imported visual is attached directly to the Babylon scene.
 */
const AssetPlayerVisual: React.FC<PropsType> = ({
	facingYawRef,
	isAirborne,
	isMoving,
	isSprinting,
	jumpAnimationRequestId,
	targetMesh,
}) => {
	const scene = useScene();
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const anchorRef = useRef<TransformNode | null>(null);
	const orientationRootRef = useRef<TransformNode | null>(null);
	const visualRootRef = useRef<TransformNode | null>(null);
	const importedRootRef = useRef<TransformNode | null>(null);
	const importedMeshesRef = useRef<AbstractMesh[]>([]);
	const importedTransformNodesRef = useRef<TransformNode[]>([]);
	const animationGroupsRef = useRef<AnimationGroup[]>([]);
	const activeAnimationNameRef = useRef<string | null>(null);
	const lastJumpAnimationRequestIdRef = useRef(0);
	const fallbackMeshRef = useRef<Mesh | null>(null);

	useBeforeRender(() => {
		if (status !== 'error' || !targetMesh || !fallbackMeshRef.current) {
			return;
		}

		fallbackMeshRef.current.position.copyFrom(targetMesh.absolutePosition);
		fallbackMeshRef.current.rotation.y = facingYawRef.current ?? 0;
	});

	useEffect(() => {
		if (!scene || !targetMesh) {
			return;
		}

		let isDisposed = false;
		let syncObserver: Observer<BabylonScene> | null = null;

		const disposeImportedResources = () => {
			if (syncObserver) {
				scene.onBeforeRenderObservable.remove(syncObserver);
				syncObserver = null;
			}

			for (const mesh of importedMeshesRef.current) {
				if (!mesh.isDisposed()) {
					mesh.dispose(false, true);
				}
			}

			for (const transformNode of importedTransformNodesRef.current) {
				if (!transformNode.isDisposed()) {
					transformNode.dispose(false, true);
				}
			}

			for (const animationGroup of animationGroupsRef.current) {
				animationGroup.dispose();
			}

			if (anchorRef.current && !anchorRef.current.isDisposed()) {
				anchorRef.current.dispose(false, true);
			}

			if (visualRootRef.current && !visualRootRef.current.isDisposed()) {
				visualRootRef.current.dispose(false, true);
			}

			if (orientationRootRef.current && !orientationRootRef.current.isDisposed()) {
				orientationRootRef.current.dispose(false, true);
			}

			if (importedRootRef.current && !importedRootRef.current.isDisposed()) {
				importedRootRef.current.dispose(false, true);
			}

			importedMeshesRef.current = [];
			importedTransformNodesRef.current = [];
			animationGroupsRef.current = [];
			activeAnimationNameRef.current = null;
			lastJumpAnimationRequestIdRef.current = 0;
			anchorRef.current = null;
			orientationRootRef.current = null;
			visualRootRef.current = null;
			importedRootRef.current = null;
		};

		setStatus('loading');

		SceneLoader.ImportMeshAsync(undefined, PLAYER_MODEL_ROOT_URL, PLAYER_MODEL_FILENAME, scene)
			.then((result) => {
				if (isDisposed) {
					for (const mesh of result.meshes) {
						mesh.dispose(false, true);
					}

					for (const transformNode of result.transformNodes) {
						transformNode.dispose(false, true);
					}

					return;
				}

				const anchor = new TransformNode(`player-visual-anchor-${targetMesh.uniqueId}`, scene);
				anchor.position.copyFrom(getVisualFootAnchorPosition(targetMesh, scene));
				anchorRef.current = anchor;
				syncObserver = scene.onBeforeRenderObservable.add(() => {
					anchor.position.copyFrom(getVisualFootAnchorPosition(targetMesh, scene));
					anchor.rotationQuaternion = null;
					anchor.rotation.copyFromFloats(0, 0, 0);
					orientationRoot.rotation.y = (facingYawRef.current ?? 0) + PLAYER_MODEL_FORWARD_OFFSET;
				});

				const orientationRoot = new TransformNode(
					`player-orientation-root-${targetMesh.uniqueId}`,
					scene,
				);
				orientationRoot.parent = anchor;
				orientationRoot.rotationQuaternion = null;
				orientationRoot.rotation.copyFromFloats(0, 0, 0);
				orientationRootRef.current = orientationRoot;

				const visualRoot = new TransformNode(`player-visual-root-${targetMesh.uniqueId}`, scene);
				visualRoot.parent = orientationRoot;
				visualRoot.rotationQuaternion = null;
				visualRoot.rotation.copyFromFloats(0, 0, 0);
				visualRootRef.current = visualRoot;

				const importedRoot = new TransformNode(`player-imported-root-${targetMesh.uniqueId}`, scene);
				importedRoot.parent = visualRoot;
				importedRoot.rotationQuaternion = null;
				importedRoot.rotation.copyFromFloats(0, 0, 0);
				importedRootRef.current = importedRoot;

				importedMeshesRef.current = result.meshes;
				importedTransformNodesRef.current = result.transformNodes;
				animationGroupsRef.current = result.animationGroups;

				for (const animationGroup of result.animationGroups) {
					stripRootMotion(animationGroup);
				}

				for (const transformNode of result.transformNodes) {
					if (!transformNode.parent) {
						transformNode.parent = importedRoot;
					}
				}

				for (const mesh of result.meshes) {
					mesh.isPickable = false;

					if (!mesh.parent) {
						mesh.parent = importedRoot;
					}
				}

				const localBounds = getLocalBoundsForMeshes(importedRoot, result.meshes);
				const bodyAnchor = getBodyAnchorForNodes(importedRoot, result.transformNodes);

				if (localBounds) {
					const modelHeight = Math.max(localBounds.max.y - localBounds.min.y, 0.001);
					const uniformScale = PLAYER_MODEL_TARGET_HEIGHT / modelHeight;
					const centerX = bodyAnchor
						? bodyAnchor.centerX
						: (localBounds.min.x + localBounds.max.x) * 0.5;
					const centerZ = bodyAnchor
						? bodyAnchor.centerZ
						: (localBounds.min.z + localBounds.max.z) * 0.5;
					const minY = bodyAnchor ? bodyAnchor.minY : localBounds.min.y;

					importedRoot.scaling.copyFromFloats(uniformScale, uniformScale, uniformScale);
					importedRoot.position.set(
						-centerX * uniformScale,
						-minY * uniformScale,
						-centerZ * uniformScale,
					);
				}

				setStatus('ready');
			})
			.catch(() => {
				if (isDisposed) {
					return;
				}

				disposeImportedResources();
				setStatus('error');
			});

		return () => {
			isDisposed = true;
			disposeImportedResources();
		};
	}, [facingYawRef, scene, targetMesh]);

	useEffect(() => {
		if (status !== 'ready') {
			return;
		}

		const animationGroups = animationGroupsRef.current;

		if (animationGroups.length === 0) {
			return;
		}

		const findAnimationGroup = (patterns: string[]): AnimationGroup | null => {
			const normalizedPatterns = patterns.map((pattern) => pattern.toLowerCase());

			return (
				animationGroups.find((animationGroup) => {
					const normalizedName = animationGroup.name.toLowerCase();
					return normalizedPatterns.some((pattern) => normalizedName.includes(pattern));
				}) ?? null
			);
		};

		const hasPendingJumpAnimationRequest =
			jumpAnimationRequestId !== lastJumpAnimationRequestIdRef.current;
		const shouldPlayJumpAnimation = isAirborne || hasPendingJumpAnimationRequest;
		const targetAnimation =
			(shouldPlayJumpAnimation ? findAnimationGroup(['jump']) : null) ??
			(isSprinting && USE_IMPORTED_LOCOMOTION_ANIMATION
				? findAnimationGroup(['sprint', 'run'])
				: null) ??
			(isMoving && USE_IMPORTED_LOCOMOTION_ANIMATION
				? findAnimationGroup(['walk', 'move', 'run'])
				: null) ??
			findAnimationGroup(['idle']) ??
			animationGroups[0];

		if (
			!targetAnimation ||
			(!hasPendingJumpAnimationRequest && activeAnimationNameRef.current === targetAnimation.name)
		) {
			return;
		}

		lastJumpAnimationRequestIdRef.current = jumpAnimationRequestId;

		for (const animationGroup of animationGroups) {
			animationGroup.stop();
		}

		targetAnimation.start(!shouldPlayJumpAnimation);
		activeAnimationNameRef.current = targetAnimation.name;
	}, [isAirborne, isMoving, isSprinting, jumpAnimationRequestId, status]);

	if (status !== 'error' || !targetMesh) {
		return null;
	}

	return (
		<cylinder
			name={`player-visual-fallback-${targetMesh.uniqueId}`}
			height={1.8}
			diameter={0.75}
			position={targetMesh.absolutePosition.clone()}
			onCreated={(mesh) => {
				mesh.isPickable = false;
				fallbackMeshRef.current = mesh;
			}}
		>
			<standardMaterial
				name={`player-visual-fallback-material-${targetMesh.uniqueId}`}
				diffuseColor={Color3.FromHexString('#d96c3f')}
				emissiveColor={Color3.FromHexString('#2d211d')}
				specularColor={Color3.FromHexString('#1a1412')}
			/>
		</cylinder>
	);
};

export default AssetPlayerVisual;
