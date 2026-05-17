import type { AssetContainer, InstantiatedEntries } from '@babylonjs/core/assetContainer';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/glTF';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import type { CollectibleSpawnPoint } from './collectibleTypes';
import LetterCollectible from './LetterCollectible';

const COLLECTIBLE_MODEL_ROOT_URL = '/models/collectibles/';
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
	collectible: CollectibleSpawnPoint;
};

/**
 * Loads the first asset-backed collectible visual with a runtime-safe fallback.
 *
 * @param {PropsType} props - Collectible props.
 * @returns {JSX.Element | null} The fallback placeholder while the asset is unavailable.
 */
const AssetLetterCollectible: React.FC<PropsType> = ({ collectible }) => {
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

				const anchor = scene.getTransformNodeByName(
					`collectible-anchor-${collectible.id}`,
				) as TransformNode | null;
				const nextAnchor = anchor ?? new TransformNode(`collectible-anchor-${collectible.id}`, scene);

				nextAnchor.position = new Vector3(
					collectible.position.x,
					collectible.position.y,
					collectible.position.z,
				);
				nextAnchor.scaling.setAll(COLLECTIBLE_MODEL_SCALE);
				anchorRef.current = nextAnchor;
				const instantiatedEntries = assetContainer.instantiateModelsToScene(
					(sourceName) => `collectible-${collectible.id}-${sourceName}`,
					false,
				);
				instantiatedEntriesRef.current = instantiatedEntries;

				for (const rootNode of instantiatedEntries.rootNodes) {
					if (rootNode instanceof TransformNode) {
						rootNode.parent = nextAnchor;
						disablePickingForInstancedRoot(rootNode);
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
	}, [
		collectible.id,
		collectible.position.x,
		collectible.position.y,
		collectible.position.z,
		scene,
	]);

	useBeforeRender(() => {
		if (status !== 'ready' || !anchorRef.current) {
			return;
		}

		const baseY = collectible.position.y;
		anchorRef.current.position.y = baseY + Math.sin(performance.now() * 0.003 + baseY) * 0.15;
		anchorRef.current.rotation.y += 0.02;
	});

	if (status === 'ready') {
		return null;
	}

	return <LetterCollectible collectible={collectible} />;
};

export default AssetLetterCollectible;
