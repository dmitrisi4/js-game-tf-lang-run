import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';

const CLOUDS_SHADER_NAME = 'keyArenaClouds';
const CLOUDS_DIAMETER = 900;

Effect.ShadersStore[`${CLOUDS_SHADER_NAME}VertexShader`] = `
precision highp float;

attribute vec3 position;

uniform mat4 worldViewProjection;
uniform mat4 world;

varying vec3 vPosition;
varying vec3 vDirection;

void main(void) {
	vec4 worldPosition = world * vec4(position, 1.0);
	vPosition = worldPosition.xyz;
	vDirection = normalize(position);
	gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

Effect.ShadersStore[`${CLOUDS_SHADER_NAME}FragmentShader`] = `
precision highp float;

varying vec3 vPosition;
varying vec3 vDirection;

uniform float time;
uniform vec3 cloudColor;

// 3D hash function
float hash(vec3 p) {
	p = fract(p * 0.3183099 + .1);
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// 3D noise
float noise(vec3 x) {
	vec3 i = floor(x);
	vec3 f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	
	return mix(mix(mix(hash(i + vec3(0,0,0)), 
					   hash(i + vec3(1,0,0)), f.x),
				   mix(hash(i + vec3(0,1,0)), 
					   hash(i + vec3(1,1,0)), f.x), f.y),
			   mix(mix(hash(i + vec3(0,0,1)), 
					   hash(i + vec3(1,0,1)), f.x),
				   mix(hash(i + vec3(0,1,1)), 
					   hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

// FBM
float fbm(vec3 p) {
	float f = 0.0;
	float w = 0.5;
	for (int i = 0; i < 5; i++) {
		f += w * noise(p);
		p *= 2.03;
		w *= 0.5;
	}
	return f;
}

void main(void) {
	// Only render clouds in the upper hemisphere
	float heightMask = smoothstep(0.1, 0.4, vDirection.y);
	if (heightMask <= 0.01) {
		discard;
	}

	// Calculate cloud noise based on 3D direction and time
	vec3 p = vDirection * 4.0;
	p.x += time * 0.03;
	p.z += time * 0.02;

	float n = fbm(p);
	
	// Create cloud shapes
	float coverage = 0.1; // lower means more clouds (was 0.25)
	float alpha = smoothstep(coverage, coverage + 0.4, n);

	// Edge fade and height fade
	alpha *= heightMask;
	
	// Fade near zenith to make it look like a cloud layer in the distance
	float zenithFade = 1.0 - smoothstep(0.75, 1.0, vDirection.y);
	alpha *= zenithFade * 0.95;

	// Add some self-shadowing/thickness
	vec3 finalColor = mix(cloudColor * 0.65, cloudColor, smoothstep(coverage, coverage + 0.5, n));

	gl_FragColor = vec4(finalColor, alpha);
}
`;

/**
 * Renders a procedural cloud layer inside the sky dome.
 */
const Clouds: React.FC = () => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		const cloudsDome = MeshBuilder.CreateSphere(
			'clouds-dome',
			{
				diameter: CLOUDS_DIAMETER,
				segments: 32,
			},
			scene,
		);

		const cloudsMaterial = new ShaderMaterial(
			'clouds-material',
			scene,
			{
				vertex: CLOUDS_SHADER_NAME,
				fragment: CLOUDS_SHADER_NAME,
			},
			{
				attributes: ['position'],
				uniforms: ['world', 'worldViewProjection', 'time', 'cloudColor'],
				needAlphaBlending: true,
			},
		);

		cloudsMaterial.backFaceCulling = true; // We are inside it, wait we should see the back face if we are inside
		cloudsMaterial.disableDepthWrite = true;
		cloudsMaterial.setColor3('cloudColor', Color3.FromHexString('#ffffff'));
		cloudsMaterial.setFloat('time', 0);
		cloudsMaterial.alphaMode = 2; // BABYLON.Engine.ALPHA_COMBINE

		cloudsDome.material = cloudsMaterial;
		cloudsDome.infiniteDistance = true;
		cloudsDome.isPickable = false;
		cloudsDome.doNotSyncBoundingInfo = true;
		cloudsDome.renderingGroupId = 1; // Render after the sky (which is 0)

		// Flip faces so we see the inside of the sphere
		cloudsDome.flipFaces();

		let observer: Observer<BabylonScene> | null = null;

		observer = scene.onBeforeRenderObservable.add(() => {
			cloudsMaterial.setFloat('time', performance.now() * 0.001);
		});

		return () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}

			cloudsMaterial.dispose();
			cloudsDome.dispose();
		};
	}, [scene]);

	return null;
};

export default Clouds;
