import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import tenerifeRoadGeoJsonRaw from '../../../data/tenerife2/export.geojson?raw';
import { transformTenerifeRoadPoint } from './TenerifeGeoRoadLayers';
import {
	buildTenerifeRoadLayerData,
	type GeoJsonFeatureCollection,
	projectTenerifeLonLatToWorld,
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
