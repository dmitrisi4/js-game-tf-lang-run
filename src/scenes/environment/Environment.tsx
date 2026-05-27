import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Clouds from './Clouds';
import Ground from './Ground';
import Lighting from './Lighting';
import PuertoCityTerrain from './PuertoCityTerrain';
import PuertoFootprintBuildings from './PuertoFootprintBuildings';
import {
	getPuertoRoadRenderMode,
	getPuertoTerrainMode,
	shouldRenderPuertoBuildingsOnFullIsland,
	shouldRenderRoadMeshes,
} from './puertoCityConfig';
import SkyDome from './SkyDome';
import TenerifeFullIslandTerrain from './TenerifeFullIslandTerrain';
import TenerifeGeoRoadLayers from './TenerifeGeoRoadLayers';
import TenerifeIslandPreview from './TenerifeIslandPreview';
import TenerifeOcean from './TenerifeOcean';
import TenerifeSafetyLayer from './TenerifeSafetyLayer';
import {
	getTenerifeFullIslandPuertoOverlayTransform,
	shouldRenderPuertoOnFullIsland,
} from './tenerifeFullIslandConfig';
import { getTenerifeFullIslandHeightAtPosition } from './tenerifeFullIslandHeightfield';
import { loadTenerifeGeoData, type TenerifeGeoData } from './tenerifeGeoData';
import WorldBuildings from './WorldBuildings';
import WorldScenery from './WorldScenery';
import type { WorldBuilding } from './worldData';
import { TENERIFE_PREVIEW_BUILDINGS } from './worldData';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

const EMPTY_WORLD_BUILDINGS: WorldBuilding[] = [];
const TENERIFE_FULL_ISLAND_PUERTO_READABILITY_SCALE = 3;
const TENERIFE_FULL_ISLAND_PUERTO_ROAD_WIDTH_SCALE = 2;
const TENERIFE_FULL_ISLAND_PUERTO_MAX_INLAND_ROAD_OFFSET = 40;
const TENERIFE_FULL_ISLAND_VISIBLE_ROAD_LAYER_IDS = ['main', 'service'] as const;

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
	const shouldRenderFullIslandPuertoOverlay = shouldRenderPuertoOnFullIsland();
	const shouldRenderFullIslandPuertoBuildings = shouldRenderPuertoBuildingsOnFullIsland();
	const shouldRenderTenerifeRoadMeshes = shouldRenderRoadMeshes(puertoRoadRenderMode);
	const fullIslandPuertoOverlayBaseTransform = useMemo(
		() =>
			isFullIslandTerrainEnabled && shouldRenderFullIslandPuertoOverlay
				? getTenerifeFullIslandPuertoOverlayTransform()
				: null,
		[isFullIslandTerrainEnabled, shouldRenderFullIslandPuertoOverlay],
	);
	const roadTransform = useMemo(
		() =>
			fullIslandPuertoOverlayBaseTransform
				? {
						clip: {
							maxZ:
								fullIslandPuertoOverlayBaseTransform.position.z +
								TENERIFE_FULL_ISLAND_PUERTO_MAX_INLAND_ROAD_OFFSET,
						},
						offset: {
							x: fullIslandPuertoOverlayBaseTransform.position.x,
							z: fullIslandPuertoOverlayBaseTransform.position.z,
						},
						roadWidthScaleMultiplier: TENERIFE_FULL_ISLAND_PUERTO_ROAD_WIDTH_SCALE,
						scale:
							fullIslandPuertoOverlayBaseTransform.scale * TENERIFE_FULL_ISLAND_PUERTO_READABILITY_SCALE,
					}
				: undefined,
		[fullIslandPuertoOverlayBaseTransform],
	);

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
	const geoRoadsideBuildings: WorldBuilding[] = isPuertoCityTerrainEnabled
		? EMPTY_WORLD_BUILDINGS
		: isFullIslandTerrainEnabled
			? EMPTY_WORLD_BUILDINGS
			: (tenerifeGeoData?.roadsideBuildings ?? []);
	const fullIslandGroundHeightProvider = useCallback(
		(position: { x: number; z: number }): number | null => {
			if (!isFullIslandTerrainEnabled || !isTenerifeIslandReady) {
				return null;
			}

			return getTenerifeFullIslandHeightAtPosition(new Vector3(position.x, 0, position.z));
		},
		[isFullIslandTerrainEnabled, isTenerifeIslandReady],
	);

	return (
		<>
			<SkyDome />
			<Clouds />
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
					{shouldRenderTenerifeRoadMeshes ? (
						<TenerifeGeoRoadLayers
							groundHeightProvider={
								isFullIslandTerrainEnabled ? fullIslandGroundHeightProvider : undefined
							}
							roadLayers={geoRoadLayers}
							roadTransform={roadTransform}
							visibleLayerIds={
								isFullIslandTerrainEnabled ? TENERIFE_FULL_ISLAND_VISIBLE_ROAD_LAYER_IDS : undefined
							}
						/>
					) : null}
					<WorldBuildings
						buildings={
							isPuertoCityTerrainEnabled || isFullIslandTerrainEnabled
								? EMPTY_WORLD_BUILDINGS
								: TENERIFE_PREVIEW_BUILDINGS
						}
						debugLabel='Tenerife preview buildings'
						groundMeshName='ground1'
						havokPlugin={null}
						onReadyChange={setAreBuildingsReady}
					/>
					<WorldBuildings
						buildings={geoRoadsideBuildings}
						debugLabel='Tenerife generated roadside buildings'
						groundHeightProvider={isFullIslandTerrainEnabled ? fullIslandGroundHeightProvider : undefined}
						groundMeshName={isFullIslandTerrainEnabled ? undefined : 'ground1'}
						havokPlugin={null}
						visualMode={isFullIslandTerrainEnabled ? 'boxes' : 'models'}
					/>
					{isFullIslandTerrainEnabled &&
					shouldRenderFullIslandPuertoOverlay &&
					shouldRenderFullIslandPuertoBuildings &&
					isTenerifeIslandReady &&
					roadTransform ? (
						<PuertoFootprintBuildings
							groundHeightProvider={fullIslandGroundHeightProvider}
							roadTransform={roadTransform}
						/>
					) : null}
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
