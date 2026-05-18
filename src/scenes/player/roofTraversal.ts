import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type RoofLandingPointType = {
	id: string;
	position: {
		x: number;
		y: number;
		z: number;
	};
	radius: number;
	roofY: number;
};

export type RoofLandingPayloadType = {
	landings: RoofLandingPointType[];
	version: number;
};

export const PUERTO_ROOF_LANDINGS_URL = '/data/tenerife/puerto-roof-landings-runtime.json';
export const ROOF_WALL_RAY_LENGTH = 1.65;
export const ROOF_WALL_RAY_HEIGHT = 0.88;
export const ROOF_LANDING_MAX_DISTANCE = 44;
export const ROOF_LEDGE_OUTWARD_OFFSET = 0.68;
export const ROOF_WALL_JUMP_DURATION_MS = 120;
export const ROOF_LEDGE_GRAB_DURATION_MS = 650;
export const ROOF_CLIMB_UP_DURATION_MS = 460;

export const isPuertoCityBuildingMeshName = (name: string): boolean =>
	name.toLowerCase().includes('puerto-osm-city-buildings');

/** Resolves whether roof traversal should load in the current URL mode. */
export const shouldLoadPuertoRoofTraversal = (search: string | undefined): boolean => {
	const params = new URLSearchParams(search ?? '');

	return params.get('tenerife') === '1' && params.get('terrain') === 'real';
};

/** Converts a camera forward vector into a normalized XZ-only traversal direction. */
export const getPlanarFacingDirection = (forward: Vector3): Vector3 => {
	const planarForward = new Vector3(forward.x, 0, forward.z);

	if (planarForward.lengthSquared() === 0) {
		return Vector3.Zero();
	}

	return planarForward.normalize();
};

/** Finds the nearest roof landing point that can accept a wall traversal from the wall hit point. */
export const findNearestRoofLandingPoint = (
	landings: RoofLandingPointType[],
	wallPoint: Vector3,
	maxDistance = ROOF_LANDING_MAX_DISTANCE,
): RoofLandingPointType | null => {
	let nearestLanding: RoofLandingPointType | null = null;
	let nearestDistanceSquared = Number.POSITIVE_INFINITY;

	for (const landing of landings) {
		const dx = landing.position.x - wallPoint.x;
		const dz = landing.position.z - wallPoint.z;
		const distanceSquared = dx * dx + dz * dz;
		const allowedDistance = Math.max(maxDistance, landing.radius);

		if (distanceSquared > allowedDistance * allowedDistance) {
			continue;
		}

		if (distanceSquared < nearestDistanceSquared) {
			nearestDistanceSquared = distanceSquared;
			nearestLanding = landing;
		}
	}

	return nearestLanding;
};

/** Builds a held ledge position between the wall hit and final roof landing. */
export const getRoofLedgePosition = (
	wallPoint: Vector3,
	landing: RoofLandingPointType,
	wallFacingDirection = Vector3.Zero(),
): Vector3 => {
	const landingPosition = new Vector3(landing.position.x, landing.position.y, landing.position.z);
	const outwardDirection = getPlanarFacingDirection(wallFacingDirection).scale(-1);
	const ledgePosition =
		outwardDirection.lengthSquared() > 0
			? wallPoint.add(outwardDirection.scale(ROOF_LEDGE_OUTWARD_OFFSET))
			: Vector3.Lerp(wallPoint, landingPosition, 0.18);

	ledgePosition.y = Math.max(wallPoint.y + 1.15, landing.position.y - 0.35);

	return ledgePosition;
};
