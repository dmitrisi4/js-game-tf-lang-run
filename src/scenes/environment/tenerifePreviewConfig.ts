import { Ray } from '@babylonjs/core/Culling/ray';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

export const TENERIFE_CITY_ANCHOR_POSITION = new Vector3(-10, 1.05, 0);
export const TENERIFE_PLAYER_START_POSITION = new Vector3(20, 3.4, -12);
export const TENERIFE_PLAYER_GROUND_LIFT = 1.35;
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

/** Keeps island edges soft while still recovering the player from deep water or runaway physics. */
export const shouldResetTenerifePlayer = ({ x, y, z }: TenerifePositionLike): boolean =>
	y < TENERIFE_DEEP_WATER_RESET_Y ||
	x < TENERIFE_WATER_BOUNDS.minX ||
	x > TENERIFE_WATER_BOUNDS.maxX ||
	z < TENERIFE_WATER_BOUNDS.minZ ||
	z > TENERIFE_WATER_BOUNDS.maxZ;

export const getTenerifePlayerResetPosition = (scene: Scene | null | undefined): Vector3 => {
	const fallbackPosition = TENERIFE_PLAYER_START_POSITION.clone();

	if (!scene) {
		return fallbackPosition;
	}

	const groundHit = scene.pickWithRay(
		new Ray(
			new Vector3(TENERIFE_PLAYER_START_POSITION.x, 220, TENERIFE_PLAYER_START_POSITION.z),
			Vector3.DownReadOnly,
			460,
		),
		(mesh) => mesh.name === 'ground1' && mesh.isEnabled() && mesh.isPickable,
	);

	if (!groundHit?.hit || !groundHit.pickedPoint) {
		return fallbackPosition;
	}

	return new Vector3(
		TENERIFE_PLAYER_START_POSITION.x,
		groundHit.pickedPoint.y + TENERIFE_PLAYER_GROUND_LIFT,
		TENERIFE_PLAYER_START_POSITION.z,
	);
};
