import { selectNonOverlappingBuildings } from './worldPlacementValidation';

export type WorldPosition = {
	x: number;
	z: number;
};

export type WorldTree = {
	id: string;
	position: WorldPosition;
	trunkHeight: number;
	trunkDiameter: number;
	canopyDiameter: number;
	canopyColor: string;
};

export type WorldRock = {
	id: string;
	position: WorldPosition;
	scale: WorldPosition & { y: number };
	color: string;
};

export type WorldBuildingModelId =
	| 'building-1-small'
	| 'building-2-small'
	| 'building-3-small'
	| 'building-4'
	| 'house-1'
	| 'house-2';

export type WorldBuildingCollider = {
	width: number;
	height: number;
	depth: number;
};

export type WorldBuilding = {
	heightOffset?: number;
	id: string;
	modelId: WorldBuildingModelId;
	position: WorldPosition;
	yaw: number;
	scale: number;
	collider: WorldBuildingCollider;
};

export type WorldRoad = {
	color?: string;
	heightOffset?: number;
	id: string;
	label: string;
	points: WorldPosition[];
	width: number;
};

export type WorldPropKind = 'campfire' | 'crate' | 'obelisk' | 'totem';

export type WorldProp = {
	id: string;
	kind: WorldPropKind;
	position: WorldPosition;
	yaw: number;
};

export type WorldNpc = {
	id: string;
	name: string;
	role: string;
	position: WorldPosition;
	yaw: number;
	accentColor: string;
};

export type WorldCreature = {
	id: string;
	species: string;
	position: WorldPosition;
	patrolRadius: number;
	patrolSpeed: number;
	accentColor: string;
};

export const WORLD_SIZE = 144;
export const WORLD_HALF_EXTENT = WORLD_SIZE / 2;

type TreeClusterDefinition = {
	prefix: string;
	center: WorldPosition;
	points: WorldPosition[];
	colorPalette: string[];
};

const createTreeCluster = ({
	prefix,
	center,
	points,
	colorPalette,
}: TreeClusterDefinition): WorldTree[] =>
	points.map((point, index) => {
		const heightVariant = index % 4;
		const canopyVariant = index % 5;

		return {
			id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
			position: {
				x: center.x + point.x,
				z: center.z + point.z,
			},
			trunkHeight: 2.7 + heightVariant * 0.22,
			trunkDiameter: 0.52 + (index % 3) * 0.06,
			canopyDiameter: 3.25 + canopyVariant * 0.22,
			canopyColor: colorPalette[index % colorPalette.length],
		};
	});

const OUTER_FOREST_TREES: WorldTree[] = [
	...createTreeCluster({
		prefix: 'tree-deep-north',
		center: { x: 0, z: 55 },
		colorPalette: ['#315f44', '#3f7b4f', '#4b8a54', '#2f7046'],
		points: [
			{ x: -39, z: -5 },
			{ x: -31, z: 7 },
			{ x: -23, z: -1 },
			{ x: -15, z: 10 },
			{ x: -7, z: -7 },
			{ x: 2, z: 6 },
			{ x: 11, z: -4 },
			{ x: 18, z: 9 },
			{ x: 27, z: -2 },
			{ x: 36, z: 8 },
			{ x: 45, z: -6 },
			{ x: 53, z: 4 },
		],
	}),
	...createTreeCluster({
		prefix: 'tree-deep-south',
		center: { x: 0, z: -57 },
		colorPalette: ['#446b3f', '#587b45', '#3e6842', '#6f844b'],
		points: [
			{ x: -52, z: 5 },
			{ x: -43, z: -6 },
			{ x: -34, z: 8 },
			{ x: -24, z: -2 },
			{ x: -13, z: 7 },
			{ x: -3, z: -8 },
			{ x: 8, z: 4 },
			{ x: 19, z: -5 },
			{ x: 30, z: 7 },
			{ x: 42, z: -2 },
			{ x: 53, z: 6 },
		],
	}),
	...createTreeCluster({
		prefix: 'tree-east-forest',
		center: { x: 56, z: 4 },
		colorPalette: ['#376d42', '#477f4a', '#2f6544', '#558b50'],
		points: [
			{ x: -4, z: -42 },
			{ x: 6, z: -31 },
			{ x: -6, z: -21 },
			{ x: 8, z: -11 },
			{ x: -3, z: 0 },
			{ x: 7, z: 10 },
			{ x: -7, z: 20 },
			{ x: 5, z: 30 },
			{ x: -5, z: 40 },
			{ x: 9, z: 50 },
		],
	}),
	...createTreeCluster({
		prefix: 'tree-west-forest',
		center: { x: -57, z: 5 },
		colorPalette: ['#405f43', '#527047', '#385a40', '#5e744b'],
		points: [
			{ x: 6, z: -44 },
			{ x: -5, z: -33 },
			{ x: 5, z: -23 },
			{ x: -7, z: -13 },
			{ x: 4, z: -2 },
			{ x: -8, z: 9 },
			{ x: 3, z: 20 },
			{ x: -6, z: 31 },
			{ x: 5, z: 42 },
			{ x: -8, z: 52 },
		],
	}),
	...createTreeCluster({
		prefix: 'tree-inner-grove',
		center: { x: 6, z: 39 },
		colorPalette: ['#417a4d', '#5b965c', '#376f4b', '#4f8855'],
		points: [
			{ x: -28, z: -2 },
			{ x: -20, z: 8 },
			{ x: -11, z: -1 },
			{ x: -2, z: 9 },
			{ x: 7, z: -4 },
			{ x: 16, z: 6 },
			{ x: 25, z: -3 },
			{ x: 33, z: 7 },
		],
	}),
];

