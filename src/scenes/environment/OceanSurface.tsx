import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';

import {
	getOceanSurfaceMetrics,
	getOceanWaveScale,
	type OceanBoundsType,
} from './oceanVisualConfig';

const OCEAN_SHADER_NAME = 'keyArenaOcean';
const OCEAN_SUBDIVISIONS = 96;
const SUN_DIRECTION = new Vector3(-0.48, 0.72, -0.5).normalize();

type PropsType = {
	bounds: OceanBoundsType;
	name: string;
	opacity?: number;
	surfaceY: number;
};

Effect.ShadersStore[`${OCEAN_SHADER_NAME}VertexShader`] = `
precision highp float;

attribute vec3 position;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec2 vLocalPosition;
varying vec3 vWorldPosition;

void main(void) {
	vec4 worldPosition = world * vec4(position, 1.0);

	vLocalPosition = position.xz;
	vWorldPosition = worldPosition.xyz;
	gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

Effect.ShadersStore[`${OCEAN_SHADER_NAME}FragmentShader`] = `
precision highp float;

varying vec2 vLocalPosition;
varying vec3 vWorldPosition;

uniform vec2 surfaceSize;
uniform vec3 deepColor;
uniform vec3 midColor;
uniform vec3 shallowColor;
uniform vec3 foamColor;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform float opacity;
uniform float time;
uniform float waveScale;

float waveField(vec2 position, float speed) {
	float waveA = sin(position.x * 0.84 + time * speed);
	float waveB = sin(position.y * 1.18 - time * speed * 0.72);
	float waveC = sin((position.x + position.y) * 0.46 + time * speed * 0.38);

	return (waveA + waveB + waveC) / 3.0;
}

void main(void) {
	vec2 normalized = abs(vLocalPosition) / max(surfaceSize * 0.5, vec2(1.0));
	float edgeDistance = clamp(max(normalized.x, normalized.y), 0.0, 1.0);
	float centerDistance = clamp(length(normalized), 0.0, 1.0);
	vec2 wavePosition = vLocalPosition / max(waveScale, 1.0);

	float broadWave = waveField(wavePosition, 0.72);
	float tightWave = waveField(wavePosition * 3.4 + vec2(12.0, -7.0), 1.65);
	float ripple = smoothstep(0.34, 0.94, broadWave * 0.68 + tightWave * 0.32);
	float shoreline = smoothstep(0.38, 0.82, centerDistance) * (1.0 - smoothstep(0.82, 1.0, centerDistance));
	float horizonDepth = smoothstep(0.46, 1.0, edgeDistance);

	vec3 waterColor = mix(shallowColor, midColor, smoothstep(0.18, 0.62, centerDistance));
	waterColor = mix(waterColor, deepColor, horizonDepth * 0.78);
	waterColor += foamColor * ripple * 0.12;
	waterColor = mix(waterColor, foamColor, shoreline * ripple * 0.26);

	vec3 viewDirection = normalize(vec3(-vWorldPosition.x * 0.012, 1.0, -vWorldPosition.z * 0.012));
	float sunFacing = max(dot(viewDirection, normalize(sunDirection)), 0.0);
	float glint = pow(sunFacing, 18.0) * smoothstep(0.52, 0.98, ripple);
	waterColor += sunColor * glint * 0.42;

	gl_FragColor = vec4(waterColor, opacity);
}
`;

/**
 * Renders the visual-only stylized ocean surface used by Tenerife modes.
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
		const material = new ShaderMaterial(
			`${name}-material`,
			scene,
			{
				vertex: OCEAN_SHADER_NAME,
				fragment: OCEAN_SHADER_NAME,
			},
			{
				attributes: ['position'],
				uniforms: [
					'world',
					'worldViewProjection',
					'surfaceSize',
					'deepColor',
					'midColor',
					'shallowColor',
					'foamColor',
					'sunColor',
					'sunDirection',
					'opacity',
					'time',
					'waveScale',
				],
			},
		);

		ocean.position.copyFrom(metrics.center);
		ocean.isPickable = false;
		ocean.renderingGroupId = 0;

		material.backFaceCulling = false;
		material.disableDepthWrite = false;
		material.needAlphaBlending = () => true;
		material.setVector2('surfaceSize', new Vector2(metrics.width, metrics.depth));
		material.setColor3('deepColor', Color3.FromHexString('#063f5d'));
		material.setColor3('midColor', Color3.FromHexString('#0d86a0'));
		material.setColor3('shallowColor', Color3.FromHexString('#4abfc1'));
		material.setColor3('foamColor', Color3.FromHexString('#d9fff3'));
		material.setColor3('sunColor', Color3.FromHexString('#ffd08a'));
		material.setVector3('sunDirection', SUN_DIRECTION);
		material.setFloat('opacity', opacity);
		material.setFloat('time', 0);
		material.setFloat('waveScale', getOceanWaveScale(metrics.width, metrics.depth));

		ocean.material = material;

		const observer: Observer<BabylonScene> = scene.onBeforeRenderObservable.add(() => {
			material.setFloat('time', performance.now() * 0.001);
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
			material.dispose();
			ocean.dispose();
		};
	}, [bounds, name, opacity, scene, surfaceY]);

	return null;
};

export default OceanSurface;
