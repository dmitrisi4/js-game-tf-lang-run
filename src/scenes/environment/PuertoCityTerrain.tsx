import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import type { Scene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/glTF';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useScene } from 'react-babylonjs';
import { applyCollisionFilterToAggregate } from '@/scenes/physics/collisionLayers';
import { PUERTO_CITY_ALBEDO_TEXTURE_URL, PUERTO_CITY_TERRAIN_MODEL_URL } from './puertoCityConfig';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

const createPuertoCityTerrainMaterial = (scene: Scene): PBRMaterial => {
	const material = new PBRMaterial('puerto-city-terrain-runtime-material', scene);
	const albedoTexture = new Texture(PUERTO_CITY_ALBEDO_TEXTURE_URL, scene);

	albedoTexture.name = 'puerto-city-albedo-texture';
	albedoTexture.gammaSpace = true;
	albedoTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
	albedoTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
	albedoTexture.anisotropicFilteringLevel = 8;

	material.albedoColor = Color3.White();
	material.albedoTexture = albedoTexture;
	material.metallic = 0;
	material.roughness = 0.9;
	material.specularIntensity = 0.14;

	return material;
};

const findPuertoTerrainMesh = (meshes: AbstractMesh[]): Mesh | null => {
	const namedGround = meshes.find(
		(mesh): mesh is Mesh => mesh instanceof Mesh && mesh.name === 'ground1',
	);

	if (namedGround) {
		return namedGround;
	}

	return (
		meshes.find(
			(mesh): mesh is Mesh => mesh instanceof Mesh && mesh.name.toLowerCase().includes('terrain'),
		) ?? null
	);
};

export const isPuertoCityBuildingMeshName = (name: string): boolean =>
	name.toLowerCase().includes('puerto-osm-city-buildings');

const findPuertoBuildingMeshes = (meshes: AbstractMesh[]): Mesh[] =>
	meshes.filter(
		(mesh): mesh is Mesh => mesh instanceof Mesh && isPuertoCityBuildingMeshName(mesh.name),
	);

/**
 * Loads the generated Puerto de la Cruz terrain patch as the active `ground1` mesh.
 */
const PuertoCityTerrain: React.FC<PropsType> = ({ havokPlugin, onReadyChange }) => {
	const scene = useScene();
	const importedMeshesRef = useRef<AbstractMesh[]>([]);
	const physicsAggregateRef = useRef<PhysicsAggregate | null>(null);
	const buildingPhysicsAggregatesRef = useRef<PhysicsAggregate[]>([]);
	const materialRef = useRef<PBRMaterial | null>(null);

	useEffect(() => {
		if (!scene) {
			onReadyChange?.(false);
			return;
		}

		let isDisposed = false;
		onReadyChange?.(false);
		const material = createPuertoCityTerrainMaterial(scene);
		materialRef.current = material;

		SceneLoader.ImportMeshAsync(undefined, '', PUERTO_CITY_TERRAIN_MODEL_URL, scene)
			.then((result) => {
				if (isDisposed) {
					for (const mesh of result.meshes) {
						mesh.dispose(false, true);
					}
					return;
				}

				importedMeshesRef.current = result.meshes;
				const terrainMesh = findPuertoTerrainMesh(result.meshes);
				const buildingMeshes = findPuertoBuildingMeshes(result.meshes);

				for (const mesh of result.meshes) {
					mesh.isPickable = false;
					mesh.checkCollisions = false;
				}

				if (!terrainMesh) {
					onReadyChange?.(true);
					return;
				}

				terrainMesh.name = 'ground1';
				terrainMesh.material = material;
				terrainMesh.isPickable = true;
				terrainMesh.checkCollisions = true;
				terrainMesh.computeWorldMatrix(true);

				if (havokPlugin) {
					physicsAggregateRef.current = new PhysicsAggregate(
						terrainMesh,
						PhysicsShapeType.MESH,
						{ friction: 0.78, mass: 0, restitution: 0.04 },
						scene,
					);
					applyCollisionFilterToAggregate(physicsAggregateRef.current, 'ground');

					buildingPhysicsAggregatesRef.current = buildingMeshes.map((buildingMesh) => {
						buildingMesh.isPickable = true;
						buildingMesh.checkCollisions = true;
						buildingMesh.computeWorldMatrix(true);

						const buildingAggregate = new PhysicsAggregate(
							buildingMesh,
							PhysicsShapeType.MESH,
							{ friction: 0.62, mass: 0, restitution: 0.01 },
							scene,
						);

						applyCollisionFilterToAggregate(buildingAggregate, 'staticWorld');

						return buildingAggregate;
					});
				}

				onReadyChange?.(true);
			})
			.catch((error: unknown) => {
				console.error('[PuertoCityTerrain] Failed to load generated terrain', error);
				onReadyChange?.(true);
			});

		return () => {
			isDisposed = true;
			onReadyChange?.(false);
			physicsAggregateRef.current?.dispose();
			physicsAggregateRef.current = null;
			for (const aggregate of buildingPhysicsAggregatesRef.current) {
				aggregate.dispose();
			}
			buildingPhysicsAggregatesRef.current = [];

			for (const mesh of importedMeshesRef.current) {
				if (!mesh.isDisposed()) {
					mesh.dispose(false, true);
				}
			}

			importedMeshesRef.current = [];
			materialRef.current?.dispose(true, true);
			materialRef.current = null;
		};
	}, [havokPlugin, onReadyChange, scene]);

	return null;
};

export default PuertoCityTerrain;
