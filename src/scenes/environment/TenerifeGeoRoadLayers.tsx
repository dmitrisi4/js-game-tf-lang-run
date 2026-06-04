import { Ray } from '@babylonjs/core/Culling/ray';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import type { PuertoRoadGroundingMode } from './puertoCityConfig';
import {
	createRoadSurfaceMaterial,
	getRoadSurfaceMaterialRole,
	getRoadSurfaceType,
	type RoadSurfaceMaterialRole,
} from './roadSurfaceShader';
import { isTenerifeFullIslandTerrainMeshName } from './tenerifeFullIslandConfig';
import { measureTenerifeSyncStep } from './tenerifePerformance';
import {
	isInsideTenerifeCityFootprint,
	type TenerifeRoadLayerData,
	type TenerifeRoadLayerId,
} from './tenerifeRoadLayers';
import {
	getTenerifeRoadOverlayMeshName,
	isTenerifeRoadVisualSupportMeshName,
} from './tenerifeRoadMeshNames';
import type { WorldPosition } from './worldData';

type PropsType = {
	groundingMode?: PuertoRoadGroundingMode;
	groundHeightProvider?: GroundHeightProviderType;
	roadLayers: TenerifeRoadLayerData[];
	roadTransform?: TenerifeRoadTransformType;
	visibleLayerIds?: readonly TenerifeRoadLayerId[];
};

type GroundHeightProviderType = (position: WorldPosition) => number | null;
type RoadHeightCacheType = Map<string, number | null>;
type RoadVisualPassType = {
	color: Color3;
	hasJunctionPads: boolean;
	materialRole: RoadSurfaceMaterialRole;
	nameSuffix: string;
	surfaceBias: number;
	width: number;
};
export type RoadRibbonPointType = {
	alongDistance: number;
	position: Vector3;
};
type RoadRibbonGeometryType = {
	indices: number[];
	positions: number[];
	uvs: number[];
};
type RoadSurfaceHeightResolverType = (
	position: { x: number; z: number },
	fallbackY: number,
) => number;
export type RoadJunctionPointType = {
	position: Vector3;
};

export type TenerifeRoadTransformType = {
	clip?: {
		maxX?: number;
		maxZ?: number;
		minX?: number;
		minZ?: number;
	};
	offset: {
		x: number;
		z: number;
	};
	roadWidthScaleMultiplier?: number;
	scale: number;
};

const ROAD_SURFACE_BIAS = 0.018;
const ROAD_SHOULDER_SURFACE_BIAS = 0.012;
const ROAD_MATERIAL_Z_OFFSET = -1;
const ROAD_MATERIAL_Z_OFFSET_UNITS = -2;
const ROAD_GROUND_RAY_START_Y = 260;
const ROAD_GROUND_RAY_LENGTH = 560;
const ROAD_SHOULDER_COLOR = Color3.FromHexString('#b0a186');
const ROAD_MAIN_SURFACE_COLOR = Color3.FromHexString('#3f3c36');
const ROAD_SERVICE_SURFACE_COLOR = Color3.FromHexString('#746a5b');
const ROAD_JUNCTION_SEGMENTS = 14;

export const getTenerifeRoadRenderWidth = (
	width: number,
	roadTransform?: TenerifeRoadTransformType,
): number => width * (roadTransform?.scale ?? 1) * (roadTransform?.roadWidthScaleMultiplier ?? 1);

/** Resolves whether a transformed road point is inside the optional runtime clip window. */
export const isTenerifeRoadPointInsideClip = (
	position: { x: number; z: number },
	roadTransform?: TenerifeRoadTransformType,
): boolean => {
	const clip = roadTransform?.clip;

	if (!clip) {
		return true;
	}

	return (
		(clip.minX === undefined || position.x >= clip.minX) &&
		(clip.maxX === undefined || position.x <= clip.maxX) &&
		(clip.minZ === undefined || position.z >= clip.minZ) &&
		(clip.maxZ === undefined || position.z <= clip.maxZ)
	);
};

/** Returns a stable cache key for repeated terrain samples on transformed road centerline points. */
export const getTenerifeRoadHeightCacheKey = (position: { x: number; z: number }): string =>
	`${position.x.toFixed(2)}:${position.z.toFixed(2)}`;

