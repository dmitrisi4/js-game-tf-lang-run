import type { AssetContainer, InstantiatedEntries } from '@babylonjs/core/assetContainer';
import { Ray } from '@babylonjs/core/Culling/ray';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/OBJ';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useScene } from 'react-babylonjs';
import { publicAssetUrl } from '@/utils/publicAssetUrl';
import { finishTenerifePerfTimer, startTenerifePerfTimer } from './tenerifePerformance';
import { getTerrainHeightAt } from './terrainData';
import {
	getWorldBuildingAnchorPosition,
	getWorldBuildingColliderCenterY,
	getWorldBuildingFallbackCenterY,
	getWorldBuildingFootprintGroundY,
	getWorldBuildingFoundationCenterY,
	getWorldBuildingFoundationDepth,
} from './worldBuildingGrounding';
import type { WorldBuilding, WorldBuildingModelId, WorldPosition } from './worldData';

type PropsType = {
	buildings: WorldBuilding[];
	debugLabel?: string;
	groundHeightProvider?: GroundHeightProviderType;
	groundMeshName?: string;
	groundRaycastPredicate?: GroundRaycastPredicateType;
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
	positionOffset?: { x: number; z: number };
	visualMode?: 'boxes' | 'models';
};

type GroundHeightProviderType = (position: WorldPosition) => number | null;
type GroundRaycastPredicateType = (mesh: AbstractMesh) => boolean;

const BUILDING_MODEL_ROOT_URL = publicAssetUrl('/models/build/buildings-pack-jan2019/OBJ/');
const BUILDING_MODEL_FILENAMES: Record<WorldBuildingModelId, string> = {
	'building-1-small': 'Building1_Small.obj',
	'building-2-small': 'Building2_Small.obj',
	'building-3-small': 'Building3_Small.obj',
	'building-4': 'Building4.obj',
	'house-1': 'House1.obj',
	'house-2': 'House2.obj',
};
const BUILDING_PHYSICS_OPTIONS = { mass: 0, restitution: 0.02, friction: 0.22 };
const BUILDING_GROUND_RAY_START_Y = 260;
const BUILDING_GROUND_RAY_LENGTH = 560;
const buildingAssetContainerCache = new WeakMap<
	BabylonScene,
	Map<string, Promise<AssetContainer>>
>();

const getBuildingAssetContainer = (
	scene: BabylonScene,
	modelId: WorldBuildingModelId,
): Promise<AssetContainer> => {
	const sceneCache =
		buildingAssetContainerCache.get(scene) ?? new Map<string, Promise<AssetContainer>>();
	const filename = BUILDING_MODEL_FILENAMES[modelId];
	const modelUrl = `${BUILDING_MODEL_ROOT_URL}${filename}`;
	const cachedContainer = sceneCache.get(modelUrl);

	if (cachedContainer) {
		return cachedContainer;
	}

	const containerPromise = LoadAssetContainerAsync(modelUrl, scene);
	sceneCache.set(modelUrl, containerPromise);
	buildingAssetContainerCache.set(scene, sceneCache);

	return containerPromise;
};

const getBuildingBasePosition = (
	building: WorldBuilding,
	positionOffset = { x: 0, z: 0 },
	groundHeightProvider?: GroundHeightProviderType,
): Vector3 => {
	const anchor = getWorldBuildingAnchorPosition(building, positionOffset);
	const providerGroundY = groundHeightProvider
		? getWorldBuildingFootprintGroundY(building, groundHeightProvider, { positionOffset })
		: null;
	const terrainGroundY =
		providerGroundY ??
		getWorldBuildingFootprintGroundY(building, getTerrainHeightAt, { positionOffset }) ??
		getTerrainHeightAt(anchor);

	return new Vector3(anchor.x, terrainGroundY + (building.heightOffset ?? 0), anchor.z);
};

const isRaycastGroundCandidate = (
	candidateMesh: AbstractMesh,
	namedGround: AbstractMesh | null,
	groundMeshName?: string,
	groundRaycastPredicate?: GroundRaycastPredicateType,
): boolean => {
	if (!candidateMesh.isEnabled() || !candidateMesh.isPickable) {
		return false;
	}

	if (groundMeshName) {
		return candidateMesh === namedGround;
	}

	return groundRaycastPredicate?.(candidateMesh) ?? false;
};

