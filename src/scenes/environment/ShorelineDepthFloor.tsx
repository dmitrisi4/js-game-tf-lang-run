import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';
import {
	getOceanSurfaceMetrics,
	getShorelineDepthGradientConfig,
	type OceanBoundsType,
} from './oceanVisualConfig';

const SHORELINE_DEPTH_SHADER_NAME = 'keyArenaShorelineDepth';
const SHORELINE_DEPTH_SUBDIVISIONS = 96;

type PropsType = {
	bounds: OceanBoundsType;
	name: string;
	y: number;
};

Effect.ShadersStore[`${SHORELINE_DEPTH_SHADER_NAME}VertexShader`] = `
precision highp float;

attribute vec3 position;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec2 vWorldXZ;

void main(void) {
	vec4 worldPosition = world * vec4(position, 1.0);

	vWorldXZ = worldPosition.xz;
	gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

Effect.ShadersStore[`${SHORELINE_DEPTH_SHADER_NAME}FragmentShader`] = `
precision highp float;

varying vec2 vWorldXZ;

uniform vec2 islandRadius;
uniform float foamWidth;
uniform float shallowEnd;
uniform float deepStart;
uniform vec3 coastColor;
uniform vec3 shallowColor;
uniform vec3 midColor;
uniform vec3 deepColor;

float ellipseSignedDistance(vec2 point, vec2 radius) {
	vec2 normalized = point / max(radius, vec2(1.0));
	float outsideRatio = length(normalized);
	float averageRadius = (radius.x + radius.y) * 0.5;

	return (outsideRatio - 1.0) * averageRadius;
}

void main(void) {
	float coastDistance = ellipseSignedDistance(vWorldXZ, islandRadius);
	float waterDistance = max(coastDistance, 0.0);
	float shallowMix = smoothstep(0.0, max(shallowEnd, 1.0), waterDistance);
	float deepMix = smoothstep(shallowEnd, max(deepStart, shallowEnd + 1.0), waterDistance);
	float foamLine = 1.0 - smoothstep(0.0, max(foamWidth, 1.0), abs(coastDistance));

	vec3 color = mix(coastColor, shallowColor, shallowMix);
	color = mix(color, midColor, deepMix * 0.72);
	color = mix(color, deepColor, smoothstep(deepStart, deepStart * 1.9, waterDistance));
	color = mix(color, vec3(0.82, 1.0, 0.95), foamLine * 0.2);

	gl_FragColor = vec4(color, 1.0);
}
`;

/**
 * Renders a visual-only seabed gradient so shoreline water gains depth gradually.
 */
const ShorelineDepthFloor: React.FC<PropsType> = ({ bounds, name, y }) => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		const metrics = getOceanSurfaceMetrics(bounds, y);
		const gradient = getShorelineDepthGradientConfig(metrics.width, metrics.depth);
		const floor = MeshBuilder.CreateGround(
			name,
			{
				height: metrics.depth,
				subdivisions: SHORELINE_DEPTH_SUBDIVISIONS,
				width: metrics.width,
			},
			scene,
		);
		const material = new ShaderMaterial(
			`${name}-material`,
			scene,
			{
				fragment: SHORELINE_DEPTH_SHADER_NAME,
				vertex: SHORELINE_DEPTH_SHADER_NAME,
			},
			{
				attributes: ['position'],
				uniforms: [
					'world',
					'worldViewProjection',
					'islandRadius',
					'foamWidth',
					'shallowEnd',
					'deepStart',
					'coastColor',
					'shallowColor',
					'midColor',
					'deepColor',
				],
			},
		);

		floor.position.copyFrom(metrics.center);
		floor.isPickable = false;
		floor.renderingGroupId = 0;

		material.backFaceCulling = false;
		material.setVector2('islandRadius', new Vector2(gradient.edgeRadiusX, gradient.edgeRadiusZ));
		material.setFloat('foamWidth', gradient.foamWidth);
		material.setFloat('shallowEnd', gradient.shallowEnd);
		material.setFloat('deepStart', gradient.deepStart);
		material.setColor3('coastColor', Color3.FromHexString('#6fc6bc'));
		material.setColor3('shallowColor', Color3.FromHexString('#1698a8'));
		material.setColor3('midColor', Color3.FromHexString('#075b78'));
		material.setColor3('deepColor', Color3.FromHexString('#021521'));
		floor.material = material;

		return () => {
			material.dispose();
			floor.dispose();
		};
	}, [bounds, name, scene, y]);

	return null;
};

export default ShorelineDepthFloor;
