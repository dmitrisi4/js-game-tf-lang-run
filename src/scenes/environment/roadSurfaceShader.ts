import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { TenerifeRoadLayerId } from './tenerifeRoadLayers';

/**
 * Road surface types — determines which procedural pattern to use.
 * - cobblestone: Voronoi-cell pattern for city streets
 * - dirt: warm earth with roughness noise for rural roads
 * - earth: packed soil for walk paths and service tracks
 */
export type RoadSurfaceType = 'cobblestone' | 'dirt' | 'earth';
export type RoadSurfaceMaterialRole = 'surface' | 'terrainBlend';

/**
 * Maps road layer + city context to a surface type.
 * City main roads → cobblestone; rural main/service → dirt; walk → packed earth.
 */
export const getRoadSurfaceType = (
	layerId: TenerifeRoadLayerId,
	isInsideCity: boolean,
): RoadSurfaceType => {
	if (layerId === 'walk') {
		return 'earth';
	}

	if (layerId === 'main' && isInsideCity) {
		return 'cobblestone';
	}

	return 'dirt';
};

/**
 * Resolves how a road visual pass should shade its pixels.
 */
export const getRoadSurfaceMaterialRole = (nameSuffix: string): RoadSurfaceMaterialRole =>
	nameSuffix === 'shoulder' ? 'terrainBlend' : 'surface';

const SHADER_NAME = 'roadSurface';

// ─────────────────────────────────────────────────────────────────────────────
// Vertex shader — passes world-space XZ for pattern sampling
// UV.x = cross-road 0..1, UV.y = accumulated world-unit distance along road
// ─────────────────────────────────────────────────────────────────────────────
const VERTEX_SHADER = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 worldViewProjection;
uniform mat4 world;

varying vec3 vWorldPos;
varying vec2 vRoadUv;