const hasRaycastGroundCandidate = (
	scene: BabylonScene,
	groundMeshName?: string,
	groundRaycastPredicate?: GroundRaycastPredicateType,
): boolean => {
	if (!groundMeshName && !groundRaycastPredicate) {
		return false;
	}

	const namedGround = groundMeshName ? scene.getMeshByName(groundMeshName) : null;

	return scene.meshes.some((mesh) =>
		isRaycastGroundCandidate(mesh, namedGround, groundMeshName, groundRaycastPredicate),
	);
};

const getRaycastGroundYAtPosition = (
	scene: BabylonScene,
	position: WorldPosition,
	groundMeshName?: string,
	groundRaycastPredicate?: GroundRaycastPredicateType,
): number | null => {
	if (!groundMeshName && !groundRaycastPredicate) {
		return null;
	}

	const namedGround = groundMeshName ? scene.getMeshByName(groundMeshName) : null;
	const groundHit = scene.pickWithRay(
		new Ray(
			new Vector3(position.x, BUILDING_GROUND_RAY_START_Y, position.z),
			Vector3.DownReadOnly,
			BUILDING_GROUND_RAY_LENGTH,
		),
		(candidateMesh) =>
			isRaycastGroundCandidate(candidateMesh, namedGround, groundMeshName, groundRaycastPredicate),
	);

	return groundHit?.hit && groundHit.pickedPoint ? groundHit.pickedPoint.y : null;
};

const getRaycastGroundY = (
	scene: BabylonScene,
	building: WorldBuilding,
	positionOffset = { x: 0, z: 0 },
	groundMeshName?: string,
	groundRaycastPredicate?: GroundRaycastPredicateType,
): number | null => {
	return getWorldBuildingFootprintGroundY(
		building,
		(samplePoint) =>
			getRaycastGroundYAtPosition(scene, samplePoint, groundMeshName, groundRaycastPredicate),
		{ positionOffset },
	);
};

const setFallbackVisibility = (
	bodyMesh: Mesh,
	foundationMesh: Mesh | null,
	isVisible: boolean,
	isBodyPickable: boolean,
): void => {
	bodyMesh.isVisible = isVisible;
	bodyMesh.isPickable = isBodyPickable;

	if (foundationMesh) {
		foundationMesh.isVisible = isVisible;
		foundationMesh.isPickable = false;
	}
};

const alignFallbackVisualsToGround = (
	bodyMesh: Mesh,
	foundationMesh: Mesh | null,
	building: WorldBuilding,
	groundY: number,
): void => {
	bodyMesh.position.y = getWorldBuildingFallbackCenterY(building, groundY);

	if (foundationMesh) {
		foundationMesh.position.y = getWorldBuildingFoundationCenterY(building, groundY);
	}
};

const disablePickingForImportedRoot = (rootNode: TransformNode): void => {
	if (rootNode instanceof Mesh) {
		rootNode.isPickable = false;
	}

	for (const childMesh of rootNode.getChildMeshes(false)) {
		childMesh.isPickable = false;
	}
};

const getRootMeshes = (rootNode: TransformNode): Mesh[] => {
	const meshes = rootNode.getChildMeshes(false).filter((mesh): mesh is Mesh => mesh instanceof Mesh);

	if (rootNode instanceof Mesh) {
		meshes.push(rootNode);
	}

	return meshes;
};

const normalizeImportedRootsToZeroY = (rootNodes: TransformNode[]): void => {
	let minimumWorldY = Number.POSITIVE_INFINITY;

	for (const rootNode of rootNodes) {
		rootNode.computeWorldMatrix(true);

		for (const mesh of getRootMeshes(rootNode)) {
			mesh.computeWorldMatrix(true);
			mesh.refreshBoundingInfo(true);
			minimumWorldY = Math.min(minimumWorldY, mesh.getBoundingInfo().boundingBox.minimumWorld.y);
		}
	}

	if (!Number.isFinite(minimumWorldY)) {
		return;
	}

	for (const rootNode of rootNodes) {
		rootNode.position.y -= minimumWorldY;
	}
};

