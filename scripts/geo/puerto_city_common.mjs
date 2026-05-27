import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '../..');

export const METERS_PER_LATITUDE_DEGREE = 111_320;
export const AOI_BUFFER_WORLD_UNITS = 260;

export const TENERIFE_ROAD_PROJECTION = {
	centerLat: 28.40330075,
	centerLon: -16.5453185,
	metersToWorld: 0.26,
	offset: { x: 0, z: 0 },
};

export const PATHS = {
	buildingFootprints: 'data/tenerife/generated/buildings/puerto-building-footprints.json',
	buildingFootprintsRuntime: 'public/data/tenerife/puerto-building-footprints-runtime.json',
	cityAoi: 'data/tenerife/generated/terrain/puerto-city-aoi.json',
	cityLayers: 'data/tenerife/generated/puerto-city-layers.json',
	demRuntime: 'data/tenerife/generated/terrain/puerto-dem-runtime.json',
	demMetadata: 'data/tenerife/generated/terrain/puerto-dem-metadata.json',
	osmSource: 'data/tenerife/puerto_de_la_cruz_osm.json',
	roadRuntime: 'public/data/tenerife/roads-runtime.json',
	roadsGenerated: 'data/tenerife/generated/roads/puerto-roads-runtime.json',
	runtimeMetadata: 'public/data/tenerife/puerto-city-metadata.json',
	textureMetadata: 'data/tenerife/generated/textures/puerto-city-texture-metadata.json',
};

