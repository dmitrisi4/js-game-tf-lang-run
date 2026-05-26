import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Clouds from './Clouds';
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
import {
	getTenerifeFullIslandPuertoOverlayTransform,
	shouldRenderPuertoOnFullIsland,
} from './tenerifeFullIslandConfig';
import { getTenerifeFullIslandHeightAtPosition } from './tenerifeFullIslandHeightfield';
import { loadTenerifeGeoData, type TenerifeGeoData } from './tenerifeGeoData';
import { transformTenerifeRoadsideBuildings } from './tenerifeRoadLayers';
import WorldBuildings from './WorldBuildings';
import WorldScenery from './WorldScenery';
import type { WorldBuilding } from './worldData';
import { TENERIFE_PREVIEW_BUILDINGS } from './worldData';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

const EMPTY_WORLD_BUILDINGS: WorldBuilding[] = [];
const TENERIFE_FULL_ISLAND_BUILDING_GROUND_SINK = 1.8;
const TENERIFE_FULL_ISLAND_BUILDING_POSITION_SCALE_MULTIPLIER = 5;
const TENERIFE_FULL_ISLAND_BUILDING_VISUAL_SCALE_MULTIPLIER = 12;

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
						offset: {
							x: fullIslandPuertoOverlayBaseTransform.position.x,
							z: fullIslandPuertoOverlayBaseTransform.position.z,
						},
						scale: fullIslandPuertoOverlayBaseTransform.scale,
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
	const fullIslandRoadsideBuildings = useMemo<WorldBuilding[]>(
		() =>
			roadTransform
				? transformTenerifeRoadsideBuildings(tenerifeGeoData?.roadsideBuildings ?? [], roadTransform, {
						groundSink: TENERIFE_FULL_ISLAND_BUILDING_GROUND_SINK,
						positionScaleMultiplier: TENERIFE_FULL_ISLAND_BUILDING_POSITION_SCALE_MULTIPLIER,
						visualScaleMultiplier: TENERIFE_FULL_ISLAND_BUILDING_VISUAL_SCALE_MULTIPLIER,
					})
				: EMPTY_WORLD_BUILDINGS,
		[roadTransform, tenerifeGeoData?.roadsideBuildings],
	);
	const geoRoadsideBuildings: WorldBuilding[] = isPuertoCityTerrainEnabled
		? EMPTY_WORLD_BUILDINGS
		: isFullIslandTerrainEnabled
			? fullIslandRoadsideBuildings
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
						<TenerifeGeoRoadLayers roadLayers={geoRoadLayers} roadTransform={roadTransform} />
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
