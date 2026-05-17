import type { AssetContainer, InstantiatedEntries } from '@babylonjs/core/assetContainer';
import { Ray } from '@babylonjs/core/Culling/ray';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/OBJ';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
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

type WorldBuildingViewPropsType = {
	building: WorldBuilding;
	groundMeshName?: string;
	havokPlugin: HavokPlugin | null;
	onSettledChange?: (buildingId: string, isSettled: boolean) => void;
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

const normalizeImportedRootsToAnchor = (
	rootNodes: TransformNode[],
	anchor: TransformNode,
): void => {
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

	const verticalOffset = (anchor.position.y - minimumWorldY) / anchor.scaling.y;

	for (const rootNode of rootNodes) {
		rootNode.position.y += verticalOffset;
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

/**
 * Loads a static building visual from the January 2019 OBJ building pack.
 *
 * @param {WorldBuildingViewPropsType} props - Static building placement and physics props.
 * @returns {JSX.Element} The building visual with a primitive collider.
 */
const WorldBuildingView: React.FC<WorldBuildingViewPropsType> = ({
	building,
	groundMeshName,
	havokPlugin,
	onSettledChange,
	positionOffset = { x: 0, z: 0 },
}) => {
	const scene = useScene();
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const anchorRef = useRef<TransformNode | null>(null);
	const instantiatedEntriesRef = useRef<InstantiatedEntries | null>(null);
	const hasAlignedToGroundRef = useRef(false);
	const { collider, heightOffset = 0, id, modelId, position, scale, yaw } = building;
	const x = position.x + positionOffset.x;
	const z = position.z + positionOffset.z;
	const colliderPosition = new Vector3(
		x,
		getTerrainHeightAt({ x, z }) + heightOffset + collider.height / 2,
		z,
	);

	useEffect(() => {
		onSettledChange?.(id, status !== 'loading');
	}, [id, onSettledChange, status]);

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
		hasAlignedToGroundRef.current = false;

		getBuildingAssetContainer(scene, modelId)
			.then((assetContainer) => {
				if (isDisposed) {
					return;
				}

				const anchor = new TransformNode(`${id}-anchor`, scene);
				anchor.position = new Vector3(x, getTerrainHeightAt({ x, z }) + heightOffset, z);
				anchor.rotation.y = yaw;
				anchor.scaling.setAll(scale);
				anchorRef.current = anchor;

				const instantiatedEntries = assetContainer.instantiateModelsToScene(
					(sourceName) => `${id}-${sourceName}`,
					false,
				);
				instantiatedEntriesRef.current = instantiatedEntries;

				for (const rootNode of instantiatedEntries.rootNodes) {
					if (rootNode instanceof TransformNode) {
						rootNode.parent = anchor;
						disablePickingForImportedRoot(rootNode);
					}
				}

				normalizeImportedRootsToAnchor(
					instantiatedEntries.rootNodes.filter(
						(rootNode): rootNode is TransformNode => rootNode instanceof TransformNode,
					),
					anchor,
				);
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
	}, [heightOffset, id, modelId, scale, scene, x, yaw, z]);

	useBeforeRender(() => {
		if (!scene || !groundMeshName || !anchorRef.current || hasAlignedToGroundRef.current) {
			return;
		}

		const groundHit = scene.pickWithRay(
			new Ray(new Vector3(x, 200, z), Vector3.DownReadOnly, 400),
			(mesh) => mesh.name === groundMeshName && mesh.isEnabled() && mesh.isPickable,
		);

		if (!groundHit?.hit || !groundHit.pickedPoint) {
			return;
		}

		anchorRef.current.position.y = groundHit.pickedPoint.y + heightOffset;
		hasAlignedToGroundRef.current = true;
	});

	return (
		<>
			{status !== 'ready' ? (
				<BuildingFallback building={building} positionOffset={positionOffset} />
			) : null}
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
	const [settledBuildingIds, setSettledBuildingIds] = useState<Set<string>>(() => new Set());
	const settlementStartedAtRef = useRef<number | null>(null);
	const hasReportedSettlementRef = useRef(false);

	useEffect(() => {
		setSettledBuildingIds(new Set());
		settlementStartedAtRef.current = startTenerifePerfTimer();
		hasReportedSettlementRef.current = false;
		onReadyChange?.(buildings.length === 0);
	}, [buildings, onReadyChange]);

	useEffect(() => {
		const isReady = buildings.length === 0 || settledBuildingIds.size >= buildings.length;

		if (isReady && debugLabel && !hasReportedSettlementRef.current) {
			finishTenerifePerfTimer(
				`Building settlement: ${debugLabel} (${buildings.length} buildings)`,
				settlementStartedAtRef.current,
			);
			hasReportedSettlementRef.current = true;
		}

		onReadyChange?.(isReady);
	}, [buildings.length, debugLabel, onReadyChange, settledBuildingIds]);

	const handleSettledChange = useCallback((buildingId: string, isSettled: boolean) => {
		setSettledBuildingIds((currentIds) => {
			const nextIds = new Set(currentIds);

			if (isSettled) {
				nextIds.add(buildingId);
			} else {
				nextIds.delete(buildingId);
			}

			return nextIds;
		});
	}, []);

	return (
		<>
			{buildings.map((building) => (
				<WorldBuildingView
					key={building.id}
					building={building}
					groundMeshName={groundMeshName}
					havokPlugin={havokPlugin}
					onSettledChange={handleSettledChange}
					positionOffset={positionOffset}
				/>
			))}
		</>
	);
};

export default WorldBuildings;
