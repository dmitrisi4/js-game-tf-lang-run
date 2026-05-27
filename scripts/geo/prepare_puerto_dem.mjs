import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
	createProjectAttribution,
	ensureParentDirectory,
	PATHS,
	ROAD_STYLES,
	readJson,
	resolveRepoPath,
	TENERIFE_ROAD_PROJECTION,
	writeJson,
} from './puerto_city_common.mjs';

const DEFAULT_RUNTIME_RESOLUTION_WORLD_UNITS = 6;
const DEFAULT_SOURCE_RESOLUTION_METERS = 16;
const ROADBED_SPATIAL_CELL_SIZE = 64;
const SOURCE_DEM_DIR = 'data/tenerife/source/dem';
const TEMP_WARPED_TIF = 'data/tenerife/generated/terrain/.tmp-puerto-dem-warped.tif';
const TEMP_XYZ = 'data/tenerife/generated/terrain/.tmp-puerto-dem.xyz';

const getArgumentValue = (name) => {
	const index = process.argv.indexOf(name);

	if (index === -1) {
		return undefined;
	}

	return process.argv[index + 1];
};

const smoothStep = (edge0, edge1, value) => {
	if (edge0 === edge1) {
		return value >= edge1 ? 1 : 0;
	}

	const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));

	return t * t * (3 - 2 * t);
};

const deterministicNoise = (x, z) => {
	const value = Math.sin(x * 0.031 + z * 0.017) * 43758.5453;

	return value - Math.floor(value);
};

const getDistanceToSegment = (point, start, end) => {
	const dx = end.x - start.x;
	const dz = end.z - start.z;
	const lengthSquared = dx * dx + dz * dz;

	if (lengthSquared === 0) {
		return {
			closest: start,
			distance: Math.hypot(point.x - start.x, point.z - start.z),
		};
	}

	const t = Math.max(
		0,
		Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared),
	);

	const closest = {
		x: start.x + dx * t,
		z: start.z + dz * t,
	};

	return {
		closest,
		distance: Math.hypot(point.x - closest.x, point.z - closest.z),
	};
};

const getGridSpacingWorldUnits = (grid) => {
	const bounds = grid.worldBounds;
	const xSpacing = (bounds.maxX - bounds.minX) / Math.max(1, grid.columns - 1);
	const zSpacing = (bounds.maxZ - bounds.minZ) / Math.max(1, grid.rows - 1);

	return Math.max(xSpacing, zSpacing);
};

const getRoadbedTotalRadius = (style, gridSpacing) =>
	Math.max(style.width / 2 + style.shoulderWidth, gridSpacing * 0.82);

const createGridHeightSampler = (grid, sourceHeights = grid.heights) => {
	const bounds = grid.worldBounds;
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxZ - bounds.minZ;

	return (point) => {
		const column = Math.max(
			0,
			Math.min(grid.columns - 1, ((point.x - bounds.minX) / width) * (grid.columns - 1)),
		);
		const row = Math.max(
			0,
			Math.min(grid.rows - 1, ((point.z - bounds.minZ) / depth) * (grid.rows - 1)),
		);
		const c0 = Math.floor(column);
		const r0 = Math.floor(row);
		const c1 = Math.min(grid.columns - 1, c0 + 1);
		const r1 = Math.min(grid.rows - 1, r0 + 1);
		const tx = column - c0;
		const tz = row - r0;
		const sample = (r, c) => sourceHeights[r * grid.columns + c] ?? grid.minHeight;
		const h00 = sample(r0, c0);
		const h10 = sample(r0, c1);
		const h01 = sample(r1, c0);
		const h11 = sample(r1, c1);
		const h0 = h00 * (1 - tx) + h10 * tx;
		const h1 = h01 * (1 - tx) + h11 * tx;

		return h0 * (1 - tz) + h1 * tz;
	};
};

const getCellKey = (x, z) =>
	`${Math.floor(x / ROADBED_SPATIAL_CELL_SIZE)}:${Math.floor(z / ROADBED_SPATIAL_CELL_SIZE)}`;