const getRoadSurfaceHeight = (
	position: { x: number; z: number },
	scene: NonNullable<ReturnType<typeof useScene>>,
	groundHeightProvider?: GroundHeightProviderType,
	surfaceBias = ROAD_SURFACE_BIAS,
	heightCache?: RoadHeightCacheType,
	groundingMode: PuertoRoadGroundingMode = 'raycast',
): number | null => {
	const cacheKey = getTenerifeRoadHeightCacheKey(position);
	const cachedHeight = heightCache?.get(cacheKey);

	if (cachedHeight !== undefined) {
		return cachedHeight === null ? null : cachedHeight + surfaceBias;
	}

	const getProvidedHeight = (): number | null => {
		const providedHeight = groundHeightProvider?.(position);

		return providedHeight !== null && typeof providedHeight === 'number' ? providedHeight : null;
	};

	const getRaycastHeight = (): number | null => {
		const groundHit = scene.pickWithRay(
			new Ray(
				new Vector3(position.x, ROAD_GROUND_RAY_START_Y, position.z),
				Vector3.DownReadOnly,
				ROAD_GROUND_RAY_LENGTH,
			),
			(mesh) =>
				mesh.isEnabled() &&
				mesh.isPickable &&
				(mesh.name === 'ground1' || isTenerifeFullIslandTerrainMeshName(mesh.name)),
		);

		return groundHit?.hit && groundHit.pickedPoint ? groundHit.pickedPoint.y : null;
	};

	const groundHeight =
		groundingMode === 'heightfield'
			? (getProvidedHeight() ?? getRaycastHeight())
			: (getRaycastHeight() ?? getProvidedHeight());

	if (groundHeight !== null) {
		heightCache?.set(cacheKey, groundHeight);
		return groundHeight + surfaceBias;
	}

	heightCache?.set(cacheKey, null);
	return null;
};

/** Resolves layered visual passes so OSM centerlines read as road surfaces. */
export const getTenerifeRoadVisualPasses = (
	layerId: TenerifeRoadLayerId,
	width: number,
	color: Color3,
): RoadVisualPassType[] => {
	if (layerId === 'main') {
		return [
			{
				color: ROAD_SHOULDER_COLOR,
				hasJunctionPads: true,
				materialRole: getRoadSurfaceMaterialRole('shoulder'),
				nameSuffix: 'shoulder',
				surfaceBias: ROAD_SHOULDER_SURFACE_BIAS,
				width: width * 1.42,
			},
			{
				color: ROAD_MAIN_SURFACE_COLOR,
				hasJunctionPads: true,
				materialRole: getRoadSurfaceMaterialRole('surface'),
				nameSuffix: 'surface',
				surfaceBias: ROAD_SURFACE_BIAS,
				width,
			},
		];
	}

	if (layerId === 'service') {
		return [
			{
				color: ROAD_SHOULDER_COLOR.scale(0.9),
				hasJunctionPads: true,
				materialRole: getRoadSurfaceMaterialRole('shoulder'),
				nameSuffix: 'shoulder',
				surfaceBias: ROAD_SHOULDER_SURFACE_BIAS,
				width: width * 1.3,
			},
			{
				color: ROAD_SERVICE_SURFACE_COLOR,
				hasJunctionPads: true,
				materialRole: getRoadSurfaceMaterialRole('surface'),
				nameSuffix: 'surface',
				surfaceBias: ROAD_SURFACE_BIAS,
				width: width * 0.88,
			},
		];
	}

	return [
		{
			color,
			hasJunctionPads: true,
			materialRole: getRoadSurfaceMaterialRole('surface'),
			nameSuffix: 'surface',
			surfaceBias: ROAD_SURFACE_BIAS,
			width,
		},
	];
};

/** Applies an optional full-island transform to Puerto-local road coordinates. */
export const transformTenerifeRoadPoint = (
	point: Vector3,
	roadTransform?: TenerifeRoadTransformType,
): Vector3 => {
	if (!roadTransform) {
		return point;
	}

	return new Vector3(
		roadTransform.offset.x + point.x * roadTransform.scale,
		point.y * roadTransform.scale,
		roadTransform.offset.z + point.z * roadTransform.scale,
	);
};

