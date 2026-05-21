import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { describe, expect, it } from 'vitest';
import {
	createTenerifeFullIslandHeightfieldFromPoints,
	sampleTenerifeFullIslandHeightfield,
	type TenerifeFullIslandHeightfieldPointType,
} from './tenerifeFullIslandHeightfield';

const createGridPoints = (
	cellCount: number,
	shouldIncludePoint: (xIndex: number, zIndex: number) => boolean,
): TenerifeFullIslandHeightfieldPointType[] => {
	const points: TenerifeFullIslandHeightfieldPointType[] = [];

	for (let zIndex = 0; zIndex < cellCount; zIndex += 1) {
		for (let xIndex = 0; xIndex < cellCount; xIndex += 1) {
			if (!shouldIncludePoint(xIndex, zIndex)) {
				continue;
			}

			points.push({
				x: xIndex,
				y: xIndex + zIndex,
				z: zIndex,
			});
		}
	}

	return points;
};

const createExpectedHeightfield = (
	points: TenerifeFullIslandHeightfieldPointType[],
	cellCount: number,
) => {
	const heightfield = createTenerifeFullIslandHeightfieldFromPoints(points, cellCount);

	if (!heightfield) {
		throw new Error('Expected synthetic heightfield to be created');
	}

	return heightfield;
};

describe('tenerifeFullIslandHeightfield', () => {
	it('samples terrain height when source cells cover the local position', () => {
		const heightfield = createExpectedHeightfield(
			createGridPoints(5, () => true),
			5,
		);

		expect(sampleTenerifeFullIslandHeightfield(heightfield, new Vector3(2, 0, 2))).toBeCloseTo(4);
	});

	it('keeps small source gaps valid for sparse terrain sampling', () => {
		const heightfield = createExpectedHeightfield(
			createGridPoints(5, (xIndex, zIndex) => !(xIndex === 2 && zIndex === 2)),
			5,
		);

		expect(sampleTenerifeFullIslandHeightfield(heightfield, new Vector3(2, 0, 2))).not.toBeNull();
	});

	it('rejects large filled spans so water and removed source planes do not become invisible ground', () => {
		const heightfield = createExpectedHeightfield(
			createGridPoints(9, (xIndex) => xIndex === 0 || xIndex === 8),
			9,
		);

		expect(sampleTenerifeFullIslandHeightfield(heightfield, new Vector3(4, 0, 4))).toBeNull();
	});
});
