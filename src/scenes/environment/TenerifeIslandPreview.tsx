import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
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
import { TENERIFE_CITY_ANCHOR_POSITION } from './tenerifePreviewConfig';

const TENERIFE_MODEL_ROOT_URL = '/models/environment/';
const TENERIFE_MODEL_FILENAME = 'tenerife-island-location.glb?v=2026-05-13-terrain-winding';
const TENERIFE_PREVIEW_SCALE = 48;
const TENERIFE_TERRAIN_MESH_NAME = 'env_tenerife_full_island_terrain_1unit_1km';
const PUERTO_DE_LA_CRUZ_LOCAL_POSITION = new Vector3(6.25, 0.347, 15.58);
const TENERIFE_TEXTURE_BASE_PATH = '/textures/Ground068_4K-JPG/Ground068_4K-JPG';
const TENERIFE_TEXTURE_REPEAT = 72;
const TENERIFE_LOCAL_TEXTURE_EXTENT = 108;

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

const createTenerifeTexture = (name: string, url: string, scene: Scene, gammaSpace = false) => {
	const texture = new Texture(url, scene);

	texture.name = name;
	texture.gammaSpace = gammaSpace;
	texture.uScale = TENERIFE_TEXTURE_REPEAT;
	texture.vScale = TENERIFE_TEXTURE_REPEAT;
	texture.wrapU = Texture.WRAP_ADDRESSMODE;
	texture.wrapV = Texture.WRAP_ADDRESSMODE;
	texture.anisotropicFilteringLevel = 8;

	return texture;
};

const createTenerifeGroundMaterial = (scene: Scene): PBRMaterial => {
	const material = new PBRMaterial('tenerife-ground-textured-material', scene);

	material.albedoColor = Color3.White();
	material.albedoTexture = createTenerifeTexture(
		'tenerife-ground-color-texture',
		`${TENERIFE_TEXTURE_BASE_PATH}_Color.jpg`,
		scene,
		true,
	);
	material.bumpTexture = createTenerifeTexture(
		'tenerife-ground-normal-texture',
		`${TENERIFE_TEXTURE_BASE_PATH}_NormalGL.jpg`,
		scene,
	);
	material.bumpTexture.level = 0.5;
	material.ambientTexture = createTenerifeTexture(
		'tenerife-ground-ambient-occlusion-texture',
		`${TENERIFE_TEXTURE_BASE_PATH}_AmbientOcclusion.jpg`,
		scene,
	);
	material.ambientTextureStrength = 0.45;
	material.useAmbientInGrayScale = true;
	material.metallicTexture = createTenerifeTexture(
		'tenerife-ground-roughness-texture',
		`${TENERIFE_TEXTURE_BASE_PATH}_Roughness.jpg`,
		scene,
	);
	material.metallic = 0;
	material.roughness = 0.92;
	material.useRoughnessFromMetallicTextureGreen = true;
	material.useMetallnessFromMetallicTextureBlue = false;
	material.specularIntensity = 0.18;

	return material;
};

const isTerrainMesh = (mesh: AbstractMesh): mesh is Mesh =>
	mesh instanceof Mesh &&
	(mesh.name === TENERIFE_TERRAIN_MESH_NAME || mesh.name.toLowerCase().includes('terrain'));

const isBakedPuertoDetailMesh = (mesh: AbstractMesh): boolean =>
	mesh.name === 'env_atlantic_ocean_disc' ||
	mesh.name.startsWith('city_puerto_cruz_') ||
	mesh.name.startsWith('puerto_cruz_osm_');

const applyTerrainUv = (mesh: Mesh): void => {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

	if (!positions) {
		return;
	}

	const uvs: number[] = [];

	for (let index = 0; index < positions.length; index += 3) {
		const x = positions[index];
		const z = positions[index + 2];

		uvs.push(x / TENERIFE_LOCAL_TEXTURE_EXTENT + 0.5, z / TENERIFE_LOCAL_TEXTURE_EXTENT + 0.5);
	}

	mesh.setVerticesData(VertexBuffer.UVKind, uvs, false);
};

const bakeRootTransformIntoMesh = (mesh: AbstractMesh, root: TransformNode): void => {
	mesh.parent = root;
	mesh.computeWorldMatrix(true);

	if (!(mesh instanceof Mesh)) {
		return;
	}

	const worldMatrix = mesh.getWorldMatrix().clone();
	mesh.parent = null;
	mesh.bakeTransformIntoVertices(worldMatrix);
	mesh.position.setAll(0);
	mesh.rotation.setAll(0);
	mesh.scaling.setAll(1);
	mesh.refreshBoundingInfo();
};

