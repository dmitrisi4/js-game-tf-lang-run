import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { RoadSurfaceType } from './roadSurfaceShader';
import { getTerrainHeightAt } from './terrainData';
import type { WorldBuilding, WorldBuildingModelId, WorldPosition } from './worldData';
import { doBuildingFootprintsOverlap } from './worldPlacementValidation';

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
	/** Procedural surface type used by the road surface shader. */
	surfaceType: RoadSurfaceType;
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
	clip?: {
		maxX?: number;
		maxZ?: number;
		minX?: number;
		minZ?: number;
	};
	offset: {
		x: number;
		z: number;
	};
	roadWidthScaleMultiplier?: number;
	scale: number;
};

type RoadsideBuildingVariantType = {
	collider: WorldBuilding['collider'];
	modelId: WorldBuildingModelId;
	setback: number;
	spacing: number;
};

type RoadsideRoadSegmentType = {
	from: WorldPosition;
	layerId: TenerifeRoadLayerId;
	length: number;
	lineIndex: number;
	midpoint: WorldPosition;
	segmentIndex: number;
	tangent: WorldPosition;
	to: WorldPosition;
	width: number;
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
		// City main roads → cobblestone; rural → dirt (resolved in shader)
		surfaceType: 'cobblestone',
		width: 3.4,
	},
	service: {
		color: Color3.FromHexString('#6f6253'),
		heightOffset: 0.018,
		id: 'service',
		label: 'Service roads',
		surfaceType: 'dirt',
		width: 1.9,
	},
	walk: {
		color: Color3.FromHexString('#aa9a78'),
		heightOffset: 0.02,
		id: 'walk',
		label: 'Walk paths',
		surfaceType: 'earth',
		width: 1.25,
	},
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
const TENERIFE_GENERATED_BUILDING_MAX_COUNT = 180;
const TENERIFE_ROADSIDE_BUILDING_END_CLEARANCE = 5.5;
const TENERIFE_ROADSIDE_BUILDING_JUNCTION_CLEARANCE = 7.5;
const TENERIFE_ROADSIDE_BUILDING_MIN_CLEARANCE = 0.8;
const TENERIFE_ROADSIDE_OTHER_ROAD_CLEARANCE = 1.2;
const TENERIFE_ROADSIDE_MAIN_SEGMENT_MIN_LENGTH = 24;
const TENERIFE_ROADSIDE_SERVICE_SEGMENT_MIN_LENGTH = 20;
const TENERIFE_ROADSIDE_BOTH_SIDE_MIN_LENGTH = 34;
const TENERIFE_ROADSIDE_MAX_HOUSES_PER_SIDE = 5;
const TENERIFE_ROADSIDE_BUILDING_VARIANTS: RoadsideBuildingVariantType[] = [
	{
		collider: { width: 5.4, height: 4.6, depth: 7.8 },
		modelId: 'house-1',
		setback: 1.45,
		spacing: 1.4,
	},
	{
		collider: { width: 6.2, height: 5.1, depth: 8.9 },
		modelId: 'house-2',
		setback: 1.6,
		spacing: 1.5,
	},
	{
		collider: { width: 6.6, height: 7.4, depth: 9.8 },
		modelId: 'building-1-small',
		setback: 1.5,
		spacing: 1.65,
	},
	{
		collider: { width: 5.9, height: 8.4, depth: 8.3 },
		modelId: 'building-3-small',
		setback: 1.4,
		spacing: 1.5,
	},
	{
		collider: { width: 7.8, height: 6.3, depth: 12.2 },
		modelId: 'building-2-small',
		setback: 1.9,
		spacing: 1.8,
	},
	{
		collider: { width: 8.6, height: 9.4, depth: 13.2 },
		modelId: 'building-4',
		setback: 2.1,
		spacing: 2,
	},
];

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

const getDeterministicUnit = (seed: number): number => {
	const value = Math.sin(seed * 12.9898) * 43_758.5453;

	return value - Math.floor(value);
};

const roundWorldValue = (value: number): number => Number(value.toFixed(2));
const roundUnitValue = (value: number): number => Number(value.toFixed(4));

const getRoadsideNormal = (tangent: WorldPosition, side: -1 | 1): WorldPosition => ({
	x: -tangent.z * side,
	z: tangent.x * side,
});

