import { Ray } from '@babylonjs/core/Culling/ray';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import '@babylonjs/loaders/glTF';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
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

const SPRUCE_TREE_MODEL_URL = publicAssetUrl('/models/environment/spruce-tree.glb');

const TREE_GROUND_RAY_START_Y = 320;
const TREE_GROUND_RAY_LENGTH = 640;
const TREE_SETTLEMENT_MAX_ATTEMPTS = 180;
const TREE_TERRAIN_LIFT = 0.12;
const TREE_MIN_GROUND_ABOVE_WATER = 0.75;
const PROCEDURAL_TREE_TRUNK_HEIGHT = 5.5;
const PROCEDURAL_TREE_CANOPY_HEIGHT = 15;
const PROCEDURAL_TREE_CANOPY_BASE_Y = 9.5;
const PROCEDURAL_TREE_CANOPY_DIAMETER = 8;
const PROCEDURAL_TREE_TRUNK_DIAMETER = 1.4;

type MountainTreeSourceMeshType = Pick<
	Mesh,
	| 'alwaysSelectAsActiveMesh'
	| 'doNotSyncBoundingInfo'
	| 'isPickable'
	| 'isVisible'
	| 'thinInstanceEnablePicking'
>;

type MountainTreeInstanceMeshType = MountainTreeSourceMeshType &
	Pick<Mesh, 'thinInstanceRefreshBoundingInfo' | 'thinInstanceSetBuffer'>;

type MountainTreeSourceRootType = Pick<TransformNode, 'name'>;

type TenerifeMountainTreeDebugBoundsType = {
	maxHeight: number;
	maxX: number;
	maxZ: number;
	minHeight: number;
	minX: number;
	minZ: number;
};

type TenerifeMountainTreeDebugSummaryType = {
	bounds: TenerifeMountainTreeDebugBoundsType | null;
	instanceMeshCount: number;
	placementCount: number;
	renderableRootCount: number;
	visibleCount: number;
};

declare global {
	interface Window {
		__tenerifeMountainTrees?: TenerifeMountainTreeDebugSummaryType;
	}
}

/** Summarizes live tree placement state for browser/runtime diagnostics. */
export const createMountainTreeDebugSummary = (
	trees: TenerifeMountainTreePlacementType[],
	visibleCount: number,
	instanceMeshCount: number,
	renderableRootCount: number,
): TenerifeMountainTreeDebugSummaryType => {
	if (trees.length === 0) {
		return {
			bounds: null,
			instanceMeshCount,
			placementCount: 0,
			renderableRootCount,
			visibleCount,
		};
	}

	const bounds = trees.reduce<TenerifeMountainTreeDebugBoundsType>(
		(accumulator, tree) => ({
			maxHeight: Math.max(accumulator.maxHeight, tree.terrainSample.height),
			maxX: Math.max(accumulator.maxX, tree.position.x),
			maxZ: Math.max(accumulator.maxZ, tree.position.z),
			minHeight: Math.min(accumulator.minHeight, tree.terrainSample.height),
			minX: Math.min(accumulator.minX, tree.position.x),
			minZ: Math.min(accumulator.minZ, tree.position.z),
		}),
		{
			maxHeight: Number.NEGATIVE_INFINITY,
			maxX: Number.NEGATIVE_INFINITY,
			maxZ: Number.NEGATIVE_INFINITY,
			minHeight: Number.POSITIVE_INFINITY,
			minX: Number.POSITIVE_INFINITY,
			minZ: Number.POSITIVE_INFINITY,
		},
	);

	return {
		bounds,
		instanceMeshCount,
		placementCount: trees.length,
		renderableRootCount,
		visibleCount,
	};
};

/** Creates a guaranteed-visible low-poly conifer source for thin instances. */
const createProceduralMountainTreeRoot = (scene: BabylonScene): TransformNode => {
	const rootNode = new TransformNode('tenerife-procedural-mountain-tree-root', scene);
	const trunkMaterial = new StandardMaterial('tenerife-procedural-tree-trunk-material', scene);
	const canopyMaterial = new StandardMaterial('tenerife-procedural-tree-canopy-material', scene);

	trunkMaterial.diffuseColor = new Color3(0.32, 0.16, 0.07);
	trunkMaterial.specularColor = Color3.Black();
	canopyMaterial.diffuseColor = new Color3(0.04, 0.31, 0.11);
	canopyMaterial.specularColor = Color3.Black();

	const trunk = MeshBuilder.CreateCylinder(
		'tenerife-procedural-mountain-tree-trunk',
		{
			diameter: PROCEDURAL_TREE_TRUNK_DIAMETER,
			height: PROCEDURAL_TREE_TRUNK_HEIGHT,
			tessellation: 7,
		},
		scene,
	);
	trunk.position.y = PROCEDURAL_TREE_TRUNK_HEIGHT / 2;
	trunk.material = trunkMaterial;
	trunk.parent = rootNode;

	const canopy = MeshBuilder.CreateCylinder(
		'tenerife-procedural-mountain-tree-canopy',
		{
			diameterBottom: PROCEDURAL_TREE_CANOPY_DIAMETER,
			diameterTop: 0,
			height: PROCEDURAL_TREE_CANOPY_HEIGHT,
			tessellation: 8,
		},
		scene,
	);
	canopy.position.y = PROCEDURAL_TREE_CANOPY_BASE_Y;
	canopy.material = canopyMaterial;
	canopy.parent = rootNode;

	return rootNode;
};

