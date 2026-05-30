import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect } from 'react';
import { useScene } from 'react-babylonjs';
import { getShorelineSurfConfig, type OceanBoundsType } from './oceanVisualConfig';
import { isTenerifeFullIslandTerrainMeshName } from './tenerifeFullIslandConfig';

const SHORELINE_BUCKET_COUNT = 192;
const SHORELINE_MIN_RADIUS = 180;
const SHORELINE_POINT_Y_TOLERANCE = 10;
const SHORELINE_SURF_Y_OFFSET = 0.065;
const SHORELINE_SURF_REBUILD_FRAME_LIMIT = 180;
const SHORELINE_SURF_MIN_POINTS = 24;
const SHORELINE_SURF_MAX_SEGMENT_MULTIPLIER = 2.2;

type PropsType = {
	bounds: OceanBoundsType;
	name: string;
	surfaceY: number;
};

type ShorelinePointType = {
	angle: number;
	point: Vector3;
};

type ShorelineCandidateType = ShorelinePointType & {
	score: number;
};

const getTerrainMeshes = (meshes: AbstractMesh[]): Mesh[] =>
	meshes.filter(
		(mesh): mesh is Mesh =>
			mesh instanceof Mesh &&
			mesh.getTotalVertices() > 0 &&
			isTenerifeFullIslandTerrainMeshName(mesh.name) &&
			mesh.isEnabled(),
	);

const getRadialDirection = (point: Vector3): Vector3 => {
	const direction = new Vector3(point.x, 0, point.z);

	if (direction.lengthSquared() < 0.001) {
		return new Vector3(1, 0, 0);
	}

	return direction.normalize();
};

export const fetchPrecalculatedShoreline = async (
	surfaceY: number,
	yOffset: number,
): Promise<ShorelinePointType[]> => {
	try {
		const response = await fetch('/data/shoreline-path.json');
		if (!response.ok) {
			return [];
		}

		const data = await response.json();
		return data.map((item: { angle: number; point: { x: number; z: number } }) => ({
			angle: item.angle,
			point: new Vector3(item.point.x, surfaceY + yOffset, item.point.z),
		}));
	} catch {
		return [];
	}
};

const getShorelinePathFromTerrain = (
	meshes: AbstractMesh[],
	surfaceY: number,
): ShorelinePointType[] => {
	const buckets: Array<ShorelineCandidateType | null> = Array.from(
		{ length: SHORELINE_BUCKET_COUNT },
		() => null,
	);

	for (const mesh of getTerrainMeshes(meshes)) {
		const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

		if (!positions) {
			continue;
		}

		const worldMatrix = mesh.getWorldMatrix();

		for (let index = 0; index < positions.length; index += 3) {
			const point = Vector3.TransformCoordinates(
				new Vector3(positions[index], positions[index + 1], positions[index + 2]),
				worldMatrix,
			);
			const yDistance = Math.abs(point.y - surfaceY);
			const radius = Math.hypot(point.x, point.z);

			if (yDistance > SHORELINE_POINT_Y_TOLERANCE || radius < SHORELINE_MIN_RADIUS) {
				continue;
			}

			const angle = Math.atan2(point.z, point.x);
			const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
			const bucketIndex = Math.min(
				SHORELINE_BUCKET_COUNT - 1,
				Math.floor((normalizedAngle / (Math.PI * 2)) * SHORELINE_BUCKET_COUNT),
			);
			const score = yDistance - radius * 0.001;
			const current = buckets[bucketIndex];

			if (!current || score < current.score) {
				buckets[bucketIndex] = { angle: normalizedAngle, point, score };
			}
		}
	}

	return buckets
		.filter((candidate): candidate is ShorelineCandidateType => Boolean(candidate))
		.map(({ angle, point }) => ({
			angle,
			point: new Vector3(point.x, surfaceY + SHORELINE_SURF_Y_OFFSET, point.z),
		}))
		.sort((a, b) => a.angle - b.angle);
};

const buildSurfPositions = (
	path: ShorelinePointType[],
	surfaceY: number,
	timeSeconds: number,
	surfWidth: number,
	retreatSpeed: number,
): number[] => {
	const advance = (Math.sin(timeSeconds * 1.7) * 0.5 + 0.5) * surfWidth * 0.58;
	const backwash = (Math.sin(timeSeconds * 1.7 + Math.PI) * 0.5 + 0.5) * surfWidth * 0.22;
	const positions: number[] = [];

	for (const { point } of path) {
		const direction = getRadialDirection(point);
		const inner = point.subtract(direction.scale(surfWidth * 0.16 + backwash));
		const outer = point.add(direction.scale(surfWidth * 0.22 + advance + retreatSpeed * 0.04));

		positions.push(inner.x, surfaceY + SHORELINE_SURF_Y_OFFSET, inner.z);
		positions.push(outer.x, surfaceY + SHORELINE_SURF_Y_OFFSET, outer.z);
	}

	return positions;
};