const getSegmentMinimumLength = (layerId: TenerifeRoadLayerId): number =>
	layerId === 'service'
		? TENERIFE_ROADSIDE_SERVICE_SEGMENT_MIN_LENGTH
		: TENERIFE_ROADSIDE_MAIN_SEGMENT_MIN_LENGTH;

const getCityFootprintPriority = (position: WorldPosition): number => {
	const normalizedX =
		(position.x - TENERIFE_CITY_FOOTPRINT.centerX) / TENERIFE_CITY_FOOTPRINT.radiusX;
	const normalizedZ =
		(position.z - TENERIFE_CITY_FOOTPRINT.centerZ) / TENERIFE_CITY_FOOTPRINT.radiusZ;
	const distanceSquared = normalizedX * normalizedX + normalizedZ * normalizedZ;

	return Math.max(0, 1 - distanceSquared);
};

const getRoadSegmentPriority = (segment: RoadsideRoadSegmentType): number => {
	const layerPriority = segment.layerId === 'main' ? 420 : 180;
	const cityPriority = getCityFootprintPriority(segment.midpoint) * 220;

	return layerPriority + cityPriority + Math.min(segment.length, 90);
};

const getRoadSegments = (layers: TenerifeRoadLayerData[]): RoadsideRoadSegmentType[] => {
	const roadSegments: RoadsideRoadSegmentType[] = [];
	const layerOrder: TenerifeRoadLayerId[] = ['main', 'service'];

	for (const layerId of layerOrder) {
		const layer = layers.find((candidateLayer) => candidateLayer.id === layerId);
		const minimumLength = getSegmentMinimumLength(layerId);

		if (!layer) {
			continue;
		}

		layer.lines.forEach((line, lineIndex) => {
			for (let segmentIndex = 0; segmentIndex < line.length - 1; segmentIndex += 1) {
				const from = line[segmentIndex];
				const to = line[segmentIndex + 1];
				const dx = to.x - from.x;
				const dz = to.z - from.z;
				const length = Math.hypot(dx, dz);
				const midpoint = {
					x: (from.x + to.x) / 2,
					z: (from.z + to.z) / 2,
				};

				if (length < minimumLength || !isInsideTenerifeCityFootprint(midpoint)) {
					continue;
				}

				roadSegments.push({
					from: { x: from.x, z: from.z },
					layerId,
					length,
					lineIndex,
					midpoint,
					segmentIndex,
					tangent: {
						x: dx / length,
						z: dz / length,
					},
					to: { x: to.x, z: to.z },
					width: layer.width,
				});
			}
		});
	}

	return roadSegments.sort((a, b) => getRoadSegmentPriority(b) - getRoadSegmentPriority(a));
};

const getJunctionPoints = (layers: TenerifeRoadLayerData[]): WorldPosition[] => {
	const endpoints = new Map<string, { count: number; position: WorldPosition }>();

	for (const layer of layers) {
		if (layer.id === 'walk') {
			continue;
		}

		for (const line of layer.lines) {
			const endpointCandidates = [line[0], line[line.length - 1]];

			for (const point of endpointCandidates) {
				const position = { x: roundWorldValue(point.x), z: roundWorldValue(point.z) };
				const key = `${Math.round(position.x)}:${Math.round(position.z)}`;
				const endpoint = endpoints.get(key);

				if (endpoint) {
					endpoint.count += 1;
				} else {
					endpoints.set(key, { count: 1, position });
				}
			}
		}
	}

	return Array.from(endpoints.values())
		.filter((endpoint) => endpoint.count > 1)
		.map((endpoint) => endpoint.position);
};

const isNearRoadJunction = (position: WorldPosition, junctionPoints: WorldPosition[]): boolean =>
	junctionPoints.some((junction) => {
		const dx = position.x - junction.x;
		const dz = position.z - junction.z;

		return (
			dx * dx + dz * dz <
			TENERIFE_ROADSIDE_BUILDING_JUNCTION_CLEARANCE * TENERIFE_ROADSIDE_BUILDING_JUNCTION_CLEARANCE
		);
	});

const hasBuildingFootprintClearance = (
	candidate: WorldBuilding,
	buildings: WorldBuilding[],
): boolean =>
	buildings.every(
		(building) =>
			!doBuildingFootprintsOverlap(candidate, building, TENERIFE_ROADSIDE_BUILDING_MIN_CLEARANCE),
	);

