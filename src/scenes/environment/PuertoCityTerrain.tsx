import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import type { Scene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/glTF';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useScene } from 'react-babylonjs';
import { applyCollisionFilterToAggregate } from '@/scenes/physics/collisionLayers';
import {
	PUERTO_CITY_ALBEDO_TEXTURE_URL,
	PUERTO_CITY_NORMAL_TEXTURE_URL,
	PUERTO_CITY_ORM_TEXTURE_URL,
	PUERTO_CITY_TERRAIN_MODEL_URL,
} from './puertoCityConfig';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	hideDistantContext?: boolean;
	onReadyChange?: (isReady: boolean) => void;
	transform?: {
		alignBottomToY?: number;
		position: Vector3;
		scale: number;
	};
};

const createPuertoCityTerrainMaterial = (scene: Scene): PBRMaterial => {
	const material = new PBRMaterial('puerto-city-terrain-runtime-material', scene);
	const albedoTexture = new Texture(PUERTO_CITY_ALBEDO_TEXTURE_URL, scene);
	const normalTexture = new Texture(PUERTO_CITY_NORMAL_TEXTURE_URL, scene);
	const ormTexture = new Texture(PUERTO_CITY_ORM_TEXTURE_URL, scene);

	albedoTexture.name = 'puerto-city-albedo-texture';
	albedoTexture.gammaSpace = true;
	albedoTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
	albedoTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
	albedoTexture.anisotropicFilteringLevel = 8;

	normalTexture.name = 'puerto-city-normal-texture';
	normalTexture.gammaSpace = false;
	normalTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
	normalTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
	normalTexture.anisotropicFilteringLevel = 8;
	normalTexture.level = 0.45;

	ormTexture.name = 'puerto-city-orm-texture';
	ormTexture.gammaSpace = false;
	ormTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
	ormTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
	ormTexture.anisotropicFilteringLevel = 8;

	material.albedoColor = Color3.White();
	material.albedoTexture = albedoTexture;
	material.bumpTexture = normalTexture;
	material.metallicTexture = ormTexture;
	material.metallic = 0;
	material.roughness = 0.88;
	material.useAmbientOcclusionFromMetallicTextureRed = true;
	material.useRoughnessFromMetallicTextureGreen = true;
	material.useMetallnessFromMetallicTextureBlue = false;
	material.specularIntensity = 0.12;

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

const isPuertoDistantContextMeshName = (name: string): boolean =>
	name.startsWith('puerto-atlantic-ocean') ||
	name.startsWith('puerto-orotava-valley-ridge') ||
	name.startsWith('puerto-teide-');

const getMinimumWorldY = (meshes: Mesh[]): number | null => {
	const minimumYValues = meshes
		.filter((mesh) => mesh.isEnabled() && mesh.getTotalVertices() > 0)
		.map((mesh) => {
			mesh.computeWorldMatrix(true);
			mesh.refreshBoundingInfo();

			return mesh.getBoundingInfo().boundingBox.minimumWorld.y;
		});

	if (minimumYValues.length === 0) {
		return null;
	}

	return Math.min(...minimumYValues);
};

/**
 * Loads the generated Puerto de la Cruz terrain patch as the active `ground1` mesh.
 */
const PuertoCityTerrain: React.FC<PropsType> = ({
	havokPlugin,
	hideDistantContext = false,
	onReadyChange,
	transform,
}) => {
	const scene = useScene();
	const importedMeshesRef = useRef<AbstractMesh[]>([]);
	const rootRef = useRef<TransformNode | null>(null);
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
		const root = new TransformNode('puerto-city-terrain-root', scene);
		root.position = transform?.position.clone() ?? root.position;
		root.scaling.setAll(transform?.scale ?? 1);
		rootRef.current = root;

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
					mesh.parent = root;
					mesh.isPickable = false;
					mesh.checkCollisions = false;

					if (hideDistantContext && isPuertoDistantContextMeshName(mesh.name)) {
						mesh.setEnabled(false);
						mesh.isVisible = false;
					}
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

				if (typeof transform?.alignBottomToY === 'number') {
					const overlayMinimumY = getMinimumWorldY(
						buildingMeshes.length > 0 ? buildingMeshes : [terrainMesh],
					);

					if (overlayMinimumY !== null) {
						root.position.y += transform.alignBottomToY - overlayMinimumY;
						root.computeWorldMatrix(true);
					}
				}

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
			if (rootRef.current && !rootRef.current.isDisposed()) {
				rootRef.current.dispose(false, true);
			}
			rootRef.current = null;
			materialRef.current?.dispose(true, true);
			materialRef.current = null;
		};
	}, [havokPlugin, hideDistantContext, onReadyChange, scene, transform]);

	return null;
};

export default PuertoCityTerrain;
