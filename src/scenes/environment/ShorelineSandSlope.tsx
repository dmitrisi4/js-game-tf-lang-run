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
import { getShorelineSandSlopeConfig, type OceanBoundsType } from './oceanVisualConfig';
import { isTenerifeFullIslandTerrainMeshName } from './tenerifeFullIslandConfig';

const SHORELINE_BUCKET_COUNT = 192;
const SHORELINE_MIN_RADIUS = 180;
const SHORELINE_POINT_Y_TOLERANCE = 10;
const SHORELINE_SAND_REBUILD_FRAME_LIMIT = 180;
const SHORELINE_SAND_MIN_POINTS = 24;
const SHORELINE_SAND_ROWS = [
	{ heightRatio: -0.04, offsetRatio: -1 },
	{ heightRatio: 0, offsetRatio: -0.18 },
	{ heightRatio: 0.08, offsetRatio: 0 },
	{ heightRatio: 0.34, offsetRatio: 0.42 },
	{ heightRatio: 0.72, offsetRatio: 0.78 },
	{ heightRatio: 1, offsetRatio: 1 },
] as const;

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
			point: new Vector3(point.x, surfaceY, point.z),
		}))
		.sort((a, b) => a.angle - b.angle);
};

/** Resolves whether two sandy slope samples can be connected without crossing terrain gaps. */
export const shouldConnectShorelineSandSlopePoints = (
	a: Vector3,
	b: Vector3,
	maxSegmentLength: number,
): boolean => Vector3.Distance(a, b) <= maxSegmentLength;

/** Builds rowed shoreline shelf vertices that descend from dry sand into shallow water. */
export const buildShorelineSandSlopePositions = (
	path: ShorelinePointType[],
	surfaceY: number,
	beachInset: number,
	slopeWidth: number,
	underwaterDrop: number,
): number[] => {
	const positions: number[] = [];

	for (const { point } of path) {
		const direction = getRadialDirection(point);

		for (const row of SHORELINE_SAND_ROWS) {
			const distance =
				row.offsetRatio < 0 ? row.offsetRatio * beachInset : row.offsetRatio * slopeWidth;
			const position = point.add(direction.scale(distance));
			const y = surfaceY - underwaterDrop * row.heightRatio;

			positions.push(position.x, y, position.z);
		}
	}

	return positions;
};

const buildConnectedSandSlopeIndices = (
	path: ShorelinePointType[],
	maxSegmentLength: number,
): number[] => {
	const indices: number[] = [];

	for (let pathIndex = 0; pathIndex < path.length - 1; pathIndex += 1) {
		if (
			!shouldConnectShorelineSandSlopePoints(
				path[pathIndex].point,
				path[pathIndex + 1].point,
				maxSegmentLength,
			)
		) {
			continue;
		}

		for (let rowIndex = 0; rowIndex < SHORELINE_SAND_ROWS.length - 1; rowIndex += 1) {
			const currentRow = pathIndex * SHORELINE_SAND_ROWS.length + rowIndex;
			const nextRow = currentRow + 1;
			const currentNextPath = currentRow + SHORELINE_SAND_ROWS.length;
			const nextNextPath = currentNextPath + 1;

			indices.push(currentRow, nextRow, nextNextPath, currentRow, nextNextPath, currentNextPath);
		}
	}

	return indices;
};

/** Creates the visual-only sandy shelf mesh around the full-island coastline. */
const createSandSlopeMesh = (
	scene: BabylonScene,
	name: string,
	path: ShorelinePointType[],
	surfaceY: number,
	beachInset: number,
	slopeWidth: number,
	underwaterDrop: number,
	maxSegmentLength: number,
): Mesh => {
	const mesh = new Mesh(name, scene);
	const vertexData = new VertexData();

	vertexData.positions = buildShorelineSandSlopePositions(
		path,
		surfaceY,
		beachInset,
		slopeWidth,
		underwaterDrop,
	);
	vertexData.indices = buildConnectedSandSlopeIndices(path, maxSegmentLength);
	vertexData.normals = Array.from(
		{ length: path.length * SHORELINE_SAND_ROWS.length * 3 },
		(_, index) => (index % 3 === 1 ? 1 : 0),
	);
	vertexData.applyToMesh(mesh, true);
	mesh.isPickable = false;
	mesh.renderingGroupId = 0;

	return mesh;
};

/**
 * Renders a visual-only sandy shelf so island edges descend gradually under the ocean.
 */
const ShorelineSandSlope: React.FC<PropsType> = ({ bounds, name, surfaceY }) => {
	const scene = useScene();

	useEffect(() => {
		if (!scene) {
			return;
		}

		const config = getShorelineSandSlopeConfig(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
		const material = new StandardMaterial(`${name}-material`, scene);
		let frameCount = 0;
		let slope: Mesh | null = null;
		let observer: Observer<BabylonScene> | null = null;

		material.alpha = 0.9;
		material.backFaceCulling = false;
		material.diffuseColor = Color3.FromHexString('#d8bd72');
		material.emissiveColor = Color3.FromHexString('#3c2f17');
		material.specularColor = Color3.FromHexString('#1a1409');

		observer = scene.onBeforeRenderObservable.add(() => {
			if (slope || frameCount >= SHORELINE_SAND_REBUILD_FRAME_LIMIT) {
				return;
			}

			frameCount += 1;
			const shorelinePath = getShorelinePathFromTerrain(scene.meshes, surfaceY);

			if (shorelinePath.length < SHORELINE_SAND_MIN_POINTS) {
				return;
			}

			slope = createSandSlopeMesh(
				scene,
				name,
				shorelinePath,
				surfaceY,
				config.beachInset,
				config.slopeWidth,
				config.underwaterDrop,
				config.maxSegmentLength,
			);
			slope.material = material;

			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
				observer = null;
			}
		});

		return () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}

			if (slope) {
				slope.dispose();
			}

			material.dispose();
		};
	}, [bounds, name, scene, surfaceY]);

	return null;
};

export default ShorelineSandSlope;
