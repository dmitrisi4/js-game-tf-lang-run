import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import type { Scene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';
import { applyCollisionFilterToAggregate } from '@/scenes/physics/collisionLayers';
import { getTerrainHeightAt, getTerrainMaterialAt, TERRAIN_SUBDIVISIONS } from './terrainData';
import { WORLD_SIZE } from './worldData';
import type { TerrainMaterialKey } from './worldZones';

type PropsType = {
	havokPlugin: HavokPlugin | null;
};

const TERRAIN_COLORS: Record<TerrainMaterialKey, Color4> = {
	grass: Color4.FromColor3(Color3.FromHexString('#587a3e'), 1),
	dirt: Color4.FromColor3(Color3.FromHexString('#7b6844'), 1),
	moss: Color4.FromColor3(Color3.FromHexString('#4f8151'), 1),
	rock: Color4.FromColor3(Color3.FromHexString('#686f68'), 1),
	ash: Color4.FromColor3(Color3.FromHexString('#5d584c'), 1),
};

const TERRAIN_TEXTURE_BASE_PATH = '/textures/Ground068_4K-JPG/Ground068_4K-JPG';
const TERRAIN_TEXTURE_REPEAT = WORLD_SIZE / 8;

const createTerrainTexture = (name: string, url: string, scene: Scene, gammaSpace = false) => {
	const texture = new Texture(url, scene);

	texture.name = name;
	texture.gammaSpace = gammaSpace;
	texture.uScale = TERRAIN_TEXTURE_REPEAT;
	texture.vScale = TERRAIN_TEXTURE_REPEAT;
	texture.wrapU = Texture.WRAP_ADDRESSMODE;
	texture.wrapV = Texture.WRAP_ADDRESSMODE;
	texture.anisotropicFilteringLevel = 8;

	return texture;
};

/**
 * Builds the procedural terrain mesh used by the expanded RPG map.
 *
 * The terrain height and material are deterministic data helpers so future
 * gameplay systems can query them without depending on Babylon scene objects.
 */
const TerrainGround: React.FC<PropsType> = ({ havokPlugin }) => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		const terrain = MeshBuilder.CreateGround(
			'ground1',
			{
				width: WORLD_SIZE,
				height: WORLD_SIZE,
				subdivisions: TERRAIN_SUBDIVISIONS,
				updatable: false,
			},
			scene,
		);
		const positions = terrain.getVerticesData(VertexBuffer.PositionKind);
		const indices = terrain.getIndices();

		if (!positions || !indices) {
			terrain.dispose();
			return;
		}

		const normals = new Array<number>(positions.length).fill(0);
		const colors: number[] = [];

		for (let index = 0; index < positions.length; index += 3) {
			const x = positions[index];
			const z = positions[index + 2];
			const height = getTerrainHeightAt({ x, z });
			const material = getTerrainMaterialAt({ x, z });
			const color = TERRAIN_COLORS[material];
			const variation = 0.92 + ((Math.sin(x * 0.37 + z * 0.19) + 1) / 2) * 0.12;

			positions[index + 1] = height;
			colors.push(color.r * variation, color.g * variation, color.b * variation, color.a);
		}

		VertexData.ComputeNormals(positions, indices, normals);
		terrain.setVerticesData(VertexBuffer.PositionKind, positions);
		terrain.setVerticesData(VertexBuffer.NormalKind, normals);
		terrain.setVerticesData(VertexBuffer.ColorKind, colors);
		terrain.refreshBoundingInfo();
		terrain.isPickable = true;

		const material = new PBRMaterial('terrain-ground-material', scene);
		material.albedoColor = Color3.White();
		material.albedoTexture = createTerrainTexture(
			'terrain-ground-color-texture',
			`${TERRAIN_TEXTURE_BASE_PATH}_Color.jpg`,
			scene,
			true,
		);
		material.bumpTexture = createTerrainTexture(
			'terrain-ground-normal-texture',
			`${TERRAIN_TEXTURE_BASE_PATH}_NormalGL.jpg`,
			scene,
		);
		material.bumpTexture.level = 0.55;
		material.ambientTexture = createTerrainTexture(
			'terrain-ground-ambient-occlusion-texture',
			`${TERRAIN_TEXTURE_BASE_PATH}_AmbientOcclusion.jpg`,
			scene,
		);
		material.ambientTextureStrength = 0.45;
		material.useAmbientInGrayScale = true;
		material.metallicTexture = createTerrainTexture(
			'terrain-ground-roughness-texture',
			`${TERRAIN_TEXTURE_BASE_PATH}_Roughness.jpg`,
			scene,
		);
		material.metallic = 0;
		material.roughness = 0.92;
		material.useRoughnessFromMetallicTextureGreen = true;
		material.useMetallnessFromMetallicTextureBlue = false;
		material.specularIntensity = 0.18;
		terrain.material = material;

		const physicsAggregate = havokPlugin
			? new PhysicsAggregate(
					terrain,
					PhysicsShapeType.MESH,
					{ mass: 0, restitution: 0.08, friction: 0.72 },
					scene,
				)
			: null;

		applyCollisionFilterToAggregate(physicsAggregate, 'ground');

		return () => {
			physicsAggregate?.dispose();
			material.dispose(true, true);
			terrain.dispose();
		};
	}, [havokPlugin, scene]);

	return null;
};

export default TerrainGround;
