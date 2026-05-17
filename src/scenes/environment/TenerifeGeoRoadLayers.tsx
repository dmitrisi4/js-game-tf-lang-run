import { Ray } from '@babylonjs/core/Culling/ray';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import { measureTenerifeSyncStep } from './tenerifePerformance';
import { isInsideTenerifeCityFootprint, type TenerifeRoadLayerData } from './tenerifeRoadLayers';

type PropsType = {
	roadLayers: TenerifeRoadLayerData[];
};

const ROAD_SURFACE_BIAS = 0.012;
const ROAD_GROUND_RAY_START_Y = 260;
const ROAD_GROUND_RAY_LENGTH = 560;

const getRoadSurfaceHeight = (
	position: { x: number; z: number },
	scene: NonNullable<ReturnType<typeof useScene>>,
): number | null => {
	const groundHit = scene.pickWithRay(
		new Ray(
			new Vector3(position.x, ROAD_GROUND_RAY_START_Y, position.z),
			Vector3.DownReadOnly,
			ROAD_GROUND_RAY_LENGTH,
		),
		(mesh) => mesh.name === 'ground1' && mesh.isEnabled() && mesh.isPickable,
	);

	if (groundHit?.hit && groundHit.pickedPoint) {
		return groundHit.pickedPoint.y + ROAD_SURFACE_BIAS;
	}

	return null;
};

const createRoadRibbonMesh = (
	name: string,
	lines: Vector3[][],
	width: number,
	color: Color3,
	scene: NonNullable<ReturnType<typeof useScene>>,
): Mesh => {
	return measureTenerifeSyncStep(`Road mesh creation: ${name}`, () => {
		const halfWidth = width / 2;
		const positions: number[] = [];
		const indices: number[] = [];
		let vertexIndex = 0;

		for (const line of lines) {
			for (let pointIndex = 0; pointIndex < line.length - 1; pointIndex += 1) {
				const from = line[pointIndex];
				const to = line[pointIndex + 1];
				const dx = to.x - from.x;
				const dz = to.z - from.z;
				const length = Math.hypot(dx, dz);
				const segmentMidpoint = {
					x: (from.x + to.x) / 2,
					z: (from.z + to.z) / 2,
				};

				if (length <= 0.01 || !isInsideTenerifeCityFootprint(segmentMidpoint)) {
					continue;
				}

				const nx = (-dz / length) * halfWidth;
				const nz = (dx / length) * halfWidth;
				const fromLeft = { x: from.x + nx, z: from.z + nz };
				const fromRight = { x: from.x - nx, z: from.z - nz };
				const toRight = { x: to.x - nx, z: to.z - nz };
				const toLeft = { x: to.x + nx, z: to.z + nz };
				const fromLeftY = getRoadSurfaceHeight(fromLeft, scene);
				const fromRightY = getRoadSurfaceHeight(fromRight, scene);
				const toRightY = getRoadSurfaceHeight(toRight, scene);
				const toLeftY = getRoadSurfaceHeight(toLeft, scene);

				if (fromLeftY === null || fromRightY === null || toRightY === null || toLeftY === null) {
					continue;
				}

				positions.push(
					fromLeft.x,
					fromLeftY,
					fromLeft.z,
					fromRight.x,
					fromRightY,
					fromRight.z,
					toRight.x,
					toRightY,
					toRight.z,
					toLeft.x,
					toLeftY,
					toLeft.z,
				);

				indices.push(
					vertexIndex,
					vertexIndex + 1,
					vertexIndex + 2,
					vertexIndex,
					vertexIndex + 2,
					vertexIndex + 3,
				);
				vertexIndex += 4;
			}
		}

		const normals: number[] = [];
		VertexData.ComputeNormals(positions, indices, normals);

		const mesh = new Mesh(name, scene);
		const vertexData = new VertexData();
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.normals = normals;
		vertexData.applyToMesh(mesh);

		const material = new StandardMaterial(`${name}-material`, scene);
		material.backFaceCulling = false;
		material.diffuseColor = color;
		material.emissiveColor = color.scale(0.18);
		material.specularColor = Color3.FromHexString('#15120f');
		material.freeze();
		mesh.material = material;
		mesh.isPickable = false;
		mesh.alwaysSelectAsActiveMesh = true;
		mesh.doNotSyncBoundingInfo = true;
		mesh.freezeWorldMatrix();

		return mesh;
	});
};

/**
 * Renders Puerto de la Cruz OSM roads from the exported GeoJSON file.
 *
 * The source is split into three visual layers so gameplay can tune road,
 * walking, and service readability independently.
 */
const TenerifeGeoRoadLayers: React.FC<PropsType> = ({ roadLayers }) => {
	const scene = useScene();
	const [isGroundMeshReady, setIsGroundMeshReady] = useState(false);
	const stableRoadLayers = useMemo(() => roadLayers, [roadLayers]);

	useBeforeRender(() => {
		if (!scene || isGroundMeshReady) {
			return;
		}

		const groundMesh = scene.getMeshByName('ground1');

		if (groundMesh?.isEnabled() && groundMesh.isPickable) {
			setIsGroundMeshReady(true);
		}
	});

	useEffect(() => {
		if (!scene || !isGroundMeshReady) {
			return undefined;
		}

		const meshes = stableRoadLayers
			.filter((layer) => layer.lines.length > 0)
			.map((layer) =>
				createRoadRibbonMesh(
					`tenerife-geo-roads-${layer.id}`,
					layer.lines,
					layer.width,
					layer.color,
					scene,
				),
			);

		return () => {
			for (const mesh of meshes) {
				mesh.dispose();
			}
		};
	}, [isGroundMeshReady, stableRoadLayers, scene]);

	return null;
};

export default TenerifeGeoRoadLayers;
