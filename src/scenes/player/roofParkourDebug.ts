import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Scene } from '@babylonjs/core/scene';
import type { RoofParkourDebugPayloadType } from './roofParkourController';

export type RoofParkourDebugRendererType = {
	dispose: () => void;
	render: (payload: RoofParkourDebugPayloadType | null) => void;
};

const DEBUG_SPHERE_SIZE = 0.16;

const DEBUG_COLORS = {
	capsule: Color3.FromHexString('#ff3fff'),
	hang: Color3.FromHexString('#ffd84a'),
	landing: Color3.FromHexString('#28e66b'),
	roof: Color3.FromHexString('#39d9ff'),
	wall: Color3.FromHexString('#ff4a4a'),
	wallNormal: Color3.FromHexString('#ff9d2e'),
};

const createLine = (scene: Scene, name: string, points: Vector3[], color: Color3) => {
	const line = MeshBuilder.CreateLines(name, { points }, scene);

	line.color = color;
	line.isPickable = false;

	return line;
};

const createPoint = (scene: Scene, name: string, position: Vector3, color: Color3) => {
	const point = MeshBuilder.CreateSphere(name, { diameter: DEBUG_SPHERE_SIZE, segments: 8 }, scene);

	point.position.copyFrom(position);
	point.isPickable = false;
	point.visibility = 0.86;
	point.overlayColor = color;
	point.renderOverlay = true;

	return point;
};

/** Creates an opt-in renderer for roof parkour debug probes. */
export const createRoofParkourDebugRenderer = (scene: Scene): RoofParkourDebugRendererType => {
	let debugMeshes: { dispose: () => void }[] = [];

	const clear = () => {
		for (const mesh of debugMeshes) {
			mesh.dispose();
		}

		debugMeshes = [];
	};

	return {
		dispose: clear,
		render: (payload) => {
			clear();

			if (!payload) {
				return;
			}

			if (payload.wallRayOrigin && payload.wallRayEnd) {
				debugMeshes.push(
					createLine(
						scene,
						'roof-debug-wall-ray',
						[payload.wallRayOrigin, payload.wallRayEnd],
						DEBUG_COLORS.wall,
					),
				);
			}

			if (payload.roofProbeOrigin && payload.roofProbeEnd) {
				debugMeshes.push(
					createLine(
						scene,
						'roof-debug-roof-ray',
						[payload.roofProbeOrigin, payload.roofProbeEnd],
						DEBUG_COLORS.roof,
					),
				);
			}

			if (payload.wallHit) {
				debugMeshes.push(createPoint(scene, 'roof-debug-wall-hit', payload.wallHit, DEBUG_COLORS.wall));
			}

			if (payload.wallHit && payload.wallNormal) {
				debugMeshes.push(
					createLine(
						scene,
						'roof-debug-wall-normal',
						[payload.wallHit, payload.wallHit.add(payload.wallNormal.scale(0.75))],
						DEBUG_COLORS.wallNormal,
					),
				);
			}

			if (payload.roofHit) {
				debugMeshes.push(createPoint(scene, 'roof-debug-roof-hit', payload.roofHit, DEBUG_COLORS.roof));
			}

			if (payload.hangCenter) {
				debugMeshes.push(createPoint(scene, 'roof-debug-hang', payload.hangCenter, DEBUG_COLORS.hang));
			}

			if (payload.landingCenter) {
				debugMeshes.push(
					createPoint(scene, 'roof-debug-landing', payload.landingCenter, DEBUG_COLORS.landing),
				);
			}

			debugMeshes.push(
				createPoint(scene, 'roof-debug-capsule', payload.capsuleCenter, DEBUG_COLORS.capsule),
			);
			debugMeshes.push(
				createLine(
					scene,
					'roof-debug-foot-baseline',
					[
						new Vector3(payload.capsuleCenter.x - 0.35, payload.visualFootY, payload.capsuleCenter.z),
						new Vector3(payload.capsuleCenter.x + 0.35, payload.visualFootY, payload.capsuleCenter.z),
					],
					DEBUG_COLORS.capsule,
				),
			);
		},
	};
};
