import type { AssetContainer, InstantiatedEntries } from '@babylonjs/core/assetContainer';
import { Ray } from '@babylonjs/core/Culling/ray';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/OBJ';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useScene } from 'react-babylonjs';
import { finishTenerifePerfTimer, startTenerifePerfTimer } from './tenerifePerformance';
import { getTerrainHeightAt } from './terrainData';
import type { WorldBuilding, WorldBuildingModelId } from './worldData';

type PropsType = {
	buildings: WorldBuilding[];
	debugLabel?: string;
	groundMeshName?: string;
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
	positionOffset?: { x: number; z: number };
};

const BUILDING_MODEL_ROOT_URL = '/models/build/buildings-pack-jan2019/OBJ/';
const BUILDING_MODEL_FILENAMES: Record<WorldBuildingModelId, string> = {
	'building-1-small': 'Building1_Small.obj',
	'building-2-small': 'Building2_Small.obj',
	'building-3-small': 'Building3_Small.obj',
	'building-4': 'Building4.obj',
	'house-1': 'House1.obj',
	'house-2': 'House2.obj',
};
const BUILDING_PHYSICS_OPTIONS = { mass: 0, restitution: 0.02, friction: 0.22 };
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
): Vector3 =>
	new Vector3(
		building.position.x + positionOffset.x,
		getTerrainHeightAt({
			x: building.position.x + positionOffset.x,
			z: building.position.z + positionOffset.z,
		}) + (building.heightOffset ?? 0),
		building.position.z + positionOffset.z,
	);

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
	positionOffset?: { x: number; z: number };
}> = ({ building, positionOffset }) => {
	const basePosition = getBuildingBasePosition(building, positionOffset);

	return (
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
		>
			<standardMaterial
				name={`${building.id}-fallback-material`}
				diffuseColor={Color3.FromHexString('#7c7465')}
				specularColor={Color3.FromHexString('#24211d')}
			/>
		</box>
	);
};

const BuildingCollider: React.FC<{
	building: WorldBuilding;
	havokPlugin: HavokPlugin | null;
	positionOffset?: { x: number; z: number };
}> = ({ building, havokPlugin, positionOffset = { x: 0, z: 0 } }) => {
	const { collider, heightOffset = 0, id, position, yaw } = building;
	const x = position.x + positionOffset.x;
	const z = position.z + positionOffset.z;
	const colliderPosition = new Vector3(
		x,
		getTerrainHeightAt({ x, z }) + heightOffset + collider.height / 2,
		z,
	);

	return (
		<box
			name={`${id}-collider`}
			size={1}
			position={colliderPosition}
			rotation={new Vector3(0, yaw, 0)}
			scaling={new Vector3(collider.width, collider.height, collider.depth)}
			onCreated={(mesh) => {
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
	groundMeshName?: string;
	positionOffset?: { x: number; z: number };
	onSettledChange: (modelId: string, isSettled: boolean) => void;
}> = ({ modelId, buildings, groundMeshName, positionOffset = { x: 0, z: 0 }, onSettledChange }) => {
	const scene = useScene();
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const anchorRef = useRef<TransformNode | null>(null);
	const instantiatedEntriesRef = useRef<InstantiatedEntries | null>(null);

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
			// If a ground mesh is specified, wait for it to be pickable
			if (groundMeshName) {
				const ground = scene.getMeshByName(groundMeshName);
				if (!ground?.isEnabled() || !ground.isPickable) {
					animationFrameId = requestAnimationFrame(trySettleBuildings);
					return;
				}
			}

			const count = buildings.length;
			const matrixBuffer = new Float32Array(count * 16);

			for (let i = 0; i < count; i++) {
				const b = buildings[i];
				const x = b.position.x + positionOffset.x;
				const z = b.position.z + positionOffset.z;
				let y = getTerrainHeightAt({ x, z }) + (b.heightOffset ?? 0);

				if (groundMeshName) {
					const ground = scene.getMeshByName(groundMeshName);
					if (ground) {
						const groundHit = scene.pickWithRay(
							new Ray(new Vector3(x, 200, z), Vector3.DownReadOnly, 400),
							(mesh) => mesh === ground,
						);
						if (groundHit?.hit && groundHit.pickedPoint) {
							y = groundHit.pickedPoint.y + (b.heightOffset ?? 0);
						}
					}
				}

				const matrix = Matrix.Compose(
					new Vector3(b.scale, b.scale, b.scale),
					Quaternion.RotationYawPitchRoll(b.yaw, 0, 0),
					new Vector3(x, y, z),
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
		modelId,
		onSettledChange,
		positionOffset.x,
		positionOffset.z,
		scene,
	]);

	if (status === 'ready') {
		return null;
	}

	return (
		<>
			{buildings.map((building) => (
				<BuildingFallback key={building.id} building={building} positionOffset={positionOffset} />
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
	groundMeshName,
	havokPlugin,
	onReadyChange,
	positionOffset,
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

	return (
		<>
			{Array.from(groupedBuildings.entries()).map(([modelId, groupBuildings]) => (
				<WorldBuildingModelManager
					key={modelId}
					modelId={modelId}
					buildings={groupBuildings}
					groundMeshName={groundMeshName}
					positionOffset={positionOffset}
					onSettledChange={(id, isSettled) => {
						setSettledModelIds((current) => {
							const next = new Set(current);
							if (isSettled) next.add(id);
							else next.delete(id);
							return next;
						});
					}}
				/>
			))}
			{buildings.map((building) => (
				<BuildingCollider
					key={`${building.id}-collider`}
					building={building}
					havokPlugin={havokPlugin}
					positionOffset={positionOffset}
				/>
			))}
		</>
	);
};

export default WorldBuildings;