void main(void) {
	vec4 worldPos = world * vec4(position, 1.0);
	vWorldPos = worldPos.xyz;
	vRoadUv = uv;
	gl_Position = worldViewProjection * vec4(position, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Fragment shader — procedural road surface.
// Road cores stay opaque to avoid seam artifacts between quads. Terrain-blend
// shoulder passes fade only at the outer edge so the base terrain can show
// through instead of ending at a hard rectangular strip.
//
// Surface modes:
//   0 = cobblestone: Voronoi grid, ~25 cm stones (scale = world * 4)
//   1 = dirt road:   warm earth, FBM noise, subtle tyre ruts
//   2 = packed earth: dry lighter path
// ─────────────────────────────────────────────────────────────────────────────
const FRAGMENT_SHADER = `
precision highp float;

uniform float uSurfaceMode;
uniform float uMaterialRole;
uniform vec3  uBaseColor;
uniform vec3  uShoulderColor;  // colour at road edge, blends to terrain grass
uniform vec3  uTerrainColor;

varying vec3 vWorldPos;
varying vec2 vRoadUv;

// ─── Helpers ─────────────────────────────────────────────────────────────────
float rand(vec2 co) {
	return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 rand2(vec2 co) {
	return vec2(rand(co), rand(co + vec2(1.3, 7.1)));
}

float smoothNoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(rand(i), rand(i + vec2(1.0, 0.0)), u.x),
		mix(rand(i + vec2(0.0, 1.0)), rand(i + vec2(1.0, 1.0)), u.x),
		u.y
	);
}

float fbm(vec2 p) {
	float v = 0.0;
	float amp = 0.5;
	for (int i = 0; i < 4; i++) {
		v   += amp * smoothNoise(p);
		p   *= 2.1;
		amp *= 0.5;
	}
	return v;
}

// ─── Voronoi: returns distance-to-edge in [0..1] ─────────────────────────────
// Scale uv so each Voronoi cell = ~1 unit = ~25 cm stone at world scale * 4
float voronoiEdge(vec2 p) {
	vec2  iP = floor(p);
	vec2  fP = fract(p);
	float minD  = 9.0;
	float minD2 = 9.0;

	for (int ix = -1; ix <= 1; ix++) {
		for (int iy = -1; iy <= 1; iy++) {
			vec2 n = vec2(float(ix), float(iy));
			// Jitter centre of each cell — bounded to [0.15, 0.85]
			vec2 pt = rand2(iP + n) * 0.7 + 0.15;
			vec2 d  = n + pt - fP;
			float dist = dot(d, d);
			if (dist < minD)  { minD2 = minD; minD = dist; }
			else if (dist < minD2) { minD2 = dist; }
		}
	}
	// Smooth edge distance — the gap between nearest and second-nearest
	return clamp(sqrt(minD2) - sqrt(minD), 0.0, 1.0);
}

void main(void) {
	float crossT = vRoadUv.x;           // 0 = left edge, 1 = right edge
	float distFromCenter = abs(crossT - 0.5) * 2.0;  // 0 = center, 1 = edge

	// ── Surface pattern ───────────────────────────────────────────────────────
	vec3 surfaceColor;
	float outputAlpha = 1.0;

	if (uMaterialRole > 0.5) {
		// Terrain-blend shoulder. The visible outer edge becomes noisy dirt/grass
		// and softly reveals the base terrain instead of a flat cut-out strip.
		float broadNoise = fbm(vWorldPos.xz * 0.48 + vec2(vRoadUv.y * 0.017, 0.0));
		float fineNoise = smoothNoise(vWorldPos.xz * 5.5 + vec2(0.0, vRoadUv.y * 0.09));
		float irregularDist = distFromCenter + (broadNoise - 0.5) * 0.24 + (fineNoise - 0.5) * 0.08;
		float roadDustT = smoothstep(0.14, 0.68, distFromCenter);
		float terrainT = smoothstep(0.32, 0.78, irregularDist);
		float edgeFadeT = smoothstep(0.86, 1.0, irregularDist);
		float grit = smoothNoise(vWorldPos.xz * 10.0) * 0.08;
		vec3 disturbedRoad = mix(uShoulderColor * 0.86, uTerrainColor, roadDustT * 0.58);
		vec3 mottledTerrain = uTerrainColor * (0.88 + broadNoise * 0.20 + fineNoise * 0.07);

		disturbedRoad += vec3(grit * 0.55, grit * 0.42, grit * 0.22);
		surfaceColor = mix(disturbedRoad, mottledTerrain, terrainT);
		surfaceColor = mix(
			surfaceColor,
			uShoulderColor * 0.82,
			smoothstep(0.72, 0.98, distFromCenter) * fineNoise * 0.10
		);
		surfaceColor = clamp(surfaceColor, 0.0, 1.0);
		outputAlpha = 1.0 - edgeFadeT * 0.95;

	} else if (uSurfaceMode < 0.5) {
		// ── COBBLESTONE ──────────────────────────────────────────────────────
		// Scale: world * 4.0 → each Voronoi cell ~= 25 cm stone
		vec2 stoneUv = vWorldPos.xz * 4.0;
		float edge   = voronoiEdge(stoneUv);

		// Mortar line: edge < 0.08 → very dark; > 0.13 → full stone colour
		float mortarMask = smoothstep(0.06, 0.14, edge);
		vec3  mortarColor = uBaseColor * 0.30;

		// Stone face: slight brightness variation per cell
		float cellBright = 0.84 + fbm(stoneUv * 1.5) * 0.22;
		vec3  stoneColor  = uBaseColor * cellBright;

		// Per-stone colour variation: hue shift R/G channels slightly
		float cellId = rand(floor(stoneUv));
		stoneColor.r += (cellId - 0.5) * 0.07;
		stoneColor.g += (cellId - 0.5) * 0.04;

		surfaceColor = mix(mortarColor, stoneColor, mortarMask);
		surfaceColor = clamp(surfaceColor, 0.0, 1.0);

	} else if (uSurfaceMode < 1.5) {
		// ── DIRT ROAD ────────────────────────────────────────────────────────
		// Scale: world * 0.22 → FBM variation at ~4 m wavelength
		vec2 dirtUv = vWorldPos.xz * 0.22;
		float n1 = fbm(dirtUv * 1.1);
		float n2 = fbm(dirtUv * 4.2 + vec2(5.1, 2.3));

		// Tyre ruts: darker band near each side (~30-50 % from edge)
		float rutZone  = smoothstep(0.28, 0.48, distFromCenter) *
		                 smoothstep(0.82, 0.60, distFromCenter);
		float rutDepth = rutZone * 0.16;

		surfaceColor = uBaseColor * (0.78 + n1 * 0.24 + n2 * 0.06 - rutDepth);

		// Fine grit speckling
		float grit = smoothNoise(vWorldPos.xz * 3.5) * 0.07;
		surfaceColor += vec3(grit * 0.7, grit * 0.5, grit * 0.2);

		// Slightly darker wheel-track center
		surfaceColor -= vec3(smoothstep(0.25, 0.0, distFromCenter) * 0.06);
		surfaceColor = clamp(surfaceColor, 0.0, 1.0);

	} else {
		// ── PACKED EARTH PATH ────────────────────────────────────────────────
		vec2 pathUv = vWorldPos.xz * 0.32;
		float n = fbm(pathUv * 1.5);
		float crack = smoothNoise(vWorldPos.xz * 5.0) * 0.05;

		surfaceColor = uBaseColor * (0.85 + n * 0.20 - crack);
		surfaceColor = clamp(surfaceColor, 0.0, 1.0);
	}

	// ── Shoulder blend — colour-only, NO alpha ────────────────────────────────
	// Blend road colour → shoulder colour across outer 20% of road width.
	// This avoids transparent-quad seam artefacts entirely.
	if (uMaterialRole < 0.5) {
		float edgeNoise = fbm(vWorldPos.xz * 0.72 + vec2(vRoadUv.y * 0.021, 0.0));
		float shoulderT = smoothstep(0.58, 1.02, distFromCenter + (edgeNoise - 0.5) * 0.16);
		vec3 edgeColor = mix(uShoulderColor, uTerrainColor, shoulderT * 0.36);
		surfaceColor = mix(surfaceColor, edgeColor, shoulderT);
	}

	// ── Lighting ──────────────────────────────────────────────────────────────
	vec3 sunL     = normalize(vec3(0.4, 1.0, -0.2));
	vec3 sunColor = vec3(1.0, 0.97, 0.90);

	vec3 N = normalize(vec3(
		sin(vWorldPos.x * 0.31 + vWorldPos.z * 0.19) * 0.04,
		1.0,
		sin(vWorldPos.x * 0.71 + vWorldPos.z * 0.53) * 0.03
	));

	float hemiT  = N.y * 0.5 + 0.5;
	vec3  ambient = mix(vec3(0.26, 0.24, 0.20), vec3(0.40, 0.52, 0.70), hemiT) * 0.28;
	float NdotL   = max(dot(N, sunL), 0.0);
	vec3  diffuse = sunColor * 1.05 * NdotL;

	float roughness = mix(0.82, 0.94, uMaterialRole);
	float shininess = exp2((1.0 - roughness) * 5.0 + 1.0);
	vec3  halfVec   = normalize(sunL + vec3(0.0, 1.0, 0.0));
	float spec      = pow(max(dot(N, halfVec), 0.0), shininess) * (1.0 - roughness) * 0.04;

	vec3 color = (ambient + diffuse) * surfaceColor + sunColor * spec;
	color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / 2.2));

	gl_FragColor = vec4(color, outputAlpha);
}
`;

Effect.ShadersStore[`${SHADER_NAME}VertexShader`] = VERTEX_SHADER;
Effect.ShadersStore[`${SHADER_NAME}FragmentShader`] = FRAGMENT_SHADER;

// ─── Colours ──────────────────────────────────────────────────────────────────
/** Warm grey Canarian limestone — base stone face colour. */
const COBBLESTONE_BASE = new Color3(0.56, 0.51, 0.43);
/** Sandy mortar shoulder at the very edge of the cobblestone road. */
const COBBLESTONE_SHOULDER = new Color3(0.46, 0.43, 0.34);
/** Terrain-tinted noisy edge used where city roads meet grass/ground. */
const COBBLESTONE_TERRAIN = new Color3(0.27, 0.38, 0.18);

/** Warm reddish-brown volcanic earth for rural dirt road surface. */
const DIRT_BASE = new Color3(0.5, 0.37, 0.23);
/** Earthy green-brown at dirt road shoulder → matches grass terrain. */
const DIRT_SHOULDER = new Color3(0.38, 0.4, 0.27);
/** Terrain-tinted edge used around rural dirt roads. */
const DIRT_TERRAIN = new Color3(0.25, 0.34, 0.17);

/** Dry pale ochre for packed-earth walk paths. */
const EARTH_BASE = new Color3(0.6, 0.5, 0.36);
/** Lighter sandy edge for packed-earth path shoulder. */
const EARTH_SHOULDER = new Color3(0.44, 0.43, 0.31);
/** Dry green-brown terrain edge used around packed-earth paths. */
const EARTH_TERRAIN = new Color3(0.34, 0.36, 0.21);

const SURFACE_MODE: Record<RoadSurfaceType, number> = {
	cobblestone: 0,
	dirt: 1,
	earth: 2,
};

const MATERIAL_ROLE_MODE: Record<RoadSurfaceMaterialRole, number> = {
	surface: 0,
	terrainBlend: 1,
};

/**
 * Creates a ShaderMaterial for a road surface ribbon.
 *
 * Road cores stay opaque. Terrain-blend shoulders can alpha fade at their
 * outer edge so the base terrain texture remains visible under the transition.
 */
export const createRoadSurfaceMaterial = (
	name: string,
	surfaceType: RoadSurfaceType,
	scene: Scene,
	materialRole: RoadSurfaceMaterialRole = 'surface',
): ShaderMaterial => {
	const material = new ShaderMaterial(
		`${name}-mat`,
		scene,
		{ vertex: SHADER_NAME, fragment: SHADER_NAME },
		{
			attributes: ['position', 'normal', 'uv'],
			uniforms: [
				'worldViewProjection',
				'world',
				'uSurfaceMode',
				'uMaterialRole',
				'uBaseColor',
				'uShoulderColor',
				'uTerrainColor',
			],
			needAlphaBlending: materialRole === 'terrainBlend',
			needAlphaTesting: false,
		},
	);

	let baseColor: Color3;
	let shoulderColor: Color3;
	let terrainColor: Color3;

	switch (surfaceType) {
		case 'cobblestone':
			baseColor = COBBLESTONE_BASE;
			shoulderColor = COBBLESTONE_SHOULDER;
			terrainColor = COBBLESTONE_TERRAIN;
			break;
		case 'earth':
			baseColor = EARTH_BASE;
			shoulderColor = EARTH_SHOULDER;
			terrainColor = EARTH_TERRAIN;
			break;
		default:
			baseColor = DIRT_BASE;
			shoulderColor = DIRT_SHOULDER;
			terrainColor = DIRT_TERRAIN;
	}

	material.setFloat('uSurfaceMode', SURFACE_MODE[surfaceType]);
	material.setFloat('uMaterialRole', MATERIAL_ROLE_MODE[materialRole]);
	material.setColor3('uBaseColor', baseColor);
	material.setColor3('uShoulderColor', shoulderColor);
	material.setColor3('uTerrainColor', terrainColor);
	material.backFaceCulling = false;

	return material;
};
