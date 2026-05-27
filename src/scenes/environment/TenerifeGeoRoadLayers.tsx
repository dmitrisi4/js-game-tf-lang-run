import { Ray } from '@babylonjs/core/Culling/ray';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import { createRoadSurfaceMaterial, getRoadSurfaceType } from './roadSurfaceShader';
import { isTenerifeFullIslandTerrainMeshName } from './tenerifeFullIslandConfig';
import { measureTenerifeSyncStep } from './tenerifePerformance';
import {
	isInsideTenerifeCityFootprint,
	type TenerifeRoadLayerData,
	type TenerifeRoadLayerId,
} from './tenerifeRoadLayers';
import type { WorldPosition } from './worldData';

type PropsType = {
	groundHeightProvider?: GroundHeightProviderType;
	roadLayers: TenerifeRoadLayerData[];
	roadTransform?: TenerifeRoadTransformType;
	visibleLayerIds?: readonly TenerifeRoadLayerId[];
};

type GroundHeightProviderType = (position: WorldPosition) => number | null;
type RoadHeightCacheType = Map<string, number | null>;
type RoadVisualPassType = {
	color: Color3;
	nameSuffix: string;
	surfaceBias: number;
	width: number;
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

const ROAD_SURFACE_BIAS = 0.012;
const ROAD_GROUND_RAY_START_Y = 260;
const ROAD_GROUND_RAY_LENGTH = 560;
const ROAD_SHOULDER_COLOR = Color3.FromHexString('#b0a186');
const ROAD_MAIN_SURFACE_COLOR = Color3.FromHexString('#3f3c36');
const ROAD_SERVICE_SURFACE_COLOR = Color3.FromHexString('#746a5b');
const ROAD_CENTER_LINE_COLOR = Color3.FromHexString('#d8c66d');

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
): number | null => {
	const cacheKey = getTenerifeRoadHeightCacheKey(position);
	const cachedHeight = heightCache?.get(cacheKey);

	if (cachedHeight !== undefined) {
		return cachedHeight === null ? null : cachedHeight + surfaceBias;
	}

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

	if (groundHit?.hit && groundHit.pickedPoint) {
		heightCache?.set(cacheKey, groundHit.pickedPoint.y);
		return groundHit.pickedPoint.y + surfaceBias;
	}

	const providedHeight = groundHeightProvider?.(position);

	if (providedHeight !== null && typeof providedHeight === 'number') {
		heightCache?.set(cacheKey, providedHeight);
		return providedHeight + surfaceBias;
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
				nameSuffix: 'shoulder',
				surfaceBias: 0.012,
				width: width * 1.35,
			},
			{
				color: ROAD_MAIN_SURFACE_COLOR,
				nameSuffix: 'surface',
				surfaceBias: 0.022,
				width,
			},
			{
				color: ROAD_CENTER_LINE_COLOR,
				nameSuffix: 'centerline',
				surfaceBias: 0.034,
				width: Math.max(0.36, width * 0.08),
			},
		];
	}

	if (layerId === 'service') {
		return [
			{
				color: ROAD_SHOULDER_COLOR.scale(0.9),
				nameSuffix: 'shoulder',
				surfaceBias: 0.012,
				width: width * 1.22,
			},
			{
				color: ROAD_SERVICE_SURFACE_COLOR,
				nameSuffix: 'surface',
				surfaceBias: 0.022,
				width: width * 0.88,
			},
		];
	}

	return [
		{
			color,
			nameSuffix: 'surface',
			surfaceBias: 0.02,
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
	scene: NonNullable<ReturnType<typeof useScene>>,
	roadTransform?: TenerifeRoadTransformType,
	groundHeightProvider?: GroundHeightProviderType,
	surfaceBias = ROAD_SURFACE_BIAS,
	heightCache?: RoadHeightCacheType,
): Mesh | null => {
	return measureTenerifeSyncStep(`Road mesh creation: ${name}`, () => {
		const renderWidth = getTenerifeRoadRenderWidth(width, roadTransform);
		const halfWidth = renderWidth / 2;
		const positions: number[] = [];
		const indices: number[] = [];
		const uvs: number[] = [];
		let vertexIndex = 0;
		let accumulatedDistance = 0;

		for (const line of lines) {
			accumulatedDistance = 0;

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
					continue;
				}

				const nx = (-dz / length) * halfWidth;
				const nz = (dx / length) * halfWidth;
				const fromLeft = { x: from.x + nx, z: from.z + nz };
				const fromRight = { x: from.x - nx, z: from.z - nz };
				const toRight = { x: to.x - nx, z: to.z - nz };
				const toLeft = { x: to.x + nx, z: to.z + nz };
				const fromY = getRoadSurfaceHeight(from, scene, groundHeightProvider, surfaceBias, heightCache);
				const toY = getRoadSurfaceHeight(to, scene, groundHeightProvider, surfaceBias, heightCache);

				if (fromY === null || toY === null) {
					continue;
				}

				positions.push(
					fromLeft.x,
					fromY,
					fromLeft.z,
					fromRight.x,
					fromY,
					fromRight.z,
					toRight.x,
					toY,
					toRight.z,
					toLeft.x,
					toY,
					toLeft.z,
				);

				// UV: cross-road 0..1, along-road accumulated distance
				const nextDist = accumulatedDistance + length;
				uvs.push(
					0.0,
					accumulatedDistance, // fromLeft
					1.0,
					accumulatedDistance, // fromRight
					1.0,
					nextDist, // toRight
					0.0,
					nextDist, // toLeft
				);
				accumulatedDistance = nextDist;

				indices.push(
					vertexIndex,
					vertexIndex + 1,
					vertexIndex + 2,
					vertexIndex,
					vertexIndex + 2,
					vertexIndex + 3,
				);
				vertexIndex += 4;
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

		// Use procedural surface shader for surface passes; plain material for
		// shoulder and centerline passes that are purely decorative color strips.
		const isSurfacePass = name.endsWith('-surface');
		if (isSurfacePass) {
			const surfaceType = getRoadSurfaceType(layerId, isInsideCity);
			const material = createRoadSurfaceMaterial(name, surfaceType, scene);
			mesh.material = material;
		} else {
			// Shoulder and centerline keep simple emissive colors for contrast
			const material = new StandardMaterial(`${name}-material`, scene);
			material.backFaceCulling = false;

			// Shoulders: earthy warm sand, centerline: removed for dirt roads
			if (name.endsWith('-shoulder')) {
				material.diffuseColor = isInsideCity
					? Color3.FromHexString('#968672')
					: Color3.FromHexString('#7a6a4a');
				material.emissiveColor = material.diffuseColor.scale(0.12);
			} else {
				// centerline: only visible in city cobblestone context
				material.diffuseColor = isInsideCity
					? Color3.FromHexString('#c8b05a')
					: Color3.FromHexString('#7a6a4a');
				material.emissiveColor = material.diffuseColor.scale(0.1);
			}
			material.specularColor = Color3.FromHexString('#15120f');
			material.freeze();
			mesh.material = material;
		}

		mesh.isPickable = false;
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
 * - All surfaces fade to terrain color at edges via alpha blending
 */
const TenerifeGeoRoadLayers: React.FC<PropsType> = ({
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

					const mesh = createRoadRibbonMeshWithUv(
						`tenerife-geo-roads-${layer.id}-${pass.nameSuffix}`,
						layer.lines,
						pass.width,
						layer.id,
						isInsideCity,
						scene,
						roadTransform,
						groundHeightProvider,
						pass.surfaceBias,
						heightCache,
					);

					return mesh ? [mesh] : [];
				}),
			);

		return () => {
			for (const mesh of meshes) {
				mesh.dispose();
			}
		};
	}, [groundHeightProvider, isGroundMeshReady, roadTransform, stableRoadLayers, scene]);

	return null;
};

export default TenerifeGeoRoadLayers;