const addSegmentToIndex = (index, segment, maxRadius) => {
	const minX = Math.min(segment.start.x, segment.end.x) - maxRadius;
	const maxX = Math.max(segment.start.x, segment.end.x) + maxRadius;
	const minZ = Math.min(segment.start.z, segment.end.z) - maxRadius;
	const maxZ = Math.max(segment.start.z, segment.end.z) + maxRadius;
	const minCellX = Math.floor(minX / ROADBED_SPATIAL_CELL_SIZE);
	const maxCellX = Math.floor(maxX / ROADBED_SPATIAL_CELL_SIZE);
	const minCellZ = Math.floor(minZ / ROADBED_SPATIAL_CELL_SIZE);
	const maxCellZ = Math.floor(maxZ / ROADBED_SPATIAL_CELL_SIZE);

	for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
		for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
			const key = `${cellX}:${cellZ}`;
			const bucket = index.get(key) ?? [];
			bucket.push(segment);
			index.set(key, bucket);
		}
	}
};

const createRoadbedSegmentIndex = (roads, gridSpacing) => {
	const index = new Map();
	const countsByLayer = { main: 0, service: 0, walk: 0 };
	let segmentCount = 0;

	for (const road of roads.lines ?? []) {
		const style = ROAD_STYLES[road.layerId];

		if (!style) {
			continue;
		}

		for (let pointIndex = 0; pointIndex < road.points.length - 1; pointIndex += 1) {
			const start = { x: road.points[pointIndex][0], z: road.points[pointIndex][1] };
			const end = { x: road.points[pointIndex + 1][0], z: road.points[pointIndex + 1][1] };
			const segmentLength = Math.hypot(end.x - start.x, end.z - start.z);

			if (segmentLength < 0.01) {
				continue;
			}

			const segment = {
				end,
				layerId: road.layerId,
				start,
				style,
				totalRadius: getRoadbedTotalRadius(style, gridSpacing),
			};

			addSegmentToIndex(index, segment, segment.totalRadius + gridSpacing * 0.55);
			countsByLayer[road.layerId] += 1;
			segmentCount += 1;
		}
	}

	return {
		countsByLayer,
		index,
		segmentCount,
	};
};

const findRoadbedInfluence = (point, candidates, sampleOriginalHeight) => {
	let best = null;

	for (const segment of candidates) {
		const { closest, distance } = getDistanceToSegment(point, segment.start, segment.end);

		if (distance > segment.totalRadius) {
			continue;
		}

		const coreRadius = segment.style.width / 2;
		const influence =
			distance <= coreRadius ? 1 : 1 - smoothStep(coreRadius, segment.totalRadius, distance);

		if (influence <= 0 || (best && influence <= best.influence)) {
			continue;
		}

		const centerHeight = sampleOriginalHeight(closest);
		const crownT = coreRadius > 0 ? Math.max(0, 1 - distance / coreRadius) : 0;
		const targetHeight = centerHeight + segment.style.roadbedCrown * crownT;

		best = {
			influence,
			layerId: segment.layerId,
			targetHeight,
		};
	}

	return best;
};

