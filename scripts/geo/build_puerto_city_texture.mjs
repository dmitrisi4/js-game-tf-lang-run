import { writePng } from './png_writer.mjs';
import { PATHS, ROAD_STYLES, readJson, resolveRepoPath, writeJson } from './puerto_city_common.mjs';

const TEXTURE_SIZE = Number(
	process.argv.includes('--size') ? process.argv[process.argv.indexOf('--size') + 1] : 2048,
);
const ALBEDO_PATH = 'public/textures/tenerife/puerto-city-albedo.png';
const NORMAL_PATH = 'public/textures/tenerife/puerto-city-normal.png';
const ORM_PATH = 'public/textures/tenerife/puerto-city-orm.png';
const ROAD_MASK_PATH = 'public/textures/tenerife/puerto-city-road-mask.png';
const CONTACT_SHEET_PATH = 'public/textures/tenerife/puerto-city-contact-sheet.png';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const blendColor = (from, to, t) =>
	from.map((channel, index) => Math.round(channel * (1 - t) + to[index] * t));

const deterministicNoise = (x, y, seed = 0) => {
	const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;

	return value - Math.floor(value);
};

const getPixelIndex = (width, x, y) => (y * width + x) * 4;

const setPixel = (buffer, width, x, y, color) => {
	if (x < 0 || y < 0 || x >= width || y >= width) {
		return;
	}

	const index = getPixelIndex(width, x, y);
	buffer[index] = color[0];
	buffer[index + 1] = color[1];
	buffer[index + 2] = color[2];
	buffer[index + 3] = color[3] ?? 255;
};

const blendPixel = (buffer, width, x, y, color, alpha = 1) => {
	if (x < 0 || y < 0 || x >= width || y >= width) {
		return;
	}

	const index = getPixelIndex(width, x, y);
	const sourceAlpha = clamp(alpha * ((color[3] ?? 255) / 255), 0, 1);
	buffer[index] = Math.round(buffer[index] * (1 - sourceAlpha) + color[0] * sourceAlpha);
	buffer[index + 1] = Math.round(buffer[index + 1] * (1 - sourceAlpha) + color[1] * sourceAlpha);
	buffer[index + 2] = Math.round(buffer[index + 2] * (1 - sourceAlpha) + color[2] * sourceAlpha);
	buffer[index + 3] = 255;
};

const createWorldToPixel = (bounds, size) => {
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxZ - bounds.minZ;

	return (point) => ({
		x: ((point.x - bounds.minX) / width) * (size - 1),
		y: (1 - (point.z - bounds.minZ) / depth) * (size - 1),
	});
};

const createPixelToWorld = (bounds, size) => {
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxZ - bounds.minZ;

	return (x, y) => ({
		x: bounds.minX + (x / (size - 1)) * width,
		z: bounds.minZ + (1 - y / (size - 1)) * depth,
	});
};

const getHeightSampler = (dem) => {
	const bounds = dem.worldBounds;
	const width = bounds.maxX - bounds.minX;
	const depth = bounds.maxZ - bounds.minZ;

	return (world) => {
		const column = clamp(
			Math.round(((world.x - bounds.minX) / width) * (dem.columns - 1)),
			0,
			dem.columns - 1,
		);
		const row = clamp(
			Math.round(((world.z - bounds.minZ) / depth) * (dem.rows - 1)),
			0,
			dem.rows - 1,
		);

		return dem.heights[row * dem.columns + column] ?? dem.minHeight;
	};
};

