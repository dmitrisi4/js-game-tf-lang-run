import { Ray } from '@babylonjs/core/Culling/ray';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import {
	isTenerifeFullIslandMode,
	isTenerifeFullIslandTerrainMeshName,
	TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
	TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS,
	TENERIFE_FULL_ISLAND_PUERTO_START_POSITION,
} from './tenerifeFullIslandConfig';

export const TENERIFE_CITY_ANCHOR_POSITION = new Vector3(-10, 1.05, 0);
export const TENERIFE_PLAYER_START_POSITION = new Vector3(20, 3.4, -12);
export const TENERIFE_PLAYER_GROUND_LIFT = 1.35;
const TENERIFE_FULL_ISLAND_SPAWN_GRID_SEGMENTS = 14;
const TENERIFE_FULL_ISLAND_SPAWN_RAY_MARGIN = 160;
const TENERIFE_FULL_ISLAND_SPAWN_MIN_GROUND_Y = 1;
export const TENERIFE_WATER_SURFACE_Y = -8;
export const TENERIFE_SEABED_Y = -12.5;
export const TENERIFE_DEEP_WATER_RESET_Y = -10.6;
export const TENERIFE_FAR_WATER_MARGIN = 48;
export const TENERIFE_PLAYABLE_BOUNDS = {
	maxX: 1030,
	maxZ: 95,
	minX: -1530,
	minZ: -1010,
};
export const TENERIFE_WATER_BOUNDS = {
	maxX: TENERIFE_PLAYABLE_BOUNDS.maxX + TENERIFE_FAR_WATER_MARGIN,
	maxZ: TENERIFE_PLAYABLE_BOUNDS.maxZ + TENERIFE_FAR_WATER_MARGIN,
	minX: TENERIFE_PLAYABLE_BOUNDS.minX - TENERIFE_FAR_WATER_MARGIN,
	minZ: TENERIFE_PLAYABLE_BOUNDS.minZ - TENERIFE_FAR_WATER_MARGIN,
};

type TenerifePositionLike = {
	x: number;
	y: number;
	z: number;
};

const getTenerifeSearch = (): string | undefined =>
	typeof window === 'undefined' ? undefined : window.location.search;

const isGroundResetTarget = (meshName: string): boolean =>
	meshName === 'ground1' || isTenerifeFullIslandTerrainMeshName(meshName);

type Bounds2DType = {
	maxX: number;
	maxY: number;
	maxZ: number;
	minX: number;
	minZ: number;
};

/** Calculates runtime world bounds from the imported full-island terrain meshes. */
const getFullIslandRuntimeBounds = (scene: Scene): Bounds2DType | null => {
	const bounds = scene.meshes
		.filter(
			(mesh) =>
				mesh instanceof Mesh &&
				mesh.getTotalVertices() > 0 &&
				isTenerifeFullIslandTerrainMeshName(mesh.name) &&
				mesh.isEnabled(),
		)
		.flatMap((mesh) => {
			mesh.computeWorldMatrix(true);

			return mesh.getBoundingInfo().boundingBox.vectorsWorld;
		});

	if (bounds.length === 0) {
		return null;
	}

	return {
		maxX: Math.max(...bounds.map((point) => point.x)),
		maxY: Math.max(...bounds.map((point) => point.y)),
		maxZ: Math.max(...bounds.map((point) => point.z)),
		minX: Math.min(...bounds.map((point) => point.x)),
		minZ: Math.min(...bounds.map((point) => point.z)),
	};
};