const applyRoadbedToGrid = (grid, cityLayers) => {
	const roads = cityLayers?.roads;

	if (!roads?.lines?.length) {
		return {
			grid,
			roadbed: {
				enabled: false,
				reason: 'no-road-lines',
				version: 1,
			},
		};
	}

	const originalHeights = [...grid.heights];
	const sampleOriginalHeight = createGridHeightSampler(grid, originalHeights);
	const gridSpacing = getGridSpacingWorldUnits(grid);
	const segmentIndex = createRoadbedSegmentIndex(roads, gridSpacing);
	const nextHeights = [...grid.heights];
	const affectedByLayer = { main: 0, service: 0, walk: 0 };
	let affectedSampleCount = 0;
	let maxDelta = 0;

	for (let row = 0; row < grid.rows; row += 1) {
		const z =
			grid.worldBounds.minZ +
			((grid.worldBounds.maxZ - grid.worldBounds.minZ) * row) / Math.max(1, grid.rows - 1);

		for (let column = 0; column < grid.columns; column += 1) {
			const x =
				grid.worldBounds.minX +
				((grid.worldBounds.maxX - grid.worldBounds.minX) * column) / Math.max(1, grid.columns - 1);
			const point = { x, z };
			const candidates = segmentIndex.index.get(getCellKey(x, z)) ?? [];

			if (candidates.length === 0) {
				continue;
			}

			const influence = findRoadbedInfluence(point, candidates, sampleOriginalHeight);

			if (!influence) {
				continue;
			}

			const sampleIndex = row * grid.columns + column;
			const originalHeight = originalHeights[sampleIndex] ?? grid.minHeight;
			const height =
				originalHeight * (1 - influence.influence) + influence.targetHeight * influence.influence;
			const delta = Math.abs(height - originalHeight);

			if (delta < 0.001) {
				continue;
			}

			nextHeights[sampleIndex] = Number(height.toFixed(3));
			affectedByLayer[influence.layerId] += 1;
			affectedSampleCount += 1;
			maxDelta = Math.max(maxDelta, delta);
		}
	}

	const minHeight = Math.min(...nextHeights);
	const maxHeight = Math.max(...nextHeights);
	const roadbed = {
		affectedByLayer,
		affectedSampleCount,
		enabled: true,
		gridSpacingWorldUnits: Number(gridSpacing.toFixed(3)),
		maxDeltaWorldUnits: Number(maxDelta.toFixed(3)),
		segmentCount: segmentIndex.segmentCount,
		segmentCountsByLayer: segmentIndex.countsByLayer,
		style: Object.fromEntries(
			Object.entries(ROAD_STYLES).map(([layerId, style]) => [
				layerId,
				{
					coreWidth: style.width,
					roadbedCrown: style.roadbedCrown,
					shoulderWidth: style.shoulderWidth,
					totalInfluenceRadius: Number(getRoadbedTotalRadius(style, gridSpacing).toFixed(3)),
				},
			]),
		),
		version: 1,
	};

	return {
		grid: {
			...grid,
			heights: nextHeights,
			maxHeight: Number(maxHeight.toFixed(3)),
			minHeight: Number(minHeight.toFixed(3)),
		},
		roadbed,
	};
};

const getFallbackHeightWorld = (x, z, bounds) => {
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxZ - bounds.minZ;
	const northToSouth = smoothStep(bounds.minZ + depth * 0.08, bounds.maxZ - depth * 0.04, z);
	const eastWest = (x - bounds.minX) / width - 0.5;
	const ridge =
		14 *
		Math.exp(
			-1 *
				(((x - bounds.minX - width * 0.56) / (width * 0.22)) ** 2 +
					((z - bounds.minZ - depth * 0.7) / (depth * 0.18)) ** 2),
		);
	const ravine = 4.5 * Math.sin((x - bounds.minX) * 0.018) * Math.cos((z - bounds.minZ) * 0.014);
	const urbanTerrace =
		1.6 * Math.sin(Math.floor((z - bounds.minZ) / 52) * 0.85) * smoothStep(0.2, 0.9, northToSouth);
	const noise = (deterministicNoise(x, z) - 0.5) * 1.2;
	const elevationMeters = Math.max(
		1.5,
		6 + northToSouth * 216 + eastWest * 18 + ridge + ravine + urbanTerrace + noise,
	);

	return Number((elevationMeters * TENERIFE_ROAD_PROJECTION.metersToWorld).toFixed(3));
};