const pointInPolygon = (point, polygon) => {
	let inside = false;
	let previous = polygon.at(-1);

	for (const current of polygon) {
		const crossesY = current.y > point.y !== previous.y > point.y;

		if (crossesY) {
			const intersectionX =
				((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;

			if (point.x < intersectionX) {
				inside = !inside;
			}
		}

		previous = current;
	}

	return inside;
};

const fillPolygon = (buffer, size, polygon, color, alpha = 1) => {
	const minX = Math.max(0, Math.floor(Math.min(...polygon.map((point) => point.x))));
	const maxX = Math.min(size - 1, Math.ceil(Math.max(...polygon.map((point) => point.x))));
	const minY = Math.max(0, Math.floor(Math.min(...polygon.map((point) => point.y))));
	const maxY = Math.min(size - 1, Math.ceil(Math.max(...polygon.map((point) => point.y))));

	for (let y = minY; y <= maxY; y += 1) {
		for (let x = minX; x <= maxX; x += 1) {
			if (pointInPolygon({ x: x + 0.5, y: y + 0.5 }, polygon)) {
				blendPixel(buffer, size, x, y, color, alpha);
			}
		}
	}
};

const distanceToSegment = (point, start, end) => {
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const lengthSquared = dx * dx + dy * dy;

	if (lengthSquared === 0) {
		return Math.hypot(point.x - start.x, point.y - start.y);
	}

	const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
	const x = start.x + dx * t;
	const y = start.y + dy * t;

	return Math.hypot(point.x - x, point.y - y);
};

const drawThickLine = (buffer, size, start, end, radius, color, alpha = 1) => {
	const minX = Math.max(0, Math.floor(Math.min(start.x, end.x) - radius - 2));
	const maxX = Math.min(size - 1, Math.ceil(Math.max(start.x, end.x) + radius + 2));
	const minY = Math.max(0, Math.floor(Math.min(start.y, end.y) - radius - 2));
	const maxY = Math.min(size - 1, Math.ceil(Math.max(start.y, end.y) + radius + 2));

	for (let y = minY; y <= maxY; y += 1) {
		for (let x = minX; x <= maxX; x += 1) {
			const distance = distanceToSegment({ x: x + 0.5, y: y + 0.5 }, start, end);
			const coverage = clamp(radius + 0.5 - distance, 0, 1);

			if (coverage > 0) {
				blendPixel(buffer, size, x, y, color, alpha * coverage);
			}
		}
	}
};

const drawRoadMaskLine = (buffer, size, start, end, radius, channel, valueMultiplier = 255) => {
	const minX = Math.max(0, Math.floor(Math.min(start.x, end.x) - radius - 2));
	const maxX = Math.min(size - 1, Math.ceil(Math.max(start.x, end.x) + radius + 2));
	const minY = Math.max(0, Math.floor(Math.min(start.y, end.y) - radius - 2));
	const maxY = Math.min(size - 1, Math.ceil(Math.max(start.y, end.y) + radius + 2));

	for (let y = minY; y <= maxY; y += 1) {
		for (let x = minX; x <= maxX; x += 1) {
			const distance = distanceToSegment({ x: x + 0.5, y: y + 0.5 }, start, end);
			const coverage = clamp(radius + 0.5 - distance, 0, 1);

			if (coverage > 0) {
				const index = getPixelIndex(size, x, y);
				buffer[index + channel] = Math.max(
					buffer[index + channel],
					Math.round(coverage * valueMultiplier),
				);
			}
		}
	}
};

const initializeAlbedo = (albedo, dem, size) => {
	const pixelToWorld = createPixelToWorld(dem.worldBounds, size);
	const getHeight = getHeightSampler(dem);

	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const world = pixelToWorld(x, y);
			const height = getHeight(world);
			const normalizedHeight = clamp((height - dem.minHeight) / (dem.maxHeight - dem.minHeight), 0, 1);
			const lowland = [86, 113, 76, 255];
			const drySlope = [123, 112, 88, 255];
			const highSlope = [101, 94, 82, 255];
			const coast = [112, 126, 101, 255];
			const base =
				normalizedHeight < 0.42
					? blendColor(coast, lowland, normalizedHeight / 0.42)
					: blendColor(drySlope, highSlope, (normalizedHeight - 0.42) / 0.58);
			const noise = (Math.sin(world.x * 0.15 + world.z * 0.08) + Math.cos(world.x * 0.07)) * 4;

			setPixel(albedo, size, x, y, [
				clamp(base[0] + noise, 0, 255),
				clamp(base[1] + noise, 0, 255),
				clamp(base[2] + noise, 0, 255),
				255,
			]);
		}
	}
};

const drawLanduse = (albedo, size, layers, worldToPixel) => {
	for (const polygon of layers.landusePolygons) {
		const pixelPolygon = polygon.points.map(worldToPixel);
		const color = polygon.kind === 'leisure' ? [70, 120, 74, 255] : [97, 107, 76, 255];
		fillPolygon(albedo, size, pixelPolygon, color, 0.28);
	}
};

const drawBuildings = (albedo, size, layers, worldToPixel) => {
	for (const footprint of layers.buildingFootprints) {
		const pixelPolygon = footprint.points.map(worldToPixel);
		fillPolygon(albedo, size, pixelPolygon, [78, 72, 62, 255], 0.28);
	}
};

