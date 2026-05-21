import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { isTenerifeFullIslandTerrainMeshName } from './tenerifeFullIslandConfig';

const HEIGHTFIELD_RESOLUTION = 192;
const EMPTY_HEIGHT = Number.NEGATIVE_INFINITY;
const UNREACHED_SOURCE_DISTANCE = 65535;
const MAX_SUPPORTED_SOURCE_DISTANCE_CELLS = 2;
const NEIGHBOR_OFFSETS = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1],
] as const;

type HeightfieldType = {
	cellCount: number;
	heights: Float32Array;
	maxX: number;
	maxZ: number;
	minX: number;
	minZ: number;
	sourceDistances: Uint16Array;
};

export type TenerifeFullIslandHeightfieldBoundsType = {
	maxX: number;
	maxZ: number;
	minX: number;
	minZ: number;
};

export type TenerifeFullIslandHeightfieldPointType = {
	x: number;
	y: number;
	z: number;
};

let activeHeightfield: HeightfieldType | null = null;

const clampIndex = (value: number, maxIndex: number): number =>
	Math.max(0, Math.min(maxIndex, Math.floor(value)));

const getCellIndex = (xIndex: number, zIndex: number, cellCount: number): number =>
	zIndex * cellCount + xIndex;

const getTerrainMeshes = (meshes: AbstractMesh[]): Mesh[] =>
	meshes.filter(
		(mesh): mesh is Mesh =>
			mesh instanceof Mesh &&
			mesh.getTotalVertices() > 0 &&
			isTenerifeFullIslandTerrainMeshName(mesh.name) &&
			mesh.isEnabled(),
	);

const getPointBounds = (points: TenerifeFullIslandHeightfieldPointType[]) => {
	return {
		maxX: Math.max(...points.map((point) => point.x)),
		maxZ: Math.max(...points.map((point) => point.z)),
		minX: Math.min(...points.map((point) => point.x)),
		minZ: Math.min(...points.map((point) => point.z)),
	};
};

const fillHeightfieldGaps = (
	heights: Float32Array,
	sourceDistances: Uint16Array,
	cellCount: number,
): void => {
	const queue: number[] = [];
	let readIndex = 0;

	for (let index = 0; index < heights.length; index += 1) {
		if (heights[index] !== EMPTY_HEIGHT) {
			queue.push(index);
			sourceDistances[index] = 0;
		}
	}

	while (readIndex < queue.length) {
		const index = queue[readIndex];
		readIndex += 1;
		const xIndex = index % cellCount;
		const zIndex = Math.floor(index / cellCount);

		for (const [xOffset, zOffset] of NEIGHBOR_OFFSETS) {
			const nextX = xIndex + xOffset;
			const nextZ = zIndex + zOffset;

			if (nextX < 0 || nextX >= cellCount || nextZ < 0 || nextZ >= cellCount) {
				continue;
			}

			const nextIndex = getCellIndex(nextX, nextZ, cellCount);

			if (heights[nextIndex] !== EMPTY_HEIGHT) {
				continue;
			}

			heights[nextIndex] = heights[index];
			sourceDistances[nextIndex] = sourceDistances[index] + 1;
			queue.push(nextIndex);
		}
	}
};

/** Clears the generated full-island heightfield. */
export const clearTenerifeFullIslandHeightfield = (): void => {
	activeHeightfield = null;
};

/** Returns the active full-island runtime bounds derived from Babylon world-space terrain vertices. */
export const getTenerifeFullIslandHeightfieldBounds =
	(): TenerifeFullIslandHeightfieldBoundsType | null => {
		if (!activeHeightfield) {
			return null;
		}

		return {
			maxX: activeHeightfield.maxX,
			maxZ: activeHeightfield.maxZ,
			minX: activeHeightfield.minX,
			minZ: activeHeightfield.minZ,
		};
	};