const findSourceDem = async () => {
	const explicitSource = getArgumentValue('--source');

	if (explicitSource) {
		return explicitSource;
	}

	const sourceDirectory = resolveRepoPath(SOURCE_DEM_DIR);

	if (!existsSync(sourceDirectory)) {
		return undefined;
	}

	const files = await readdir(sourceDirectory);
	const candidate = files.find((file) => /\.(tif|tiff)$/i.test(file));

	return candidate ? path.join(SOURCE_DEM_DIR, candidate) : undefined;
};

const getProjectedCenter = () => {
	const input = `${TENERIFE_ROAD_PROJECTION.centerLon} ${TENERIFE_ROAD_PROJECTION.centerLat}\n`;
	const output = execFileSync('gdaltransform', ['-s_srs', 'EPSG:4326', '-t_srs', 'EPSG:4083'], {
		input,
		encoding: 'utf8',
	});
	const [easting, northing] = output.trim().split(/\s+/).map(Number);

	if (!Number.isFinite(easting) || !Number.isFinite(northing)) {
		throw new Error(`Failed to transform projection center: ${output}`);
	}

	return { easting, northing };
};

const buildGridFromXyz = async (xyzPath) => {
	const center = getProjectedCenter();
	const content = await readFile(xyzPath, 'utf8');
	const samples = [];
	const xValues = new Set();
	const zValues = new Set();
	let minHeight = Number.POSITIVE_INFINITY;
	let maxHeight = Number.NEGATIVE_INFINITY;

	for (const line of content.trim().split('\n')) {
		const [easting, northing, elevationMeters] = line.trim().split(/\s+/).map(Number);

		if (
			!Number.isFinite(easting) ||
			!Number.isFinite(northing) ||
			!Number.isFinite(elevationMeters)
		) {
			continue;
		}

		const x = Number(
			((easting - center.easting) * TENERIFE_ROAD_PROJECTION.metersToWorld).toFixed(3),
		);
		const z = Number(
			(-(northing - center.northing) * TENERIFE_ROAD_PROJECTION.metersToWorld).toFixed(3),
		);
		const heightWorld = Number((elevationMeters * TENERIFE_ROAD_PROJECTION.metersToWorld).toFixed(3));
		samples.push({ heightWorld, x, z });
		xValues.add(x);
		zValues.add(z);
		minHeight = Math.min(minHeight, heightWorld);
		maxHeight = Math.max(maxHeight, heightWorld);
	}

	const columns = [...xValues].sort((a, b) => a - b);
	const rows = [...zValues].sort((a, b) => a - b);
	const heightByCoordinate = new Map(
		samples.map((sample) => [`${sample.x}:${sample.z}`, sample.heightWorld]),
	);
	const heights = [];

	for (const z of rows) {
		for (const x of columns) {
			heights.push(heightByCoordinate.get(`${x}:${z}`) ?? null);
		}
	}

	return {
		columns: columns.length,
		heights,
		maxHeight,
		minHeight,
		rows: rows.length,
		worldBounds: {
			maxX: columns.at(-1),
			maxZ: rows.at(-1),
			minX: columns[0],
			minZ: rows[0],
		},
	};
};

const buildGridFromSourceDem = async (sourceDem, aoi) => {
	const sourcePath = resolveRepoPath(sourceDem);
	const warpedPath = resolveRepoPath(TEMP_WARPED_TIF);
	const xyzPath = resolveRepoPath(TEMP_XYZ);
	const resolutionMeters = Number(
		getArgumentValue('--source-resolution-meters') ?? DEFAULT_SOURCE_RESOLUTION_METERS,
	);

	await ensureParentDirectory(warpedPath);
	execFileSync(
		'gdalwarp',
		[
			'-q',
			'-t_srs',
			'EPSG:4083',
			'-te_srs',
			'EPSG:4326',
			'-te',
			String(aoi.wgs84Bounds.west),
			String(aoi.wgs84Bounds.south),
			String(aoi.wgs84Bounds.east),
			String(aoi.wgs84Bounds.north),
			'-tr',
			String(resolutionMeters),
			String(resolutionMeters),
			'-r',
			'bilinear',
			sourcePath,
			warpedPath,
		],
		{ stdio: 'inherit' },
	);
	execFileSync('gdal_translate', ['-q', '-of', 'XYZ', warpedPath, xyzPath], { stdio: 'inherit' });

	const grid = await buildGridFromXyz(xyzPath);
	await rm(warpedPath, { force: true });
	await rm(xyzPath, { force: true });

	return {
		...grid,
		resolutionMeters,
		sourceKind: 'cnig-dtm-geotiff',
		sourcePath: sourceDem,
	};
};

