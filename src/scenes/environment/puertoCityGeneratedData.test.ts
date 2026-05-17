import { describe, expect, it } from 'vitest';
import demRaw from '../../../data/tenerife/generated/terrain/puerto-dem-runtime.json?raw';
import textureMetadataRaw from '../../../data/tenerife/generated/textures/puerto-city-texture-metadata.json?raw';
import metadataRaw from '../../../public/data/tenerife/puerto-city-metadata.json?raw';

const dem = JSON.parse(demRaw);
const textureMetadata = JSON.parse(textureMetadataRaw);
const metadata = JSON.parse(metadataRaw);

describe('generated Puerto city data', () => {
	it('contains a runtime terrain grid with usable dimensions and height range', () => {
		expect(dem.columns).toBeGreaterThan(300);
		expect(dem.rows).toBeGreaterThan(200);
		expect(dem.maxHeight).toBeGreaterThan(dem.minHeight);
		expect(dem.sourceKind).toBe('procedural-fallback-awaiting-cnig-dtm');
	});

	it('records readable baked-road pixel widths for the prototype atlas', () => {
		expect(textureMetadata.textureSize).toBe(2048);
		expect(textureMetadata.roadPixelWidths.main.clampedPixelWidth).toBeGreaterThanOrEqual(4);
		expect(textureMetadata.roadPixelWidths.service.clampedPixelWidth).toBeGreaterThanOrEqual(3);
		expect(textureMetadata.roadPixelWidths.walk.clampedPixelWidth).toBeGreaterThanOrEqual(2);
	});

	it('records terrain mesh budget metadata for the generated GLB', () => {
		expect(metadata.terrain.glbPath).toBe('public/models/environment/puerto-de-la-cruz-terrain.glb');
		expect(metadata.terrain.vertexCount).toBeGreaterThan(50_000);
		expect(metadata.terrain.vertexCount).toBeLessThan(200_000);
		expect(metadata.terrain.collisionStrategy).toContain('static mesh');
	});
});
