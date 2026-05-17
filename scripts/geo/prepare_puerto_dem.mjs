import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
	createProjectAttribution,
	ensureParentDirectory,
	PATHS,
	readJson,
	resolveRepoPath,
	TENERIFE_ROAD_PROJECTION,
	writeJson,
} from './puerto_city_common.mjs';

const DEFAULT_RUNTIME_RESOLUTION_WORLD_UNITS = 6;
const DEFAULT_SOURCE_RESOLUTION_METERS = 16;
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
	const grid = sourceDem ? await buildGridFromSourceDem(sourceDem, aoi) : buildFallbackGrid(aoi);
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
		rows: grid.rows,
		sourceKind: grid.sourceKind,
		sourcePath: grid.sourcePath ?? null,
		sourceResolutionMeters: grid.resolutionMeters ?? null,
		version: 1,
		worldBounds: grid.worldBounds,
	});

	console.info(
		`Wrote Puerto DEM ${grid.columns}x${grid.rows} from ${grid.sourceKind} with height ${grid.minHeight}..${grid.maxHeight}.`,
	);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
