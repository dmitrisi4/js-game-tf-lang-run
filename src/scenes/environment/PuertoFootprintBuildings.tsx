import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useScene } from 'react-babylonjs';
import {
	PUERTO_BUILDING_FOOTPRINTS_RUNTIME_URL,
	type PuertoFootprintBuildingsRuntimeDataType,
	TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_HORIZONTAL_SCALE_MULTIPLIER,
	TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_VERTICAL_SCALE_MULTIPLIER,
	transformPuertoFootprintBuilding,
} from './puertoFootprintBuildingData';
import type { TenerifeRoadTransformType } from './TenerifeGeoRoadLayers';
import type { WorldPosition } from './worldData';

type PropsType = {
	groundHeightProvider: (position: WorldPosition) => number | null;
	roadTransform: TenerifeRoadTransformType | undefined;
};

const FOOTPRINT_BUILDING_SURFACE_LIFT = 0.04;

const loadPuertoFootprintBuildings = async (): Promise<PuertoFootprintBuildingsRuntimeDataType> => {
	const response = await fetch(PUERTO_BUILDING_FOOTPRINTS_RUNTIME_URL);

	if (!response.ok) {
		throw new Error(`Failed to load Puerto footprint buildings: ${response.status}`);
	}

	return (await response.json()) as PuertoFootprintBuildingsRuntimeDataType;
};

/**
 * Renders OSM-derived Puerto de la Cruz building footprints on the full Tenerife island.
 */
const PuertoFootprintBuildings: React.FC<PropsType> = ({ groundHeightProvider, roadTransform }) => {
	const scene = useScene();
	const [runtimeData, setRuntimeData] = useState<PuertoFootprintBuildingsRuntimeDataType | null>(
		null,
	);

	useEffect(() => {
		let isDisposed = false;

		loadPuertoFootprintBuildings()
			.then((data) => {
				if (!isDisposed) {
					setRuntimeData(data);
				}
			})
			.catch((error: unknown) => {
				console.error('[PuertoFootprintBuildings] Failed to load runtime buildings', error);
			});

		return () => {
			isDisposed = true;
		};
	}, []);

	useEffect(() => {
		if (!scene || !roadTransform || !runtimeData) {
			return undefined;
		}

		const baseMesh = MeshBuilder.CreateBox('puerto-osm-footprint-buildings', { size: 1 }, scene);
		const material = new StandardMaterial('puerto-osm-footprint-buildings-material', scene);
		const matrixBuffer = new Float32Array(runtimeData.runtimeBuildings.length * 16);

		material.diffuseColor = Color3.FromHexString('#c8b58e');
		material.emissiveColor = Color3.FromHexString('#2f281d');
		material.specularColor = Color3.FromHexString('#15120f');
		material.freeze();
		baseMesh.material = material;
		baseMesh.isPickable = false;
		baseMesh.alwaysSelectAsActiveMesh = true;

		for (let index = 0; index < runtimeData.runtimeBuildings.length; index += 1) {
			const building = runtimeData.runtimeBuildings[index];
			const x = roadTransform.offset.x + building.position.x * roadTransform.scale;
			const z = roadTransform.offset.z + building.position.z * roadTransform.scale;
			const groundHeight = groundHeightProvider({ x, z });
			const instance = transformPuertoFootprintBuilding(building, roadTransform, {
				groundHeight,
				heightOffset: FOOTPRINT_BUILDING_SURFACE_LIFT,
				horizontalScaleMultiplier: TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_HORIZONTAL_SCALE_MULTIPLIER,
				verticalScaleMultiplier: TENERIFE_FULL_ISLAND_FOOTPRINT_BUILDING_VERTICAL_SCALE_MULTIPLIER,
			});
			const matrix = Matrix.Compose(
				new Vector3(instance.width, instance.height, instance.depth),
				Quaternion.RotationYawPitchRoll(instance.yaw, 0, 0),
				new Vector3(
					instance.position.x,
					instance.position.y + instance.height / 2,
					instance.position.z,
				),
			);

			matrix.copyToArray(matrixBuffer, index * 16);
		}

		baseMesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
		baseMesh.freezeWorldMatrix();

		return () => {
			baseMesh.dispose(false, true);
			material.dispose();
		};
	}, [groundHeightProvider, roadTransform, runtimeData, scene]);

	return null;
};

export default PuertoFootprintBuildings;
