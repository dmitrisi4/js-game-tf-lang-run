import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { getTerrainHeightAt } from './terrainData';
import type { WorldBuilding, WorldBuildingModelId, WorldPosition } from './worldData';

export type TenerifeRoadLayerId = 'main' | 'walk' | 'service';

type GeoJsonLineString = {
	coordinates: [number, number][];
	type: 'LineString';
};

type GeoJsonFeature = {
	geometry: GeoJsonLineString | { type: string };
	properties?: {
		'@id'?: string;
		highway?: string;
		name?: string;
	};
	type: 'Feature';
};

export type GeoJsonFeatureCollection = {
	features: GeoJsonFeature[];
	type: 'FeatureCollection';
};

export type TenerifeRoadLayerStyle = {
	color: Color3;
	heightOffset: number;
	id: TenerifeRoadLayerId;
	label: string;
	width: number;
};

export type TenerifeRoadLine = {
	id: string;
	layerId: TenerifeRoadLayerId;
	name: string;
	points: Vector3[];
};

export type TenerifeRoadLayerData = TenerifeRoadLayerStyle & {
	lines: Vector3[][];
	roadCount: number;
};

export type TenerifeRuntimeRoadLine = {
	id: string;
	layerId: TenerifeRoadLayerId;
	name: string;
	points: [number, number][];
};

export type TenerifeRuntimeRoadData = {
	lines: TenerifeRuntimeRoadLine[];
	metrics?: {
		countsByLayer?: Partial<Record<TenerifeRoadLayerId, number>>;
		lineCount: number;
		pointCount: number;
		segmentCount: number;
	};
	version: 1;
};

type ProjectionConfig = {
	centerLat: number;
	centerLon: number;
	metersToWorld: number;
	offset: WorldPosition;
};

export type TenerifeWorldTransformType = {
	offset: {
		x: number;
		z: number;
	};
	scale: number;
};

const METERS_PER_LATITUDE_DEGREE = 111_320;
const TENERIFE_CITY_CENTER_LAT = 28.40330075;
const TENERIFE_CITY_CENTER_LON = -16.5453185;

const ROAD_LAYER_BY_HIGHWAY: Record<string, TenerifeRoadLayerId | undefined> = {
	motorway: 'main',
	motorway_link: 'main',
	primary: 'main',
	primary_link: 'main',
	secondary: 'main',
	secondary_link: 'main',
	tertiary: 'main',
	tertiary_link: 'main',
	residential: 'main',
	living_street: 'main',
	unclassified: 'main',
	pedestrian: 'walk',
	footway: 'walk',
	steps: 'walk',
	path: 'walk',
	cycleway: 'walk',
	service: 'service',
	track: 'service',
};

export const TENERIFE_ROAD_LAYER_STYLES: Record<TenerifeRoadLayerId, TenerifeRoadLayerStyle> = {
	main: {
		color: Color3.FromHexString('#47423c'),
		heightOffset: 0.015,
		id: 'main',
		label: 'Main roads',
		width: 3.4,
	},
	service: {
		color: Color3.FromHexString('#6f6253'),
		heightOffset: 0.018,
		id: 'service',
		label: 'Service roads',
		width: 1.9,
	},
	walk: {
		color: Color3.FromHexString('#aa9a78'),
		heightOffset: 0.02,
		id: 'walk',
		label: 'Walk paths',
		width: 1.25,
	},
};

const TENERIFE_BUILDING_MODELS: WorldBuildingModelId[] = [
	'building-1-small',
	'building-2-small',
	'building-3-small',
	'house-1',
	'house-2',
	'building-4',
];

const TENERIFE_BUILDING_COLLIDERS: Record<WorldBuildingModelId, WorldBuilding['collider']> = {
	'building-1-small': { width: 4.8, height: 5.8, depth: 3.5 },
	'building-2-small': { width: 4.6, height: 6.2, depth: 3.2 },
	'building-3-small': { width: 3.9, height: 6.8, depth: 5.3 },
	'building-4': { width: 5.8, height: 7.2, depth: 5.4 },
	'house-1': { width: 3.7, height: 4.2, depth: 5.4 },
	'house-2': { width: 4.8, height: 3.8, depth: 4.1 },
};

export const TENERIFE_ROAD_PROJECTION: ProjectionConfig = {
	centerLat: TENERIFE_CITY_CENTER_LAT,
	centerLon: TENERIFE_CITY_CENTER_LON,
	metersToWorld: 0.26,
	offset: { x: 0, z: 0 },
};