const getDistanceToRoadSegment = (
	position: WorldPosition,
	segment: RoadsideRoadSegmentType,
): number => {
	const fromToX = segment.to.x - segment.from.x;
	const fromToZ = segment.to.z - segment.from.z;
	const segmentLengthSquared = fromToX * fromToX + fromToZ * fromToZ;

	if (segmentLengthSquared <= 0) {
		return Math.hypot(position.x - segment.from.x, position.z - segment.from.z);
	}

	const positionT =
		((position.x - segment.from.x) * fromToX + (position.z - segment.from.z) * fromToZ) /
		segmentLengthSquared;
	const clampedT = Math.max(0, Math.min(1, positionT));
	const closest = {
		x: segment.from.x + fromToX * clampedT,
		z: segment.from.z + fromToZ * clampedT,
	};

	return Math.hypot(position.x - closest.x, position.z - closest.z);
};

const isSameRoadSegment = (
	first: RoadsideRoadSegmentType,
	second: RoadsideRoadSegmentType,
): boolean =>
	first.layerId === second.layerId &&
	first.lineIndex === second.lineIndex &&
	first.segmentIndex === second.segmentIndex;

const isTooCloseToOtherRoadSurface = (
	candidate: WorldBuilding,
	sourceSegment: RoadsideRoadSegmentType,
	roadSegments: RoadsideRoadSegmentType[],
): boolean =>
	roadSegments.some((segment) => {
		if (isSameRoadSegment(segment, sourceSegment)) {
			return false;
		}

		const minimumDistance =
			segment.width / 2 + candidate.collider.width / 2 + TENERIFE_ROADSIDE_OTHER_ROAD_CLEARANCE;

		return getDistanceToRoadSegment(candidate.position, segment) < minimumDistance;
	});

const getRoadsideYaw = (tangent: WorldPosition, side: number): number => {
	const yaw = Math.atan2(tangent.x, tangent.z) + (side > 0 ? 0 : Math.PI);

	return Math.atan2(Math.sin(yaw), Math.cos(yaw));
};

const getSideOrder = (seed: number): (-1 | 1)[] => (seed % 2 === 0 ? [1, -1] : [-1, 1]);

const shouldPlaceBothSides = (segment: RoadsideRoadSegmentType): boolean =>
	segment.layerId === 'main' && segment.length >= TENERIFE_ROADSIDE_BOTH_SIDE_MIN_LENGTH;

const getRoadSegmentAnchorPosition = (
	segment: RoadsideRoadSegmentType,
	distance: number,
): WorldPosition => ({
	x: segment.from.x + segment.tangent.x * distance,
	z: segment.from.z + segment.tangent.z * distance,
});

/**
 * Derives natural-looking placeholder houses from Puerto road polylines.
 */
