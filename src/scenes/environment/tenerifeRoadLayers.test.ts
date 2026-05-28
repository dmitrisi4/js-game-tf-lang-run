import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import tenerifeRoadGeoJsonRaw from '../../../data/tenerife2/export.geojson?raw';
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
	type GeoJsonFeatureCollection,
	projectTenerifeLonLatToWorld,
	TENERIFE_ROAD_LAYER_STYLES,
	TENERIFE_ROAD_PROJECTION,
	transformTenerifeRoadsideBuildings,
} from './tenerifeRoadLayers';

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
		expect(mainPasses[0].width).toBeGreaterThan(mainPasses[1].width);
		expect(servicePasses.map((pass) => pass.nameSuffix)).toEqual(['shoulder', 'surface']);
		expect(servicePasses[0].width).toBeGreaterThan(servicePasses[1].width);
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
});
