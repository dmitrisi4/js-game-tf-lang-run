import { Ray } from '@babylonjs/core/Culling/ray';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
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

const createRoadRibbonMesh = (
	name: string,
	lines: Vector3[][],
	width: number,
	color: Color3,
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
		let vertexIndex = 0;

		for (const line of lines) {
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
		vertexData.applyToMesh(mesh);

		const material = new StandardMaterial(`${name}-material`, scene);
		material.backFaceCulling = false;
		material.diffuseColor = color;
		material.emissiveColor = color.scale(0.18);
		material.specularColor = Color3.FromHexString('#15120f');
		material.freeze();
		mesh.material = material;
		mesh.isPickable = false;
		mesh.doNotSyncBoundingInfo = true;
		mesh.freezeWorldMatrix();

		return mesh;
	});
};

/**
 * Renders Puerto de la Cruz OSM roads from the exported GeoJSON file.
 *
 * The source is split into three visual layers so gameplay can tune road,
 * walking, and service readability independently.
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
					const mesh = createRoadRibbonMesh(
						`tenerife-geo-roads-${layer.id}-${pass.nameSuffix}`,
						layer.lines,
						pass.width,
						pass.color,
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