const buildFallbackGrid = (aoi) => {
	const resolutionWorldUnits = Number(
		getArgumentValue('--runtime-resolution-world-units') ?? DEFAULT_RUNTIME_RESOLUTION_WORLD_UNITS,
	);
	const { worldBounds } = aoi;
	const columns = Math.floor((worldBounds.maxX - worldBounds.minX) / resolutionWorldUnits) + 1;
	const rows = Math.floor((worldBounds.maxZ - worldBounds.minZ) / resolutionWorldUnits) + 1;
	const heights = [];
	let minHeight = Number.POSITIVE_INFINITY;
	let maxHeight = Number.NEGATIVE_INFINITY;

	for (let row = 0; row < rows; row += 1) {
		const z =
			worldBounds.minZ + ((worldBounds.maxZ - worldBounds.minZ) * row) / Math.max(1, rows - 1);

		for (let column = 0; column < columns; column += 1) {
			const x =
				worldBounds.minX + ((worldBounds.maxX - worldBounds.minX) * column) / Math.max(1, columns - 1);
			const height = getFallbackHeightWorld(x, z, worldBounds);
			heights.push(height);
			minHeight = Math.min(minHeight, height);
			maxHeight = Math.max(maxHeight, height);
		}
	}

	return {
		columns,
		heights,
		maxHeight: Number(maxHeight.toFixed(3)),
		minHeight: Number(minHeight.toFixed(3)),
		resolutionWorldUnits,
		rows,
		sourceKind: 'procedural-fallback-awaiting-cnig-dtm',
		worldBounds,
	};
};

const main = async () => {
	const aoi = await readJson(PATHS.cityAoi);
	const sourceDem = await findSourceDem();
	const baseGrid = sourceDem ? await buildGridFromSourceDem(sourceDem, aoi) : buildFallbackGrid(aoi);
	const cityLayers = await readJson(PATHS.cityLayers);
	const { grid, roadbed } = applyRoadbedToGrid(baseGrid, cityLayers);
	const attribution = createProjectAttribution();
	const generatedAt = new Date().toISOString();
	const dem = {
		aoi,
		attribution,
		columns: grid.columns,
		generatedAt,
		heights: grid.heights,
		maxHeight: grid.maxHeight,
		minHeight: grid.minHeight,
		rows: grid.rows,
		roadbed,
		sourceKind: grid.sourceKind,
		sourcePath: grid.sourcePath ?? null,
		version: 1,
		worldBounds: grid.worldBounds,
	};

	await writeJson(PATHS.demRuntime, dem);
	await writeJson(PATHS.demMetadata, {
		aoi,
		attribution,
		columns: grid.columns,
		generatedAt,
		maxHeight: grid.maxHeight,
		minHeight: grid.minHeight,
		roadbed,
		rows: grid.rows,
		sourceKind: grid.sourceKind,
		sourcePath: grid.sourcePath ?? null,
		sourceResolutionMeters: grid.resolutionMeters ?? null,
		version: 1,
		worldBounds: grid.worldBounds,
	});
	await writeJson(PATHS.roadbedMetadata, {
		attribution,
		generatedAt,
		roadbed,
		sourceKind: grid.sourceKind,
		version: 1,
	});

	console.info(
		`Wrote Puerto DEM ${grid.columns}x${grid.rows} from ${grid.sourceKind} with height ${grid.minHeight}..${grid.maxHeight}; roadbed affected ${roadbed.affectedSampleCount ?? 0} samples.`,
	);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