/** Builds a compact terrain heightfield from already resolved world-space terrain points. */
export const createTenerifeFullIslandHeightfieldFromPoints = (
	points: TenerifeFullIslandHeightfieldPointType[],
	cellCount = HEIGHTFIELD_RESOLUTION,
): HeightfieldType | null => {
	if (points.length === 0 || cellCount < 2) {
		return null;
	}

	const bounds = getPointBounds(points);

	if (bounds.maxX === bounds.minX || bounds.maxZ === bounds.minZ) {
		return null;
	}

	const maxIndex = cellCount - 1;
	const heights = new Float32Array(cellCount * cellCount);
	const sourceDistances = new Uint16Array(cellCount * cellCount);
	heights.fill(EMPTY_HEIGHT);
	sourceDistances.fill(UNREACHED_SOURCE_DISTANCE);

	for (const point of points) {
		const xIndex = clampIndex(
			((point.x - bounds.minX) / (bounds.maxX - bounds.minX)) * maxIndex,
			maxIndex,
		);
		const zIndex = clampIndex(
			((point.z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * maxIndex,
			maxIndex,
		);
		const cellIndex = getCellIndex(xIndex, zIndex, cellCount);

		heights[cellIndex] = Math.max(heights[cellIndex], point.y);
	}

	fillHeightfieldGaps(heights, sourceDistances, cellCount);

	return {
		...bounds,
		cellCount,
		heights,
		sourceDistances,
	};
};

/** Builds a compact terrain heightfield from the loaded full-island terrain meshes. */
export const rebuildTenerifeFullIslandHeightfield = (meshes: AbstractMesh[]): void => {
	const terrainMeshes = getTerrainMeshes(meshes);

	if (terrainMeshes.length === 0) {
		activeHeightfield = null;
		return;
	}

	const worldPoints: TenerifeFullIslandHeightfieldPointType[] = [];

	for (const mesh of terrainMeshes) {
		const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

		if (!positions) {
			continue;
		}

		const worldMatrix = mesh.getWorldMatrix();

		for (let index = 0; index < positions.length; index += 3) {
			const worldPosition = Vector3.TransformCoordinates(
				new Vector3(positions[index], positions[index + 1], positions[index + 2]),
				worldMatrix,
			);

			worldPoints.push(worldPosition);
		}
	}

	activeHeightfield = createTenerifeFullIslandHeightfieldFromPoints(worldPoints);
};

/** Resolves a height from a specific heightfield while rejecting large filled gaps. */
export const sampleTenerifeFullIslandHeightfield = (
	heightfield: HeightfieldType,
	{ x, z }: Vector3,
): number | null => {
	if (x < heightfield.minX || x > heightfield.maxX || z < heightfield.minZ || z > heightfield.maxZ) {
		return null;
	}

	const maxIndex = heightfield.cellCount - 1;
	const xRatio = ((x - heightfield.minX) / (heightfield.maxX - heightfield.minX)) * maxIndex;
	const zRatio = ((z - heightfield.minZ) / (heightfield.maxZ - heightfield.minZ)) * maxIndex;
	const x0 = clampIndex(xRatio, maxIndex);
	const z0 = clampIndex(zRatio, maxIndex);
	const x1 = Math.min(x0 + 1, maxIndex);
	const z1 = Math.min(z0 + 1, maxIndex);
	const tx = xRatio - x0;
	const tz = zRatio - z0;
	const cellCount = heightfield.cellCount;
	const index00 = getCellIndex(x0, z0, cellCount);
	const index10 = getCellIndex(x1, z0, cellCount);
	const index01 = getCellIndex(x0, z1, cellCount);
	const index11 = getCellIndex(x1, z1, cellCount);
	const nearestSourceDistance = Math.min(
		heightfield.sourceDistances[index00],
		heightfield.sourceDistances[index10],
		heightfield.sourceDistances[index01],
		heightfield.sourceDistances[index11],
	);

	if (nearestSourceDistance > MAX_SUPPORTED_SOURCE_DISTANCE_CELLS) {
		return null;
	}

	const height00 = heightfield.heights[index00];
	const height10 = heightfield.heights[index10];
	const height01 = heightfield.heights[index01];
	const height11 = heightfield.heights[index11];
	const height0 = height00 + (height10 - height00) * tx;
	const height1 = height01 + (height11 - height01) * tx;

	return height0 + (height1 - height0) * tz;
};

/** Resolves the approximate full-island terrain height at a runtime world position. */
export const getTenerifeFullIslandHeightAtPosition = (position: Vector3): number | null => {
	if (!activeHeightfield) {
		return null;
	}

	return sampleTenerifeFullIslandHeightfield(activeHeightfield, position);
};
