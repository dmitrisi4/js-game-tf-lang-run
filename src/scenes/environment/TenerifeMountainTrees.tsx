import type { AssetContainer, InstantiatedEntries } from '@babylonjs/core/assetContainer';
import { Ray } from '@babylonjs/core/Culling/ray';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/glTF';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useScene } from 'react-babylonjs';
import {
	isTenerifeFullIslandTerrainMeshName,
	TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
} from '@/scenes/environment/tenerifeFullIslandConfig';
import {
	getTenerifeFullIslandHeightAtPosition,
	getTenerifeFullIslandHeightfieldBounds,
} from '@/scenes/environment/tenerifeFullIslandHeightfield';
import {
	createTenerifeMountainTreePlacements,
	type TenerifeMountainTreePlacementType,
} from '@/scenes/environment/tenerifeMountainTreeData';
import { publicAssetUrl } from '@/utils/publicAssetUrl';

const SPRUCE_TREE_MODEL_URL = publicAssetUrl(
	'/models/spruce-trees/spruce-trees/source/Trees/Tree.glb',
);
const TREE_GROUND_RAY_START_Y = 320;
const TREE_GROUND_RAY_LENGTH = 640;
const TREE_SETTLEMENT_MAX_ATTEMPTS = 180;
const TREE_TERRAIN_LIFT = 0.12;
const TREE_MIN_GROUND_ABOVE_WATER = 0.75;

const spruceTreeAssetContainerCache = new WeakMap<BabylonScene, Promise<AssetContainer>>();

type MountainTreeSourceMeshType = Pick<
	Mesh,
	'doNotSyncBoundingInfo' | 'isPickable' | 'isVisible' | 'thinInstanceEnablePicking'
>;

type MountainTreeInstanceMeshType = MountainTreeSourceMeshType &
	Pick<Mesh, 'thinInstanceRefreshBoundingInfo' | 'thinInstanceSetBuffer'>;

type MountainTreeSourceRootType = Pick<TransformNode, 'name'>;

/** Loads and caches the spruce GLB asset container per Babylon scene. */
const getSpruceTreeAssetContainer = (scene: BabylonScene): Promise<AssetContainer> => {
	const cachedContainer = spruceTreeAssetContainerCache.get(scene);

	if (cachedContainer) {
		return cachedContainer;
	}

	const containerPromise = LoadAssetContainerAsync(SPRUCE_TREE_MODEL_URL, scene);
	spruceTreeAssetContainerCache.set(scene, containerPromise);

	return containerPromise;
};

/** Keeps imported source meshes hidden until their thin-instance transforms are ready. */
export const prepareMountainTreeSourceMesh = (mesh: MountainTreeSourceMeshType): void => {
	mesh.isPickable = false;
	mesh.thinInstanceEnablePicking = false;
	mesh.doNotSyncBoundingInfo = false;
	mesh.isVisible = false;
};

/** Enables a tree mesh for rendering after its thin-instance bounds are updated. */
export const activateMountainTreeInstanceMesh = (
	mesh: MountainTreeInstanceMeshType,
	matrixBuffer: Float32Array,
): void => {
	mesh.doNotSyncBoundingInfo = false;
	mesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
	mesh.thinInstanceRefreshBoundingInfo(false);
	mesh.doNotSyncBoundingInfo = true;
	mesh.isVisible = true;
};

/** Skips source-offset helper trees and loose dry branches from the GLB source file. */
export const shouldRenderMountainTreeSourceRoot = (
	rootNode: MountainTreeSourceRootType,
): boolean => {
	const normalizedName = rootNode.name.toLowerCase();

	return !normalizedName.includes('mini_tree') && !normalizedName.includes('dry branch');
};

/** Identifies the mesh root that should define the tree's terrain anchor. */
export const isMountainTreeTrunkRoot = (rootNode: MountainTreeSourceRootType): boolean =>
	rootNode.name.toLowerCase().includes('tree trunk');

/** Detects full-island terrain meshes that can receive mountain tree placement. */
const isMountainTreeGroundCandidate = (mesh: AbstractMesh): boolean =>
	isTenerifeFullIslandTerrainMeshName(mesh.name) && mesh.isEnabled() && mesh.isPickable;

/** Reports whether full-island terrain is ready for tree ground settlement. */
const hasMountainTreeGroundCandidate = (scene: BabylonScene): boolean =>
	scene.meshes.some(isMountainTreeGroundCandidate);

