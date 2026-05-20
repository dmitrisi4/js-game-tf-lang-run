import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { isTenerifeFullIslandTerrainMeshName } from './tenerifeFullIslandConfig';

const HEIGHTFIELD_RESOLUTION = 192;
const EMPTY_HEIGHT = Number.NEGATIVE_INFINITY;
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
};

export type TenerifeFullIslandHeightfieldBoundsType = {
	maxX: number;
	maxZ: number;
	minX: number;
	minZ: number;
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

const getTerrainBounds = (terrainMeshes: Mesh[]) => {
	const points = terrainMeshes.flatMap((mesh) => {
		mesh.computeWorldMatrix(true);

		return mesh.getBoundingInfo().boundingBox.vectorsWorld;
	});

	return {
		maxX: Math.max(...points.map((point) => point.x)),
		maxZ: Math.max(...points.map((point) => point.z)),
		minX: Math.min(...points.map((point) => point.x)),
		minZ: Math.min(...points.map((point) => point.z)),
	};
};

const fillHeightfieldGaps = (heights: Float32Array, cellCount: number): void => {
	const queue: number[] = [];
	let readIndex = 0;

	for (let index = 0; index < heights.length; index += 1) {
		if (heights[index] !== EMPTY_HEIGHT) {
			queue.push(index);
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

/** Builds a compact terrain heightfield from the loaded full-island terrain meshes. */
export const rebuildTenerifeFullIslandHeightfield = (meshes: AbstractMesh[]): void => {
	const terrainMeshes = getTerrainMeshes(meshes);

	if (terrainMeshes.length === 0) {
		activeHeightfield = null;
		return;
	}

	const bounds = getTerrainBounds(terrainMeshes);
	const cellCount = HEIGHTFIELD_RESOLUTION;
	const maxIndex = cellCount - 1;
	const heights = new Float32Array(cellCount * cellCount);
	heights.fill(EMPTY_HEIGHT);

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
			const xIndex = clampIndex(
				((worldPosition.x - bounds.minX) / (bounds.maxX - bounds.minX)) * maxIndex,
				maxIndex,
			);
			const zIndex = clampIndex(
				((worldPosition.z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * maxIndex,
				maxIndex,
			);
			const cellIndex = getCellIndex(xIndex, zIndex, cellCount);

			heights[cellIndex] = Math.max(heights[cellIndex], worldPosition.y);
		}
	}

	fillHeightfieldGaps(heights, cellCount);
	activeHeightfield = {
		...bounds,
		cellCount,
		heights,
	};
};

/** Resolves the approximate full-island terrain height at a runtime world position. */
export const getTenerifeFullIslandHeightAtPosition = ({ x, z }: Vector3): number | null => {
	if (
		!activeHeightfield ||
		x < activeHeightfield.minX ||
		x > activeHeightfield.maxX ||
		z < activeHeightfield.minZ ||
		z > activeHeightfield.maxZ
	) {
		return null;
	}

	const maxIndex = activeHeightfield.cellCount - 1;
	const xRatio =
		((x - activeHeightfield.minX) / (activeHeightfield.maxX - activeHeightfield.minX)) * maxIndex;
	const zRatio =
		((z - activeHeightfield.minZ) / (activeHeightfield.maxZ - activeHeightfield.minZ)) * maxIndex;
	const x0 = clampIndex(xRatio, maxIndex);
	const z0 = clampIndex(zRatio, maxIndex);
	const x1 = Math.min(x0 + 1, maxIndex);
	const z1 = Math.min(z0 + 1, maxIndex);
	const tx = xRatio - x0;
	const tz = zRatio - z0;
	const height00 = activeHeightfield.heights[getCellIndex(x0, z0, activeHeightfield.cellCount)];
	const height10 = activeHeightfield.heights[getCellIndex(x1, z0, activeHeightfield.cellCount)];
	const height01 = activeHeightfield.heights[getCellIndex(x0, z1, activeHeightfield.cellCount)];
	const height11 = activeHeightfield.heights[getCellIndex(x1, z1, activeHeightfield.cellCount)];
	const height0 = height00 + (height10 - height00) * tx;
	const height1 = height01 + (height11 - height01) * tx;

	return height0 + (height1 - height0) * tz;
};
