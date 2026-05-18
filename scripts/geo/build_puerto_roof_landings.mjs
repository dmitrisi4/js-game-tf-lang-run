import { mkdir, readFile, writeFile } from 'node:fs/promises';

const DEM_PATH = 'data/tenerife/generated/terrain/puerto-dem-runtime.json';
const BUILDINGS_PATH = 'data/tenerife/generated/buildings/puerto-building-footprints.json';
const OUTPUT_PATH = 'public/data/tenerife/puerto-roof-landings-runtime.json';

const BUILDING_FOOTPRINT_SCALE = 1.35;
const BUILDING_HEIGHT_SCALE = 1.18;
const BUILDING_LOCAL_SPACING_SCALE = 1.06;
const BUILDING_SPACING_BLOCK_WORLD_UNITS = 72;
const PLAYER_CAPSULE_HALF_HEIGHT = 0.9;
const MIN_ROOF_AREA = 8;

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const sampleHeight = (dem, x, z) => {
	const { columns, rows, worldBounds, heights } = dem;
	const u = (x - worldBounds.minX) / Math.max(0.0001, worldBounds.maxX - worldBounds.minX);
	const v = (z - worldBounds.minZ) / Math.max(0.0001, worldBounds.maxZ - worldBounds.minZ);
	const column = Math.max(0, Math.min(columns - 1, u * (columns - 1)));
	const row = Math.max(0, Math.min(rows - 1, v * (rows - 1)));
	const c0 = Math.trunc(column);
	const r0 = Math.trunc(row);
	const c1 = Math.min(columns - 1, c0 + 1);
	const r1 = Math.min(rows - 1, r0 + 1);
	const tx = column - c0;
	const tz = row - r0;
	const gridHeight = (gridRow, gridColumn) => heights[gridRow * columns + gridColumn] || 0;
	const h00 = gridHeight(r0, c0);
	const h10 = gridHeight(r0, c1);
	const h01 = gridHeight(r1, c0);
	const h11 = gridHeight(r1, c1);
	const h0 = h00 * (1 - tx) + h10 * tx;
	const h1 = h01 * (1 - tx) + h11 * tx;

	return h0 * (1 - tz) + h1 * tz;
};

const getVisualBuildingCenter = ({ x, z }) => {
	const blockCenterX =
		Math.round(x / BUILDING_SPACING_BLOCK_WORLD_UNITS) * BUILDING_SPACING_BLOCK_WORLD_UNITS;
	const blockCenterZ =
		Math.round(z / BUILDING_SPACING_BLOCK_WORLD_UNITS) * BUILDING_SPACING_BLOCK_WORLD_UNITS;

	return {
		x: blockCenterX + (x - blockCenterX) * BUILDING_LOCAL_SPACING_SCALE,
		z: blockCenterZ + (z - blockCenterZ) * BUILDING_LOCAL_SPACING_SCALE,
	};
};

const getVisualBuildingPoints = (points, centroid, visualCenter) =>
	points.map((point) => ({
		x: visualCenter.x + (point.x - centroid.x) * BUILDING_FOOTPRINT_SCALE,
		z: visualCenter.z + (point.z - centroid.z) * BUILDING_FOOTPRINT_SCALE,
	}));

const getBuildingHeight = (footprint) => {
	const isHotel = footprint.tags?.tourism === 'hotel';
	const heightMeters = footprint.heightMeters || 7.5;

	return Math.max(3.6, Math.min(26, heightMeters * (isHotel ? 0.5 : 0.42) * BUILDING_HEIGHT_SCALE));
};

const getBounds = (points) =>
	points.reduce(
		(bounds, point) => ({
			maxX: Math.max(bounds.maxX, point.x),
			maxZ: Math.max(bounds.maxZ, point.z),
			minX: Math.min(bounds.minX, point.x),
			minZ: Math.min(bounds.minZ, point.z),
		}),
		{
			maxX: Number.NEGATIVE_INFINITY,
			maxZ: Number.NEGATIVE_INFINITY,
			minX: Number.POSITIVE_INFINITY,
			minZ: Number.POSITIVE_INFINITY,
		},
	);

const round = (value) => Number(value.toFixed(2));

const buildRoofLandings = (dem, footprints) =>
	footprints
		.filter((footprint) => footprint.areaWorldUnits >= MIN_ROOF_AREA && footprint.points.length >= 3)
		.map((footprint) => {
			const centroid = footprint.centroid;
			const visualCenter = getVisualBuildingCenter(centroid);
			const visualPoints = getVisualBuildingPoints(footprint.points, centroid, visualCenter);
			const roofY =
				Math.max(...visualPoints.map((point) => sampleHeight(dem, point.x, point.z) + 0.07)) +
				getBuildingHeight(footprint) +
				0.03;
			const bounds = getBounds(visualPoints);
			const radius = Math.max(
				8,
				Math.min(42, Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) * 0.42),
			);

			return {
				id: footprint.id,
				position: {
					x: round(visualCenter.x),
					y: round(roofY + PLAYER_CAPSULE_HALF_HEIGHT),
					z: round(visualCenter.z),
				},
				radius: round(radius),
				roofY: round(roofY),
			};
		});

const main = async () => {
	const dem = await readJson(DEM_PATH);
	const buildingData = await readJson(BUILDINGS_PATH);
	const landings = buildRoofLandings(dem, buildingData.buildingFootprints ?? []);

	await mkdir('public/data/tenerife', { recursive: true });
	await writeFile(
		OUTPUT_PATH,
		`${JSON.stringify(
			{
				landings,
				source: {
					buildings: BUILDINGS_PATH,
					dem: DEM_PATH,
				},
				version: 1,
			},
			null,
			'\t',
		)}\n`,
	);

	console.info(`Wrote ${landings.length} Puerto roof landing points to ${OUTPUT_PATH}.`);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
