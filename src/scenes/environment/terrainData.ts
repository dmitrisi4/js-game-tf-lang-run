import { WORLD_HALF_EXTENT, type WorldPosition } from './worldData';
import { getZoneForPosition, type TerrainMaterialKey } from './worldZones';

export type TerrainSample = {
	height: number;
	material: TerrainMaterialKey;
};

/** Higher subdivision count produces smoother height interpolation between vertices. */
export const TERRAIN_SUBDIVISIONS = 128;
export const TERRAIN_MIN_HEIGHT = -0.45;
export const TERRAIN_MAX_HEIGHT = 1.55;

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

const smoothStep = (edge0: number, edge1: number, value: number): number => {
	const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);

	return t * t * (3 - 2 * t);
};

const radialFalloff = (position: WorldPosition, center: WorldPosition, radius: number): number => {
	const dx = position.x - center.x;
	const dz = position.z - center.z;
	const distance = Math.sqrt(dx * dx + dz * dz);

	return 1 - smoothStep(0, radius, distance);
};

const ridgeFalloff = (position: WorldPosition): number => {
	const westward = smoothStep(-6, -34, position.x);
	const ridgeBand = 1 - smoothStep(5, 25, Math.abs(position.z - 17));

	return westward * ridgeBand;
};

const pathDepression = (position: WorldPosition): number => {
	const southTrail = 1 - smoothStep(1.5, 7, Math.abs(position.x + 1.5));
	const northTrail = 1 - smoothStep(2, 8, Math.abs(position.x - 4));

	return Math.max(
		southTrail * smoothStep(-6, -30, position.z),
		northTrail * smoothStep(8, 28, position.z),
	);
};

export const getTerrainMaterialAt = (position: WorldPosition): TerrainMaterialKey =>
	getZoneForPosition(position).terrainMaterial;

export const getTerrainHeightAt = (position: WorldPosition): number => {
	const edgeDistance = WORLD_HALF_EXTENT - Math.max(Math.abs(position.x), Math.abs(position.z));
	const edgeLift = (1 - smoothStep(0, 12, edgeDistance)) * 0.35;
	const groveMound = radialFalloff(position, { x: 8, z: 27 }, 28) * 0.7;
	const emberBasin = radialFalloff(position, { x: 0, z: -24 }, 24) * -0.32;
	const ruinPlateau = radialFalloff(position, { x: 30, z: 2 }, 18) * 0.45;
	const westRidge = ridgeFalloff(position) * 1.15;
	const trailCut = pathDepression(position) * -0.16;
	const microVariation =
		Math.sin(position.x * 0.21) * 0.08 +
		Math.cos(position.z * 0.17) * 0.07 +
		Math.sin((position.x + position.z) * 0.09) * 0.05;

	return clamp(
		groveMound + emberBasin + ruinPlateau + westRidge + trailCut + edgeLift + microVariation,
		TERRAIN_MIN_HEIGHT,
		TERRAIN_MAX_HEIGHT,
	);
};

export const getTerrainSampleAt = (position: WorldPosition): TerrainSample => ({
	height: getTerrainHeightAt(position),
	material: getTerrainMaterialAt(position),
});
