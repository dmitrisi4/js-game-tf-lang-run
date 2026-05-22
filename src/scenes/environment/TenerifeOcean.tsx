import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import { useEffect } from 'react';
import OceanSurface from './OceanSurface';
import { shouldHideCustomOcean, updateOceanDebugState } from './ocean/oceanDebug';
import {
	TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
	TENERIFE_FULL_ISLAND_OCEAN_SIZE,
	TENERIFE_FULL_ISLAND_SEABED_Y,
	TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
} from './tenerifeFullIslandConfig';

type PropsType = {
	havokPlugin: HavokPlugin | null;
};

const TENERIFE_FULL_ISLAND_OCEAN_BOUNDS = {
	maxX: TENERIFE_FULL_ISLAND_OCEAN_SIZE / 2,
	maxZ: TENERIFE_FULL_ISLAND_OCEAN_SIZE / 2,
	minX: -TENERIFE_FULL_ISLAND_OCEAN_SIZE / 2,
	minZ: -TENERIFE_FULL_ISLAND_OCEAN_SIZE / 2,
};

/**
 * Renders a controllable Atlantic ocean layer for the full-island terrain mode.
 */
const TenerifeOcean: React.FC<PropsType> = () => {
	const isCustomOceanHidden = shouldHideCustomOcean();

	useEffect(() => {
		updateOceanDebugState({
			customOceanHidden: isCustomOceanHidden,
			deepWaterResetY: TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
			mode: 'island-full',
			seabedY: TENERIFE_FULL_ISLAND_SEABED_Y,
			waterSurfaceY: TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
		});
	}, [isCustomOceanHidden]);

	return (
		<>
			{isCustomOceanHidden ? null : (
				<OceanSurface
					bounds={TENERIFE_FULL_ISLAND_OCEAN_BOUNDS}
					name='tenerife-full-island-ocean-surface'
					opacity={0.62}
					surfaceY={TENERIFE_FULL_ISLAND_WATER_SURFACE_Y}
				/>
			)}
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