export const WORLD_TREES: WorldTree[] = [
	{
		id: 'tree-west-01',
		position: { x: -17, z: -11 },
		trunkHeight: 2.8,
		trunkDiameter: 0.55,
		canopyDiameter: 3.2,
		canopyColor: '#2f7d45',
	},
	{
		id: 'tree-west-02',
		position: { x: -25, z: -5 },
		trunkHeight: 3.2,
		trunkDiameter: 0.62,
		canopyDiameter: 3.9,
		canopyColor: '#3f8f4e',
	},
	{
		id: 'tree-west-03',
		position: { x: -30, z: 8 },
		trunkHeight: 2.9,
		trunkDiameter: 0.58,
		canopyDiameter: 3.5,
		canopyColor: '#2d6f3d',
	},
	{
		id: 'tree-north-01',
		position: { x: -18, z: 25 },
		trunkHeight: 3.5,
		trunkDiameter: 0.7,
		canopyDiameter: 4.2,
		canopyColor: '#356f4f',
	},
	{
		id: 'tree-north-02',
		position: { x: -6, z: 30 },
		trunkHeight: 3.1,
		trunkDiameter: 0.62,
		canopyDiameter: 3.8,
		canopyColor: '#4a9658',
	},
	{
		id: 'tree-north-03',
		position: { x: 8, z: 33 },
		trunkHeight: 3.4,
		trunkDiameter: 0.64,
		canopyDiameter: 4,
		canopyColor: '#36774a',
	},
	{
		id: 'tree-north-04',
		position: { x: 22, z: 27 },
		trunkHeight: 3,
		trunkDiameter: 0.58,
		canopyDiameter: 3.6,
		canopyColor: '#45894c',
	},
	{
		id: 'tree-east-01',
		position: { x: 32, z: 13 },
		trunkHeight: 2.7,
		trunkDiameter: 0.52,
		canopyDiameter: 3.3,
		canopyColor: '#3a7f42',
	},
	{
		id: 'tree-east-02',
		position: { x: 35, z: -3 },
		trunkHeight: 3.3,
		trunkDiameter: 0.68,
		canopyDiameter: 4.1,
		canopyColor: '#2f6f43',
	},
	{
		id: 'tree-east-03',
		position: { x: 28, z: -20 },
		trunkHeight: 2.9,
		trunkDiameter: 0.56,
		canopyDiameter: 3.7,
		canopyColor: '#4b8f52',
	},
	{
		id: 'tree-south-01',
		position: { x: 11, z: -31 },
		trunkHeight: 3.2,
		trunkDiameter: 0.6,
		canopyDiameter: 3.9,
		canopyColor: '#367c45',
	},
	{
		id: 'tree-south-02',
		position: { x: -8, z: -32 },
		trunkHeight: 2.8,
		trunkDiameter: 0.55,
		canopyDiameter: 3.4,
		canopyColor: '#4c914e',
	},
	{
		id: 'tree-south-03',
		position: { x: -24, z: -25 },
		trunkHeight: 3.6,
		trunkDiameter: 0.72,
		canopyDiameter: 4.4,
		canopyColor: '#2f7147',
	},
	...OUTER_FOREST_TREES,
];