const drawRoads = (albedo, roadMask, size, layers, worldToPixel) => {
	const worldWidth = layers.aoi.worldBounds.maxX - layers.aoi.worldBounds.minX;

	for (const road of layers.roads.lines) {
		const style = ROAD_STYLES[road.layerId];

		if (!style) {
			continue;
		}

		const radius = Math.max(style.minPixels, (style.width / worldWidth) * size) / 2;
		const shoulderRadius = radius + 1.35;

		for (let index = 0; index < road.points.length - 1; index += 1) {
			const start = worldToPixel({ x: road.points[index][0], z: road.points[index][1] });
			const end = worldToPixel({ x: road.points[index + 1][0], z: road.points[index + 1][1] });

			drawThickLine(albedo, size, start, end, shoulderRadius, [142, 129, 104, 255], 0.62);
			drawThickLine(albedo, size, start, end, radius, style.color, 0.9);
			drawRoadMaskLine(roadMask, size, start, end, shoulderRadius, 3, 224);
			drawRoadMaskLine(roadMask, size, start, end, radius, style.maskChannel);
		}
	}
};

const getRoadCoverage = (roadMask, size, x, y) => {
	const index = getPixelIndex(size, x, y);
	const main = roadMask[index] / 255;
	const service = roadMask[index + 1] / 255;
	const walk = roadMask[index + 2] / 255;
	const shoulder = roadMask[index + 3] / 255;

	return {
		core: Math.max(main, service, walk),
		main,
		service,
		shoulder,
		walk,
	};
};

const createOrmTexture = (roadMask, size) => {
	const orm = new Uint8Array(size * size * 4);

	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const index = getPixelIndex(size, x, y);
			const coverage = getRoadCoverage(roadMask, size, x, y);
			const roadCore = coverage.core;
			const disturbedGround = Math.max(coverage.shoulder - roadCore * 0.65, 0);
			const grain = deterministicNoise(x * 0.41, y * 0.37, 3);
			const patch = deterministicNoise(Math.floor(x / 19), Math.floor(y / 19), 4);
			const roadRoughness = coverage.main * 184 + coverage.service * 208 + coverage.walk * 224;
			const terrainRoughness = 232 + grain * 10;
			const blendedRoughness =
				terrainRoughness * (1 - roadCore) +
				roadRoughness * roadCore +
				disturbedGround * 10 -
				patch * roadCore * 8;
			const ambientOcclusion = 238 - roadCore * 18 - disturbedGround * 12 - patch * roadCore * 9;

			orm[index] = clamp(Math.round(ambientOcclusion), 0, 255);
			orm[index + 1] = clamp(Math.round(blendedRoughness), 0, 255);
			orm[index + 2] = 0;
			orm[index + 3] = 255;
		}
	}

	return orm;
};

const createDetailHeightField = (roadMask, size, bounds) => {
	const height = new Float32Array(size * size);
	const pixelToWorld = createPixelToWorld(bounds, size);

	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const world = pixelToWorld(x, y);
			const coverage = getRoadCoverage(roadMask, size, x, y);
			const roadCore = coverage.core;
			const disturbedGround = Math.max(coverage.shoulder - roadCore * 0.65, 0);
			const coarseNoise =
				Math.sin(world.x * 0.42 + world.z * 0.31) * 0.012 +
				Math.cos(world.x * 0.19 - world.z * 0.27) * 0.01;
			const asphaltGrain =
				(deterministicNoise(x * 1.7, y * 1.7, 7) - 0.5) * 0.034 +
				(deterministicNoise(x * 0.43, y * 0.43, 8) - 0.5) * 0.022;
			const shoulderRoughness = (deterministicNoise(x * 0.61, y * 0.61, 9) - 0.5) * 0.045;

			height[y * size + x] =
				coarseNoise * (1 - roadCore) + asphaltGrain * roadCore + shoulderRoughness * disturbedGround;
		}
	}

	return height;
};

const createNormalTexture = (roadMask, size, bounds) => {
	const detailHeight = createDetailHeightField(roadMask, size, bounds);
	const normal = new Uint8Array(size * size * 4);
	const sample = (x, y) => detailHeight[clamp(y, 0, size - 1) * size + clamp(x, 0, size - 1)];
	const strength = 7.5;

	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
			const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
			const length = Math.hypot(dx, dy, 1);
			const nx = -dx / length;
			const ny = -dy / length;
			const nz = 1 / length;
			const index = getPixelIndex(size, x, y);

			normal[index] = clamp(Math.round((nx * 0.5 + 0.5) * 255), 0, 255);
			normal[index + 1] = clamp(Math.round((ny * 0.5 + 0.5) * 255), 0, 255);
			normal[index + 2] = clamp(Math.round((nz * 0.5 + 0.5) * 255), 0, 255);
			normal[index + 3] = 255;
		}
	}

	return normal;
};