export const ROAD_LAYER_BY_HIGHWAY = {
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

export const ROAD_STYLES = {
	main: {
		color: [71, 66, 60, 255],
		maskChannel: 0,
		minPixels: 4,
		width: 3.4,
	},
	service: {
		color: [111, 98, 83, 255],
		maskChannel: 1,
		minPixels: 3,
		width: 1.9,
	},
	walk: {
		color: [170, 154, 120, 255],
		maskChannel: 2,
		minPixels: 2,
		width: 1.25,
	},
};

export const resolveRepoPath = (relativePath) => path.join(repoRoot, relativePath);

export const ensureDirectory = async (directoryPath) => {
	await mkdir(directoryPath, { recursive: true });
};

export const ensureParentDirectory = async (filePath) => {
	await ensureDirectory(path.dirname(filePath));
};

export const readJson = async (relativePath) =>
	JSON.parse(await readFile(resolveRepoPath(relativePath), 'utf8'));

export const writeJson = async (relativePath, value) => {
	const absolutePath = resolveRepoPath(relativePath);
	await ensureParentDirectory(absolutePath);
	await writeFile(absolutePath, `${JSON.stringify(value, null, '\t')}\n`);
};

export const projectLonLatToWorld = (lon, lat, projection = TENERIFE_ROAD_PROJECTION) => {
	const metersPerLongitudeDegree =
		METERS_PER_LATITUDE_DEGREE * Math.cos((projection.centerLat * Math.PI) / 180);
	const x =
		(lon - projection.centerLon) * metersPerLongitudeDegree * projection.metersToWorld +
		projection.offset.x;
	const z =
		-(lat - projection.centerLat) * METERS_PER_LATITUDE_DEGREE * projection.metersToWorld +
		projection.offset.z;

	return {
		x: Number(x.toFixed(3)),
		z: Number(z.toFixed(3)),
	};
};

export const projectWorldToLonLat = ({ x, z }, projection = TENERIFE_ROAD_PROJECTION) => {
	const metersPerLongitudeDegree =
		METERS_PER_LATITUDE_DEGREE * Math.cos((projection.centerLat * Math.PI) / 180);
	const lon =
		(x - projection.offset.x) / (metersPerLongitudeDegree * projection.metersToWorld) +
		projection.centerLon;
	const lat =
		-(z - projection.offset.z) / (METERS_PER_LATITUDE_DEGREE * projection.metersToWorld) +
		projection.centerLat;

	return {
		lat,
		lon,
	};
};

export const createBounds = () => ({
	maxX: Number.NEGATIVE_INFINITY,
	maxZ: Number.NEGATIVE_INFINITY,
	minX: Number.POSITIVE_INFINITY,
	minZ: Number.POSITIVE_INFINITY,
});

export const expandBounds = (bounds, point) => {
	bounds.minX = Math.min(bounds.minX, point.x);
	bounds.maxX = Math.max(bounds.maxX, point.x);
	bounds.minZ = Math.min(bounds.minZ, point.z);
	bounds.maxZ = Math.max(bounds.maxZ, point.z);
};

export const padBounds = (bounds, padding) => ({
	maxX: Number((bounds.maxX + padding).toFixed(3)),
	maxZ: Number((bounds.maxZ + padding).toFixed(3)),
	minX: Number((bounds.minX - padding).toFixed(3)),
	minZ: Number((bounds.minZ - padding).toFixed(3)),
});

export const isPointInsideBounds = (point, bounds) =>
	point.x >= bounds.minX &&
	point.x <= bounds.maxX &&
	point.z >= bounds.minZ &&
	point.z <= bounds.maxZ;

export const getWgs84BoundsFromWorldBounds = (bounds) => {
	const southwest = projectWorldToLonLat({ x: bounds.minX, z: bounds.maxZ });
	const northeast = projectWorldToLonLat({ x: bounds.maxX, z: bounds.minZ });

	return {
		east: Number(northeast.lon.toFixed(9)),
		north: Number(northeast.lat.toFixed(9)),
		south: Number(southwest.lat.toFixed(9)),
		west: Number(southwest.lon.toFixed(9)),
	};
};

export const createAoiFromRoadRuntimeData = (
	runtimeRoadData,
	bufferWorldUnits = AOI_BUFFER_WORLD_UNITS,
) => {
	const roadBounds = createBounds();

	for (const line of runtimeRoadData.lines) {
		for (const [x, z] of line.points) {
			expandBounds(roadBounds, { x, z });
		}
	}

	const worldBounds = padBounds(roadBounds, bufferWorldUnits);

	return {
		bufferWorldUnits,
		projection: runtimeRoadData.projection ?? TENERIFE_ROAD_PROJECTION,
		roadBounds,
		version: 1,
		wgs84Bounds: getWgs84BoundsFromWorldBounds(worldBounds),
		worldBounds,
	};
};

export const getRoadLayerId = (highway) => {
	if (!highway) {
		return undefined;
	}

	return ROAD_LAYER_BY_HIGHWAY[highway];
};

export const buildOsmNodeIndex = (osmData) => {
	const nodes = new Map();

	for (const element of osmData.elements ?? []) {
		if (
			element.type === 'node' &&
			typeof element.lon === 'number' &&
			typeof element.lat === 'number'
		) {
			nodes.set(element.id, [element.lon, element.lat]);
		}
	}

	return nodes;
};

export const getWayCoordinates = (way, nodeIndex) => {
	if (!Array.isArray(way.nodes)) {
		return [];
	}

	const coordinates = [];

	for (const nodeId of way.nodes) {
		const coordinate = nodeIndex.get(nodeId);

		if (coordinate) {
			coordinates.push(coordinate);
		}
	}

	return coordinates;
};

export const isClosedCoordinateRing = (coordinates) => {
	if (coordinates.length < 4) {
		return false;
	}

	const first = coordinates[0];
	const last = coordinates.at(-1);

	return first[0] === last[0] && first[1] === last[1];
};

export const getPolygonArea = (points) => {
	let area = 0;

	for (let index = 0; index < points.length; index += 1) {
		const current = points[index];
		const next = points[(index + 1) % points.length];
		area += current.x * next.z - next.x * current.z;
	}

	return Math.abs(area / 2);
};

export const getPolygonCentroid = (points) => {
	let areaTerm = 0;
	let x = 0;
	let z = 0;

	for (let index = 0; index < points.length; index += 1) {
		const current = points[index];
		const next = points[(index + 1) % points.length];
		const cross = current.x * next.z - next.x * current.z;
		areaTerm += cross;
		x += (current.x + next.x) * cross;
		z += (current.z + next.z) * cross;
	}

	if (Math.abs(areaTerm) < 0.0001) {
		return {
			x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
			z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
		};
	}

	return {
		x: x / (3 * areaTerm),
		z: z / (3 * areaTerm),
	};
};

export const getPolygonBounds = (points) => {
	const bounds = createBounds();

	for (const point of points) {
		expandBounds(bounds, point);
	}

	return bounds;
};

export const getLongestEdgeYaw = (points) => {
	let longestLength = 0;
	let yaw = 0;

	for (let index = 0; index < points.length; index += 1) {
		const from = points[index];
		const to = points[(index + 1) % points.length];
		const dx = to.x - from.x;
		const dz = to.z - from.z;
		const length = Math.hypot(dx, dz);

		if (length > longestLength) {
			longestLength = length;
			yaw = Math.atan2(dx, dz);
		}
	}

	return yaw;
};

export const parseNumericTag = (value) => {
	if (typeof value !== 'string') {
		return undefined;
	}

	const parsed = Number.parseFloat(value.replace(',', '.'));

	return Number.isFinite(parsed) ? parsed : undefined;
};

export const createProjectAttribution = () => ({
	cnig: {
		license: 'Compatible with CC-BY 4.0 per IGN/CNIG data policy',
		source: 'IGN/CNIG PNOA LiDAR-derived MDT/DTM',
		url: 'https://www.ign.es/web/politica-datos',
	},
	osm: {
		license: 'Open Data Commons Open Database License (ODbL)',
		source: 'OpenStreetMap contributors via local Overpass/GeoJSON exports',
		url: 'https://www.openstreetmap.org/copyright',
	},
});