export const WORLD_BUILDINGS: WorldBuilding[] = [
	{
		id: 'house-starter-west',
		modelId: 'house-1',
		position: { x: -12, z: 7 },
		yaw: 0.45,
		scale: 1.35,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'house-starter-east',
		modelId: 'house-2',
		position: { x: 13, z: 8 },
		yaw: -0.4,
		scale: 1.25,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'building-ember-watch',
		modelId: 'building-2-small',
		position: { x: 14, z: -25 },
		yaw: -0.75,
		scale: 1.25,
		collider: { width: 4.6, height: 6.2, depth: 3.2 },
	},
	{
		id: 'building-grove-study',
		modelId: 'building-1-small',
		position: { x: -14, z: 31 },
		yaw: 0.85,
		scale: 1.2,
		collider: { width: 4.8, height: 5.8, depth: 3.5 },
	},
	{
		id: 'building-east-ruin-hall',
		modelId: 'building-4',
		position: { x: 42, z: 10 },
		yaw: -0.2,
		scale: 1.2,
		collider: { width: 5.8, height: 6.8, depth: 4.8 },
	},
	{
		id: 'building-west-ridge-tower',
		modelId: 'building-3-small',
		position: { x: -39, z: 18 },
		yaw: 0.35,
		scale: 1.15,
		collider: { width: 3.9, height: 6.8, depth: 5.3 },
	},
];

