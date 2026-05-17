import { writeFile } from 'node:fs/promises';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
import { Scene } from '@babylonjs/core/scene.js';
import { GLTF2Export } from '@babylonjs/serializers/glTF/index.js';

const GLB_PATH = 'public/models/environment/tenerife-island-location.glb';
const GRID_HALF_SIZE_KM = 54;
const GRID_STEPS = 156;
const HEIGHT_EXAGGERATION = 1.18;
const COASTLINE_DISTANCE_FADE_KM = 13.5;
const COASTLINE_NOISE_KM = 0.34;
const TERRAIN_MESH_NAME = 'env_tenerife_full_island_terrain_1unit_1km';

const CITY_SITES = [
	{ id: 'santa_cruz', x: 35.0, z: 7.2, radius: 2.8 },
	{ id: 'la_laguna', x: 29.5, z: 9.8, radius: 2.1 },
	{ id: 'puerto_cruz', x: 6.5, z: 15.4, radius: 6.3 },
	{ id: 'la_orotava', x: 2.2, z: 12.4, radius: 2.0 },
	{ id: 'adeje', x: -20.5, z: -12.4, radius: 2.2 },
	{ id: 'los_cristianos', x: -11.5, z: -15.4, radius: 2.2 },
	{ id: 'garachico', x: -25.0, z: 9.2, radius: 1.7 },
];

