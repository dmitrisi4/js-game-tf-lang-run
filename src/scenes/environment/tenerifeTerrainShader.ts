import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import { publicAssetUrl } from '@/utils/publicAssetUrl';

const SHADER_NAME = 'tenerifeTerrainSplat';

const TEXTURE_BASE = publicAssetUrl('/textures/Ground068_4K-JPG/Ground068_4K-JPG');

// ─────────────────────────────────────────────────────────────────────────────
// Vertex shader — passes world-space position and normal to the fragment stage
// ─────────────────────────────────────────────────────────────────────────────
const VERTEX_SHADER = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 worldViewProjection;
uniform mat4 world;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main(void) {
	vec4 worldPos = world * vec4(position, 1.0);
	vWorldPos = worldPos.xyz;
	// Uniform scale — mat3(world) * normal is correct after normalization
	vWorldNormal = normalize(mat3(world) * normal);
	vUv = uv;
	gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Fragment shader — 4 Biome Zones with Texture Splatting + Slope Rock
// ─────────────────────────────────────────────────────────────────────────────
const FRAGMENT_SHADER = `
precision highp float;

// Shared AO
uniform sampler2D uAoMap;

// Layer 0: Beach / Sand
uniform sampler2D uAlbedoBeach;
uniform sampler2D uNormalBeach;
uniform sampler2D uRoughnessBeach;
uniform vec3 uColorBeach;

// Layer 1: Rock / Basalt
uniform sampler2D uAlbedoRock;
uniform sampler2D uNormalRock;
uniform sampler2D uRoughnessRock;
uniform vec3 uColorRock;

// Layer 2: Subtropical Grass / Forest
uniform sampler2D uAlbedoGrass;
uniform sampler2D uNormalGrass;
uniform sampler2D uRoughnessGrass;
uniform vec3 uColorGrass;

// Layer 3: Volcanic Ash / Caldera
uniform sampler2D uAlbedoVolc;
uniform sampler2D uNormalVolc;
uniform sampler2D uRoughnessVolc;
uniform vec3 uColorVolc;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec2 vUv;

// Helper to unpack normal
vec3 unpackNormal(vec3 nmRaw) {
	return nmRaw * 2.0 - 1.0;
}

void main(void) {
	float worldY = vWorldPos.y;

	// ── Altitude-based blend weights ───────────────────────────────────────────
	// Transitions:
	// Beach -> Grass: 0.8m to 2.5m (keeps sand very close to water level)
	// Grass -> Volcanic: 30.0m to 45.0m
	float tBeachGrass = smoothstep(0.8, 2.5, worldY);
	float tGrassVolc  = smoothstep(30.0, 45.0, worldY);

	// ── Slope exposure — steep faces become Rock ───────────────────────────────
	float flatness    = abs(vWorldNormal.y);
	// 1.0 = flat ground, 0.0 = vertical wall.
	// We want rock to appear when flatness < 0.65
	float slopeFactor = 1.0 - smoothstep(0.40, 0.75, flatness);

	// ── Sample Textures ────────────────────────────────────────────────────────
	// Layer 0: Beach
	vec3 alb0 = texture2D(uAlbedoBeach, vUv).rgb * uColorBeach;
	vec3 nrm0 = unpackNormal(texture2D(uNormalBeach, vUv).rgb);
	float rgh0 = texture2D(uRoughnessBeach, vUv).g;

	// Layer 1: Rock
	vec3 alb1 = texture2D(uAlbedoRock, vUv).rgb * uColorRock;
	vec3 nrm1 = unpackNormal(texture2D(uNormalRock, vUv).rgb);
	float rgh1 = texture2D(uRoughnessRock, vUv).g;

	// Layer 2: Grass
	vec3 alb2 = texture2D(uAlbedoGrass, vUv).rgb * uColorGrass;
	vec3 nrm2 = unpackNormal(texture2D(uNormalGrass, vUv).rgb);
	float rgh2 = texture2D(uRoughnessGrass, vUv).g;

	// Layer 3: Volcanic
	vec3 alb3 = texture2D(uAlbedoVolc, vUv).rgb * uColorVolc;
	vec3 nrm3 = unpackNormal(texture2D(uNormalVolc, vUv).rgb);
	float rgh3 = texture2D(uRoughnessVolc, vUv).g;

	// ── Blend Layers ───────────────────────────────────────────────────────────
	// 1. Blend Altitude (Beach -> Grass -> Volcanic)
	vec3 baseAlb = mix(alb0, alb2, tBeachGrass);
	vec3 baseNrm = mix(nrm0, nrm2, tBeachGrass);
	float baseRgh = mix(rgh0, rgh2, tBeachGrass);

	baseAlb = mix(baseAlb, alb3, tGrassVolc);
	baseNrm = mix(baseNrm, nrm3, tGrassVolc);
	baseRgh = mix(baseRgh, rgh3, tGrassVolc);

	// 2. Blend Slope (Base -> Rock)
	vec3 finalAlb = mix(baseAlb, alb1, slopeFactor);
	vec3 finalNrm = mix(baseNrm, nrm1, slopeFactor);
	float finalRgh = mix(baseRgh, rgh1, slopeFactor);

	// ── Micro-variation — break up uniform tiling ──────────────────────────────
	float variation = 0.90 + sin(vWorldPos.x * 0.31 + vWorldPos.z * 0.19) * 0.05
	                       + sin(vWorldPos.x * 0.71 + vWorldPos.z * 0.53) * 0.03;
	finalAlb *= clamp(variation, 0.82, 1.08);

	// ── Apply Normal Map ───────────────────────────────────────────────────────
	vec3 N = normalize(vWorldNormal);
	// Simple XZ perturbation (assuming mostly horizontal terrain, good enough for ground)
	N.x += finalNrm.x * 1.5;
	N.z += finalNrm.y * 1.5;
	N = normalize(N);

	// ── AO ─────────────────────────────────────────────────────────────────────
	float ao = mix(1.0, texture2D(uAoMap, vUv).r, 0.72);

	// ── Lighting (hemisphere ambient + directional diffuse + specular) ─────────
	vec3 sunL = normalize(vec3(0.4, 1.0, -0.2)); // vector TO light
	vec3 sunColor = vec3(1.0, 0.97, 0.90);
	float sunIntensity = 1.1;

	// Hemisphere gradient
	float hemiT = N.y * 0.5 + 0.5;
	vec3 skyAmb    = vec3(0.40, 0.52, 0.70);
	vec3 groundAmb = vec3(0.26, 0.24, 0.20);
	vec3 ambient = mix(groundAmb, skyAmb, hemiT) * 0.3 * ao;

	// Diffuse
	float NdotL = max(dot(N, sunL), 0.0);
	vec3 diffuse = sunColor * sunIntensity * NdotL;

	// Specular
	vec3 viewDir = normalize(vec3(0.0, 1.0, 0.0));
	vec3 halfVec = normalize(sunL + viewDir);
	float NdotH = max(dot(N, halfVec), 0.0);
	
	// Increase roughness globally to make it look like natural ground
	finalRgh = clamp(finalRgh + 0.3, 0.0, 1.0);
	float shininess = exp2((1.0 - finalRgh) * 7.0 + 1.0);
	float spec = pow(NdotH, shininess) * (1.0 - finalRgh) * 0.12;

	vec3 color = (ambient + diffuse) * finalAlb + sunColor * spec;

	// Gamma encode — ShaderMaterial outputs directly to framebuffer
	color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / 2.2));

	gl_FragColor = vec4(color, 1.0);
}
`;

Effect.ShadersStore[`${SHADER_NAME}VertexShader`] = VERTEX_SHADER;
Effect.ShadersStore[`${SHADER_NAME}FragmentShader`] = FRAGMENT_SHADER;

export const createTenerifeTerrainShaderMaterial = (scene: Scene): ShaderMaterial => {
	const material = new ShaderMaterial(
		'tenerife-terrain-splat-material',
		scene,
		{
			vertex: SHADER_NAME,
			fragment: SHADER_NAME,
		},
		{
			attributes: ['position', 'normal', 'uv'],
			uniforms: [
				'worldViewProjection',
				'world',
				'uColorBeach',
				'uColorRock',
				'uColorGrass',
				'uColorVolc',
			],
			samplers: [
				'uAoMap',
				'uAlbedoBeach',
				'uNormalBeach',
				'uRoughnessBeach',
				'uAlbedoRock',
				'uNormalRock',
				'uRoughnessRock',
				'uAlbedoGrass',
				'uNormalGrass',
				'uRoughnessGrass',
				'uAlbedoVolc',
				'uNormalVolc',
				'uRoughnessVolc',
			],
			needAlphaBlending: false,
			needAlphaTesting: false,
		},
	);

	// Load the single texture set we have for now.
	// Users can drop in new textures into /textures/ later and update these paths!
	const texAlbedo = new Texture(`${TEXTURE_BASE}_Color.jpg`, scene);
	const texNormal = new Texture(`${TEXTURE_BASE}_NormalGL.jpg`, scene);
	const texRough = new Texture(`${TEXTURE_BASE}_Roughness.jpg`, scene);
	const texAo = new Texture(`${TEXTURE_BASE}_AmbientOcclusion.jpg`, scene);

	const setupTex = (tex: Texture) => {
		tex.wrapU = Texture.WRAP_ADDRESSMODE;
		tex.wrapV = Texture.WRAP_ADDRESSMODE;
		tex.anisotropicFilteringLevel = 16;
	};

	[texAlbedo, texNormal, texRough, texAo].forEach(setupTex);

	material.setTexture('uAoMap', texAo);

	// Layer 0: Beach (Yellowish tint)
	material.setTexture('uAlbedoBeach', texAlbedo);
	material.setTexture('uNormalBeach', texNormal);
	material.setTexture('uRoughnessBeach', texRough);
	material.setColor3('uColorBeach', new Color3(0.9, 0.8, 0.6)); // Warm Sand

	// Layer 1: Rock (Dark greyish tint)
	material.setTexture('uAlbedoRock', texAlbedo);
	material.setTexture('uNormalRock', texNormal);
	material.setTexture('uRoughnessRock', texRough);
	material.setColor3('uColorRock', new Color3(0.35, 0.35, 0.35)); // Basalt Rock

	// Layer 2: Grass/Forest (Greenish tint)
	material.setTexture('uAlbedoGrass', texAlbedo);
	material.setTexture('uNormalGrass', texNormal);
	material.setTexture('uRoughnessGrass', texRough);
	material.setColor3('uColorGrass', new Color3(0.4, 0.6, 0.3)); // Subtropical Green

	// Layer 3: Volcanic (Reddish/Brown tint)
	material.setTexture('uAlbedoVolc', texAlbedo);
	material.setTexture('uNormalVolc', texNormal);
	material.setTexture('uRoughnessVolc', texRough);
	material.setColor3('uColorVolc', new Color3(0.55, 0.35, 0.25)); // Volcanic Ash

	material.backFaceCulling = true;

	return material;
};