/** Finds a guaranteed terrain-backed spawn point from the imported island mesh itself. */
const getFullIslandTerrainSpawnPosition = (scene: Scene): Vector3 | null => {
	const bounds = getFullIslandRuntimeBounds(scene);

	if (!bounds) {
		return null;
	}

	let bestPoint: Vector3 | null = null;
	const rayY = bounds.maxY + TENERIFE_FULL_ISLAND_SPAWN_RAY_MARGIN;
	const rayLength = rayY + TENERIFE_FULL_ISLAND_SPAWN_RAY_MARGIN;

	for (let xIndex = 0; xIndex <= TENERIFE_FULL_ISLAND_SPAWN_GRID_SEGMENTS; xIndex += 1) {
		const x =
			bounds.minX + ((bounds.maxX - bounds.minX) * xIndex) / TENERIFE_FULL_ISLAND_SPAWN_GRID_SEGMENTS;

		for (let zIndex = 0; zIndex <= TENERIFE_FULL_ISLAND_SPAWN_GRID_SEGMENTS; zIndex += 1) {
			const z =
				bounds.minZ + ((bounds.maxZ - bounds.minZ) * zIndex) / TENERIFE_FULL_ISLAND_SPAWN_GRID_SEGMENTS;
			const groundHit = scene.pickWithRay(
				new Ray(new Vector3(x, rayY, z), Vector3.DownReadOnly, rayLength),
				(mesh) => isTenerifeFullIslandTerrainMeshName(mesh.name) && mesh.isEnabled() && mesh.isPickable,
			);

			if (
				!groundHit?.hit ||
				!groundHit.pickedPoint ||
				groundHit.pickedPoint.y < TENERIFE_FULL_ISLAND_SPAWN_MIN_GROUND_Y
			) {
				continue;
			}

			if (!bestPoint || groundHit.pickedPoint.y > bestPoint.y) {
				bestPoint = groundHit.pickedPoint.clone();
			}
		}
	}

	if (!bestPoint) {
		return null;
	}

	return new Vector3(bestPoint.x, bestPoint.y + TENERIFE_PLAYER_GROUND_LIFT, bestPoint.z);
};

/** Keeps island edges soft while still recovering the player from deep water or runaway physics. */
export const shouldResetTenerifePlayer = ({ x, y, z }: TenerifePositionLike): boolean => {
	if (isTenerifeFullIslandMode(getTenerifeSearch())) {
		return (
			y < TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y ||
			x < TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS.minX ||
			x > TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS.maxX ||
			z < TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS.minZ ||
			z > TENERIFE_FULL_ISLAND_PLAYABLE_BOUNDS.maxZ
		);
	}

	return (
		y < TENERIFE_DEEP_WATER_RESET_Y ||
		x < TENERIFE_WATER_BOUNDS.minX ||
		x > TENERIFE_WATER_BOUNDS.maxX ||
		z < TENERIFE_WATER_BOUNDS.minZ ||
		z > TENERIFE_WATER_BOUNDS.maxZ
	);
};

/** Resolves the current Tenerife respawn point by raycasting onto the active terrain mode. */
export const getTenerifePlayerResetPosition = (scene: Scene | null | undefined): Vector3 => {
	const fallbackPosition = isTenerifeFullIslandMode(getTenerifeSearch())
		? TENERIFE_FULL_ISLAND_PUERTO_START_POSITION.clone()
		: TENERIFE_PLAYER_START_POSITION.clone();

	if (!scene) {
		return fallbackPosition;
	}

	if (isTenerifeFullIslandMode(getTenerifeSearch())) {
		return getFullIslandTerrainSpawnPosition(scene) ?? fallbackPosition;
	}

	const groundHit = scene.pickWithRay(
		new Ray(new Vector3(fallbackPosition.x, 5200, fallbackPosition.z), Vector3.DownReadOnly, 9000),
		(mesh) => isGroundResetTarget(mesh.name) && mesh.isEnabled() && mesh.isPickable,
	);

	if (!groundHit?.hit || !groundHit.pickedPoint) {
		return fallbackPosition;
	}

	return new Vector3(
		fallbackPosition.x,
		groundHit.pickedPoint.y + TENERIFE_PLAYER_GROUND_LIFT,
		fallbackPosition.z,
	);
};
