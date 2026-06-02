import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import tenerifeRoadGeoJsonRaw from '../../../data/tenerife2/export.geojson?raw';
import { getRoadSurfaceMaterialRole } from './roadSurfaceShader';
import {
	buildRoadJunctionGeometry,
	buildRoadRibbonGeometry,
	getTenerifeRoadHeightCacheKey,
	getTenerifeRoadRenderWidth,
	getTenerifeRoadVisualPasses,
	isTenerifeRoadPointInsideClip,
	transformTenerifeRoadPoint,
} from './TenerifeGeoRoadLayers';
import {
	buildTenerifeRoadLayerData,
	buildTenerifeRoadsideBuildings,
	type GeoJsonFeatureCollection,
	projectTenerifeLonLatToWorld,
	TENERIFE_ROAD_LAYER_STYLES,
	TENERIFE_ROAD_PROJECTION,
	type TenerifeRoadLayerData,
	transformTenerifeRoadsideBuildings,
} from './tenerifeRoadLayers';
import { findBuildingFootprintOverlaps } from './worldPlacementValidation';

describe('tenerife road layers', () => {
	it('projects Puerto de la Cruz coordinates near the configured world offset', () => {
		expect(
			projectTenerifeLonLatToWorld(
				TENERIFE_ROAD_PROJECTION.centerLon,
				TENERIFE_ROAD_PROJECTION.centerLat,
			),
		).toEqual(TENERIFE_ROAD_PROJECTION.offset);
	});

	it('splits the exported Overpass roads into gameplay layers', () => {
		const layers = buildTenerifeRoadLayerData(
			JSON.parse(tenerifeRoadGeoJsonRaw) as GeoJsonFeatureCollection,
		);
		const countsByLayer = Object.fromEntries(layers.map((layer) => [layer.id, layer.roadCount]));

		expect(countsByLayer.main).toBeGreaterThan(1_300);
		expect(countsByLayer.walk).toBeGreaterThan(1_400);
		expect(countsByLayer.service).toBeGreaterThan(600);
	});

	it('transforms Puerto road points onto a full-island overlay anchor', () => {
		const point = transformTenerifeRoadPoint(new Vector3(10, 2, -20), {
			offset: { x: 100, z: -50 },
			scale: 0.5,
		});

		expect(point.x).toBe(105);
		expect(point.y).toBe(1);
		expect(point.z).toBe(-60);
	});

	it('keeps full-island road ribbons readable after coordinate scaling', () => {
		const width = getTenerifeRoadRenderWidth(3.4, {
			offset: { x: 100, z: -50 },
			roadWidthScaleMultiplier: 2,
			scale: 0.225,
		});

		expect(width).toBeCloseTo(1.53);
	});

	it('uses stable rounded keys for repeated full-island road height samples', () => {
		expect(getTenerifeRoadHeightCacheKey({ x: 10.004, z: -20.004 })).toBe('10.00:-20.00');
		expect(getTenerifeRoadHeightCacheKey({ x: 10.005, z: -20.005 })).toBe('10.01:-20.00');
	});

	it('clips transformed full-island road points outside the Puerto coastal band', () => {
		const roadTransform = {
			clip: { maxZ: -190 },
			offset: { x: 100, z: -250 },
			scale: 0.25,
		};

		expect(isTenerifeRoadPointInsideClip({ x: 120, z: -210 }, roadTransform)).toBe(true);
		expect(isTenerifeRoadPointInsideClip({ x: 120, z: -170 }, roadTransform)).toBe(false);
	});

	it('builds layered visuals for main and service roads', () => {
		const mainPasses = getTenerifeRoadVisualPasses(
			'main',
			3.4,
			TENERIFE_ROAD_LAYER_STYLES.main.color,
		);
		const servicePasses = getTenerifeRoadVisualPasses(
			'service',
			1.9,
			TENERIFE_ROAD_LAYER_STYLES.service.color,
		);

		expect(mainPasses.map((pass) => pass.nameSuffix)).toEqual(['shoulder', 'surface']);
		expect(mainPasses.map((pass) => pass.materialRole)).toEqual(['terrainBlend', 'surface']);
		expect(mainPasses[0].width).toBeGreaterThan(mainPasses[1].width);
		expect(servicePasses.map((pass) => pass.nameSuffix)).toEqual(['shoulder', 'surface']);
		expect(servicePasses.map((pass) => pass.materialRole)).toEqual(['terrainBlend', 'surface']);
		expect(servicePasses[0].width).toBeGreaterThan(servicePasses[1].width);
	});

	it('maps shoulder road passes to terrain-blend materials', () => {
		expect(getRoadSurfaceMaterialRole('shoulder')).toBe('terrainBlend');
		expect(getRoadSurfaceMaterialRole('surface')).toBe('surface');
	});

	it('places varied placeholder houses along road lines with clearance', () => {
		const layers: TenerifeRoadLayerData[] = [
			{
				...TENERIFE_ROAD_LAYER_STYLES.main,
				lines: [[new Vector3(-80, 0, 0), new Vector3(80, 0, 0)]],
				roadCount: 1,
			},
			{
				...TENERIFE_ROAD_LAYER_STYLES.service,
				lines: [[new Vector3(-64, 0, -24), new Vector3(64, 0, -24)]],
				roadCount: 1,
			},
		];

		const buildings = buildTenerifeRoadsideBuildings(layers, 24);
		const buildingHeights = new Set(buildings.map((building) => building.collider.height));
		const rowCounts = new Map<string, number>();

		expect(buildings.length).toBeGreaterThanOrEqual(12);
		expect(buildingHeights.size).toBeGreaterThan(2);
		expect(findBuildingFootprintOverlaps(buildings, 0.8)).toEqual([]);

		for (const building of buildings) {
			expect(building.roadsideAnchor).toBeDefined();
			const anchor = building.roadsideAnchor;

			if (anchor) {
				const roadEdgeClearance =
					Math.hypot(building.position.x - anchor.position.x, building.position.z - anchor.position.z) -
					anchor.roadWidth / 2 -
					building.collider.width / 2;
				const rowKey = `${anchor.position.z}:${anchor.side}`;
				rowCounts.set(rowKey, (rowCounts.get(rowKey) ?? 0) + 1);
				expect(roadEdgeClearance).toBeGreaterThan(1.2);
			}

			const distanceToNearestRoad = Math.min(
				Math.abs(building.position.z),
				Math.abs(building.position.z + 24),
			);

			expect(distanceToNearestRoad).toBeGreaterThan(4);
			expect(distanceToNearestRoad).toBeLessThan(9);
			expect(Math.abs(Math.sin(building.yaw))).toBeGreaterThan(0.95);
		}

		expect(Math.max(...rowCounts.values())).toBeGreaterThanOrEqual(3);
	});

	it('builds continuous road ribbon geometry with shared joins', () => {
		const geometry = buildRoadRibbonGeometry(
			[
				{ alongDistance: 0, position: new Vector3(0, 1, 0) },
				{ alongDistance: 10, position: new Vector3(10, 1, 0) },
				{ alongDistance: 20, position: new Vector3(10, 1, 10) },
			],
			4,
		);

		expect(geometry.positions).toHaveLength(18);
		expect(geometry.uvs).toEqual([0, 0, 1, 0, 0, 10, 1, 10, 0, 20, 1, 20]);
		expect(geometry.indices).toEqual([0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4]);
	});

	it('samples road ribbon edge heights independently from the centerline', () => {
		const geometry = buildRoadRibbonGeometry(
			[
				{ alongDistance: 0, position: new Vector3(0, 1, 0) },
				{ alongDistance: 10, position: new Vector3(10, 1, 0) },
			],
			4,
			0,
			(position, fallbackY) => fallbackY + position.z * 0.1,
		);

		expect(geometry.positions.slice(0, 6)).toEqual([0, 1.2, 2, 0, 0.8, -2]);
		expect(geometry.positions.slice(6, 12)).toEqual([10, 1.2, 2, 10, 0.8, -2]);
	});

	it('builds round junction pads for shared road nodes', () => {
		const geometry = buildRoadJunctionGeometry([{ position: new Vector3(4, 2, -8) }], 3, 10, 4);

		expect(geometry.positions).toHaveLength(15);
		expect(geometry.uvs).toHaveLength(10);
		expect(geometry.indices).toEqual([10, 11, 12, 10, 12, 13, 10, 13, 14, 10, 14, 11]);
	});

	it('transforms generated Puerto buildings onto a full-island overlay anchor', () => {
		const [building] = transformTenerifeRoadsideBuildings(
			[
				{
					collider: { depth: 6, height: 9, width: 12 },
					heightOffset: 0.2,
					id: 'sample',
					modelId: 'house-1',
					position: { x: 20, z: -40 },
					scale: 1.5,
					yaw: 0.25,
				},
			],
			{
				offset: { x: 100, z: -50 },
				scale: 0.25,
			},
			{ groundSink: 0.1, positionScaleMultiplier: 3, visualScaleMultiplier: 2 },
		);

		expect(building.position).toEqual({ x: 115, z: -80 });
		expect(building.heightOffset).toBe(0);
		expect(building.scale).toBe(0.75);
		expect(building.collider).toEqual({ depth: 3, height: 4.5, width: 6 });
	});

	it('recomputes full-island roadside building offsets from the transformed road anchor', () => {
		const [building] = transformTenerifeRoadsideBuildings(
			[
				{
					collider: { depth: 8, height: 5, width: 6 },
					heightOffset: 0,
					id: 'anchored-building',
					modelId: 'house-1',
					position: { x: 20, z: 4 },
					roadsideAnchor: {
						position: { x: 20, z: 0 },
						roadWidth: 4,
						side: 1,
						setback: 4,
						tangent: { x: 1, z: 0 },
					},
					scale: 1,
					yaw: Math.PI / 2,
				},
			],
			{
				offset: { x: 100, z: -50 },
				roadWidthScaleMultiplier: 2,
				scale: 0.5,
			},
			{ roadsideSetback: 1, visualScaleMultiplier: 2 },
		);

		expect(building.position).toEqual({ x: 110, z: -44 });
		expect(building.collider.width).toBe(6);
	});

	it('keeps transformed full-island placeholder houses clear of widened road shoulders', () => {
		const roadTransform = {
			offset: { x: 440, z: -270 },
			roadWidthScaleMultiplier: 2,
			scale: 0.675,
		};
		const [building] = transformTenerifeRoadsideBuildings(
			[
				{
					collider: { depth: 7.8, height: 4.6, width: 5.4 },
					heightOffset: 0.04,
					id: 'anchored-building',
					modelId: 'house-1',
					position: { x: 0, z: 0 },
					roadsideAnchor: {
						position: { x: 10, z: 0 },
						roadWidth: TENERIFE_ROAD_LAYER_STYLES.main.width,
						side: 1,
						tangent: { x: 1, z: 0 },
					},
					scale: 1,
					yaw: Math.PI / 2,
				},
			],
			roadTransform,
			{ groundSink: 0.35, roadsideSetback: 2.4, visualScaleMultiplier: 1.45 },
		);
		const roadAnchorPosition = {
			x: roadTransform.offset.x + 10 * roadTransform.scale,
			z: roadTransform.offset.z,
		};
		const distanceFromRoadCenter = Math.hypot(
			building.position.x - roadAnchorPosition.x,
			building.position.z - roadAnchorPosition.z,
		);
		const renderedRoadShoulderHalfWidth =
			(getTenerifeRoadRenderWidth(TENERIFE_ROAD_LAYER_STYLES.main.width, roadTransform) * 1.42) / 2;
		const renderedBuildingHalfWidth = (building.collider.width * 0.8) / 2;
		const visualClearance =
			distanceFromRoadCenter - renderedRoadShoulderHalfWidth - renderedBuildingHalfWidth;

		expect(visualClearance).toBeGreaterThan(1.5);
		expect(building.collider.height * 0.84).toBeGreaterThan(3.7);
		expect(building.heightOffset).toBeGreaterThan(-0.4);
		expect(building.heightOffset).toBeLessThan(-0.25);
	});

	it('clips full-island roadside buildings when the transformed road anchor is hidden', () => {
		const buildings = transformTenerifeRoadsideBuildings(
			[
				{
					collider: { depth: 4, height: 5, width: 2 },
					heightOffset: 0,
					id: 'anchored-building',
					modelId: 'house-1',
					position: { x: 0, z: 0 },
					roadsideAnchor: {
						position: { x: 0, z: 4 },
						roadWidth: 2,
						side: -1,
						tangent: { x: 1, z: 0 },
					},
					scale: 1,
					yaw: Math.PI / 2,
				},
			],
			{
				clip: { maxZ: 0 },
				offset: { x: 0, z: 0 },
				scale: 1,
			},
			{ roadsideSetback: 4 },
		);

		expect(buildings).toEqual([]);
	});
});
