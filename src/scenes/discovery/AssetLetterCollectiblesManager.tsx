import type { AssetContainer, InstantiatedEntries } from '@babylonjs/core/assetContainer';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/glTF';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import { publicAssetUrl } from '@/utils/publicAssetUrl';
import type { CollectibleSpawnPoint } from './collectibleTypes';
import LetterCollectible from './LetterCollectible';

const COLLECTIBLE_MODEL_ROOT_URL = publicAssetUrl('/models/collectibles/');
const COLLECTIBLE_MODEL_FILENAME = 'collectible-letter-crystal.glb';
const COLLECTIBLE_MODEL_URL = `${COLLECTIBLE_MODEL_ROOT_URL}${COLLECTIBLE_MODEL_FILENAME}`;
const COLLECTIBLE_MODEL_SCALE = 0.65;
const collectibleAssetContainerCache = new WeakMap<BabylonScene, Promise<AssetContainer>>();

const getCollectibleAssetContainer = (scene: BabylonScene): Promise<AssetContainer> => {
	const cachedContainer = collectibleAssetContainerCache.get(scene);

	if (cachedContainer) {
		return cachedContainer;
	}

	const containerPromise = LoadAssetContainerAsync(COLLECTIBLE_MODEL_URL, scene);
	collectibleAssetContainerCache.set(scene, containerPromise);

	return containerPromise;
};

const disablePickingForInstancedRoot = (rootNode: TransformNode): void => {
	if (rootNode instanceof Mesh) {
		rootNode.isPickable = false;
	}

	for (const childMesh of rootNode.getChildMeshes(false)) {
		childMesh.isPickable = false;
	}
};

type PropsType = {
	collectibles: CollectibleSpawnPoint[];
};

/**
 * Manages all asset-backed collectibles using Thin Instances for performance.
 *
 * @param {PropsType} props - Collectible list props.
 * @returns {JSX.Element | null} Fallback placeholders if asset is loading or failed.
 */
const AssetLetterCollectiblesManager: React.FC<PropsType> = ({ collectibles }) => {
	const scene = useScene();
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
	const anchorRef = useRef<TransformNode | null>(null);
	const instantiatedEntriesRef = useRef<InstantiatedEntries | null>(null);

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

		getCollectibleAssetContainer(scene)
			.then((assetContainer) => {
				if (isDisposed) {
					return;
				}

				const anchorName = 'collectible-manager-base-anchor';
				const anchor = scene.getTransformNodeByName(anchorName) as TransformNode | null;
				const nextAnchor = anchor ?? new TransformNode(anchorName, scene);

				// The base anchor stays at origin with the model scale.
				nextAnchor.scaling.setAll(COLLECTIBLE_MODEL_SCALE);
				anchorRef.current = nextAnchor;

				// Instantiate one base copy to hold the thin instances.
				const instantiatedEntries = assetContainer.instantiateModelsToScene(
					(sourceName) => `collectible-base-${sourceName}`,
					false,
				);
				instantiatedEntriesRef.current = instantiatedEntries;

				for (const rootNode of instantiatedEntries.rootNodes) {
					if (rootNode instanceof TransformNode) {
						rootNode.parent = nextAnchor;
						disablePickingForInstancedRoot(rootNode);
					}
				}

				// Hide the base meshes so only the thin instances are visible
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
	}, [scene]);

	useBeforeRender(() => {
		if (status !== 'ready' || !instantiatedEntriesRef.current || collectibles.length === 0) {
			// If we have no collectibles, we should clear thin instances.
			if (status === 'ready' && instantiatedEntriesRef.current && collectibles.length === 0) {
				const emptyBuffer = new Float32Array(0);
				for (const rootNode of instantiatedEntriesRef.current.rootNodes) {
					for (const mesh of rootNode.getChildMeshes(false)) {
						if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
							mesh.thinInstanceSetBuffer('matrix', emptyBuffer, 16, false);
						}
					}
				}
			}
			return;
		}

		const count = collectibles.length;
		const matrixBuffer = new Float32Array(count * 16);
		const now = performance.now();

		for (let i = 0; i < count; i++) {
			const collectible = collectibles[i];
			const baseY = collectible.position.y;
			const yOffset = Math.sin(now * 0.003 + baseY) * 0.15;

			// We divide the final position by COLLECTIBLE_MODEL_SCALE because the base anchor is already scaled,
			// and Thin Instance matrices are multiplied by the base mesh's world matrix.
			// Actually, it is simpler to apply scaling to the thin instance matrix and keep the base anchor at scale=1.
			// However, since we set scale=0.65 on the base anchor, we only need translation and rotation in the TI matrix.
			// Wait, the thin instance matrix is Local. So to move it in world space, we need to counter-scale it.
			// Let's reset the anchor scale to 1 to avoid complexity.
			const scale = COLLECTIBLE_MODEL_SCALE;
			const rx = 0;
			const ry = (now * 0.02) % (Math.PI * 2);
			const rz = 0;

			// Compose the matrix for this instance
			const matrix = Matrix.Compose(
				new Vector3(scale, scale, scale),
				Quaternion.RotationYawPitchRoll(ry, rx, rz),
				new Vector3(collectible.position.x, baseY + yOffset, collectible.position.z),
			);
			matrix.copyToArray(matrixBuffer, i * 16);
		}

		// Let's reset the anchor scaling to 1 so the matrix position acts in world space directly
		if (anchorRef.current && anchorRef.current.scaling.x !== 1) {
			anchorRef.current.scaling.setAll(1);
		}

		// Apply the matrix buffer to all renderable meshes
		for (const rootNode of instantiatedEntriesRef.current.rootNodes) {
			for (const mesh of rootNode.getChildMeshes(false)) {
				if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
					mesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
				}
			}
			if (rootNode instanceof Mesh && rootNode.getTotalVertices() > 0) {
				rootNode.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
			}
		}
	});

	if (status === 'ready') {
		return null;
	}

	// Fallback during loading/error
	return (
		<>
			{collectibles.map((collectible) => (
				<LetterCollectible key={collectible.id} collectible={collectible} />
			))}
		</>
	);
};

export default AssetLetterCollectiblesManager;
