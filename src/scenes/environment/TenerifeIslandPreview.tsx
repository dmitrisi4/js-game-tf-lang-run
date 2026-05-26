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
import { applyCollisionFilterToAggregate } from '@/scenes/physics/collisionLayers';
import { TENERIFE_CITY_ANCHOR_POSITION } from './tenerifePreviewConfig';

const TENERIFE_MODEL_ROOT_URL = '/models/environment/';
const TENERIFE_MODEL_FILENAME = 'tenerife-island-location.glb?v=2026-05-13-terrain-winding';
const TENERIFE_PREVIEW_SCALE = 48;
const TENERIFE_TERRAIN_MESH_NAME = 'env_tenerife_full_island_terrain_1unit_1km';
const PUERTO_DE_LA_CRUZ_LOCAL_POSITION = new Vector3(6.25, 0.347, 15.58);
const TENERIFE_TEXTURE_BASE_PATH = '/textures/Ground068_4K-JPG/Ground068_4K-JPG';
/**
 * UV projection extent in local mesh space. Covers the full island width
 * so UV goes 0→1 across 108 local units (= 5184 world units at scale×48).
 */
const TENERIFE_LOCAL_TEXTURE_EXTENT = 108;

/**
 * Normal and roughness micro-tiling — 1 tile ≈ 72 world-unit squares.
 * Keeps fine surface detail visible at player scale without blurring.
 */
const TENERIFE_NORMAL_REPEAT = 72;

/**
 * Volcanic height zones in world-Y space (after baking scale×48 transform).
 * Puerto de la Cruz city level ≈ Y 17. Teide peak ≈ Y 178.
 * Colors reference Canary Islands volcanic terrain palette.
 */
type VolcanicZoneType = {
	maxY: number;
	r: number;
	g: number;
	b: number;
};

const VOLCANIC_HEIGHT_ZONES: VolcanicZoneType[] = [
	// Coastal / beach — warm volcanic sand
	{ maxY: 4, r: 0.58, g: 0.52, b: 0.38 },
	// Dark basalt — low coastal cliffs and lava fields
	{ maxY: 18, r: 0.2, g: 0.16, b: 0.13 },
	// Reddish-brown volcanic rock — mid slopes
	{ maxY: 45, r: 0.42, g: 0.26, b: 0.17 },
	// Warm volcanic soil — dry sparse vegetation zone
	{ maxY: 90, r: 0.5, g: 0.38, b: 0.25 },
	// Pale grey-tan — upper pine forest / eroded rock
	{ maxY: 140, r: 0.58, g: 0.52, b: 0.4 },
	// Volcanic ash / pumice — Teide caldera zone
	{ maxY: Number.POSITIVE_INFINITY, r: 0.65, g: 0.61, b: 0.55 },
];

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

const createTenerifeTexture = (
	name: string,
	url: string,
	scene: Scene,
	gammaSpace = false,
	repeat = TENERIFE_NORMAL_REPEAT,
) => {
	const texture = new Texture(url, scene);

	texture.name = name;
	texture.gammaSpace = gammaSpace;
	texture.uScale = repeat;
	texture.vScale = repeat;
	texture.wrapU = Texture.WRAP_ADDRESSMODE;
	texture.wrapV = Texture.WRAP_ADDRESSMODE;
	// 16x anisotropic — critical for glancing-angle terrain readability
	texture.anisotropicFilteringLevel = 16;

	return texture;
};

/**
 * Builds a volcanic-island PBR material driven by vertex colors for zone colour,
 * with a high-frequency normal map overlay for surface micro-detail.
 *
 * Ground068 albedo is intentionally omitted — it is a temperate forest texture
 * that does not match Tenerife volcanic terrain. Zone colours come from
 * `applyVolcanicVertexColors` which maps world-Y height to a Canary Islands palette.
 */
