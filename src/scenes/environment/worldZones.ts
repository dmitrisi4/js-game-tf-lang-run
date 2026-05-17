import type { DiscoveryWaveId } from '@/scenes/discovery/discoveryWaves';
import { WORLD_HALF_EXTENT, type WorldPosition } from './worldData';

export type WorldZoneId =
	| 'starter-clearing'
	| 'ember-camp'
	| 'north-grove'
	| 'east-ruins'
	| 'west-ridge'
	| 'northern-woods'
	| 'southern-wilds';

export type TerrainMaterialKey = 'grass' | 'dirt' | 'moss' | 'rock' | 'ash';

export type WorldZone = {
	id: WorldZoneId;
	displayName: string;
	center: WorldPosition;
	radius: number;
	terrainMaterial: TerrainMaterialKey;
	ambientColor: string;
	fogDensity: number;
	discoveryWaves: DiscoveryWaveId[];
};

export const WORLD_ZONES: WorldZone[] = [
	{
		id: 'starter-clearing',
		displayName: 'Starter Clearing',
		center: { x: 0, z: 0 },
		radius: 18,
		terrainMaterial: 'grass',
		ambientColor: '#8fbf74',
		fogDensity: 0.008,
		discoveryWaves: ['starter'],
	},
	{
		id: 'ember-camp',
		displayName: 'Ember Camp',
		center: { x: 0, z: -28 },
		radius: 34,
		terrainMaterial: 'ash',
		ambientColor: '#d18b55',
		fogDensity: 0.011,
		discoveryWaves: ['ember'],
	},
	{
		id: 'north-grove',
		displayName: 'North Grove',
		center: { x: 8, z: 30 },
		radius: 34,
		terrainMaterial: 'moss',
		ambientColor: '#77a873',
		fogDensity: 0.014,
		discoveryWaves: ['grove'],
	},
	{
		id: 'east-ruins',
		displayName: 'East Ruins',
		center: { x: 42, z: 0 },
		radius: 34,
		terrainMaterial: 'rock',
		ambientColor: '#8190a0',
		fogDensity: 0.01,
		discoveryWaves: [],
	},
	{
		id: 'west-ridge',
		displayName: 'West Ridge',
		center: { x: -42, z: 14 },
		radius: 36,
		terrainMaterial: 'rock',
		ambientColor: '#a09b87',
		fogDensity: 0.009,
		discoveryWaves: [],
	},
	{
		id: 'northern-woods',
		displayName: 'Northern Woods',
		center: { x: 0, z: 58 },
		radius: 38,
		terrainMaterial: 'moss',
		ambientColor: '#5f8d68',
		fogDensity: 0.016,
		discoveryWaves: [],
	},
	{
		id: 'southern-wilds',
		displayName: 'Southern Wilds',
		center: { x: 0, z: -60 },
		radius: 38,
		terrainMaterial: 'grass',
		ambientColor: '#8d9058',
		fogDensity: 0.012,
		discoveryWaves: [],
	},
];

const distanceSquared = (a: WorldPosition, b: WorldPosition): number => {
	const dx = a.x - b.x;
	const dz = a.z - b.z;

	return dx * dx + dz * dz;
};

export const isPositionInsideWorldBounds = (position: WorldPosition): boolean =>
	Math.abs(position.x) <= WORLD_HALF_EXTENT && Math.abs(position.z) <= WORLD_HALF_EXTENT;

export const isPositionInsideZone = (position: WorldPosition, zone: WorldZone): boolean =>
	distanceSquared(position, zone.center) <= zone.radius * zone.radius;

export const getZoneById = (zoneId: WorldZoneId): WorldZone => {
	const zone = WORLD_ZONES.find((candidateZone) => candidateZone.id === zoneId);

	if (!zone) {
		throw new Error(`Unknown world zone: ${zoneId}`);
	}

	return zone;
};

export const getZoneForPosition = (position: WorldPosition): WorldZone => {
	const containingZones = WORLD_ZONES.filter((zone) => isPositionInsideZone(position, zone));
	const candidateZones = containingZones.length > 0 ? containingZones : WORLD_ZONES;

	return candidateZones.reduce((nearestZone, zone) =>
		distanceSquared(position, zone.center) < distanceSquared(position, nearestZone.center)
			? zone
			: nearestZone,
	);
};

export const getZoneForDiscoveryWave = (waveId: DiscoveryWaveId): WorldZone | null =>
	WORLD_ZONES.find((zone) => zone.discoveryWaves.includes(waveId)) ?? null;
