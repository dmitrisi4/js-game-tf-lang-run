import {
	buildOsmNodeIndex,
	createAoiFromRoadRuntimeData,
	createProjectAttribution,
	getLongestEdgeYaw,
	getPolygonArea,
	getPolygonBounds,
	getPolygonCentroid,
	getWayCoordinates,
	isClosedCoordinateRing,
	isPointInsideBounds,
	PATHS,
	parseNumericTag,
	projectLonLatToWorld,
	ROAD_STYLES,
	readJson,
	writeJson,
} from './puerto_city_common.mjs';

const MAX_RUNTIME_BUILDINGS = 160;

const toWorldPoint = ([lon, lat]) => projectLonLatToWorld(lon, lat);

const getBuildingHeight = (tags = {}) => {
	const explicitHeight = parseNumericTag(tags.height);

	if (explicitHeight) {
		return explicitHeight;
	}

	const levels = parseNumericTag(tags['building:levels']);

	if (levels) {
		return levels * 3.2;
	}

	return 7.5;
};

const getModelIdForBuilding = (area, height) => {
	if (height > 15 || area > 160) {
		return 'building-4';
	}

	if (area > 95) {
		return 'building-3-small';
	}

	if (area > 55) {
		return 'building-1-small';
	}

	return area > 30 ? 'house-2' : 'house-1';
};

const getRuntimeBuilding = (footprint, index) => {
	const bounds = getPolygonBounds(footprint.points);
	const width = Math.max(2.5, bounds.maxX - bounds.minX);
	const depth = Math.max(2.5, bounds.maxZ - bounds.minZ);
	const height = Math.max(3.2, footprint.heightMeters * 0.26);
	const modelId = getModelIdForBuilding(footprint.areaWorldUnits, footprint.heightMeters);
	const scale = Math.max(0.75, Math.min(2.4, Math.sqrt(footprint.areaWorldUnits) / 6));

	return {
		collider: {
			depth: Number(depth.toFixed(2)),
			height: Number(height.toFixed(2)),
			width: Number(width.toFixed(2)),
		},
		heightOffset: 0.04,
		id: `puerto-osm-building-${String(index + 1).padStart(3, '0')}`,
		modelId,
		position: {
			x: Number(footprint.centroid.x.toFixed(2)),
			z: Number(footprint.centroid.z.toFixed(2)),
		},
		scale: Number(scale.toFixed(2)),
		yaw: Number(footprint.yaw.toFixed(4)),
	};
};

const buildRoadLines = (runtimeRoadData, aoi) => {
	const lines = [];
	const countsByLayer = { main: 0, service: 0, walk: 0 };
	let pointCount = 0;
	let segmentCount = 0;

	for (const line of runtimeRoadData.lines) {
		if (!ROAD_STYLES[line.layerId]) {
			continue;
		}

		const points = line.points
			.map(([x, z]) => ({ x, z }))
			.filter((point) => isPointInsideBounds(point, aoi.worldBounds));

		if (points.length < 2) {
			continue;
		}

		countsByLayer[line.layerId] += 1;
		pointCount += points.length;
		segmentCount += points.length - 1;
		lines.push({
			id: line.id,
			layerId: line.layerId,
			name: line.name,
			points: points.map((point) => [Number(point.x.toFixed(2)), Number(point.z.toFixed(2))]),
		});
	}

	return {
		lines,
		metrics: {
			countsByLayer,
			lineCount: lines.length,
			pointCount,
			segmentCount,
		},
		projection: runtimeRoadData.projection,
		version: 1,
	};
};