const buildSurfIndices = (pointCount: number): number[] => {
	const indices: number[] = [];

	for (let index = 0; index < pointCount - 1; index += 1) {
		const next = index + 1;
		const inner = index * 2;
		const outer = inner + 1;
		const nextInner = next * 2;
		const nextOuter = nextInner + 1;

		indices.push(inner, outer, nextOuter, inner, nextOuter, nextInner);
	}

	return indices;
};

/** Resolves whether two shoreline samples can be connected without crossing terrain gaps. */
export const shouldConnectShorelineSurfPoints = (
	a: Vector3,
	b: Vector3,
	maxSegmentLength: number,
): boolean => Vector3.Distance(a, b) <= maxSegmentLength;

const buildConnectedSurfIndices = (
	path: ShorelinePointType[],
	maxSegmentLength: number,
): number[] => {
	const indices: number[] = [];

	for (let index = 0; index < path.length - 1; index += 1) {
		if (
			!shouldConnectShorelineSurfPoints(path[index].point, path[index + 1].point, maxSegmentLength)
		) {
			continue;
		}

		indices.push(...buildSurfIndices(2).map((vertexIndex) => vertexIndex + index * 2));
	}

	return indices;
};

/** Creates a flat animated foam ribbon from terrain-derived shoreline points. */
const createSurfRibbon = (
	scene: BabylonScene,
	name: string,
	path: ShorelinePointType[],
	surfaceY: number,
	surfWidth: number,
	retreatSpeed: number,
): Mesh => {
	const mesh = new Mesh(name, scene);
	const vertexData = new VertexData();
	const maxSegmentLength = surfWidth * SHORELINE_SURF_MAX_SEGMENT_MULTIPLIER;

	vertexData.positions = buildSurfPositions(path, surfaceY, 0, surfWidth, retreatSpeed);
	vertexData.indices = buildConnectedSurfIndices(path, maxSegmentLength);
	vertexData.normals = Array.from({ length: path.length * 2 * 3 }, (_, index) =>
		index % 3 === 1 ? 1 : 0,
	);
	vertexData.applyToMesh(mesh, true);
	mesh.isPickable = false;
	mesh.renderingGroupId = 0;

	return mesh;
};

/**
 * Renders animated shoreline foam from the loaded full-island terrain coastline.
 */
const ShorelineSurf: React.FC<PropsType> = ({ bounds, name, surfaceY }) => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		const surfConfig = getShorelineSurfConfig(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
		const material = new StandardMaterial(`${name}-material`, scene);
		let frameCount = 0;
		let ribbon: Mesh | null = null;
		let shorelinePath: ShorelinePointType[] = [];
		let observer: Observer<BabylonScene> | null = null;

		material.alpha = 0.72;
		material.backFaceCulling = false;
		material.diffuseColor = Color3.FromHexString('#e8fff8');
		material.disableLighting = true;
		material.emissiveColor = Color3.FromHexString('#e8fff8');
		material.specularColor = Color3.Black();

		let isFetching = false;
		let usingFallback = false;

		observer = scene.onBeforeRenderObservable.add(() => {
			if (!ribbon) {
				if (!isFetching && !usingFallback) {
					isFetching = true;
					fetchPrecalculatedShoreline(surfaceY, SHORELINE_SURF_Y_OFFSET).then((path) => {
						isFetching = false;
						if (path && path.length >= SHORELINE_SURF_MIN_POINTS) {
							shorelinePath = path;
							ribbon = createSurfRibbon(
								scene,
								name,
								shorelinePath,
								surfaceY,
								surfConfig.surfWidth,
								surfConfig.retreatSpeed,
							);
							ribbon.material = material;
						} else {
							// Fallback to runtime extraction
							usingFallback = true;
						}
					});
				}

				if (usingFallback && frameCount < SHORELINE_SURF_REBUILD_FRAME_LIMIT) {
					frameCount += 1;
					shorelinePath = getShorelinePathFromTerrain(scene.meshes, surfaceY);

					if (shorelinePath.length >= SHORELINE_SURF_MIN_POINTS) {
						ribbon = createSurfRibbon(
							scene,
							name,
							shorelinePath,
							surfaceY,
							surfConfig.surfWidth,
							surfConfig.retreatSpeed,
						);
						ribbon.material = material;
					}
				}
			}

			if (!ribbon) {
				return;
			}

			const timeSeconds = performance.now() * 0.001;
			const positions = buildSurfPositions(
				shorelinePath,
				surfaceY,
				timeSeconds,
				surfConfig.surfWidth,
				surfConfig.retreatSpeed,
			);

			ribbon.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);
			material.alpha = 0.5 + (Math.sin(timeSeconds * 2.2) * 0.5 + 0.5) * 0.28;
		});

		return () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}

			ribbon?.dispose();
			material.dispose();
		};
	}, [bounds, name, scene, surfaceY]);

	return null;
};

export default ShorelineSurf;