const TENERIFE_PREVIEW_BUILDINGS_RAW: WorldBuilding[] = [
	{
		id: 'tenerife-osm-building-01',
		modelId: 'house-1',
		position: { x: -11.93, z: 4.65 },
		yaw: 2.89,
		scale: 1.12,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-02',
		modelId: 'house-2',
		position: { x: -2.29, z: 1.96 },
		yaw: 2.67,
		scale: 1.18,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-03',
		modelId: 'building-1-small',
		position: { x: -0.31, z: -1.8 },
		yaw: 2.7,
		scale: 1.24,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 5.8, depth: 3.5 },
	},
	{
		id: 'tenerife-osm-building-04',
		modelId: 'house-1',
		position: { x: -6.58, z: -14.1 },
		yaw: 1.62,
		scale: 1.3,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-05',
		modelId: 'building-2-small',
		position: { x: -7.07, z: -18.08 },
		yaw: 0.43,
		scale: 1.36,
		heightOffset: 0.08,
		collider: { width: 4.6, height: 6.2, depth: 3.2 },
	},
	{
		id: 'tenerife-osm-building-06',
		modelId: 'house-2',
		position: { x: -14.44, z: -12.15 },
		yaw: 0.26,
		scale: 1.12,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-07',
		modelId: 'building-3-small',
		position: { x: -14.05, z: -0.44 },
		yaw: -0.18,
		scale: 1.18,
		heightOffset: 0.08,
		collider: { width: 3.9, height: 6.8, depth: 5.3 },
	},
	{
		id: 'tenerife-osm-building-08',
		modelId: 'house-1',
		position: { x: -6.34, z: 3.1 },
		yaw: -0.03,
		scale: 1.24,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-09',
		modelId: 'house-1',
		position: { x: 4.03, z: -5.61 },
		yaw: -0.16,
		scale: 1.3,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-10',
		modelId: 'house-2',
		position: { x: -1.62, z: 8.43 },
		yaw: 2.81,
		scale: 1.36,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-11',
		modelId: 'building-1-small',
		position: { x: -7.54, z: 7.19 },
		yaw: 1.04,
		scale: 1.12,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 5.8, depth: 3.5 },
	},
	{
		id: 'tenerife-osm-building-12',
		modelId: 'house-1',
		position: { x: 2.18, z: 11.3 },
		yaw: 1.32,
		scale: 1.18,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-13',
		modelId: 'building-2-small',
		position: { x: -17.81, z: 1.08 },
		yaw: 3.07,
		scale: 1.24,
		heightOffset: 0.08,
		collider: { width: 4.6, height: 6.2, depth: 3.2 },
	},
	{
		id: 'tenerife-osm-building-14',
		modelId: 'house-2',
		position: { x: 5.24, z: 1.45 },
		yaw: 1.26,
		scale: 1.3,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-15',
		modelId: 'building-3-small',
		position: { x: 5.2, z: -13.06 },
		yaw: 1.51,
		scale: 1.36,
		heightOffset: 0.08,
		collider: { width: 3.9, height: 6.8, depth: 5.3 },
	},
	{
		id: 'tenerife-osm-building-16',
		modelId: 'house-1',
		position: { x: -3.02, z: 13.68 },
		yaw: -1.69,
		scale: 1.12,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-17',
		modelId: 'house-1',
		position: { x: -18.38, z: 8.53 },
		yaw: -1.8,
		scale: 1.18,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-18',
		modelId: 'house-2',
		position: { x: 10.05, z: -6.67 },
		yaw: 1.45,
		scale: 1.24,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-19',
		modelId: 'building-1-small',
		position: { x: 11.66, z: 2.33 },
		yaw: 1.29,
		scale: 1.3,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 5.8, depth: 3.5 },
	},
	{
		id: 'tenerife-osm-building-20',
		modelId: 'house-1',
		position: { x: 15.41, z: 3.45 },
		yaw: 1.34,
		scale: 1.36,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-21',
		modelId: 'building-2-small',
		position: { x: 12.42, z: -2.2 },
		yaw: -0.26,
		scale: 1.12,
		heightOffset: 0.08,
		collider: { width: 4.6, height: 6.2, depth: 3.2 },
	},
	{
		id: 'tenerife-osm-building-22',
		modelId: 'house-2',
		position: { x: 15.87, z: -7.73 },
		yaw: 1.57,
		scale: 1.18,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-23',
		modelId: 'building-3-small',
		position: { x: -13.16, z: 13.6 },
		yaw: 1.54,
		scale: 1.24,
		heightOffset: 0.08,
		collider: { width: 3.9, height: 6.8, depth: 5.3 },
	},
	{
		id: 'tenerife-osm-building-24',
		modelId: 'house-1',
		position: { x: 6.95, z: 10.39 },
		yaw: 1.38,
		scale: 1.3,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-25',
		modelId: 'house-1',
		position: { x: -18.01, z: 15.05 },
		yaw: -1.53,
		scale: 1.36,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-26',
		modelId: 'house-2',
		position: { x: 11.38, z: 10.71 },
		yaw: 1.34,
		scale: 1.12,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-27',
		modelId: 'building-1-small',
		position: { x: -23.38, z: 13.24 },
		yaw: 1.32,
		scale: 1.18,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 5.8, depth: 3.5 },
	},
	{
		id: 'tenerife-osm-building-28',
		modelId: 'house-1',
		position: { x: 25.78, z: -9.71 },
		yaw: -1.96,
		scale: 1.24,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-29',
		modelId: 'building-2-small',
		position: { x: 16.97, z: -3.36 },
		yaw: -1.53,
		scale: 1.3,
		heightOffset: 0.08,
		collider: { width: 4.6, height: 6.2, depth: 3.2 },
	},
	{
		id: 'tenerife-osm-building-30',
		modelId: 'house-2',
		position: { x: -25.09, z: -2.96 },
		yaw: -1.94,
		scale: 1.36,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
	{
		id: 'tenerife-osm-building-31',
		modelId: 'building-3-small',
		position: { x: -27.63, z: 12.02 },
		yaw: 1.46,
		scale: 1.12,
		heightOffset: 0.08,
		collider: { width: 3.9, height: 6.8, depth: 5.3 },
	},
	{
		id: 'tenerife-osm-building-32',
		modelId: 'house-1',
		position: { x: -34.84, z: -4.34 },
		yaw: -1.67,
		scale: 1.18,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-33',
		modelId: 'house-1',
		position: { x: -40.08, z: 3.85 },
		yaw: -1.76,
		scale: 1.24,
		heightOffset: 0.08,
		collider: { width: 3.7, height: 4.2, depth: 5.4 },
	},
	{
		id: 'tenerife-osm-building-34',
		modelId: 'house-2',
		position: { x: 24.97, z: -4.19 },
		yaw: 0.82,
		scale: 1.3,
		heightOffset: 0.08,
		collider: { width: 4.8, height: 3.8, depth: 4.1 },
	},
];