const BuildingFallback: React.FC<{
	building: WorldBuilding;
	groundMeshName?: string;
	groundHeightProvider?: GroundHeightProviderType;
	groundRaycastPredicate?: GroundRaycastPredicateType;
	positionOffset?: { x: number; z: number };
	showFoundation?: boolean;
}> = ({
	building,
	groundHeightProvider,
	groundMeshName,
	groundRaycastPredicate,
	positionOffset,
	showFoundation = false,
}) => {
	const scene = useScene();
	const meshRef = useRef<Mesh | null>(null);
	const foundationRef = useRef<Mesh | null>(null);
	const positionOffsetX = positionOffset?.x ?? 0;
	const positionOffsetZ = positionOffset?.z ?? 0;
	const resolvedPositionOffset = useMemo(
		() => ({ x: positionOffsetX, z: positionOffsetZ }),
		[positionOffsetX, positionOffsetZ],
	);
	const basePosition = getBuildingBasePosition(
		building,
		resolvedPositionOffset,
		groundHeightProvider,
	);
	const baseGroundY = basePosition.y - (building.heightOffset ?? 0);
	const foundationDepth = getWorldBuildingFoundationDepth(building);
	const needsRaycastGround = Boolean(groundMeshName || groundRaycastPredicate);

	useEffect(() => {
		const mesh = meshRef.current;

		if (!scene || !mesh || !needsRaycastGround) {
			return undefined;
		}

		let animationFrameId = 0;
		setFallbackVisibility(mesh, foundationRef.current, false, false);

		const alignFallbackToGround = () => {
			if (!hasRaycastGroundCandidate(scene, groundMeshName, groundRaycastPredicate)) {
				animationFrameId = requestAnimationFrame(alignFallbackToGround);
				return;
			}

			const groundY = getRaycastGroundY(
				scene,
				building,
				resolvedPositionOffset,
				groundMeshName,
				groundRaycastPredicate,
			);

			if (groundY !== null) {
				alignFallbackVisualsToGround(mesh, foundationRef.current, building, groundY);
				setFallbackVisibility(mesh, foundationRef.current, true, true);
				return;
			}

			animationFrameId = requestAnimationFrame(alignFallbackToGround);
		};

		alignFallbackToGround();

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [
		building,
		groundMeshName,
		groundRaycastPredicate,
		needsRaycastGround,
		resolvedPositionOffset,
		scene,
	]);

	return (
		<>
			<box
				name={`${building.id}-fallback`}
				size={1}
				position={
					new Vector3(basePosition.x, basePosition.y + building.collider.height * 0.42, basePosition.z)
				}
				rotation={new Vector3(0, building.yaw, 0)}
				scaling={
					new Vector3(
						building.collider.width * 0.8,
						building.collider.height * 0.84,
						building.collider.depth * 0.8,
					)
				}
				onCreated={(mesh) => {
					meshRef.current = mesh;
					mesh.isPickable = !needsRaycastGround;
					mesh.isVisible = !needsRaycastGround;
				}}
			>
				<standardMaterial
					name={`${building.id}-fallback-material`}
					diffuseColor={Color3.FromHexString('#7c7465')}
					specularColor={Color3.FromHexString('#24211d')}
				/>
			</box>
			{showFoundation ? (
				<box
					name={`${building.id}-foundation`}
					size={1}
					position={
						new Vector3(
							basePosition.x,
							getWorldBuildingFoundationCenterY(building, baseGroundY),
							basePosition.z,
						)
					}
					rotation={new Vector3(0, building.yaw, 0)}
					scaling={
						new Vector3(building.collider.width * 0.84, foundationDepth, building.collider.depth * 0.84)
					}
					onCreated={(mesh) => {
						foundationRef.current = mesh;
						mesh.isPickable = false;
						mesh.isVisible = !needsRaycastGround;
					}}
				>
					<standardMaterial
						name={`${building.id}-foundation-material`}
						diffuseColor={Color3.FromHexString('#554f45')}
						specularColor={Color3.FromHexString('#191613')}
					/>
				</box>
			) : null}
		</>
	);
};

const BuildingCollider: React.FC<{
	building: WorldBuilding;
	groundHeightProvider?: GroundHeightProviderType;
	groundRaycastPredicate?: GroundRaycastPredicateType;
	groundMeshName?: string;
	havokPlugin: HavokPlugin | null;
	positionOffset?: { x: number; z: number };
}> = ({
	building,
	groundHeightProvider,
	groundRaycastPredicate,
	groundMeshName,
	havokPlugin,
	positionOffset = { x: 0, z: 0 },
}) => {
	const { collider, id, yaw } = building;
	const scene = useScene();
	const meshRef = useRef<Mesh | null>(null);
	const positionOffsetX = positionOffset.x;
	const positionOffsetZ = positionOffset.z;
	const resolvedPositionOffset = useMemo(
		() => ({ x: positionOffsetX, z: positionOffsetZ }),
		[positionOffsetX, positionOffsetZ],
	);
	const anchor = getWorldBuildingAnchorPosition(building, resolvedPositionOffset);
	const basePosition = getBuildingBasePosition(
		building,
		resolvedPositionOffset,
		groundHeightProvider,
	);
	const colliderPosition = new Vector3(
		anchor.x,
		getWorldBuildingColliderCenterY(building, basePosition.y - (building.heightOffset ?? 0)),
		anchor.z,
	);

	useEffect(() => {
		const mesh = meshRef.current;

		if (!scene || !mesh || (!groundMeshName && !groundRaycastPredicate)) {
			return undefined;
		}

		let animationFrameId = 0;

		const alignColliderToGround = () => {
			const raycastGroundY = getRaycastGroundY(
				scene,
				building,
				resolvedPositionOffset,
				groundMeshName,
				groundRaycastPredicate,
			);

			if (raycastGroundY !== null) {
				mesh.position.y = getWorldBuildingColliderCenterY(building, raycastGroundY);
				mesh.physicsBody?.setTargetTransform(mesh.position, Quaternion.RotationYawPitchRoll(yaw, 0, 0));
				return;
			}

			animationFrameId = requestAnimationFrame(alignColliderToGround);
		};

		alignColliderToGround();

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [building, groundMeshName, groundRaycastPredicate, resolvedPositionOffset, scene, yaw]);

	return (
		<box
			name={`${id}-collider`}
			size={1}
			position={colliderPosition}
			rotation={new Vector3(0, yaw, 0)}
			scaling={new Vector3(collider.width, collider.height, collider.depth)}
			onCreated={(mesh) => {
				meshRef.current = mesh;
				mesh.isPickable = false;
				mesh.isVisible = false;
			}}
		>
			{havokPlugin && (
				<physicsAggregate type={PhysicsShapeType.BOX} _options={BUILDING_PHYSICS_OPTIONS} />
			)}
		</box>
	);
};

/**
 * Manages Thin Instances for a specific building model type.
 */
const WorldBuildingModelManager: React.FC<{
	modelId: WorldBuildingModelId;
	buildings: WorldBuilding[];
	groundHeightProvider?: GroundHeightProviderType;
	groundMeshName?: string;
	groundRaycastPredicate?: GroundRaycastPredicateType;
	positionOffset?: { x: number; z: number };
	onSettledChange: (modelId: string, isSettled: boolean) => void;
}> = ({
	modelId,
	buildings,
	groundHeightProvider,
	groundMeshName,
	groundRaycastPredicate,
	positionOffset = { x: 0, z: 0 },
	onSettledChange,
}) => {
	const scene = useScene();
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const anchorRef = useRef<TransformNode | null>(null);
	const instantiatedEntriesRef = useRef<InstantiatedEntries | null>(null);
	const positionOffsetX = positionOffset.x;
	const positionOffsetZ = positionOffset.z;
	const resolvedPositionOffset = useMemo(
		() => ({ x: positionOffsetX, z: positionOffsetZ }),
		[positionOffsetX, positionOffsetZ],
	);

	useEffect(() => {
		onSettledChange(modelId, false);
	}, [modelId, onSettledChange]);

	useEffect(() => {
		if (!scene) {
			return;
		}

		let isDisposed = false;

		const disposeImportedResources = () => {
			instantiatedEntriesRef.current?.dispose();

			if (anchorRef.current && !anchorRef.current.isDisposed()) {
				anchorRef.current.dispose(false, true);
			}

			instantiatedEntriesRef.current = null;
			anchorRef.current = null;
		};

		setStatus('loading');

		getBuildingAssetContainer(scene, modelId)
			.then((assetContainer) => {
				if (isDisposed) {
					return;
				}

				const anchorName = `building-manager-anchor-${modelId}`;
				const anchor = scene.getTransformNodeByName(anchorName) as TransformNode | null;
				const nextAnchor = anchor ?? new TransformNode(anchorName, scene);
				anchorRef.current = nextAnchor;

				const instantiatedEntries = assetContainer.instantiateModelsToScene(
					(sourceName) => `${modelId}-base-${sourceName}`,
					false,
				);
				instantiatedEntriesRef.current = instantiatedEntries;

				for (const rootNode of instantiatedEntries.rootNodes) {
					if (rootNode instanceof TransformNode) {
						rootNode.parent = nextAnchor;
						disablePickingForImportedRoot(rootNode);
					}
				}

				normalizeImportedRootsToZeroY(
					instantiatedEntries.rootNodes.filter(
						(rootNode): rootNode is TransformNode => rootNode instanceof TransformNode,
					),
				);

				for (const rootNode of instantiatedEntries.rootNodes) {
					for (const mesh of rootNode.getChildMeshes(false)) {
						if (mesh instanceof Mesh) {
							mesh.isVisible = false;
							mesh.doNotSyncBoundingInfo = true;
						}
					}
					if (rootNode instanceof Mesh) {
						rootNode.isVisible = false;
						rootNode.doNotSyncBoundingInfo = true;
					}
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
	}, [modelId, scene]);

	useEffect(() => {
		if (status !== 'ready' || !scene || !instantiatedEntriesRef.current) {
			return;
		}

		let animationFrameId = 0;

		const trySettleBuildings = () => {
			const needsRaycastGround = Boolean(groundMeshName || groundRaycastPredicate);

			if (
				needsRaycastGround &&
				!hasRaycastGroundCandidate(scene, groundMeshName, groundRaycastPredicate)
			) {
				animationFrameId = requestAnimationFrame(trySettleBuildings);
				return;
			}

			const count = buildings.length;
			const matrixBuffer = new Float32Array(count * 16);

			for (let i = 0; i < count; i++) {
				const b = buildings[i];
				const anchor = getWorldBuildingAnchorPosition(b, resolvedPositionOffset);
				const basePosition = getBuildingBasePosition(b, resolvedPositionOffset, groundHeightProvider);
				let y = basePosition.y;
				let scale = b.scale;

				const raycastGroundY = getRaycastGroundY(
					scene,
					b,
					resolvedPositionOffset,
					groundMeshName,
					groundRaycastPredicate,
				);
				if (raycastGroundY !== null) {
					y = raycastGroundY + (b.heightOffset ?? 0);
				} else if (needsRaycastGround) {
					scale = 0;
				}

				const matrix = Matrix.Compose(
					new Vector3(scale, scale, scale),
					Quaternion.RotationYawPitchRoll(b.yaw, 0, 0),
					new Vector3(anchor.x, y, anchor.z),
				);
				matrix.copyToArray(matrixBuffer, i * 16);
			}

			for (const rootNode of instantiatedEntriesRef.current?.rootNodes ?? []) {
				for (const mesh of rootNode.getChildMeshes(false)) {
					if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
						mesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
					}
				}
				if (rootNode instanceof Mesh && rootNode.getTotalVertices() > 0) {
					rootNode.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
				}
			}

			onSettledChange(modelId, true);
		};

		trySettleBuildings();

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [
		status,
		buildings,
		groundMeshName,
		groundHeightProvider,
		modelId,
		onSettledChange,
		resolvedPositionOffset,
		groundRaycastPredicate,
		scene,
	]);

	if (status === 'ready') {
		return null;
	}

	return (
		<>
			{buildings.map((building) => (
				<BuildingFallback
					key={building.id}
					building={building}
					groundHeightProvider={groundHeightProvider}
					groundMeshName={groundMeshName}
					groundRaycastPredicate={groundRaycastPredicate}
					positionOffset={positionOffset}
					showFoundation={false}
				/>
			))}
		</>
	);
};

/**
 * Renders all static building placements for the arena.
 *
 * @param {PropsType} props - Building list and physics plugin.
 * @returns {JSX.Element} Building visuals and colliders.
 */
const WorldBuildings: React.FC<PropsType> = ({
	buildings,
	debugLabel,
	groundHeightProvider,
	groundMeshName,
	groundRaycastPredicate,
	havokPlugin,
	onReadyChange,
	positionOffset,
	visualMode = 'models',
}) => {
	const [settledModelIds, setSettledModelIds] = useState<Set<string>>(() => new Set());
	const settlementStartedAtRef = useRef<number | null>(null);
	const hasReportedSettlementRef = useRef(false);

	const groupedBuildings = useMemo(() => {
		const groups = new Map<WorldBuildingModelId, WorldBuilding[]>();
		for (const building of buildings) {
			const group = groups.get(building.modelId) ?? [];
			group.push(building);
			groups.set(building.modelId, group);
		}
		return groups;
	}, [buildings]);

	useEffect(() => {
		setSettledModelIds(new Set());
		settlementStartedAtRef.current = startTenerifePerfTimer();
		hasReportedSettlementRef.current = false;
		onReadyChange?.(buildings.length === 0);
	}, [buildings, onReadyChange]);

	useEffect(() => {
		if (visualMode === 'boxes') {
			onReadyChange?.(true);
		}
	}, [onReadyChange, visualMode]);

	useEffect(() => {
		const isReady = buildings.length === 0 || settledModelIds.size >= groupedBuildings.size;

		if (isReady && debugLabel && !hasReportedSettlementRef.current) {
			finishTenerifePerfTimer(
				`Building settlement: ${debugLabel} (${buildings.length} buildings)`,
				settlementStartedAtRef.current,
			);
			hasReportedSettlementRef.current = true;
		}

		onReadyChange?.(isReady);
	}, [buildings.length, debugLabel, groupedBuildings.size, onReadyChange, settledModelIds]);

	const handleSettledChange = useCallback((id: string, isSettled: boolean) => {
		setSettledModelIds((current) => {
			const next = new Set(current);
			if (isSettled) next.add(id);
			else next.delete(id);
			return next;
		});
	}, []);

	return (
		<>
			{visualMode === 'models'
				? Array.from(groupedBuildings.entries()).map(([modelId, groupBuildings]) => (
						<WorldBuildingModelManager
							key={modelId}
							modelId={modelId}
							buildings={groupBuildings}
							groundHeightProvider={groundHeightProvider}
							groundMeshName={groundMeshName}
							groundRaycastPredicate={groundRaycastPredicate}
							positionOffset={positionOffset}
							onSettledChange={handleSettledChange}
						/>
					))
				: buildings.map((building) => (
						<BuildingFallback
							key={building.id}
							building={building}
							groundHeightProvider={groundHeightProvider}
							groundMeshName={groundMeshName}
							groundRaycastPredicate={groundRaycastPredicate}
							positionOffset={positionOffset}
							showFoundation={visualMode === 'boxes'}
						/>
					))}
			{buildings.map((building) => (
				<BuildingCollider
					key={`${building.id}-collider`}
					building={building}
					groundHeightProvider={groundHeightProvider}
					groundMeshName={groundMeshName}
					groundRaycastPredicate={groundRaycastPredicate}
					havokPlugin={havokPlugin}
					positionOffset={positionOffset}
				/>
			))}
		</>
	);
};

export default WorldBuildings;
