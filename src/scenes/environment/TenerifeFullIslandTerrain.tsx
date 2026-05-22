import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/loaders/glTF';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useScene } from 'react-babylonjs';
import {
	auditFullIslandImportedWaterMeshes,
	shouldHideImportedWater,
	updateOceanDebugState,
} from '@/scenes/environment/ocean/oceanDebug';
import {
	isTenerifeFullIslandTerrainMeshName,
	TENERIFE_FULL_ISLAND_MODEL_URL,
	TENERIFE_FULL_ISLAND_RUNTIME_SCALE,
} from './tenerifeFullIslandConfig';
import {
	clearTenerifeFullIslandHeightfield,
	rebuildTenerifeFullIslandHeightfield,
} from './tenerifeFullIslandHeightfield';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

/** Applies conservative runtime PBR settings to the imported island terrain material. */
const tuneTerrainMaterial = (mesh: Mesh): void => {
	if (!(mesh.material instanceof PBRMaterial)) {
		return;
	}

	mesh.material.name = 'tenerife-full-island-runtime-material';
	mesh.material.metallic = 0;
	mesh.material.roughness = 0.96;
	mesh.material.specularIntensity = 0.12;
	mesh.material.albedoColor = Color3.White();
	mesh.material.freeze();
};

/**
 * Loads the normalized full Tenerife island as the active large-scale terrain.
 *
 * The first runtime pass keeps the six source terrain tiles intact so later work
 * can split them into LOD or streamed chunks instead of undoing a merged mesh.
 */
const TenerifeFullIslandTerrain: React.FC<PropsType> = ({ onReadyChange }) => {
	const scene = useScene();
	const importedMeshesRef = useRef<AbstractMesh[]>([]);

	useEffect(() => {
		if (!scene) {
			onReadyChange?.(false);
			return;
		}

		let isDisposed = false;
		const previousSkipPointerMovePicking = scene.skipPointerMovePicking;
		scene.skipPointerMovePicking = true;
		onReadyChange?.(false);

		SceneLoader.ImportMeshAsync(undefined, '', TENERIFE_FULL_ISLAND_MODEL_URL, scene)
			.then((result) => {
				if (isDisposed) {
					for (const mesh of result.meshes) {
						mesh.dispose(false, true);
					}
					return;
				}

				importedMeshesRef.current = result.meshes;
				const waterMeshAudit = auditFullIslandImportedWaterMeshes(
					result.meshes,
					shouldHideImportedWater(),
				);
				updateOceanDebugState({
					lastAudit: waterMeshAudit,
				});

				for (const mesh of result.meshes) {
					mesh.isPickable = false;
					mesh.checkCollisions = false;

					if (!(mesh instanceof Mesh) || !isTenerifeFullIslandTerrainMeshName(mesh.name)) {
						continue;
					}

					mesh.scaling.setAll(TENERIFE_FULL_ISLAND_RUNTIME_SCALE);
					mesh.isPickable = true;
					mesh.checkCollisions = false;
					mesh.alwaysSelectAsActiveMesh = false;
					mesh.computeWorldMatrix(true);
					tuneTerrainMaterial(mesh);
					mesh.freezeWorldMatrix();
					mesh.doNotSyncBoundingInfo = true;
				}

				rebuildTenerifeFullIslandHeightfield(result.meshes);
				onReadyChange?.(true);
			})
			.catch((error: unknown) => {
				console.error('[TenerifeFullIslandTerrain] Failed to load normalized island', error);
				onReadyChange?.(true);
			});

		return () => {
			isDisposed = true;
			scene.skipPointerMovePicking = previousSkipPointerMovePicking;
			onReadyChange?.(false);

			clearTenerifeFullIslandHeightfield();

			for (const mesh of importedMeshesRef.current) {
				if (!mesh.isDisposed()) {
					mesh.dispose(false, true);
				}
			}

			importedMeshesRef.current = [];
		};
	}, [onReadyChange, scene]);

	return null;
};

export default TenerifeFullIslandTerrain;