export const buildTenerifeRoadsideBuildings = (
	layers: TenerifeRoadLayerData[],
	maxBuildings = TENERIFE_GENERATED_BUILDING_MAX_COUNT,
): WorldBuilding[] => {
	const roadSegments = getRoadSegments(layers);
	const buildings: WorldBuilding[] = [];

	if (roadSegments.length === 0) {
		return buildings;
	}

	const junctionPoints = getJunctionPoints(layers);

	for (const [segmentOrderIndex, segment] of roadSegments.entries()) {
		const segmentSeed =
			(segment.lineIndex + 1) * 127 + (segment.segmentIndex + 1) * 53 + segmentOrderIndex * 17;
		const sideOrder = getSideOrder(segmentSeed);
		const sidesToTry = shouldPlaceBothSides(segment) ? sideOrder : [sideOrder[0]];

		for (const side of sidesToTry) {
			let distance =
				TENERIFE_ROADSIDE_BUILDING_END_CLEARANCE + getDeterministicUnit(segmentSeed + side * 11) * 1.8;
			let housesOnSide = 0;

			while (
				housesOnSide < TENERIFE_ROADSIDE_MAX_HOUSES_PER_SIDE &&
				distance < segment.length - TENERIFE_ROADSIDE_BUILDING_END_CLEARANCE
			) {
				if (buildings.length >= maxBuildings) {
					return buildings;
				}

				const variantSeed = segmentSeed + housesOnSide * 31 + (side > 0 ? 11 : 23);
				const variant =
					TENERIFE_ROADSIDE_BUILDING_VARIANTS[variantSeed % TENERIFE_ROADSIDE_BUILDING_VARIANTS.length];
				const frontageLength = variant.collider.depth;
				const anchorDistance = distance + frontageLength / 2;

				if (anchorDistance > segment.length - TENERIFE_ROADSIDE_BUILDING_END_CLEARANCE) {
					break;
				}

				const anchorPosition = getRoadSegmentAnchorPosition(segment, anchorDistance);
				const setbackJitter = getDeterministicUnit(variantSeed * 3) * 0.45;
				const offsetDistance =
					segment.width / 2 + variant.collider.width / 2 + variant.setback + setbackJitter;
				const normal = getRoadsideNormal(segment.tangent, side);
				const position = {
					x: roundWorldValue(anchorPosition.x + normal.x * offsetDistance),
					z: roundWorldValue(anchorPosition.z + normal.z * offsetDistance),
				};

				if (
					!isInsideBuildingPlacementArea(position) ||
					isNearRoadJunction(anchorPosition, junctionPoints)
				) {
					distance += frontageLength + variant.spacing;
					housesOnSide += 1;
					continue;
				}

				const candidate = {
					collider: variant.collider,
					heightOffset: 0.04,
					id: `tenerife-roadside-building-${String(buildings.length + 1).padStart(2, '0')}`,
					modelId: variant.modelId,
					position,
					roadsideAnchor: {
						position: {
							x: roundWorldValue(anchorPosition.x),
							z: roundWorldValue(anchorPosition.z),
						},
						roadWidth: segment.width,
						side,
						setback: variant.setback + setbackJitter,
						tangent: {
							x: roundUnitValue(segment.tangent.x),
							z: roundUnitValue(segment.tangent.z),
						},
					},
					scale: 1,
					yaw: getRoadsideYaw(segment.tangent, side),
				} satisfies WorldBuilding;

				if (
					hasBuildingFootprintClearance(candidate, buildings) &&
					!isTooCloseToOtherRoadSurface(candidate, segment, roadSegments)
				) {
					buildings.push(candidate);
				}

				distance += frontageLength + variant.spacing + getDeterministicUnit(variantSeed * 5) * 0.9;
				housesOnSide += 1;
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
		roadsideSetback?: number;
		visualScaleMultiplier?: number;
	} = {},
): WorldBuilding[] => {
	const isInsideTransformClip = (position: WorldPosition): boolean => {
		const clip = transform.clip;

		if (!clip) {
			return true;
		}

		return (
			(clip.minX === undefined || position.x >= clip.minX) &&
			(clip.maxX === undefined || position.x <= clip.maxX) &&
			(clip.minZ === undefined || position.z >= clip.minZ) &&
			(clip.maxZ === undefined || position.z <= clip.maxZ)
		);
	};

	const transformPosition = (position: WorldPosition, scale: number): WorldPosition => ({
		x: transform.offset.x + position.x * scale,
		z: transform.offset.z + position.z * scale,
	});

	return buildings.flatMap((building) => {
		const positionScale = transform.scale * (options.positionScaleMultiplier ?? 1);
		const visualScale = transform.scale * (options.visualScaleMultiplier ?? 1);
		const collider = {
			depth: building.collider.depth * visualScale,
			height: building.collider.height * visualScale,
			width: building.collider.width * visualScale,
		};
		const anchor = building.roadsideAnchor;
		const transformedPosition = anchor
			? (() => {
					const roadAnchorPosition = transformPosition(anchor.position, positionScale);

					if (!isInsideTransformClip(roadAnchorPosition)) {
						return null;
					}

					const roadWidth =
						anchor.roadWidth * transform.scale * (transform.roadWidthScaleMultiplier ?? 1);
					const normal = getRoadsideNormal(anchor.tangent, anchor.side);
					const setback = options.roadsideSetback ?? anchor.setback ?? 0.9;
					const offsetDistance = roadWidth / 2 + collider.width / 2 + setback;

					return {
						x: roadAnchorPosition.x + normal.x * offsetDistance,
						z: roadAnchorPosition.z + normal.z * offsetDistance,
					};
				})()
			: transformPosition(building.position, positionScale);

		if (!transformedPosition || !isInsideTransformClip(transformedPosition)) {
			return [];
		}

		return {
			...building,
			collider,
			heightOffset: (building.heightOffset ?? 0) * visualScale - (options.groundSink ?? 0),
			position: transformedPosition,
			scale: building.scale * visualScale,
		};
	});
};
