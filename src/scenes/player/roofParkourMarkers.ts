import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Scene } from '@babylonjs/core/scene';
import type { RoofParkourDebugPayloadType } from './roofParkourController';

export type RoofParkourMarkerRendererType = {
	dispose: () => void;
	render: (payload: RoofParkourDebugPayloadType | null) => void;
};

const MARKER_COLOR = Color3.FromHexString('#ffd84a');
const MARKER_LENGTH = 1.35;
const MARKER_HEIGHT_OFFSET = 0.07;
const MARKER_OUTWARD_OFFSET = 0.08;

const createMarkerMaterial = (scene: Scene): StandardMaterial => {
	const existing = scene.getMaterialByName('roof-parkour-marker-material');

	if (existing instanceof StandardMaterial) {
		return existing;
	}

	const material = new StandardMaterial('roof-parkour-marker-material', scene);

	material.diffuseColor = MARKER_COLOR;
	material.emissiveColor = MARKER_COLOR;
	material.specularColor = Color3.White();
	material.alpha = 0.82;

	return material;
};

const getMarkerPoints = (payload: RoofParkourDebugPayloadType): Vector3[] | null => {
	if (!payload.roofHit || !payload.wallNormal) {
		return null;
	}

	const planarNormal = new Vector3(payload.wallNormal.x, 0, payload.wallNormal.z);

	if (planarNormal.lengthSquared() === 0) {
		return null;
	}

	planarNormal.normalize();
	const tangent = new Vector3(-planarNormal.z, 0, planarNormal.x);
	const center = payload.roofHit
		.add(planarNormal.scale(MARKER_OUTWARD_OFFSET))
		.add(new Vector3(0, MARKER_HEIGHT_OFFSET, 0));

	return [
		center.subtract(tangent.scale(MARKER_LENGTH * 0.5)),
		center.add(tangent.scale(MARKER_LENGTH * 0.5)),
	];
};

/** Creates the in-world ledge hint shown for currently reachable roof edges. */
export const createRoofParkourMarkerRenderer = (scene: Scene): RoofParkourMarkerRendererType => {
	const material = createMarkerMaterial(scene);
	let markerMeshes: { dispose: () => void }[] = [];

	const clear = () => {
		for (const mesh of markerMeshes) {
			mesh.dispose();
		}

		markerMeshes = [];
	};

	return {
		dispose: clear,
		render: (payload) => {
			clear();

			if (!payload?.hangCenter || !payload.landingCenter) {
				return;
			}

			const points = getMarkerPoints(payload);

			if (!points) {
				return;
			}

			const strip = MeshBuilder.CreateTube(
				'roof-parkour-ledge-marker',
				{ path: points, radius: 0.035, tessellation: 8 },
				scene,
			);

			strip.material = material;
			strip.isPickable = false;
			markerMeshes.push(strip);

			const halo = MeshBuilder.CreateSphere(
				'roof-parkour-ledge-marker-halo',
				{ diameter: 0.18, segments: 12 },
				scene,
			);

			halo.position.copyFrom(
				points[0]
					.add(points[1])
					.scale(0.5)
					.add(new Vector3(0, 0.16, 0)),
			);
			halo.material = material;
			halo.isPickable = false;
			markerMeshes.push(halo);
		},
	};
};