const TENERIFE_CITY_FOOTPRINT = {
	centerX: 0,
	centerZ: -8,
	radiusX: 235,
	radiusZ: 165,
};
const TENERIFE_GENERATED_BUILDING_BASE_SCALE = 1.42;
const TENERIFE_GENERATED_BUILDING_SCALE_STEP = 0.12;
const TENERIFE_GENERATED_BUILDING_MIN_DISTANCE = 23;

export const isInsideTenerifeCityFootprint = (position: WorldPosition): boolean => {
	const normalizedX =
		(position.x - TENERIFE_CITY_FOOTPRINT.centerX) / TENERIFE_CITY_FOOTPRINT.radiusX;
	const normalizedZ =
		(position.z - TENERIFE_CITY_FOOTPRINT.centerZ) / TENERIFE_CITY_FOOTPRINT.radiusZ;

	return normalizedX * normalizedX + normalizedZ * normalizedZ <= 1;
};

export const getTenerifeRoadLayerId = (
	highway: string | undefined,
): TenerifeRoadLayerId | undefined => {
	if (!highway) {
		return undefined;
	}

	return ROAD_LAYER_BY_HIGHWAY[highway];
};

const isGeoJsonLineString = (geometry: GeoJsonFeature['geometry']): geometry is GeoJsonLineString =>
	geometry.type === 'LineString';

export const projectTenerifeLonLatToWorld = (
	lon: number,
	lat: number,
	projection = TENERIFE_ROAD_PROJECTION,
): WorldPosition => {
	const metersPerLongitudeDegree =
		METERS_PER_LATITUDE_DEGREE * Math.cos((projection.centerLat * Math.PI) / 180);
	const x =
		(lon - projection.centerLon) * metersPerLongitudeDegree * projection.metersToWorld +
		projection.offset.x;
	const z =
		-(lat - projection.centerLat) * METERS_PER_LATITUDE_DEGREE * projection.metersToWorld +
		projection.offset.z;

	return {
		x: Number(x.toFixed(2)),
		z: Number(z.toFixed(2)),
	};
};

export const buildTenerifeRoadLayerData = (
	geoJson: GeoJsonFeatureCollection,
	projection = TENERIFE_ROAD_PROJECTION,
): TenerifeRoadLayerData[] => {
	const layerLines: Record<TenerifeRoadLayerId, Vector3[][]> = {
		main: [],
		service: [],
		walk: [],
	};

	for (const feature of geoJson.features) {
		if (!isGeoJsonLineString(feature.geometry)) {
			continue;
		}

		const layerId = getTenerifeRoadLayerId(feature.properties?.highway);

		if (!layerId || feature.geometry.coordinates.length < 2) {
			continue;
		}

		const style = TENERIFE_ROAD_LAYER_STYLES[layerId];
		const points = feature.geometry.coordinates.map(([lon, lat]) => {
			const position = projectTenerifeLonLatToWorld(lon, lat, projection);

			return new Vector3(position.x, getTerrainHeightAt(position) + style.heightOffset, position.z);
		});

		layerLines[layerId].push(points);
	}

	return (['service', 'main', 'walk'] satisfies TenerifeRoadLayerId[]).map((layerId) => ({
		...TENERIFE_ROAD_LAYER_STYLES[layerId],
		lines: layerLines[layerId],
		roadCount: layerLines[layerId].length,
	}));
};

export const buildTenerifeRoadLayerDataFromRuntime = (
	runtimeData: TenerifeRuntimeRoadData,
): TenerifeRoadLayerData[] => {
	const layerLines: Record<TenerifeRoadLayerId, Vector3[][]> = {
		main: [],
		service: [],
		walk: [],
	};

	for (const line of runtimeData.lines) {
		if (!layerLines[line.layerId] || line.points.length < 2) {
			continue;
		}

		const style = TENERIFE_ROAD_LAYER_STYLES[line.layerId];
		const points = line.points.map(
			([x, z]) => new Vector3(x, getTerrainHeightAt({ x, z }) + style.heightOffset, z),
		);

		layerLines[line.layerId].push(points);
	}

	return (['service', 'main', 'walk'] satisfies TenerifeRoadLayerId[]).map((layerId) => ({
		...TENERIFE_ROAD_LAYER_STYLES[layerId],
		lines: layerLines[layerId],
		roadCount: layerLines[layerId].length,
	}));
};

