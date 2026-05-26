import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { SkyMaterial } from '@babylonjs/materials/sky/skyMaterial';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';

const SKY_SIZE = 1000;
// We align the sun visually with the directional light in Lighting.tsx,
// which points roughly towards (-0.4, -1.0, 0.2). So the sun is up and back.
const SUN_POSITION = new Vector3(40, 100, -20);

/**
 * Renders a physically based sky dome using Babylon's SkyMaterial.
 * This calculates Rayleigh and Mie scattering for a highly realistic atmospheric sky.
 */
const SkyDome: React.FC = () => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		scene.clearColor = Color4.FromHexString('#cfe6ff');

		const skyBox = MeshBuilder.CreateBox('skyBox', { size: SKY_SIZE }, scene);
		const skyMaterial = new SkyMaterial('skyMaterial', scene);

		skyMaterial.backFaceCulling = false;
		skyMaterial.disableDepthWrite = true;

		// Tuning the atmosphere for a beautiful clear day
		skyMaterial.turbidity = 4.0; // Amount of particulates in the air
		skyMaterial.luminance = 1.0; // Overall brightness
		skyMaterial.rayleigh = 2.0; // Scattering of light (blue sky)
		skyMaterial.mieCoefficient = 0.015; // Increased for a larger, beautiful sun halo
		skyMaterial.mieDirectionalG = 0.9; // Focuses the glow around the sun

		skyMaterial.useSunPosition = true;
		skyMaterial.sunPosition = SUN_POSITION;

		skyBox.material = skyMaterial;
		skyBox.infiniteDistance = true;
		skyBox.isPickable = false;
		skyBox.doNotSyncBoundingInfo = true;
		skyBox.renderingGroupId = 0;

		// Create a physical glowing sun mesh
		const sunMesh = MeshBuilder.CreateSphere('sun-mesh', { diameter: 45 }, scene);
		const sunMaterial = new StandardMaterial('sun-material', scene);

		sunMaterial.emissiveColor = new Color3(1.0, 0.95, 0.8); // Bright warm yellow-white
		sunMaterial.disableLighting = true; // Unaffected by scene lights

		sunMesh.material = sunMaterial;
		// Position the sun far away in the sky direction, just inside the skybox
		sunMesh.position = SUN_POSITION.normalize().scale(400);
		sunMesh.infiniteDistance = true;
		sunMesh.renderingGroupId = 0; // Same layer as sky
		sunMesh.isPickable = false;

		return () => {
			sunMaterial.dispose();
			sunMesh.dispose();
			skyMaterial.dispose();
			skyBox.dispose();
		};
	}, [scene]);

	return null;
};

export default SkyDome;
