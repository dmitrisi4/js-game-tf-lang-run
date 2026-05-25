import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import { useEffect } from 'react';
import OceanSurface from './OceanSurface';
import { shouldHideCustomOcean, updateOceanDebugState } from './ocean/oceanDebug';
import ShorelineDepthFloor from './ShorelineDepthFloor';
import ShorelineSurf from './ShorelineSurf';
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
				<>
					<OceanSurface
						bounds={TENERIFE_FULL_ISLAND_OCEAN_BOUNDS}
						name='tenerife-full-island-ocean-surface'
						opacity={0.86}
						surfaceY={TENERIFE_FULL_ISLAND_WATER_SURFACE_Y}
					/>
					<ShorelineSurf
						bounds={TENERIFE_FULL_ISLAND_OCEAN_BOUNDS}
						name='tenerife-full-island-shoreline-surf'
						surfaceY={TENERIFE_FULL_ISLAND_WATER_SURFACE_Y}
					/>
				</>
			)}
			<ShorelineDepthFloor
				bounds={TENERIFE_FULL_ISLAND_OCEAN_BOUNDS}
				name='tenerife-full-island-seabed'
				y={TENERIFE_FULL_ISLAND_SEABED_Y}
			/>
		</>
	);
};

export default TenerifeOcean;