export const TENERIFE_PREVIEW_BUILDINGS: WorldBuilding[] = selectNonOverlappingBuildings(
	TENERIFE_PREVIEW_BUILDINGS_RAW,
	0.75,
);

export const TENERIFE_PREVIEW_ROADS: WorldRoad[] = [
	{
		id: 'osm-25032776',
		label: 'Calle Quintana',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -10.4, z: 1.21 },
			{ x: -9.66, z: 1.54 },
			{ x: -8.43, z: 2.09 },
			{ x: -7.16, z: 2.65 },
			{ x: -4.21, z: 4.08 },
			{ x: -0.22, z: 5.69 },
			{ x: 1.48, z: 6.42 },
			{ x: 4.45, z: 6.92 },
		],
	},
	{
		id: 'osm-25038540',
		label: 'Calle Blanco',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -9.6, z: -5.4 },
			{ x: -10.14, z: -1.3 },
		],
	},
	{
		id: 'osm-25059397',
		label: 'Avenida Venezuela',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: 25.96, z: 13.86 },
			{ x: 27.56, z: 12.59 },
			{ x: 28.84, z: 11.61 },
			{ x: 30.1, z: 10.63 },
			{ x: 31.99, z: 9.21 },
		],
	},
	{
		id: 'osm-25059653',
		label: 'Avenida Venezuela',
		width: 2.55,
		points: [
			{ x: 38.42, z: 4.29 },
			{ x: 37.35, z: 5.14 },
			{ x: 36.23, z: 6.01 },
			{ x: 32.96, z: 8.48 },
		],
	},
	{
		id: 'osm-25143684',
		label: 'Calle Iriarte',
		width: 2.55,
		points: [
			{ x: 7.5, z: -2.39 },
			{ x: 10.76, z: -1.74 },
			{ x: 14.12, z: -1.04 },
			{ x: 17.95, z: -0.47 },
		],
	},
	{
		id: 'osm-25157457',
		label: 'Calle Valois',
		width: 2.55,
		points: [
			{ x: -9.2, z: -10.39 },
			{ x: -4.22, z: -10.22 },
			{ x: -3.12, z: -9.83 },
			{ x: -1.62, z: -9.4 },
			{ x: 0.04, z: -9.07 },
			{ x: 2.31, z: -8.72 },
		],
	},
	{
		id: 'osm-25162194',
		label: 'Calle San Juan',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -8.95, z: 7.66 },
			{ x: -7.73, z: 4.1 },
			{ x: -7.16, z: 2.65 },
			{ x: -5.29, z: -1.94 },
			{ x: -4.12, z: -5.01 },
		],
	},
	{
		id: 'osm-25162198',
		label: 'Calle Augustín de Betancourt',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -5.74, z: 9.23 },
			{ x: -4.87, z: 5.78 },
			{ x: -4.21, z: 4.08 },
			{ x: -2.18, z: -1.09 },
		],
	},
	{
		id: 'osm-36823333',
		label: 'Calle Mequínez',
		width: 2.55,
		points: [
			{ x: -35.64, z: 5.67 },
			{ x: -34.98, z: 7.25 },
			{ x: -34.41, z: 7.82 },
			{ x: -32.66, z: 8.06 },
			{ x: -31.14, z: 8.13 },
			{ x: -30.31, z: 8.14 },
			{ x: -24.71, z: 8.31 },
		],
	},
	{
		id: 'osm-55360050',
		label: 'Calle Perdomo',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -14.43, z: 4.76 },
			{ x: -14.33, z: 3.47 },
			{ x: -13.77, z: -0.16 },
			{ x: -13.56, z: -1.42 },
		],
	},
	{
		id: 'osm-75076489',
		label: 'Avenida de la Familia Betancourt y Molina',
		width: 2.55,
		points: [
			{ x: 8.48, z: -5.15 },
			{ x: 11.37, z: -4.29 },
			{ x: 19.75, z: -3.6 },
		],
	},
	{
		id: 'osm-75076534',
		label: 'Calle San Felipe',
		width: 2.55,
		points: [
			{ x: -14.66, z: 4.91 },
			{ x: -15.62, z: 4.95 },
			{ x: -18.55, z: 4.01 },
		],
	},
	{
		id: 'osm-75076549',
		label: 'Paseo de San Telmo',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: 4.45, z: 6.92 },
			{ x: 5.8, z: 5.7 },
			{ x: 6.69, z: 5.81 },
			{ x: 9.69, z: 6.17 },
			{ x: 14.31, z: 6.85 },
		],
	},
	{
		id: 'osm-75076559',
		label: 'Calle Iriarte',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -9.58, z: -5.67 },
			{ x: -6.04, z: -5.26 },
			{ x: -4.41, z: -5.07 },
			{ x: -1.11, z: -4.38 },
		],
	},
	{
		id: 'osm-75076608',
		label: 'Calle Mequínez',
		width: 2.55,
		points: [
			{ x: -40.83, z: -1.23 },
			{ x: -36.8, z: 2.63 },
			{ x: -35.64, z: 5.67 },
		],
	},
	{
		id: 'osm-75076645',
		label: 'Calle Valois',
		width: 2.55,
		points: [
			{ x: 28.06, z: -4.12 },
			{ x: 26.98, z: -4.63 },
			{ x: 25.92, z: -5.67 },
			{ x: 23.32, z: -6.5 },
			{ x: 21.14, z: -7.09 },
			{ x: 20.15, z: -7.33 },
			{ x: 19.31, z: -7.51 },
			{ x: 15.01, z: -7.7 },
			{ x: 12.62, z: -7.69 },
			{ x: 10.99, z: -7.77 },
		],
	},
	{
		id: 'osm-75076651',
		label: 'Calle Mequinez',
		width: 2.55,
		points: [
			{ x: -43.56, z: -1.43 },
			{ x: -44.14, z: -0.82 },
			{ x: -44.36, z: 0.47 },
			{ x: -44.77, z: 1.91 },
			{ x: -45.42, z: 2.83 },
			{ x: -45.59, z: 3.67 },
			{ x: -45.19, z: 4.64 },
			{ x: -44.58, z: 5.66 },
			{ x: -40.61, z: 9.94 },
			{ x: -39.5, z: 10.68 },
		],
	},
	{
		id: 'osm-75543223',
		label: 'Calle Blanco',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -10.14, z: -1.3 },
			{ x: -10.4, z: 1.21 },
			{ x: -10.72, z: 4.03 },
			{ x: -10.94, z: 4.89 },
		],
	},
	{
		id: 'osm-83602170',
		label: 'Calle Mequínez',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -21.36, z: 11.12 },
			{ x: -22.25, z: 11.33 },
			{ x: -23.88, z: 10.13 },
			{ x: -25.89, z: 9.99 },
			{ x: -27.31, z: 10.13 },
			{ x: -28.43, z: 10.65 },
			{ x: -29.46, z: 10.71 },
			{ x: -30.1, z: 9.97 },
			{ x: -29.22, z: 10 },
			{ x: -28.35, z: 9.83 },
			{ x: -27.62, z: 9.39 },
			{ x: -26.46, z: 9.24 },
			{ x: -25.01, z: 9.27 },
			{ x: -24.03, z: 9.37 },
			{ x: -22.54, z: 9.91 },
			{ x: -21.71, z: 10.19 },
			{ x: -19.27, z: 10.48 },
			{ x: -19.06, z: 9.24 },
			{ x: -18.45, z: 10.54 },
			{ x: -16.71, z: 10.59 },
			{ x: -16.59, z: 9.41 },
			{ x: -15.31, z: 9.43 },
			{ x: -14.33, z: 9.43 },
			{ x: -14.38, z: 11.38 },
			{ x: -21.36, z: 11.12 },
		],
	},
	{
		id: 'osm-91017948',
		label: 'Calle Santo Domingo',
		width: 2.55,
		points: [
			{ x: 5.52, z: 3.96 },
			{ x: 4.96, z: 5.56 },
			{ x: 4.45, z: 6.92 },
			{ x: 3.79, z: 7.63 },
			{ x: 0.39, z: 10.25 },
			{ x: -0.49, z: 10.32 },
			{ x: -4.03, z: 9.6 },
			{ x: -5.74, z: 9.23 },
			{ x: -6.96, z: 8.72 },
			{ x: -8.95, z: 7.66 },
			{ x: -10.11, z: 7.12 },
			{ x: -10.93, z: 6.71 },
		],
	},
	{
		id: 'osm-91017961',
		label: 'Calle San Felipe',
		width: 2.55,
		points: [
			{ x: -33.01, z: -0.06 },
			{ x: -36.83, z: -0.13 },
			{ x: -40.83, z: -1.23 },
		],
	},
	{
		id: 'osm-93292792',
		label: 'Calle San Felipe',
		width: 2.55,
		points: [
			{ x: -24.34, z: 2.18 },
			{ x: -28.57, z: 0.9 },
			{ x: -30.12, z: 0.4 },
			{ x: -31.23, z: 0.13 },
		],
	},
	{
		id: 'osm-94559558',
		label: 'Calle Zamora',
		width: 2.55,
		points: [
			{ x: 8.48, z: -5.15 },
			{ x: 7.5, z: -2.39 },
			{ x: 5.57, z: 2.86 },
			{ x: 5.52, z: 3.96 },
		],
	},
	{
		id: 'osm-132734831',
		label: 'Avenida de la Familia Betancourt y Molina',
		width: 2.55,
		points: [
			{ x: 20.24, z: -3.5 },
			{ x: 21.05, z: -2.84 },
			{ x: 23.29, z: -0.4 },
			{ x: 24.28, z: 0.58 },
			{ x: 25.62, z: 1.87 },
		],
	},
	{
		id: 'osm-180339320',
		label: 'Plaza del Charco',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -10.59, z: -0.93 },
			{ x: -10.84, z: 0.96 },
			{ x: -11.23, z: 3.95 },
		],
	},
	{
		id: 'osm-235634256',
		label: 'Avenida de la Familia Betancourt y Molina',
		width: 2.55,
		points: [
			{ x: 25.62, z: 1.87 },
			{ x: 27.46, z: 3.68 },
			{ x: 32.3, z: 8.42 },
		],
	},
	{
		id: 'osm-235634271',
		label: 'Calle San Felipe',
		width: 2.55,
		points: [
			{ x: -18.55, z: 4.01 },
			{ x: -22.65, z: 2.69 },
			{ x: -24.07, z: 2.26 },
		],
	},
	{
		id: 'osm-244400894',
		label: 'Calle Mequínez',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: -24.71, z: 8.31 },
			{ x: -23.87, z: 8.39 },
			{ x: -21.3, z: 8.83 },
			{ x: -19.06, z: 9.24 },
			{ x: -16.83, z: 9.39 },
			{ x: -15.31, z: 9.43 },
		],
	},
	{
		id: 'osm-616625415',
		label: 'Paseo de San Telmo',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: 8.93, z: 6.55 },
			{ x: 9.62, z: 7.81 },
			{ x: 11.08, z: 7.68 },
			{ x: 11.92, z: 7.22 },
			{ x: 12.68, z: 7.58 },
			{ x: 13.46, z: 7.98 },
			{ x: 14.62, z: 7.93 },
			{ x: 15.53, z: 7.35 },
			{ x: 16.83, z: 7.89 },
			{ x: 16.86, z: 7.08 },
			{ x: 14.8, z: 6.83 },
			{ x: 13.36, z: 6.59 },
			{ x: 11.55, z: 6.26 },
			{ x: 10.39, z: 6.06 },
			{ x: 9.22, z: 6.3 },
		],
	},
	{
		id: 'osm-984623235',
		label: 'Calle Blanco',
		width: 2.55,
		points: [
			{ x: -9.2, z: -10.39 },
			{ x: -9.58, z: -5.67 },
		],
	},
	{
		id: 'osm-1206373847',
		label: 'Paseo de San Telmo',
		width: 1.85,
		color: '#6a6257',
		points: [
			{ x: 4.97, z: 7.91 },
			{ x: 4.66, z: 6.97 },
			{ x: 5.24, z: 5.48 },
			{ x: 9.68, z: 5.96 },
			{ x: 6.68, z: 6.01 },
			{ x: 5.71, z: 6.19 },
			{ x: 5.06, z: 7.41 },
		],
	},
];