const isInsideBuildingPlacementArea = (position: WorldPosition): boolean =>
	isInsideTenerifeCityFootprint(position);

const isFarEnoughFromExistingBuildings = (
	position: WorldPosition,
	buildings: WorldBuilding[],
): boolean =>
	buildings.every((building) => {
		const dx = position.x - building.position.x;
		const dz = position.z - building.position.z;

		return (
			dx * dx + dz * dz >
			TENERIFE_GENERATED_BUILDING_MIN_DISTANCE * TENERIFE_GENERATED_BUILDING_MIN_DISTANCE
		);
	});

export const buildTenerifeRoadsideBuildings = (
	layers: TenerifeRoadLayerData[],
	maxBuildings = 72,
): WorldBuilding[] => {
	const mainLayer = layers.find((layer) => layer.id === 'main');
	const buildings: WorldBuilding[] = [];

	if (!mainLayer) {
		return buildings;
	}

	let candidateIndex = 0;

	for (const line of mainLayer.lines) {
		for (let pointIndex = 0; pointIndex < line.length - 1; pointIndex += 1) {
			const from = line[pointIndex];
			const to = line[pointIndex + 1];
			const dx = to.x - from.x;
			const dz = to.z - from.z;
			const segmentLength = Math.hypot(dx, dz);
			const segmentMidpoint = {
				x: (from.x + to.x) / 2,
				z: (from.z + to.z) / 2,
			};

			if (segmentLength < 16 || !isInsideTenerifeCityFootprint(segmentMidpoint)) {
				continue;
			}

			const placementsOnSegment = Math.max(1, Math.floor(segmentLength / 48));

			for (let placementIndex = 0; placementIndex < placementsOnSegment; placementIndex += 1) {
				if (buildings.length >= maxBuildings) {
					return buildings;
				}

				const t = (placementIndex + 0.5) / placementsOnSegment;
				const side = candidateIndex % 2 === 0 ? 1 : -1;
				const offsetDistance = 13 + (candidateIndex % 3) * 2.6;
				const normalX = (-dz / segmentLength) * side;
				const normalZ = (dx / segmentLength) * side;
				const position = {
					x: Number((from.x + dx * t + normalX * offsetDistance).toFixed(2)),
					z: Number((from.z + dz * t + normalZ * offsetDistance).toFixed(2)),
				};
				candidateIndex += 1;

				if (
					!isInsideBuildingPlacementArea(position) ||
					!isFarEnoughFromExistingBuildings(position, buildings)
				) {
					continue;
				}

				const modelId = TENERIFE_BUILDING_MODELS[candidateIndex % TENERIFE_BUILDING_MODELS.length];

				buildings.push({
					collider: TENERIFE_BUILDING_COLLIDERS[modelId],
					heightOffset: 0.04,
					id: `tenerife-roadside-building-${String(buildings.length + 1).padStart(2, '0')}`,
					modelId,
					position,
					scale:
						TENERIFE_GENERATED_BUILDING_BASE_SCALE +
						(candidateIndex % 5) * TENERIFE_GENERATED_BUILDING_SCALE_STEP,
					yaw: Math.atan2(dx, dz) + (side > 0 ? Math.PI / 2 : -Math.PI / 2),
				});
			}
		}
	}

	return buildings;
};

/** Maps generated Puerto-local roadside buildings onto a larger Tenerife world. */
export const transformTenerifeRoadsideBuildings = (
	buildings: WorldBuilding[],
	transform: TenerifeWorldTransformType,
	options: {
		groundSink?: number;
		positionScaleMultiplier?: number;
		visualScaleMultiplier?: number;
	} = {},
): WorldBuilding[] =>
	buildings.map((building) => {
		const positionScale = transform.scale * (options.positionScaleMultiplier ?? 1);
		const visualScale = transform.scale * (options.visualScaleMultiplier ?? 1);

		return {
			...building,
			collider: {
				depth: building.collider.depth * visualScale,
				height: building.collider.height * visualScale,
				width: building.collider.width * visualScale,
			},
			heightOffset: (building.heightOffset ?? 0) * visualScale - (options.groundSink ?? 0),
			position: {
				x: transform.offset.x + building.position.x * positionScale,
				z: transform.offset.z + building.position.z * positionScale,
			},
			scale: building.scale * visualScale,
		};
	});