const getRoadRibbonPointNormal = (
	points: RoadRibbonPointType[],
	index: number,
): { x: number; z: number } => {
	const current = points[index].position;
	const previous = points[index - 1]?.position;
	const next = points[index + 1]?.position;
	const incoming = previous
		? {
				x: current.x - previous.x,
				z: current.z - previous.z,
			}
		: null;
	const outgoing = next
		? {
				x: next.x - current.x,
				z: next.z - current.z,
			}
		: null;
	const incomingLength = incoming ? Math.hypot(incoming.x, incoming.z) : 0;
	const outgoingLength = outgoing ? Math.hypot(outgoing.x, outgoing.z) : 0;
	const incomingUnit = incoming && incomingLength > 0 ? incoming : null;
	const outgoingUnit = outgoing && outgoingLength > 0 ? outgoing : null;
	const tangent = {
		x:
			(incomingUnit ? incomingUnit.x / incomingLength : 0) +
			(outgoingUnit ? outgoingUnit.x / outgoingLength : 0),
		z:
			(incomingUnit ? incomingUnit.z / incomingLength : 0) +
			(outgoingUnit ? outgoingUnit.z / outgoingLength : 0),
	};
	const tangentLength = Math.hypot(tangent.x, tangent.z);

	if (tangentLength > 0.001) {
		return {
			x: -tangent.z / tangentLength,
			z: tangent.x / tangentLength,
		};
	}

	const fallback = outgoingLength > 0 ? outgoing : incoming;
	const fallbackLength = fallback ? Math.hypot(fallback.x, fallback.z) : 0;

	if (!fallback || fallbackLength <= 0.001) {
		return { x: 1, z: 0 };
	}

	return {
		x: -fallback.z / fallbackLength,
		z: fallback.x / fallbackLength,
	};
};

/**
 * Builds one continuous road strip from centerline samples.
 */
export const buildRoadRibbonGeometry = (
	points: RoadRibbonPointType[],
	width: number,
	startVertexIndex = 0,
	heightResolver?: RoadSurfaceHeightResolverType,
): RoadRibbonGeometryType => {
	const halfWidth = width / 2;
	const positions: number[] = [];
	const indices: number[] = [];
	const uvs: number[] = [];

	for (let index = 0; index < points.length; index += 1) {
		const point = points[index];
		const normal = getRoadRibbonPointNormal(points, index);
		const left = {
			x: point.position.x + normal.x * halfWidth,
			z: point.position.z + normal.z * halfWidth,
		};
		const right = {
			x: point.position.x - normal.x * halfWidth,
			z: point.position.z - normal.z * halfWidth,
		};
		const leftY = heightResolver?.(left, point.position.y) ?? point.position.y;
		const rightY = heightResolver?.(right, point.position.y) ?? point.position.y;

		positions.push(left.x, leftY, left.z, right.x, rightY, right.z);
		uvs.push(0, point.alongDistance, 1, point.alongDistance);

		if (index < points.length - 1) {
			const vertexIndex = startVertexIndex + index * 2;
			indices.push(
				vertexIndex,
				vertexIndex + 1,
				vertexIndex + 3,
				vertexIndex,
				vertexIndex + 3,
				vertexIndex + 2,
			);
		}
	}

	return { indices, positions, uvs };
};

/**
 * Builds round pads that cover joins between independent OSM road ways.
 */
export const buildRoadJunctionGeometry = (
	points: RoadJunctionPointType[],
	radius: number,
	startVertexIndex = 0,
	segments = ROAD_JUNCTION_SEGMENTS,
	heightResolver?: RoadSurfaceHeightResolverType,
): RoadRibbonGeometryType => {
	const positions: number[] = [];
	const indices: number[] = [];
	const uvs: number[] = [];
	let vertexIndex = startVertexIndex;

	for (const point of points) {
		positions.push(point.position.x, point.position.y, point.position.z);
		uvs.push(0.5, 0.5);

		for (let segmentIndex = 0; segmentIndex < segments; segmentIndex += 1) {
			const angle = (segmentIndex / segments) * Math.PI * 2;
			const x = point.position.x + Math.cos(angle) * radius;
			const z = point.position.z + Math.sin(angle) * radius;
			const y = heightResolver?.({ x, z }, point.position.y) ?? point.position.y;

			positions.push(x, y, z);
			uvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
		}

		for (let segmentIndex = 0; segmentIndex < segments; segmentIndex += 1) {
			const current = vertexIndex + 1 + segmentIndex;
			const next = vertexIndex + 1 + ((segmentIndex + 1) % segments);
			indices.push(vertexIndex, current, next);
		}

		vertexIndex += segments + 1;
	}

	return { indices, positions, uvs };
};

const getRoadJunctionKey = (position: { x: number; z: number }): string =>
	`${position.x.toFixed(1)}:${position.z.toFixed(1)}`;

const collectRoadJunctionCandidates = (
	lines: Vector3[][],
	roadTransform?: TenerifeRoadTransformType,
): Vector3[] => {
	const candidatesByKey = new Map<string, { count: number; point: Vector3 }>();

	for (const line of lines) {
		for (const point of line) {
			const transformedPoint = transformTenerifeRoadPoint(point, roadTransform);
			const key = getRoadJunctionKey(transformedPoint);
			const current = candidatesByKey.get(key);

			if (current) {
				current.count += 1;
			} else {
				candidatesByKey.set(key, { count: 1, point: transformedPoint });
			}
		}
	}

	return Array.from(candidatesByKey.values())
		.filter((candidate) => candidate.count >= 2)
		.map((candidate) => candidate.point);
};

