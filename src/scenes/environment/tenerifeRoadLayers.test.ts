import { describe, expect, it } from 'vitest';
import tenerifeRoadGeoJsonRaw from '../../../data/tenerife2/export.geojson?raw';
import {
	buildTenerifeRoadLayerData,
	type GeoJsonFeatureCollection,
	projectTenerifeLonLatToWorld,
	TENERIFE_ROAD_PROJECTION,
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
});