/** Keeps imported source meshes hidden until their thin-instance transforms are ready. */
export const prepareMountainTreeSourceMesh = (mesh: MountainTreeSourceMeshType): void => {
	mesh.alwaysSelectAsActiveMesh = true;
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
	mesh.alwaysSelectAsActiveMesh = true;
	mesh.doNotSyncBoundingInfo = false;
	mesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
	mesh.thinInstanceRefreshBoundingInfo(true);
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

/** Chooses a visible ground height from runtime raycast and heightfield samples. */
export const resolveMountainTreeGroundY = (
	raycastY: number | null,
	heightfieldY: number | null,
): number | null => {
	const hasVisibleRaycast = raycastY !== null && isMountainTreeGroundAboveWater(raycastY);
	const hasVisibleHeightfield =
		heightfieldY !== null && isMountainTreeGroundAboveWater(heightfieldY);

	if (hasVisibleRaycast && hasVisibleHeightfield) {
		return Math.max(raycastY, heightfieldY);
	}

	if (hasVisibleHeightfield) {
		return heightfieldY;
	}

	return hasVisibleRaycast ? raycastY : null;
};

/** Resolves confirmed visible terrain height for a tree placement. */
const getTreeGroundY = (
	scene: BabylonScene,
	tree: TenerifeMountainTreePlacementType,
): number | null => {
	const raycastY = getRaycastGroundYAtPosition(scene, tree);
	const heightfieldY = getTenerifeFullIslandHeightAtPosition(
		new Vector3(tree.position.x, 0, tree.position.z),
	);

	return resolveMountainTreeGroundY(raycastY, heightfieldY);
};

/** Collects renderable meshes from a GLB root node while preserving source hierarchy. */
const getRootMeshes = (rootNode: TransformNode): Mesh[] => {
	const meshes = rootNode.getChildMeshes(false).filter((mesh): mesh is Mesh => mesh instanceof Mesh);

	if (rootNode instanceof Mesh) {
		meshes.push(rootNode);
	}

	return meshes;
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
const applyTreeMatrixBuffer = (rootNodes: TransformNode[], matrixBuffer: Float32Array): number => {
	let instanceMeshCount = 0;

	for (const rootNode of rootNodes) {
		for (const mesh of getRootMeshes(rootNode)) {
			if (mesh.getTotalVertices() === 0) {
				continue;
			}

			activateMountainTreeInstanceMesh(mesh, matrixBuffer);
			instanceMeshCount += 1;
		}
	}

	return instanceMeshCount;
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

	useEffect(() => {
		if (!scene) {
			return undefined;
		}

		let isDisposed = false;
		let animationFrameId = 0;
		let settlementAttempts = 0;

		const disposeImportedResources = () => {
			if (anchorRef.current && !anchorRef.current.isDisposed()) {
				anchorRef.current.dispose(false, true);
			}

			anchorRef.current = null;
		};

		const settleTrees = (rootNodes: TransformNode[], renderableRootCount: number) => {
			if (isDisposed) {
				return;
			}

			if (
				!hasMountainTreeGroundCandidate(scene) &&
				settlementAttempts < TREE_SETTLEMENT_MAX_ATTEMPTS
			) {
				settlementAttempts += 1;
				animationFrameId = requestAnimationFrame(() => settleTrees(rootNodes, renderableRootCount));
				return;
			}

			const treePlacements = createRuntimeMountainTreePlacements();
			const { matrixBuffer, visibleCount } = createTreeMatrixBuffer(scene, treePlacements);

			if (visibleCount === 0 && settlementAttempts < TREE_SETTLEMENT_MAX_ATTEMPTS) {
				settlementAttempts += 1;
				animationFrameId = requestAnimationFrame(() => settleTrees(rootNodes, renderableRootCount));
				return;
			}

			const instanceMeshCount = applyTreeMatrixBuffer(rootNodes, matrixBuffer);
			const debugSummary = createMountainTreeDebugSummary(
				treePlacements,
				visibleCount,
				instanceMeshCount,
				renderableRootCount,
			);

			window.__tenerifeMountainTrees = debugSummary;
			console.info('[TenerifeMountainTrees] settled', debugSummary);
		};

		const anchorNode = new TransformNode('tenerife-mountain-trees-anchor', scene);
		anchorRef.current = anchorNode;

		SceneLoader.ImportMeshAsync(undefined, '', SPRUCE_TREE_MODEL_URL, scene)
			.then((result) => {
				if (isDisposed) {
					for (const mesh of result.meshes) {
						mesh.dispose(false, true);
					}
					return;
				}

				// Collect renderable root nodes, skipping offset helpers and dry branches
				const renderableRoots: TransformNode[] = [];

				for (const mesh of result.meshes) {
					if (!shouldRenderMountainTreeSourceRoot(mesh)) {
						mesh.isVisible = false;
						mesh.isPickable = false;
						continue;
					}

					if (mesh instanceof Mesh) {
						prepareMountainTreeSourceMesh(mesh);
						mesh.parent = anchorNode;
						renderableRoots.push(mesh);
					}
				}

				if (renderableRoots.length === 0) {
					console.warn('[TenerifeMountainTrees] No renderable meshes in GLB, using procedural fallback');
					const proceduralRootNode = createProceduralMountainTreeRoot(scene);
					proceduralRootNode.parent = anchorNode;
					disableBaseMeshInteractions(proceduralRootNode);
					settleTrees([proceduralRootNode], 1);
					return;
				}

				console.info(
					`[TenerifeMountainTrees] Loaded GLB with ${renderableRoots.length} renderable meshes`,
				);
				settleTrees(renderableRoots, renderableRoots.length);
			})
			.catch((error: unknown) => {
				if (isDisposed) {
					return;
				}
				console.warn('[TenerifeMountainTrees] GLB load failed, using procedural fallback', error);
				const proceduralRootNode = createProceduralMountainTreeRoot(scene);
				proceduralRootNode.parent = anchorNode;
				disableBaseMeshInteractions(proceduralRootNode);
				settleTrees([proceduralRootNode], 1);
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