/** Samples runtime terrain by raycasting down at an authored tree position. */
const getRaycastGroundYAtPosition = (
	scene: BabylonScene,
	{ position }: TenerifeMountainTreePlacementType,
): number | null => {
	const groundHit = scene.pickWithRay(
		new Ray(
			new Vector3(position.x, TREE_GROUND_RAY_START_Y, position.z),
			Vector3.DownReadOnly,
			TREE_GROUND_RAY_LENGTH,
		),
		isMountainTreeGroundCandidate,
	);

	return groundHit?.hit && groundHit.pickedPoint ? groundHit.pickedPoint.y : null;
};

/** Keeps water-covered terrain samples from receiving visual tree instances. */
export const isMountainTreeGroundAboveWater = (groundY: number): boolean =>
	groundY >= TENERIFE_FULL_ISLAND_WATER_SURFACE_Y + TREE_MIN_GROUND_ABOVE_WATER;

/** Resolves confirmed visible terrain height for a tree placement. */
const getTreeGroundY = (
	scene: BabylonScene,
	tree: TenerifeMountainTreePlacementType,
): number | null => {
	const raycastY = getRaycastGroundYAtPosition(scene, tree);

	if (raycastY === null || !isMountainTreeGroundAboveWater(raycastY)) {
		return null;
	}

	const heightfieldY = getTenerifeFullIslandHeightAtPosition(
		new Vector3(tree.position.x, 0, tree.position.z),
	);

	if (heightfieldY !== null && isMountainTreeGroundAboveWater(heightfieldY)) {
		return Math.max(raycastY, heightfieldY);
	}

	return raycastY;
};

/** Collects renderable meshes from a GLB root node while preserving source hierarchy. */
const getRootMeshes = (rootNode: TransformNode): Mesh[] => {
	const meshes = rootNode.getChildMeshes(false).filter((mesh): mesh is Mesh => mesh instanceof Mesh);

	if (rootNode instanceof Mesh) {
		meshes.push(rootNode);
	}

	return meshes;
};

/** Finds the world-space Y anchor for imported source roots. */
const getImportedRootsAnchorY = (rootNodes: TransformNode[]): number | null => {
	const anchorRootNodes = rootNodes.filter(isMountainTreeTrunkRoot);
	const rootsToMeasure = anchorRootNodes.length > 0 ? anchorRootNodes : rootNodes;
	let minimumWorldY = Number.POSITIVE_INFINITY;

	for (const rootNode of rootsToMeasure) {
		rootNode.computeWorldMatrix(true);

		for (const mesh of getRootMeshes(rootNode)) {
			mesh.computeWorldMatrix(true);
			mesh.refreshBoundingInfo(true);
			minimumWorldY = Math.min(minimumWorldY, mesh.getBoundingInfo().boundingBox.minimumWorld.y);
		}
	}

	if (!Number.isFinite(minimumWorldY)) {
		return null;
	}

	return minimumWorldY;
};

/** Moves imported source roots so the trunk base becomes the terrain anchor. */
const normalizeImportedRootsToTreeBase = (rootNodes: TransformNode[]): void => {
	const anchorY = getImportedRootsAnchorY(rootNodes);

	if (anchorY === null) {
		return;
	}

	for (const rootNode of rootNodes) {
		rootNode.position.y -= anchorY;
	}
};

/** Prevents source meshes from becoming pickable or rendering as an extra base copy. */
const disableBaseMeshInteractions = (rootNode: TransformNode): void => {
	for (const mesh of getRootMeshes(rootNode)) {
		prepareMountainTreeSourceMesh(mesh);
	}
};

/** Builds one thin-instance transform buffer for all authored mountain tree clusters. */
const createTreeMatrixBuffer = (
	scene: BabylonScene,
	trees: TenerifeMountainTreePlacementType[],
): { matrixBuffer: Float32Array; visibleCount: number } => {
	const matrixBuffer = new Float32Array(trees.length * 16);
	let visibleCount = 0;

	for (let index = 0; index < trees.length; index += 1) {
		const tree = trees[index];
		const groundY = getTreeGroundY(scene, tree);
		const scale = groundY === null ? 0 : tree.scale;
		const y = (groundY ?? 0) + (tree.heightOffset ?? TREE_TERRAIN_LIFT);

		if (groundY !== null) {
			visibleCount += 1;
		}

		Matrix.Compose(
			new Vector3(scale, scale, scale),
			Quaternion.RotationYawPitchRoll(tree.yaw, 0, 0),
			new Vector3(tree.position.x, y, tree.position.z),
		).copyToArray(matrixBuffer, index * 16);
	}

	return { matrixBuffer, visibleCount };
};