export const WORLD_ROCKS: WorldRock[] = [
	{
		id: 'rock-ridge-01',
		position: { x: -33, z: 24 },
		scale: { x: 1.6, y: 0.8, z: 1.2 },
		color: '#747066',
	},
	{
		id: 'rock-ridge-02',
		position: { x: -28, z: 31 },
		scale: { x: 1.2, y: 0.7, z: 1.5 },
		color: '#5f625d',
	},
	{
		id: 'rock-ridge-03',
		position: { x: -12, z: 39 },
		scale: { x: 1.7, y: 0.9, z: 1.1 },
		color: '#777b71',
	},
	{
		id: 'rock-east-01',
		position: { x: 21, z: 17 },
		scale: { x: 1.1, y: 0.6, z: 1.3 },
		color: '#69645d',
	},
	{
		id: 'rock-east-02',
		position: { x: 38, z: -14 },
		scale: { x: 1.8, y: 0.9, z: 1.4 },
		color: '#7b766d',
	},
	{
		id: 'rock-south-01',
		position: { x: 4, z: -38 },
		scale: { x: 1.5, y: 0.7, z: 1.1 },
		color: '#686d66',
	},
	{
		id: 'rock-south-02',
		position: { x: -19, z: -36 },
		scale: { x: 1.2, y: 0.6, z: 1.6 },
		color: '#777268',
	},
];

