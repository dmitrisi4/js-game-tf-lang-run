import { describe, expect, it } from 'vitest';
import {
	activateMountainTreeInstanceMesh,
	createMountainTreeDebugSummary,
	isMountainTreeGroundAboveWater,
	isMountainTreeTrunkRoot,
	prepareMountainTreeSourceMesh,
	resolveMountainTreeGroundY,
	shouldRenderMountainTreeSourceRoot,
} from '@/scenes/environment/TenerifeMountainTrees';
import { TENERIFE_FULL_ISLAND_WATER_SURFACE_Y } from '@/scenes/environment/tenerifeFullIslandConfig';

type TestTreeMeshType = {
	doNotSyncBoundingInfo: boolean;
	isPickable: boolean;
	isVisible: boolean;
	matrixBuffer: Float32Array | null;
	refreshCount: number;
	thinInstanceEnablePicking: boolean;
	thinInstanceRefreshBoundingInfo: (forceRefreshParentInfo: boolean) => void;
	thinInstanceSetBuffer: (
		kind: string,
		buffer: Float32Array,
		stride: number,
		staticBuffer: boolean,
	) => void;
};

const createTestTreeMesh = (): TestTreeMeshType => ({
	doNotSyncBoundingInfo: true,
	isPickable: true,
	isVisible: true,
	matrixBuffer: null,
	refreshCount: 0,
	thinInstanceEnablePicking: true,
	thinInstanceRefreshBoundingInfo: () => {
		// The test only needs to prove that bounds refresh is requested.
	},
	thinInstanceSetBuffer: () => {
		// Assigned per test when we need to inspect arguments.
	},
});

describe('TenerifeMountainTrees', () => {
	it('hides imported source meshes until thin-instance transforms are ready', () => {
		const mesh = createTestTreeMesh();

		prepareMountainTreeSourceMesh(mesh);

		expect(mesh.isPickable).toBe(false);
		expect(mesh.thinInstanceEnablePicking).toBe(false);
		expect(mesh.doNotSyncBoundingInfo).toBe(false);
		expect(mesh.isVisible).toBe(false);
	});

	it('keeps tree thin-instance meshes visible after refreshing placement bounds', () => {
		const mesh = createTestTreeMesh();
		const matrixBuffer = new Float32Array(16);

		mesh.thinInstanceSetBuffer = (kind, buffer, stride, staticBuffer) => {
			expect(kind).toBe('matrix');
			expect(buffer).toBe(matrixBuffer);
			expect(stride).toBe(16);
			expect(staticBuffer).toBe(false);
			mesh.matrixBuffer = buffer;
		};
		mesh.thinInstanceRefreshBoundingInfo = (forceRefreshParentInfo) => {
			expect(forceRefreshParentInfo).toBe(true);
			mesh.refreshCount += 1;
		};

		activateMountainTreeInstanceMesh(mesh, matrixBuffer);

		expect(mesh.matrixBuffer).toBe(matrixBuffer);
		expect(mesh.refreshCount).toBe(1);
		expect(mesh.doNotSyncBoundingInfo).toBe(true);
		expect(mesh.isVisible).toBe(true);
	});

	it('filters source-offset helper roots that would render stray tree artifacts', () => {
		expect(shouldRenderMountainTreeSourceRoot({ name: 'tenerife-spruce-base-mini_tree_1' })).toBe(
			false,
		);
		expect(shouldRenderMountainTreeSourceRoot({ name: 'tenerife-spruce-base-dry branch.004' })).toBe(
			false,
		);
		expect(shouldRenderMountainTreeSourceRoot({ name: 'tenerife-spruce-base-big_branch_1' })).toBe(
			true,
		);
		expect(shouldRenderMountainTreeSourceRoot({ name: 'tenerife-spruce-base-tree trunk' })).toBe(
			true,
		);
	});

	it('uses the trunk root as the imported tree ground anchor', () => {
		expect(isMountainTreeTrunkRoot({ name: 'tenerife-spruce-base-tree trunk' })).toBe(true);
		expect(isMountainTreeTrunkRoot({ name: 'tenerife-spruce-base-big_branch_1' })).toBe(false);
	});

	it('rejects terrain samples that would place tree trunks under the ocean surface', () => {
		expect(isMountainTreeGroundAboveWater(TENERIFE_FULL_ISLAND_WATER_SURFACE_Y + 0.25)).toBe(false);
		expect(isMountainTreeGroundAboveWater(TENERIFE_FULL_ISLAND_WATER_SURFACE_Y + 1)).toBe(true);
	});

	it('keeps mountain trees visible when heightfield is valid but raycast misses', () => {
		expect(resolveMountainTreeGroundY(null, TENERIFE_FULL_ISLAND_WATER_SURFACE_Y + 24)).toBe(
			TENERIFE_FULL_ISLAND_WATER_SURFACE_Y + 24,
		);
		expect(resolveMountainTreeGroundY(null, TENERIFE_FULL_ISLAND_WATER_SURFACE_Y + 0.25)).toBe(null);
	});

	it('summarizes live mountain tree placement diagnostics', () => {
		const summary = createMountainTreeDebugSummary(
			[
				{
					id: 'tree-a',
					position: { x: -10, z: -30 },
					regionId: 'upper-mountain-belt',
					scale: 0.3,
					terrainSample: { height: 25, slope: 0.1 },
					yaw: 0,
				},
				{
					id: 'tree-b',
					position: { x: 20, z: 40 },
					regionId: 'upper-mountain-belt',
					scale: 0.35,
					terrainSample: { height: 35, slope: 0.2 },
					yaw: 0.5,
				},
			],
			1,
			7,
			3,
		);

		expect(summary).toEqual({
			bounds: {
				maxHeight: 35,
				maxX: 20,
				maxZ: 40,
				minHeight: 25,
				minX: -10,
				minZ: -30,
			},
			instanceMeshCount: 7,
			placementCount: 2,
			renderableRootCount: 3,
			visibleCount: 1,
		});
	});
});
