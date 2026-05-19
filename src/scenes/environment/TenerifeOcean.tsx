import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import {
	TENERIFE_FULL_ISLAND_OCEAN_SIZE,
	TENERIFE_FULL_ISLAND_SEABED_Y,
	TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
} from './tenerifeFullIslandConfig';

type PropsType = {
	havokPlugin: HavokPlugin | null;
};

/**
 * Renders a controllable Atlantic ocean layer for the full-island terrain mode.
 */
const TenerifeOcean: React.FC<PropsType> = () => {
	return (
		<>
			<box
				name='tenerife-full-island-ocean-surface'
				position={new Vector3(0, TENERIFE_FULL_ISLAND_WATER_SURFACE_Y, 0)}
				scaling={new Vector3(TENERIFE_FULL_ISLAND_OCEAN_SIZE, 0.04, TENERIFE_FULL_ISLAND_OCEAN_SIZE)}
				size={1}
				onCreated={(mesh) => {
					mesh.isPickable = false;
				}}
			>
				<standardMaterial
					name='tenerife-full-island-ocean-material'
					alpha={0.74}
					diffuseColor={Color3.FromHexString('#0a6f86')}
					specularColor={Color3.FromHexString('#b7f3ff')}
				/>
			</box>
			<box
				name='tenerife-full-island-seabed'
				position={new Vector3(0, TENERIFE_FULL_ISLAND_SEABED_Y, 0)}
				scaling={new Vector3(TENERIFE_FULL_ISLAND_OCEAN_SIZE, 0.7, TENERIFE_FULL_ISLAND_OCEAN_SIZE)}
				size={1}
				visibility={0}
				onCreated={(mesh) => {
					mesh.isPickable = false;
				}}
			>
				<standardMaterial
					name='tenerife-full-island-seabed-material'
					diffuseColor={Color3.FromHexString('#504c3f')}
					specularColor={Color3.FromHexString('#242018')}
				/>
			</box>
		</>
	);
};

export default TenerifeOcean;