/**
 * Loads the lightweight Tenerife island blockout as a non-physical preview layer.
 */
const TenerifeIslandPreview: React.FC<PropsType> = ({ havokPlugin, onReadyChange }) => {
	const scene = useScene();
	const rootRef = useRef<TransformNode | null>(null);
	const importedMeshesRef = useRef<AbstractMesh[]>([]);
	const importedTransformNodesRef = useRef<TransformNode[]>([]);
	const physicsAggregatesRef = useRef<PhysicsAggregate[]>([]);
	const groundMaterialRef = useRef<PBRMaterial | null>(null);

	useEffect(() => {
		if (!scene) {
			onReadyChange?.(false);
			return;
		}

		let isDisposed = false;
		onReadyChange?.(false);
		const root = new TransformNode('tenerife-island-preview-root', scene);
		root.position = new Vector3(
			TENERIFE_CITY_ANCHOR_POSITION.x - PUERTO_DE_LA_CRUZ_LOCAL_POSITION.x * TENERIFE_PREVIEW_SCALE,
			TENERIFE_CITY_ANCHOR_POSITION.y - PUERTO_DE_LA_CRUZ_LOCAL_POSITION.y * TENERIFE_PREVIEW_SCALE,
			TENERIFE_CITY_ANCHOR_POSITION.z - PUERTO_DE_LA_CRUZ_LOCAL_POSITION.z * TENERIFE_PREVIEW_SCALE,
		);
		root.scaling.setAll(TENERIFE_PREVIEW_SCALE);
		rootRef.current = root;
		const groundMaterial = createTenerifeGroundMaterial(scene);
		groundMaterialRef.current = groundMaterial;

		SceneLoader.ImportMeshAsync(undefined, TENERIFE_MODEL_ROOT_URL, TENERIFE_MODEL_FILENAME, scene)
			.then((result) => {
				if (isDisposed) {
					for (const mesh of result.meshes) {
						mesh.dispose(false, true);
					}
					for (const transformNode of result.transformNodes) {
						transformNode.dispose(false, true);
					}
					return;
				}

				importedMeshesRef.current = result.meshes;
				importedTransformNodesRef.current = result.transformNodes;

				for (const mesh of result.meshes) {
					bakeRootTransformIntoMesh(mesh, root);
					mesh.isPickable = false;
					mesh.checkCollisions = false;

					if (isBakedPuertoDetailMesh(mesh)) {
						mesh.setEnabled(false);
						mesh.isVisible = false;
						continue;
					}

					if (isTerrainMesh(mesh)) {
						mesh.name = 'ground1';
						applyTerrainUv(mesh);
						mesh.material = groundMaterial;
						mesh.isPickable = true;
						mesh.checkCollisions = true;
						mesh.computeWorldMatrix(true);

						if (havokPlugin) {
							physicsAggregatesRef.current.push(
								new PhysicsAggregate(
									mesh,
									PhysicsShapeType.MESH,
									{ mass: 0, restitution: 0.05, friction: 0.74 },
									scene,
								),
							);
						}
					}
				}

				onReadyChange?.(true);

				for (const transformNode of result.transformNodes) {
					if (transformNode !== root && !transformNode.parent) {
						transformNode.parent = root;
					}
				}
			})
			.catch(() => {
				if (!root.isDisposed()) {
					root.dispose(false, true);
				}
				rootRef.current = null;
				onReadyChange?.(true);
			});

		return () => {
			isDisposed = true;
			onReadyChange?.(false);

			for (const aggregate of physicsAggregatesRef.current) {
				aggregate.dispose();
			}

			for (const mesh of importedMeshesRef.current) {
				if (!mesh.isDisposed()) {
					mesh.dispose(false, true);
				}
			}

			for (const transformNode of importedTransformNodesRef.current) {
				if (!transformNode.isDisposed()) {
					transformNode.dispose(false, true);
				}
			}

			if (rootRef.current && !rootRef.current.isDisposed()) {
				rootRef.current.dispose(false, true);
			}

			importedMeshesRef.current = [];
			importedTransformNodesRef.current = [];
			physicsAggregatesRef.current = [];
			groundMaterialRef.current?.dispose(true, true);
			groundMaterialRef.current = null;
			rootRef.current = null;
		};
	}, [havokPlugin, onReadyChange, scene]);

	return null;
};

export default TenerifeIslandPreview;