export const WORLD_PROPS: WorldProp[] = [
	{ id: 'campfire-south-gate', kind: 'campfire', position: { x: -3, z: -17 }, yaw: 0.1 },
	{ id: 'crate-camp-01', kind: 'crate', position: { x: -5.7, z: -15.8 }, yaw: 0.3 },
	{ id: 'crate-camp-02', kind: 'crate', position: { x: -1.4, z: -19.1 }, yaw: -0.6 },
	{ id: 'obelisk-grove', kind: 'obelisk', position: { x: 15, z: 26 }, yaw: 0 },
	{ id: 'totem-west-road', kind: 'totem', position: { x: -22, z: 11 }, yaw: 0.25 },
	{ id: 'totem-east-road', kind: 'totem', position: { x: 25, z: 5 }, yaw: -0.2 },
];

export const WORLD_NPCS: WorldNpc[] = [
	{
		id: 'npc-crafter-alie',
		name: 'Alie',
		role: 'Crafter',
		position: { x: -6, z: -14 },
		yaw: 0.8,
		accentColor: '#69b7ff',
	},
	{
		id: 'npc-warden-mira',
		name: 'Mira',
		role: 'Grove Warden',
		position: { x: 12, z: 24 },
		yaw: -0.5,
		accentColor: '#8be66f',
	},
	{
		id: 'npc-scout-ren',
		name: 'Ren',
		role: 'Path Scout',
		position: { x: 24, z: -8 },
		yaw: -1.1,
		accentColor: '#f0c362',
	},
];

export const WORLD_CREATURES: WorldCreature[] = [
	{
		id: 'creature-mote-01',
		species: 'Glow Mote',
		position: { x: -15, z: 17 },
		patrolRadius: 2.6,
		patrolSpeed: 0.7,
		accentColor: '#ffd56a',
	},
	{
		id: 'creature-mote-02',
		species: 'Glow Mote',
		position: { x: 18, z: 19 },
		patrolRadius: 3.2,
		patrolSpeed: 0.55,
		accentColor: '#9ce6ff',
	},
	{
		id: 'creature-sprout-01',
		species: 'Sproutling',
		position: { x: 30, z: -22 },
		patrolRadius: 2.1,
		patrolSpeed: 0.8,
		accentColor: '#95df62',
	},
	{
		id: 'creature-sprout-02',
		species: 'Sproutling',
		position: { x: -30, z: -20 },
		patrolRadius: 2.4,
		patrolSpeed: 0.65,
		accentColor: '#77ca71',
	},
];

export const getWorldPopulationSummary = () => ({
	npcs: WORLD_NPCS.length,
	creatures: WORLD_CREATURES.length,
	buildings: WORLD_BUILDINGS.length,
	trees: WORLD_TREES.length,
	props: WORLD_PROPS.length,
});
