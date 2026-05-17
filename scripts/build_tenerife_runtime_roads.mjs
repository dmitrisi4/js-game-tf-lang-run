import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'data/tenerife2/export.geojson');
const outputPath = path.join(repoRoot, 'public/data/tenerife/roads-runtime.json');

const METERS_PER_LATITUDE_DEGREE = 111_320;
const TENERIFE_ROAD_PROJECTION = {
	centerLat: 28.40330075,
	centerLon: -16.5453185,
	metersToWorld: 0.26,
	offset: { x: 0, z: 0 },
};
const SIMPLIFICATION_TOLERANCE_WORLD_UNITS = 0.35;

const ROAD_LAYER_BY_HIGHWAY = {
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

const projectLonLatToWorld = (lon, lat) => {
	const metersPerLongitudeDegree =
		METERS_PER_LATITUDE_DEGREE * Math.cos((TENERIFE_ROAD_PROJECTION.centerLat * Math.PI) / 180);
	const x =
		(lon - TENERIFE_ROAD_PROJECTION.centerLon) *
			metersPerLongitudeDegree *
			TENERIFE_ROAD_PROJECTION.metersToWorld +
		TENERIFE_ROAD_PROJECTION.offset.x;
	const z =
		-(lat - TENERIFE_ROAD_PROJECTION.centerLat) *
			METERS_PER_LATITUDE_DEGREE *
			TENERIFE_ROAD_PROJECTION.metersToWorld +
		TENERIFE_ROAD_PROJECTION.offset.z;

	return [Number(x.toFixed(2)), Number(z.toFixed(2))];
};

const getSquaredDistanceToSegment = (point, start, end) => {
	const dx = end[0] - start[0];
	const dz = end[1] - start[1];
	const lengthSquared = dx * dx + dz * dz;

	if (lengthSquared === 0) {
		const pointDx = point[0] - start[0];
		const pointDz = point[1] - start[1];

		return pointDx * pointDx + pointDz * pointDz;
	}

	const t = Math.max(
		0,
		Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) / lengthSquared),
	);
	const projectedX = start[0] + t * dx;
	const projectedZ = start[1] + t * dz;
	const pointDx = point[0] - projectedX;
	const pointDz = point[1] - projectedZ;

	return pointDx * pointDx + pointDz * pointDz;
};

const simplifyPoints = (points, tolerance = SIMPLIFICATION_TOLERANCE_WORLD_UNITS) => {
	if (points.length <= 2) {
		return points;
	}

	const toleranceSquared = tolerance * tolerance;
	let farthestPointIndex = -1;
	let farthestPointDistanceSquared = 0;
	const firstPoint = points[0];
	const lastPoint = points.at(-1);

	for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
		const distanceSquared = getSquaredDistanceToSegment(points[pointIndex], firstPoint, lastPoint);

		if (distanceSquared > farthestPointDistanceSquared) {
			farthestPointDistanceSquared = distanceSquared;
			farthestPointIndex = pointIndex;
		}
	}

	if (farthestPointDistanceSquared <= toleranceSquared || farthestPointIndex === -1) {
		return [firstPoint, lastPoint];
	}

	const left = simplifyPoints(points.slice(0, farthestPointIndex + 1), tolerance);
	const right = simplifyPoints(points.slice(farthestPointIndex), tolerance);

	return [...left.slice(0, -1), ...right];
};

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const countsByLayer = { main: 0, service: 0, walk: 0 };
let sourcePointCount = 0;
let sourceSegmentCount = 0;
let pointCount = 0;
let segmentCount = 0;

const lines = source.features.flatMap((feature, featureIndex) => {
	if (feature.geometry?.type !== 'LineString' || feature.geometry.coordinates.length < 2) {
		return [];
	}

	const layerId = ROAD_LAYER_BY_HIGHWAY[feature.properties?.highway];

	if (!layerId) {
		return [];
	}

	const projectedPoints = feature.geometry.coordinates.map(([lon, lat]) =>
		projectLonLatToWorld(lon, lat),
	);
	const points = simplifyPoints(projectedPoints);
	countsByLayer[layerId] += 1;
	sourcePointCount += projectedPoints.length;
	sourceSegmentCount += Math.max(0, projectedPoints.length - 1);
	pointCount += points.length;
	segmentCount += Math.max(0, points.length - 1);

	return [
		{
			id: feature.properties?.['@id'] ?? `road-${featureIndex}`,
			layerId,
			name: feature.properties?.name ?? '',
			points,
		},
	];
});

const runtimeData = {
	version: 1,
	source: 'data/tenerife2/export.geojson',
	projection: TENERIFE_ROAD_PROJECTION,
	metrics: {
		lineCount: lines.length,
		pointCount,
		segmentCount,
		simplificationToleranceWorldUnits: SIMPLIFICATION_TOLERANCE_WORLD_UNITS,
		sourcePointCount,
		sourceSegmentCount,
		countsByLayer,
	},
	lines,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(runtimeData)}\n`);

console.info(
	`Wrote ${path.relative(repoRoot, outputPath)} with ${lines.length} lines, ${pointCount}/${sourcePointCount} points, ${segmentCount}/${sourceSegmentCount} segments.`,
);