/**
 * Builds ribbon geometry with along-road UV coords for texture splatting.
 *
 * UV layout:
 * - uv.x (cross-road): 0 = left edge, 0.5 = centerline, 1 = right edge
 * - uv.y (along-road): accumulated world-unit distance along the centerline,
 *   consumed by the shader as `y * uAlongTile` for tiling
 */
const createRoadRibbonMeshWithUv = (
	name: string,
	lines: Vector3[][],
	width: number,
	layerId: TenerifeRoadLayerId,
	isInsideCity: boolean,
	materialRole: RoadSurfaceMaterialRole,
	scene: NonNullable<ReturnType<typeof useScene>>,
	roadTransform?: TenerifeRoadTransformType,
	groundHeightProvider?: GroundHeightProviderType,
	surfaceBias = ROAD_SURFACE_BIAS,
	heightCache?: RoadHeightCacheType,
	includeJunctionPads = true,
	groundingMode: PuertoRoadGroundingMode = 'raycast',
): Mesh | null => {
	return measureTenerifeSyncStep(`Road mesh creation: ${name}`, () => {
		const renderWidth = getTenerifeRoadRenderWidth(width, roadTransform);
		const positions: number[] = [];
		const indices: number[] = [];
		const uvs: number[] = [];
		let vertexIndex = 0;
		const resolveOverlayHeight: RoadSurfaceHeightResolverType = (position, fallbackY) =>
			getRoadSurfaceHeight(
				position,
				scene,
				groundHeightProvider,
				surfaceBias,
				heightCache,
				groundingMode,
			) ?? fallbackY;

		for (const line of lines) {
			let currentRibbon: RoadRibbonPointType[] = [];
			let accumulatedDistance = 0;

			const flushRibbon = () => {
				if (currentRibbon.length < 2) {
					currentRibbon = [];
					accumulatedDistance = 0;
					return;
				}

				const geometry = buildRoadRibbonGeometry(
					currentRibbon,
					renderWidth,
					vertexIndex,
					resolveOverlayHeight,
				);
				positions.push(...geometry.positions);
				uvs.push(...geometry.uvs);
				indices.push(...geometry.indices);
				vertexIndex += currentRibbon.length * 2;
				currentRibbon = [];
				accumulatedDistance = 0;
			};

			for (let pointIndex = 0; pointIndex < line.length - 1; pointIndex += 1) {
				const from = transformTenerifeRoadPoint(line[pointIndex], roadTransform);
				const to = transformTenerifeRoadPoint(line[pointIndex + 1], roadTransform);
				const dx = to.x - from.x;
				const dz = to.z - from.z;
				const length = Math.hypot(dx, dz);
				const segmentMidpoint = {
					x: (from.x + to.x) / 2,
					z: (from.z + to.z) / 2,
				};

				if (
					length <= 0.01 ||
					(!roadTransform && !isInsideTenerifeCityFootprint(segmentMidpoint)) ||
					!isTenerifeRoadPointInsideClip(from, roadTransform) ||
					!isTenerifeRoadPointInsideClip(to, roadTransform)
				) {
					flushRibbon();
					continue;
				}

				const fromY = getRoadSurfaceHeight(
					from,
					scene,
					groundHeightProvider,
					surfaceBias,
					heightCache,
					groundingMode,
				);
				const toY = getRoadSurfaceHeight(
					to,
					scene,
					groundHeightProvider,
					surfaceBias,
					heightCache,
					groundingMode,
				);

				if (fromY === null || toY === null) {
					flushRibbon();
					continue;
				}

				if (currentRibbon.length === 0) {
					currentRibbon.push({
						alongDistance: 0,
						position: new Vector3(from.x, fromY, from.z),
					});
				}

				accumulatedDistance += length;
				currentRibbon.push({
					alongDistance: accumulatedDistance,
					position: new Vector3(to.x, toY, to.z),
				});
			}

			flushRibbon();
		}

		if (includeJunctionPads) {
			const junctionPoints: RoadJunctionPointType[] = [];

			for (const point of collectRoadJunctionCandidates(lines, roadTransform)) {
				if (
					(!roadTransform && !isInsideTenerifeCityFootprint(point)) ||
					!isTenerifeRoadPointInsideClip(point, roadTransform)
				) {
					continue;
				}

				const y = getRoadSurfaceHeight(
					point,
					scene,
					groundHeightProvider,
					surfaceBias,
					heightCache,
					groundingMode,
				);

				if (y === null) {
					continue;
				}

				junctionPoints.push({
					position: new Vector3(point.x, y, point.z),
				});
			}

			if (junctionPoints.length > 0) {
				const geometry = buildRoadJunctionGeometry(
					junctionPoints,
					renderWidth * 0.58,
					vertexIndex,
					ROAD_JUNCTION_SEGMENTS,
					resolveOverlayHeight,
				);
				positions.push(...geometry.positions);
				uvs.push(...geometry.uvs);
				indices.push(...geometry.indices);
				vertexIndex += junctionPoints.length * (ROAD_JUNCTION_SEGMENTS + 1);
			}
		}

		if (positions.length === 0) {
			return null;
		}

		const normals: number[] = [];
		VertexData.ComputeNormals(positions, indices, normals);

		const mesh = new Mesh(name, scene);
		const vertexData = new VertexData();
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.normals = normals;
		vertexData.uvs = uvs;
		vertexData.applyToMesh(mesh);

		const surfaceType = getRoadSurfaceType(layerId, isInsideCity);
		const material = createRoadSurfaceMaterial(name, surfaceType, scene, materialRole);
		material.zOffset = ROAD_MATERIAL_Z_OFFSET;
		material.zOffsetUnits = ROAD_MATERIAL_Z_OFFSET_UNITS;
		mesh.material = material;

		mesh.isPickable = isTenerifeRoadVisualSupportMeshName(name);
		mesh.doNotSyncBoundingInfo = true;
		mesh.freezeWorldMatrix();

		return mesh;
	});
};

