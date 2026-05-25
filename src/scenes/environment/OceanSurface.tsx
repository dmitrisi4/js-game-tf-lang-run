import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { WaterMaterial } from '@babylonjs/materials/water';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';

import {
	getOceanMaterialConfig,
	getOceanSurfaceMetrics,
	type OceanBoundsType,
} from './oceanVisualConfig';

const OCEAN_SUBDIVISIONS = 96;

type PropsType = {
	bounds: OceanBoundsType;
	name: string;
	opacity?: number;
	surfaceY: number;
};

/**
 * Renders the realistic ocean surface using Babylon's built-in WaterMaterial.
 */
const OceanSurface: React.FC<PropsType> = ({ bounds, name, opacity = 0.82, surfaceY }) => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		const metrics = getOceanSurfaceMetrics(bounds, surfaceY);
		const ocean = MeshBuilder.CreateGround(
			name,
			{
				height: metrics.depth,
				subdivisions: OCEAN_SUBDIVISIONS,
				width: metrics.width,
			},
			scene,
		);

		ocean.position.copyFrom(metrics.center);
		ocean.isPickable = false;
		ocean.renderingGroupId = 0;

		const material = new WaterMaterial(`${name}-material`, scene, new Vector2(1024, 1024));
		const materialConfig = getOceanMaterialConfig(metrics.width, metrics.depth);

		material.backFaceCulling = false;
		material.bumpTexture = new Texture('/textures/waterbump.png', scene);
		material.windForce = materialConfig.windForce;
		material.windDirection = new Vector2(0.72, 0.28);
		material.waveHeight = materialConfig.waveHeight;
		material.waveLength = materialConfig.waveLength;
		material.waveSpeed = materialConfig.waveSpeed;
		material.waveCount = materialConfig.waveCount;
		material.bumpHeight = materialConfig.bumpHeight;
		material.bumpSuperimpose = true;
		material.bumpAffectsReflection = true;
		material.fresnelSeparate = true;
		material.useWorldCoordinatesForWaveDeformation = true;
		material.waterColor = Color3.FromHexString('#18a8bd');
		material.waterColor2 = Color3.FromHexString('#04344f');
		material.colorBlendFactor = materialConfig.colorBlendFactor;
		material.colorBlendFactor2 = materialConfig.colorBlendFactor2;
		material.specularColor = Color3.FromHexString('#d6fbff');
		material.specularPower = 96;
		material.alpha = opacity;

		// Register existing meshes for WaterMaterial reflection + refraction RTTs.
		// Must use addToRenderList() — pushing directly to material.renderList only
		// writes to the refraction RTT getter and misses the reflection RTT entirely.
		for (const mesh of scene.meshes) {
			if (mesh.name !== name && mesh.isVisible && mesh.isEnabled()) {
				material.addToRenderList(mesh);
			}
		}

		// Handle dynamically added meshes
		const observer = scene.onNewMeshAddedObservable.add((mesh: AbstractMesh) => {
			if (mesh.name !== name) {
				material.addToRenderList(mesh);
			}
		});

		ocean.material = material;

		return () => {
			scene.onNewMeshAddedObservable.remove(observer);
			material.dispose();
			ocean.dispose();
		};
	}, [bounds, name, opacity, scene, surfaceY]);

	return null;
};

export default OceanSurface;
