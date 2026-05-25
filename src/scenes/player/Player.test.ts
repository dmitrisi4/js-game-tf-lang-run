import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import { describe, expect, it } from 'vitest';
import { TENERIFE_FULL_ISLAND_TERRAIN_PREFIX } from '@/scenes/environment/tenerifeFullIslandConfig';
import { getTenerifeFullIslandSupportAtPosition } from './Player';
import { getCapsuleCenterYForFloor } from './playerCapsuleMetrics';

describe('Player full-island terrain support', () => {
	it('prefers the rendered terrain raycast height for capsule grounding', () => {
		const terrainMeshName = `${TENERIFE_FULL_ISLAND_TERRAIN_PREFIX}0`;
		const scene = {
			pickWithRay: (_ray: unknown, predicate: (mesh: never) => boolean) => {
				const mesh = {
					isEnabled: () => true,
					isPickable: true,
					name: terrainMeshName,
				};

				expect(predicate(mesh as never)).toBe(true);

				return {
					getNormal: () => Vector3.Up(),
					hit: true,
					pickedPoint: new Vector3(10, 12, -4),
				};
			},
		} as unknown as BabylonScene;

		const support = getTenerifeFullIslandSupportAtPosition(new Vector3(10, 100, -4), scene);

		expect(support?.supportedCenterY).toBeCloseTo(getCapsuleCenterYForFloor(12));
		expect(support?.normal?.equals(Vector3.Up())).toBe(true);
	});

	it('returns null when no rendered terrain or heightfield support is available', () => {
		const scene = {
			pickWithRay: () => ({
				hit: false,
				pickedPoint: null,
			}),
		} as unknown as BabylonScene;

		expect(getTenerifeFullIslandSupportAtPosition(new Vector3(0, 0, 0), scene)).toBeNull();
	});
});