const getRoadPixelWidths = (layers, size) => {
	const worldWidth = layers.aoi.worldBounds.maxX - layers.aoi.worldBounds.minX;

	return Object.fromEntries(
		Object.entries(ROAD_STYLES).map(([layerId, style]) => [
			layerId,
			{
				clampedPixelWidth: Number(
					Math.max(style.minPixels, (style.width / worldWidth) * size).toFixed(2),
				),
				rawPixelWidth: Number(((style.width / worldWidth) * size).toFixed(2)),
				worldWidth: style.width,
			},
		]),
	);
};

const createContactSheet = (albedo, roadMask, orm, normal, size) => {
	const sheetSize = 1024;
	const half = sheetSize / 2;
	const sheet = new Uint8Array(sheetSize * sheetSize * 4);

	for (let y = 0; y < sheetSize; y += 1) {
		for (let x = 0; x < sheetSize; x += 1) {
			const sourceX = Math.floor(((x % half) / half) * size);
			const sourceY = Math.floor(((y % half) / half) * size);
			const source =
				x < half && y < half ? albedo : x >= half && y < half ? roadMask : x < half ? orm : normal;
			const sourceIndex = getPixelIndex(size, sourceX, sourceY);
			const targetIndex = getPixelIndex(sheetSize, x, y);
			sheet[targetIndex] = source[sourceIndex];
			sheet[targetIndex + 1] = source[sourceIndex + 1];
			sheet[targetIndex + 2] = source[sourceIndex + 2];
			sheet[targetIndex + 3] = 255;
		}
	}

	return sheet;
};

const main = async () => {
	const layers = await readJson(PATHS.cityLayers);
	const dem = await readJson(PATHS.demRuntime);
	const albedo = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4);
	const roadMask = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4);
	const worldToPixel = createWorldToPixel(dem.worldBounds, TEXTURE_SIZE);

	initializeAlbedo(albedo, dem, TEXTURE_SIZE);
	drawLanduse(albedo, TEXTURE_SIZE, layers, worldToPixel);
	drawBuildings(albedo, TEXTURE_SIZE, layers, worldToPixel);
	drawRoads(albedo, roadMask, TEXTURE_SIZE, layers, worldToPixel);

	const orm = createOrmTexture(roadMask, TEXTURE_SIZE);
	const normal = createNormalTexture(roadMask, TEXTURE_SIZE, dem.worldBounds);
	const contactSheet = createContactSheet(albedo, roadMask, orm, normal, TEXTURE_SIZE);

	await writePng(resolveRepoPath(ALBEDO_PATH), TEXTURE_SIZE, TEXTURE_SIZE, albedo);
	await writePng(resolveRepoPath(ORM_PATH), TEXTURE_SIZE, TEXTURE_SIZE, orm);
	await writePng(resolveRepoPath(NORMAL_PATH), TEXTURE_SIZE, TEXTURE_SIZE, normal);
	await writePng(resolveRepoPath(ROAD_MASK_PATH), TEXTURE_SIZE, TEXTURE_SIZE, roadMask);
	await writePng(resolveRepoPath(CONTACT_SHEET_PATH), 1024, 1024, contactSheet);
	await writeJson(PATHS.textureMetadata, {
		aoi: layers.aoi,
		albedoPath: ALBEDO_PATH,
		contactSheetPath: CONTACT_SHEET_PATH,
		generatedAt: new Date().toISOString(),
		materialMaps: {
			albedo: {
				classification: 'color-srgb',
				path: ALBEDO_PATH,
			},
			normal: {
				classification: 'data-linear',
				path: NORMAL_PATH,
				usage: 'subtle terrain and road detail normal map',
			},
			orm: {
				channels: {
					blue: 'metallic; black for terrain and asphalt',
					green: 'roughness',
					red: 'ambient occlusion',
				},
				classification: 'data-linear',
				path: ORM_PATH,
			},
			roadMask: {
				classification: 'data-linear',
				path: ROAD_MASK_PATH,
			},
		},
		normalPath: NORMAL_PATH,
		ormPath: ORM_PATH,
		roadMaskPath: ROAD_MASK_PATH,
		roadMaskChannels: {
			alpha: 'shoulder and disturbed ground falloff',
			blue: 'walk paths',
			green: 'service roads',
			red: 'main roads',
		},
		roadPixelWidths: getRoadPixelWidths(layers, TEXTURE_SIZE),
		sourceKind: dem.sourceKind,
		textureSize: TEXTURE_SIZE,
		version: 1,
	});

	console.info(`Wrote Puerto city textures at ${TEXTURE_SIZE}x${TEXTURE_SIZE}.`);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
