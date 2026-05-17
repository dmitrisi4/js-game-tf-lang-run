import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';

const SKY_SHADER_NAME = 'keyArenaSky';
const SKY_DIAMETER = 180;
const SUN_DIRECTION = new Vector3(-0.48, 0.72, -0.5).normalize();

Effect.ShadersStore[`${SKY_SHADER_NAME}VertexShader`] = `
precision highp float;

attribute vec3 position;

uniform mat4 worldViewProjection;
uniform mat4 world;

varying vec3 vDirection;

void main(void) {
	vec4 worldPosition = world * vec4(position, 1.0);
	vDirection = normalize(worldPosition.xyz);
	gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

Effect.ShadersStore[`${SKY_SHADER_NAME}FragmentShader`] = `
precision highp float;

varying vec3 vDirection;

uniform vec3 topColor;
uniform vec3 midColor;
uniform vec3 horizonColor;
uniform vec3 groundColor;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform float time;

float cloudLayer(vec3 direction, float scale, float speed, float threshold) {
	float waveA = sin(direction.x * scale + time * speed);
	float waveB = sin((direction.z * scale * 0.72) - time * speed * 0.68);
	float waveC = sin((direction.x + direction.z) * scale * 0.42 + time * speed * 0.34);
	float value = (waveA + waveB + waveC) / 3.0;

	return smoothstep(threshold, 1.0, value);
}

void main(void) {
	vec3 direction = normalize(vDirection);
	float height = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
	float upperMix = smoothstep(0.2, 1.0, height);
	float horizonMix = smoothstep(0.0, 0.32, height);
	vec3 skyColor = mix(groundColor, horizonColor, horizonMix);

	skyColor = mix(skyColor, midColor, smoothstep(0.16, 0.58, height));
	skyColor = mix(skyColor, topColor, upperMix);

	float sunAmount = max(dot(direction, normalize(sunDirection)), 0.0);
	float sunDisk = pow(sunAmount, 420.0);
	float sunGlow = pow(sunAmount, 10.0) * 0.55;
	float horizonGlow = pow(1.0 - abs(direction.y), 3.0) * 0.18;

	float cloudMask = cloudLayer(direction, 12.0, 0.018, 0.34);
	float cloudBand = smoothstep(0.16, 0.5, height) * (1.0 - smoothstep(0.72, 0.9, height));
	vec3 cloudColor = vec3(1.0, 0.88, 0.68);

	skyColor = mix(skyColor, cloudColor, cloudMask * cloudBand * 0.22);
	skyColor += sunColor * (sunDisk + sunGlow);
	skyColor += sunColor * horizonGlow;

	gl_FragColor = vec4(skyColor, 1.0);
}
`;

/**
 * Renders a shader-driven sky dome behind the playable world.
 */
const SkyDome: React.FC = () => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		scene.clearColor = Color4.FromHexString('#cfe6ff');

		const skyDome = MeshBuilder.CreateSphere(
			'sky-dome',
			{
				diameter: SKY_DIAMETER,
				segments: 48,
				sideOrientation: Mesh.BACKSIDE,
			},
			scene,
		);
		const skyMaterial = new ShaderMaterial(
			'sky-dome-material',
			scene,
			{
				vertex: SKY_SHADER_NAME,
				fragment: SKY_SHADER_NAME,
			},
			{
				attributes: ['position'],
				uniforms: [
					'world',
					'worldViewProjection',
					'topColor',
					'midColor',
					'horizonColor',
					'groundColor',
					'sunColor',
					'sunDirection',
					'time',
				],
			},
		);

		skyMaterial.backFaceCulling = false;
		skyMaterial.disableDepthWrite = true;
		skyMaterial.setColor3('topColor', Color3.FromHexString('#2765b9'));
		skyMaterial.setColor3('midColor', Color3.FromHexString('#79b8f2'));
		skyMaterial.setColor3('horizonColor', Color3.FromHexString('#ffd49a'));
		skyMaterial.setColor3('groundColor', Color3.FromHexString('#6b7862'));
		skyMaterial.setColor3('sunColor', Color3.FromHexString('#ffd47c'));
		skyMaterial.setVector3('sunDirection', SUN_DIRECTION);
		skyMaterial.setFloat('time', 0);

		skyDome.material = skyMaterial;
		skyDome.infiniteDistance = true;
		skyDome.isPickable = false;
		skyDome.doNotSyncBoundingInfo = true;
		skyDome.renderingGroupId = 0;

		let observer: Observer<BabylonScene> | null = null;

		observer = scene.onBeforeRenderObservable.add(() => {
			skyMaterial.setFloat('time', performance.now() * 0.001);
		});

		return () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}

			skyMaterial.dispose();
			skyDome.dispose();
		};
	}, [scene]);

	return null;
};

export default SkyDome;