const buildFootprints = (osmData, nodeIndex, aoi) => {
	const footprints = [];
	const landusePolygons = [];
	const pois = [];

	for (const element of osmData.elements ?? []) {
		const tags = element.tags ?? {};

		if (element.type === 'node' && (tags.amenity || tags.tourism)) {
			const point = projectLonLatToWorld(element.lon, element.lat);

			if (isPointInsideBounds(point, aoi.worldBounds)) {
				pois.push({
					id: `node/${element.id}`,
					kind: tags.amenity ? 'amenity' : 'tourism',
					name: tags.name ?? '',
					position: point,
					tag: tags.amenity ?? tags.tourism,
				});
			}
			continue;
		}

		if (element.type !== 'way') {
			continue;
		}

		const coordinates = getWayCoordinates(element, nodeIndex);

		if (!isClosedCoordinateRing(coordinates)) {
			continue;
		}

		const points = coordinates.slice(0, -1).map(toWorldPoint);
		const centroid = getPolygonCentroid(points);

		if (!isPointInsideBounds(centroid, aoi.worldBounds)) {
			continue;
		}

		if (tags.amenity || tags.tourism) {
			pois.push({
				id: `way/${element.id}`,
				kind: tags.amenity ? 'amenity' : 'tourism',
				name: tags.name ?? '',
				position: {
					x: Number(centroid.x.toFixed(3)),
					z: Number(centroid.z.toFixed(3)),
				},
				tag: tags.amenity ?? tags.tourism,
			});
		}

		if (tags.building) {
			const areaWorldUnits = getPolygonArea(points);

			if (areaWorldUnits < 2) {
				continue;
			}

			footprints.push({
				areaWorldUnits: Number(areaWorldUnits.toFixed(2)),
				centroid: {
					x: Number(centroid.x.toFixed(3)),
					z: Number(centroid.z.toFixed(3)),
				},
				heightMeters: Number(getBuildingHeight(tags).toFixed(2)),
				id: `way/${element.id}`,
				levels: parseNumericTag(tags['building:levels']) ?? null,
				name: tags.name ?? '',
				points: points.map((point) => ({
					x: Number(point.x.toFixed(3)),
					z: Number(point.z.toFixed(3)),
				})),
				tags: {
					building: tags.building,
					tourism: tags.tourism,
				},
				yaw: Number(getLongestEdgeYaw(points).toFixed(4)),
			});
			continue;
		}

		const landuseTag = tags.landuse ?? tags.leisure ?? tags.natural;

		if (landuseTag) {
			landusePolygons.push({
				id: `way/${element.id}`,
				kind: tags.landuse ? 'landuse' : tags.leisure ? 'leisure' : 'natural',
				points: points.map((point) => ({
					x: Number(point.x.toFixed(3)),
					z: Number(point.z.toFixed(3)),
				})),
				tag: landuseTag,
			});
		}
	}

	footprints.sort((a, b) => b.areaWorldUnits - a.areaWorldUnits);

	return {
		footprints,
		landusePolygons,
		pois,
		runtimeBuildings: footprints
			.slice(0, MAX_RUNTIME_BUILDINGS)
			.map((footprint, index) => getRuntimeBuilding(footprint, index)),
	};
};

const main = async () => {
	const runtimeRoadData = await readJson(PATHS.roadRuntime);
	const osmData = await readJson(PATHS.osmSource);
	const aoi = createAoiFromRoadRuntimeData(runtimeRoadData);
	const nodeIndex = buildOsmNodeIndex(osmData);
	const roadData = buildRoadLines(runtimeRoadData, aoi);
	const cityVectors = buildFootprints(osmData, nodeIndex, aoi);
	const attribution = createProjectAttribution();
	const generatedAt = new Date().toISOString();

	const cityLayers = {
		aoi,
		attribution,
		buildingFootprints: cityVectors.footprints,
		landusePolygons: cityVectors.landusePolygons,
		metadata: {
			generatedAt,
			sourceFiles: {
				osm: PATHS.osmSource,
				roads: PATHS.roadRuntime,
			},
		},
		pois: cityVectors.pois,
		roads: roadData,
		runtimeBuildings: cityVectors.runtimeBuildings,
		version: 1,
	};

	await writeJson(PATHS.cityAoi, aoi);
	await writeJson(PATHS.roadsGenerated, roadData);
	await writeJson(PATHS.buildingFootprints, {
		aoi,
		attribution,
		buildingFootprints: cityVectors.footprints,
		metrics: {
			buildingFootprintCount: cityVectors.footprints.length,
			runtimeBuildingCount: cityVectors.runtimeBuildings.length,
		},
		runtimeBuildings: cityVectors.runtimeBuildings,
		version: 1,
	});
	await writeJson(PATHS.cityLayers, cityLayers);
	await writeJson(PATHS.runtimeMetadata, {
		aoi,
		attribution,
		buildings: {
			footprintCount: cityVectors.footprints.length,
			runtimeBuildingCount: cityVectors.runtimeBuildings.length,
		},
		generatedAt,
		roads: roadData.metrics,
		sourceKind: 'osm-and-generated-terrain-pipeline',
		version: 1,
	});

	console.info(
		`Wrote Puerto city layers with ${roadData.metrics.lineCount} roads, ${cityVectors.footprints.length} building footprints, and ${cityVectors.pois.length} POIs.`,
	);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