const TENERIFE_COASTLINE_POINTS = [
	[-40.5, -2.2],
	[-38.2, 2.4],
	[-34.5, 4.8],
	[-30.0, 7.8],
	[-23.5, 9.8],
	[-15.5, 11.5],
	[-7.2, 13.4],
	[1.8, 16.2],
	[8.8, 17.1],
	[15.0, 15.7],
	[22.8, 13.6],
	[28.8, 14.2],
	[34.8, 17.1],
	[41.5, 17.6],
	[44.0, 13.9],
	[41.7, 9.5],
	[37.8, 6.4],
	[35.1, 2.6],
	[31.6, -1.5],
	[27.2, -6.2],
	[23.0, -9.8],
	[17.8, -12.7],
	[10.8, -14.7],
	[4.0, -16.2],
	[-1.5, -18.2],
	[-8.8, -18.4],
	[-15.8, -16.7],
	[-21.8, -14.4],
	[-27.4, -11.4],
	[-31.7, -8.2],
	[-36.8, -5.6],
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const smoothStep = (edge0, edge1, value) => {
	if (edge0 === edge1) {
		return value >= edge1 ? 1 : 0;
	}

	const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (3 - 2 * t);
};

const rotatedCoords = (x, z) => {
	const angle = (-28 * Math.PI) / 180;
	return [x * Math.cos(angle) - z * Math.sin(angle), x * Math.sin(angle) + z * Math.cos(angle)];
};

const isPointInsidePolygon = (x, z, polygon) => {
	let inside = false;
	let [previousX, previousZ] = polygon.at(-1);

	for (const [currentX, currentZ] of polygon) {
		const crossesZ = currentZ > z !== previousZ > z;

		if (crossesZ) {
			const intersectionX =
				((previousX - currentX) * (z - currentZ)) / (previousZ - currentZ) + currentX;

			if (x < intersectionX) {
				inside = !inside;
			}
		}

		previousX = currentX;
		previousZ = currentZ;
	}

	return inside;
};

const distanceToSegment = (x, z, start, end) => {
	const [startX, startZ] = start;
	const [endX, endZ] = end;
	const dx = endX - startX;
	const dz = endZ - startZ;
	const lengthSquared = dx * dx + dz * dz;

	if (lengthSquared === 0) {
		return Math.hypot(x - startX, z - startZ);
	}

	const t = clamp(((x - startX) * dx + (z - startZ) * dz) / lengthSquared, 0, 1);
	const nearestX = startX + t * dx;
	const nearestZ = startZ + t * dz;
	return Math.hypot(x - nearestX, z - nearestZ);
};

const signedDistanceToCoastline = (x, z) => {
	let distance = Number.POSITIVE_INFINITY;

	for (let index = 0; index < TENERIFE_COASTLINE_POINTS.length; index += 1) {
		distance = Math.min(
			distance,
			distanceToSegment(
				x,
				z,
				TENERIFE_COASTLINE_POINTS[index],
				TENERIFE_COASTLINE_POINTS[(index + 1) % TENERIFE_COASTLINE_POINTS.length],
			),
		);
	}

	return isPointInsidePolygon(x, z, TENERIFE_COASTLINE_POINTS) ? distance : -distance;
};

const coastlineNoise = (x, z) =>
	COASTLINE_NOISE_KM * (0.58 * Math.sin(x * 0.72) + 0.42 * Math.cos(z * 0.61));

const islandProfile = (x, z) => {
	const [u, v] = rotatedCoords(x, z);
	const signedDistance = signedDistanceToCoastline(x, z);
	const normalized =
		signedDistance >= 0
			? 1 - Math.min(signedDistance, COASTLINE_DISTANCE_FADE_KM) / COASTLINE_DISTANCE_FADE_KM
			: 1 +
				Math.min(Math.abs(signedDistance), COASTLINE_DISTANCE_FADE_KM) / COASTLINE_DISTANCE_FADE_KM;

	return { normalized, u, v };
};

const isLand = (x, z) => {
	const signedDistance = signedDistanceToCoastline(x, z);

	return signedDistance >= 0 || signedDistance + coastlineNoise(x, z) >= 0;
};

const gaussian = (u, v, centerU, centerV, sigmaU, sigmaV, height) =>
	height * Math.exp(-1 * (((u - centerU) / sigmaU) ** 2 + ((v - centerV) / sigmaV) ** 2));

const rawTerrainHeight = (x, z) => {
	const { normalized, u, v } = islandProfile(x, z);

	if (normalized >= 1.05) {
		return -0.18;
	}

	const coastFalloff = Math.max(0, 1 - normalized) ** 0.38;
	const base = 0.12 + 0.32 * coastFalloff;
	const teide = gaussian(u, v, -2.2, 0.4, 7.0, 6.2, 3.05);
	const teidePeak = gaussian(u, v, -2.4, 0.55, 2.35, 2.2, 1.05);
	const calderaWall =
		0.55 * Math.exp(-1 * ((Math.sqrt((u + 2.0) ** 2 + (v - 0.2) ** 2) - 8.8) / 1.65) ** 2);
	const calderaFloor = -0.22 * gaussian(u, v, -0.6, -0.2, 5.8, 4.8, 1.0);
	const dorsalRidge = gaussian(u, v, 13.0, 0.8, 18.0, 3.1, 0.82);
	const anaga = gaussian(u, v, 35.0, 1.2, 6.6, 7.4, 1.12);
	const teno = gaussian(u, v, -36.0, -0.2, 6.0, 6.5, 0.98);
	const northGreenSlope = gaussian(u, v, 3.0, 8.4, 30.0, 7.0, 0.38);
	const southLowlands = -gaussian(u, v, 13.0, -10.5, 20.0, 5.8, 0.16);
	let ravines =
		0.12 * Math.sin(u * 0.72 + v * 0.24) +
		0.08 * Math.sin(u * 1.18 - v * 0.42) +
		0.05 * Math.cos(x * 0.47 + z * 0.31);
	ravines *= Math.max(0, normalized - 0.25) * Math.max(0, 1 - normalized);

	const height =
		base +
		teide +
		teidePeak +
		calderaWall +
		calderaFloor +
		dorsalRidge +
		anaga +
		teno +
		northGreenSlope +
		southLowlands +
		ravines;

	return Math.max(0.02, height * HEIGHT_EXAGGERATION);
};

const terrainHeight = (x, z) => {
	let height = rawTerrainHeight(x, z);

	for (const city of CITY_SITES) {
		const distance = Math.hypot(x - city.x, z - city.z);
		const innerRadius = city.radius * 0.68;
		const outerRadius = city.radius * 1.25;

		if (distance > outerRadius) {
			continue;
		}

		const targetHeight = rawTerrainHeight(city.x, city.z);
		const flattenWeight = 1 - smoothStep(innerRadius, outerRadius, distance);
		height = height * (1 - flattenWeight) + targetHeight * flattenWeight;
	}

	return height;
};

const createTerrainVertexData = () => {
	const positions = [];
	const indices = [];
	const indexByGrid = new Map();
	const step = (GRID_HALF_SIZE_KM * 2) / GRID_STEPS;

	for (let zi = 0; zi <= GRID_STEPS; zi += 1) {
		const z = -GRID_HALF_SIZE_KM + zi * step;

		for (let xi = 0; xi <= GRID_STEPS; xi += 1) {
			const x = -GRID_HALF_SIZE_KM + xi * step;

			if (!isLand(x, z)) {
				continue;
			}

			indexByGrid.set(`${xi}:${zi}`, positions.length / 3);
			positions.push(x, terrainHeight(x, z), -z);
		}
	}

	for (let zi = 0; zi < GRID_STEPS; zi += 1) {
		for (let xi = 0; xi < GRID_STEPS; xi += 1) {
			const a = indexByGrid.get(`${xi}:${zi}`);
			const b = indexByGrid.get(`${xi + 1}:${zi}`);
			const c = indexByGrid.get(`${xi + 1}:${zi + 1}`);
			const d = indexByGrid.get(`${xi}:${zi + 1}`);

			if (a === undefined || b === undefined || c === undefined || d === undefined) {
				continue;
			}

			indices.push(a, c, b, a, d, c);
		}
	}

	const normals = [];
	VertexData.ComputeNormals(positions, indices, normals);

	const vertexData = new VertexData();
	vertexData.positions = positions;
	vertexData.indices = indices;
	vertexData.normals = normals;
	return vertexData;
};

const engine = new NullEngine();
const scene = new Scene(engine);
const terrain = new Mesh(TERRAIN_MESH_NAME, scene);
const material = new PBRMaterial('tenerife-runtime-terrain-placeholder', scene);
material.albedoColor = new Color3(0.38, 0.43, 0.25);
material.roughness = 0.92;
material.metallic = 0;
material.backFaceCulling = true;

createTerrainVertexData().applyToMesh(terrain);
terrain.material = material;
terrain.refreshBoundingInfo();

const gltfData = await GLTF2Export.GLBAsync(scene, 'tenerife-island-location');
const blob = gltfData.glTFFiles['tenerife-island-location.glb'];
await writeFile(GLB_PATH, Buffer.from(await blob.arrayBuffer()));
engine.dispose();

console.log(`Exported runtime GLB: ${GLB_PATH}`);