/** Applies the shared tree placement buffer to every renderable mesh in the source GLB. */
const applyTreeMatrixBuffer = (rootNodes: TransformNode[], matrixBuffer: Float32Array): void => {
	for (const rootNode of rootNodes) {
		for (const mesh of getRootMeshes(rootNode)) {
			if (mesh.getTotalVertices() === 0) {
				continue;
			}

			activateMountainTreeInstanceMesh(mesh, matrixBuffer);
		}
	}
};

/** Creates current terrain-scanned tree placements after the heightfield is ready. */
const createRuntimeMountainTreePlacements = (): TenerifeMountainTreePlacementType[] => {
	const bounds = getTenerifeFullIslandHeightfieldBounds();

	if (!bounds) {
		return [];
	}

	return createTenerifeMountainTreePlacements({
		bounds,
		getHeightAtPosition: (position) =>
			getTenerifeFullIslandHeightAtPosition(new Vector3(position.x, 0, position.z)),
	});
};

/**
 * Renders first-pass spruce clusters on full-island Tenerife mountain terrain.
 *
 * The trees are visual scenery only; gameplay collision should be added later
 * as primitive trunk proxies if mountain forest traversal needs blockers.
 */
const TenerifeMountainTrees: React.FC = () => {
	const scene = useScene();
	const anchorRef = useRef<TransformNode | null>(null);
	const instantiatedEntriesRef = useRef<InstantiatedEntries | null>(null);

	useEffect(() => {
		if (!scene) {
			return undefined;
		}

		let isDisposed = false;
		let animationFrameId = 0;
		let settlementAttempts = 0;

		const disposeImportedResources = () => {
			instantiatedEntriesRef.current?.dispose();

			if (anchorRef.current && !anchorRef.current.isDisposed()) {
				anchorRef.current.dispose(false, true);
			}

			instantiatedEntriesRef.current = null;
			anchorRef.current = null;
		};

		const settleTrees = (rootNodes: TransformNode[]) => {
			if (isDisposed) {
				return;
			}

			if (
				!hasMountainTreeGroundCandidate(scene) &&
				settlementAttempts < TREE_SETTLEMENT_MAX_ATTEMPTS
			) {
				settlementAttempts += 1;
				animationFrameId = requestAnimationFrame(() => settleTrees(rootNodes));
				return;
			}

			const treePlacements = createRuntimeMountainTreePlacements();
			const { matrixBuffer, visibleCount } = createTreeMatrixBuffer(scene, treePlacements);

			if (visibleCount === 0 && settlementAttempts < TREE_SETTLEMENT_MAX_ATTEMPTS) {
				settlementAttempts += 1;
				animationFrameId = requestAnimationFrame(() => settleTrees(rootNodes));
				return;
			}

			applyTreeMatrixBuffer(rootNodes, matrixBuffer);
		};

		getSpruceTreeAssetContainer(scene)
			.then((assetContainer) => {
				if (isDisposed) {
					return;
				}

				const anchor = new TransformNode('tenerife-mountain-tree-anchor', scene);
				const instantiatedEntries = assetContainer.instantiateModelsToScene(
					(sourceName) => `tenerife-spruce-base-${sourceName}`,
					false,
				);
				const rootNodes = instantiatedEntries.rootNodes.filter(
					(rootNode): rootNode is TransformNode => rootNode instanceof TransformNode,
				);
				const renderableRootNodes = rootNodes.filter(shouldRenderMountainTreeSourceRoot);

				anchorRef.current = anchor;
				instantiatedEntriesRef.current = instantiatedEntries;

				for (const rootNode of rootNodes) {
					rootNode.parent = anchor;
				}

				normalizeImportedRootsToTreeBase(renderableRootNodes);

				for (const rootNode of rootNodes) {
					disableBaseMeshInteractions(rootNode);
				}

				settleTrees(renderableRootNodes);
			})
			.catch((error: unknown) => {
				console.error('[TenerifeMountainTrees] Failed to load spruce tree asset', error);
				disposeImportedResources();
			});

		return () => {
			isDisposed = true;
			cancelAnimationFrame(animationFrameId);
			disposeImportedResources();
		};
	}, [scene]);

	return null;
};

export default TenerifeMountainTrees;
