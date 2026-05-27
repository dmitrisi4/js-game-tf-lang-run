import type { WorldBuilding, WorldPosition } from './worldData';

export type BuildingOverlapType = {
	a: string;
	b: string;
};

export type CircularPlacementType = {
	id: string;
	position: WorldPosition;
	radius: number;
};

export type CircularOverlapType = BuildingOverlapType & {
	clearance: number;
	distance: number;
};

type ProjectionType = {
	max: number;
	min: number;
};

const getBuildingHalfExtents = (building: WorldBuilding, padding = 0) => ({
	depth: (building.collider.depth * building.scale + padding) / 2,
	width: (building.collider.width * building.scale + padding) / 2,
});

const getBuildingAxes = (building: WorldBuilding): WorldPosition[] => {
	const sin = Math.sin(building.yaw);
	const cos = Math.cos(building.yaw);

	return [
		{ x: cos, z: -sin },
		{ x: sin, z: cos },
	];
};

const getBuildingCorners = (building: WorldBuilding, padding = 0): WorldPosition[] => {
	const half = getBuildingHalfExtents(building, padding);
	const axes = getBuildingAxes(building);
	const center = building.position;
	const offsets = [
		{ x: half.width, z: half.depth },
		{ x: half.width, z: -half.depth },
		{ x: -half.width, z: half.depth },
		{ x: -half.width, z: -half.depth },
	];

	return offsets.map((offset) => ({
		x: center.x + axes[0].x * offset.x + axes[1].x * offset.z,
		z: center.z + axes[0].z * offset.x + axes[1].z * offset.z,
	}));
};

const projectPoints = (points: WorldPosition[], axis: WorldPosition): ProjectionType => {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;

	for (const point of points) {
		const projected = point.x * axis.x + point.z * axis.z;
		min = Math.min(min, projected);
		max = Math.max(max, projected);
	}

	return { max, min };
};

const projectionsOverlap = (a: ProjectionType, b: ProjectionType): boolean =>
	a.max >= b.min && b.max >= a.min;

/**
 * Checks two oriented building footprints with an optional clearance padding.
 */
export const doBuildingFootprintsOverlap = (
	a: WorldBuilding,
	b: WorldBuilding,
	minimumClearance = 0,
): boolean => {
	const padding = minimumClearance / 2;
	const aCorners = getBuildingCorners(a, padding);
	const bCorners = getBuildingCorners(b, padding);
	const axes = [...getBuildingAxes(a), ...getBuildingAxes(b)];

	for (const axis of axes) {
		if (!projectionsOverlap(projectPoints(aCorners, axis), projectPoints(bCorners, axis))) {
			return false;
		}
	}

	return true;
};

/**
 * Finds pairs of building footprints that overlap or violate the requested clearance.
 */
export const findBuildingFootprintOverlaps = (
	buildings: WorldBuilding[],
	minimumClearance = 0,
): BuildingOverlapType[] => {
	const overlaps: BuildingOverlapType[] = [];

	for (let i = 0; i < buildings.length; i++) {
		for (let j = i + 1; j < buildings.length; j++) {
			const a = buildings[i];
			const b = buildings[j];

			if (doBuildingFootprintsOverlap(a, b, minimumClearance)) {
				overlaps.push({ a: a.id, b: b.id });
			}
		}
	}

	return overlaps;
};

/**
 * Keeps the first building in each local conflict group and drops later overlaps.
 */
export const selectNonOverlappingBuildings = (
	buildings: WorldBuilding[],
	minimumClearance = 0,
): WorldBuilding[] => {
	const selected: WorldBuilding[] = [];

	for (const building of buildings) {
		const overlapsSelected = selected.some((selectedBuilding) =>
			doBuildingFootprintsOverlap(selectedBuilding, building, minimumClearance),
		);

		if (!overlapsSelected) {
			selected.push(building);
		}
	}

	return selected;
};

/**
 * Finds approximate circular placement overlaps for mixed scenery categories.
 */
export const findCircularPlacementOverlaps = (
	placements: CircularPlacementType[],
	minimumClearance = 0,
): CircularOverlapType[] => {
	const overlaps: CircularOverlapType[] = [];

	for (let i = 0; i < placements.length; i++) {
		for (let j = i + 1; j < placements.length; j++) {
			const a = placements[i];
			const b = placements[j];
			const distance = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
			const clearance = distance - a.radius - b.radius;

			if (clearance < minimumClearance) {
				overlaps.push({
					a: a.id,
					b: b.id,
					clearance,
					distance,
				});
			}
		}
	}

	return overlaps;
};
