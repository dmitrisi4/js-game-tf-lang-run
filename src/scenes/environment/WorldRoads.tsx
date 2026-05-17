import { Ray } from '@babylonjs/core/Culling/ray';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type React from 'react';
import { useRef } from 'react';
import { useBeforeRender, useScene } from 'react-babylonjs';
import { getTerrainHeightAt } from './terrainData';
import type { WorldPosition, WorldRoad } from './worldData';

type PropsType = {
	groundMeshName?: string;
	positionOffset?: { x: number; z: number };
	roads: WorldRoad[];
};

type RoadSegmentPropsType = {
	from: WorldPosition;
	groundMeshName?: string;
	road: WorldRoad;
	segmentIndex: number;
	to: WorldPosition;
};

const ROAD_SURFACE_LIFT = 0.06;
const DEFAULT_ROAD_COLOR = '#514c45';
const ROAD_SPECULAR_COLOR = '#1a1714';

const getRoadPointHeight = (point: WorldPosition, road: WorldRoad): number =>
	getTerrainHeightAt(point) + (road.heightOffset ?? 0) + ROAD_SURFACE_LIFT;

const getRoadSegmentKey = (road: WorldRoad, from: WorldPosition, to: WorldPosition): string =>
	`${road.id}-${from.x}-${from.z}-${to.x}-${to.z}`;

const getOffsetPoint = (point: WorldPosition, positionOffset = { x: 0, z: 0 }): WorldPosition => ({
	x: point.x + positionOffset.x,
	z: point.z + positionOffset.z,
});

const RoadSegment: React.FC<RoadSegmentPropsType> = ({
	from,
	groundMeshName,
	road,
	segmentIndex,
	to,
}) => {
	const scene = useScene();
	const meshRef = useRef<Mesh | null>(null);
	const hasAlignedToGroundRef = useRef(false);
	const dx = to.x - from.x;
	const dz = to.z - from.z;
	const length = Math.hypot(dx, dz);
	const midpoint = {
		x: (from.x + to.x) / 2,
		z: (from.z + to.z) / 2,
	};
	const y = (getRoadPointHeight(from, road) + getRoadPointHeight(to, road)) / 2;
	const yaw = Math.atan2(dx, dz);

	useBeforeRender(() => {
		if (!scene || !groundMeshName || !meshRef.current || hasAlignedToGroundRef.current) {
			return;
		}

		const groundHit = scene.pickWithRay(
			new Ray(new Vector3(midpoint.x, 200, midpoint.z), Vector3.DownReadOnly, 400),
			(mesh) => mesh.name === groundMeshName && mesh.isEnabled() && mesh.isPickable,
		);

		if (!groundHit?.hit || !groundHit.pickedPoint) {
			return;
		}

		meshRef.current.position.y =
			groundHit.pickedPoint.y + (road.heightOffset ?? 0) + ROAD_SURFACE_LIFT;
		hasAlignedToGroundRef.current = true;
	});

	if (length <= 0.01) {
		return null;
	}

	return (
		<box
			name={`${road.id}-segment-${segmentIndex + 1}`}
			position={new Vector3(midpoint.x, y, midpoint.z)}
			rotation={new Vector3(0, yaw, 0)}
			scaling={new Vector3(road.width, 0.08, length + road.width * 0.55)}
			size={1}
			onCreated={(mesh) => {
				meshRef.current = mesh;
				mesh.isPickable = false;
			}}
		>
			<standardMaterial
				name={`${road.id}-segment-${segmentIndex + 1}-material`}
				diffuseColor={Color3.FromHexString(road.color ?? DEFAULT_ROAD_COLOR)}
				specularColor={Color3.FromHexString(ROAD_SPECULAR_COLOR)}
			/>
		</box>
	);
};

/**
 * Renders authored road polylines as low-profile Babylon meshes.
 *
 * @param {PropsType} props - Road placement data.
 * @returns {JSX.Element} Static road surfaces.
 */
const WorldRoads: React.FC<PropsType> = ({ groundMeshName, positionOffset, roads }) => (
	<>
		{roads.flatMap((road) =>
			road.points.slice(0, -1).map((point, index) => {
				const from = getOffsetPoint(point, positionOffset);
				const to = getOffsetPoint(road.points[index + 1], positionOffset);

				return (
					<RoadSegment
						key={getRoadSegmentKey(road, from, to)}
						from={from}
						groundMeshName={groundMeshName}
						road={road}
						segmentIndex={index}
						to={to}
					/>
				);
			}),
		)}
	</>
);

export default WorldRoads;