/**
 * Renders Puerto de la Cruz OSM roads from the exported GeoJSON file.
 *
 * Roads use procedural ShaderMaterial:
 * - City main roads → Voronoi cobblestone (warm grey Canarian stone)
 * - Rural main / service roads → dirt track with ruts (warm volcanic earth)
 * - Walk paths → packed earth
 * - Road cores stay opaque; outer shoulders alpha-fade into terrain.
 */
const TenerifeGeoRoadLayers: React.FC<PropsType> = ({
	groundingMode = 'raycast',
	groundHeightProvider,
	roadLayers,
	roadTransform,
	visibleLayerIds,
}) => {
	const scene = useScene();
	const [isGroundMeshReady, setIsGroundMeshReady] = useState(false);
	const stableRoadLayers = useMemo(
		() =>
			visibleLayerIds ? roadLayers.filter((layer) => visibleLayerIds.includes(layer.id)) : roadLayers,
		[roadLayers, visibleLayerIds],
	);

	useBeforeRender(() => {
		if (!scene || isGroundMeshReady) {
			return;
		}

		if (groundHeightProvider && roadTransform) {
			setIsGroundMeshReady(true);
			return;
		}

		const groundMesh = scene.getMeshByName('ground1');
		if (groundMesh?.isEnabled() && groundMesh.isPickable) {
			setIsGroundMeshReady(true);
		}
	});

	useEffect(() => {
		if (!scene || !isGroundMeshReady) {
			return undefined;
		}

		const heightCache: RoadHeightCacheType = new Map();
		const meshes = stableRoadLayers
			.filter((layer) => layer.lines.length > 0)
			.flatMap((layer) =>
				getTenerifeRoadVisualPasses(layer.id, layer.width, layer.color).flatMap((pass) => {
					// For each pass, determine the representative segment midpoint to
					// decide city vs rural context. We sample the first segment midpoint.
					const firstLine = layer.lines[0];
					const segMid =
						firstLine && firstLine.length >= 2
							? {
									x: (firstLine[0].x + firstLine[1].x) / 2,
									z: (firstLine[0].z + firstLine[1].z) / 2,
								}
							: { x: 0, z: 0 };
					const isInsideCity = roadTransform
						? true // transformed layers are always city context
						: isInsideTenerifeCityFootprint(segMid);
					const meshName = getTenerifeRoadOverlayMeshName(layer.id, pass.nameSuffix);

					const mesh = createRoadRibbonMeshWithUv(
						meshName,
						layer.lines,
						pass.width,
						layer.id,
						isInsideCity,
						pass.materialRole,
						scene,
						roadTransform,
						groundHeightProvider,
						pass.surfaceBias,
						heightCache,
						pass.hasJunctionPads,
						groundingMode,
					);

					return mesh ? [mesh] : [];
				}),
			);

		return () => {
			for (const mesh of meshes) {
				mesh.dispose();
			}
		};
	}, [
		groundHeightProvider,
		groundingMode,
		isGroundMeshReady,
		roadTransform,
		stableRoadLayers,
		scene,
	]);

	return null;
};

export default TenerifeGeoRoadLayers;
