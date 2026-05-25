import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import { useEffect, useState } from 'react';
import Ground from './Ground';
import Lighting from './Lighting';
import PuertoCityTerrain from './PuertoCityTerrain';
import {
	getPuertoRoadRenderMode,
	getPuertoTerrainMode,
	shouldRenderRoadMeshes,
} from './puertoCityConfig';
import SkyDome from './SkyDome';
import TenerifeFullIslandTerrain from './TenerifeFullIslandTerrain';
import TenerifeGeoRoadLayers from './TenerifeGeoRoadLayers';
import TenerifeIslandPreview from './TenerifeIslandPreview';
import TenerifeOcean from './TenerifeOcean';
import TenerifeSafetyLayer from './TenerifeSafetyLayer';
import { loadTenerifeGeoData, type TenerifeGeoData } from './tenerifeGeoData';
import WorldBuildings from './WorldBuildings';
import WorldScenery from './WorldScenery';
import type { WorldBuilding } from './worldData';
import { TENERIFE_PREVIEW_BUILDINGS } from './worldData';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

/**
 * Composes the baseline environment for the current prototype scene.
 *
 * @param {PropsType} props - Environment configuration props.
 * @returns {JSX.Element} The environment subtree.
 */
const Environment: React.FC<PropsType> = ({ havokPlugin, onReadyChange }) => {
	const [areBuildingsReady, setAreBuildingsReady] = useState(false);
	const [tenerifeGeoData, setTenerifeGeoData] = useState<TenerifeGeoData | null>(null);
	const [isTenerifeIslandReady, setIsTenerifeIslandReady] = useState(false);
	const isTenerifePreviewEnabled =
		typeof window !== 'undefined' &&
		new URLSearchParams(window.location.search).get('tenerife') === '1';
	const puertoTerrainMode = getPuertoTerrainMode();
	const puertoRoadRenderMode = getPuertoRoadRenderMode(puertoTerrainMode);
	const isPuertoCityTerrainEnabled = isTenerifePreviewEnabled && puertoTerrainMode === 'real';
	const isFullIslandTerrainEnabled = isTenerifePreviewEnabled && puertoTerrainMode === 'island-full';
	const shouldRenderTenerifeRoadMeshes = shouldRenderRoadMeshes(puertoRoadRenderMode);

	useEffect(() => {
		setAreBuildingsReady(false);
		setIsTenerifeIslandReady(!isTenerifePreviewEnabled);
	}, [isTenerifePreviewEnabled]);

	useEffect(() => {
		onReadyChange?.(areBuildingsReady && (isTenerifePreviewEnabled ? isTenerifeIslandReady : true));
	}, [areBuildingsReady, isTenerifeIslandReady, isTenerifePreviewEnabled, onReadyChange]);

	useEffect(() => {
		if (!isTenerifePreviewEnabled) {
			setTenerifeGeoData(null);
			return undefined;
		}

		let isDisposed = false;

		loadTenerifeGeoData()
			.then((geoData) => {
				if (!isDisposed) {
					setTenerifeGeoData(geoData);
				}
			})
			.catch((error: unknown) => {
				console.error('[Tenerife] Failed to load runtime road data', error);
			});

		return () => {
			isDisposed = true;
		};
	}, [isTenerifePreviewEnabled]);

	const geoRoadLayers = tenerifeGeoData?.roadLayers ?? [];
	const geoRoadsideBuildings: WorldBuilding[] =
		isPuertoCityTerrainEnabled || isFullIslandTerrainEnabled
			? []
			: (tenerifeGeoData?.roadsideBuildings ?? []);

	return (
		<>
			<SkyDome />
			<Lighting />
			{isTenerifePreviewEnabled ? (
				<>
					{isPuertoCityTerrainEnabled ? (
						<PuertoCityTerrain havokPlugin={havokPlugin} onReadyChange={setIsTenerifeIslandReady} />
					) : isFullIslandTerrainEnabled ? (
						<TenerifeFullIslandTerrain
							havokPlugin={havokPlugin}
							onReadyChange={setIsTenerifeIslandReady}
						/>
					) : (
						<TenerifeIslandPreview havokPlugin={havokPlugin} onReadyChange={setIsTenerifeIslandReady} />
					)}
					{isFullIslandTerrainEnabled && isTenerifeIslandReady ? (
						<TenerifeOcean havokPlugin={havokPlugin} />
					) : null}
					<TenerifeSafetyLayer
						havokPlugin={havokPlugin}
						renderWaterVisuals={!isFullIslandTerrainEnabled}
					/>
					{shouldRenderTenerifeRoadMeshes ? <TenerifeGeoRoadLayers roadLayers={geoRoadLayers} /> : null}
					<WorldBuildings
						buildings={
							isPuertoCityTerrainEnabled || isFullIslandTerrainEnabled ? [] : TENERIFE_PREVIEW_BUILDINGS
						}
						debugLabel='Tenerife preview buildings'
						groundMeshName='ground1'
						havokPlugin={null}
						onReadyChange={setAreBuildingsReady}
					/>
					<WorldBuildings
						buildings={geoRoadsideBuildings}
						debugLabel='Tenerife generated roadside buildings'
						groundMeshName='ground1'
						havokPlugin={null}
					/>
				</>
			) : (
				<>
					<Ground havokPlugin={havokPlugin} />
					<WorldScenery havokPlugin={havokPlugin} onBuildingsReadyChange={setAreBuildingsReady} />
				</>
			)}
		</>
	);
};

export default Environment;