const createTenerifeGroundMaterial = (scene: Scene): PBRMaterial => {
	const material = new PBRMaterial('tenerife-ground-textured-material', scene);

	// Zone colour is supplied via vertex colors; albedoColor acts as tint multiplier.
	material.albedoColor = Color3.White();

	// Normal map — micro surface detail at player scale
	material.bumpTexture = createTenerifeTexture(
		'tenerife-ground-normal-texture',
		`${TENERIFE_TEXTURE_BASE_PATH}_NormalGL.jpg`,
		scene,
		false,
		TENERIFE_NORMAL_REPEAT,
	);
	// Stronger level — visible micro-relief on steep volcanic slopes
	material.bumpTexture.level = 1.5;

	// AO — baked ambient occlusion for crevice depth
	material.ambientTexture = createTenerifeTexture(
		'tenerife-ground-ao-texture',
		`${TENERIFE_TEXTURE_BASE_PATH}_AmbientOcclusion.jpg`,
		scene,
		false,
		TENERIFE_NORMAL_REPEAT,
	);
	material.ambientTextureStrength = 0.72;
	material.useAmbientInGrayScale = true;

	// Roughness — volcanic rock varies from glassy to matte
	material.metallicTexture = createTenerifeTexture(
		'tenerife-ground-roughness-texture',
		`${TENERIFE_TEXTURE_BASE_PATH}_Roughness.jpg`,
		scene,
		false,
		TENERIFE_NORMAL_REPEAT,
	);
	material.metallic = 0;
	material.roughness = 0.88;
	material.useRoughnessFromMetallicTextureGreen = true;
	material.useMetallnessFromMetallicTextureBlue = false;
	// Volcanic rock has very low specular — avoid wet-look artefacts
	material.specularIntensity = 0.08;

	// Parallax occlusion — enhances depth on rough lava texture
	material.useParallax = true;
	material.useParallaxOcclusion = true;
	material.parallaxScaleBias = 0.03;

	return material;
};

/** Resolves the volcanic zone colour for a given world-Y height value. */
const getVolcanicColor = (worldY: number): VolcanicZoneType => {
	const zone = VOLCANIC_HEIGHT_ZONES.find((z) => worldY <= z.maxY);

	return zone ?? VOLCANIC_HEIGHT_ZONES[VOLCANIC_HEIGHT_ZONES.length - 1];
};

/**
 * Paints each vertex with a height-derived volcanic colour.
 *
 * Must be called AFTER `bakeRootTransformIntoMesh` so that vertex Y values
 * are in world space. A small sine-based variation breaks up uniform banding.
 * PBRMaterial automatically multiplies vertex colours with albedoColor.
 */
const applyVolcanicVertexColors = (mesh: Mesh): void => {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

	if (!positions) {
		return;
	}

	const colors: number[] = [];

	for (let index = 0; index < positions.length; index += 3) {
		const x = positions[index];
		const y = positions[index + 1];
		const z = positions[index + 2];
		const zone = getVolcanicColor(y);
		// Subtle variation to break uniform colour banding between zones
		const variation = 0.91 + (Math.sin(x * 0.031 + z * 0.019) + 1) * 0.045;

		colors.push(zone.r * variation, zone.g * variation, zone.b * variation, 1.0);
	}

	mesh.setVerticesData(VertexBuffer.ColorKind, colors, false);
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
						// Height-based volcanic colours — must run after transform bake
						applyVolcanicVertexColors(mesh);
						mesh.material = groundMaterial;
						mesh.isPickable = true;
						mesh.checkCollisions = true;
						mesh.computeWorldMatrix(true);

						if (havokPlugin) {
							const terrainAggregate = new PhysicsAggregate(
								mesh,
								PhysicsShapeType.MESH,
								{ mass: 0, restitution: 0.05, friction: 0.74 },
								scene,
							);

							applyCollisionFilterToAggregate(terrainAggregate, 'ground');
							physicsAggregatesRef.current.push(terrainAggregate);
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
