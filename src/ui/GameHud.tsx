import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type React from 'react';
import { useMemo, useState } from 'react';
import type { CollectibleSpawnPoint } from '@/scenes/discovery/collectibleTypes';
import { TENERIFE_FULL_ISLAND_MAP_DATA } from '@/scenes/environment/tenerifeFullIslandMapData';
import { getWorldPopulationSummary } from '@/scenes/environment/worldData';
import {
	selectInventoryLetters,
	selectInventoryWords,
	selectIsInventoryOpen,
	selectPlayerNextLevelXp,
	selectPlayerStats,
	selectPlayerXp,
} from '@/store/selectors';
import { useGameStore } from '@/store/useGameStore';
import {
	getMapBounds,
	getMapMode,
	getPlayerMapPoint,
	type MapBoundsType,
	type MapModeType,
	type MapPointType,
	offsetWorldPointByMapPercent,
	projectTenerifeGeoToFullIslandWorldPoint,
	toMapPoint,
} from './mapProjection';
import './gameHud.css';

type PropsType = {
	currentZoneName: string;
	isTenerifeModeEnabled: boolean;
	nearbyCollectible: CollectibleSpawnPoint | null;
	objectiveLabel: string;
	playerPosition: Vector3 | null;
};

const worldSummary = getWorldPopulationSummary();

type MapMarker = {
	id: string;
	label: string;
	x: number;
	z: number;
};

const TENERIFE_MAP_LAND_PATH =
	'M 1.7 54.9 L 4.4 43.3 L 8.6 37.2 L 13.8 29.6 L 21.3 24.6 L 30.5 20.3 L 40.0 15.4 L 50.3 8.4 L 58.4 6.1 L 65.5 9.6 L 74.5 14.9 L 81.4 13.4 L 88.3 6.1 L 96.0 4.8 L 98.9 14.2 L 96.2 25.3 L 91.7 33.2 L 88.6 42.8 L 84.6 53.2 L 79.5 65.1 L 74.7 74.2 L 68.7 81.5 L 60.7 86.6 L 52.9 90.4 L 46.6 95.4 L 38.2 95.9 L 30.1 91.6 L 23.2 85.8 L 16.8 78.2 L 11.8 70.1 L 6.0 63.5 Z';
const TENERIFE_MAP_RIDGE_PATH =
	'M 6.9 62.0 L 19.5 64.6 L 32.2 59.5 L 45.5 47.8 L 56.3 39.2 L 66.7 31.6 L 79.3 24.1 L 92.0 13.9';
const TENERIFE_MAP_NORTH_ROUTE_PATH =
	'M 6.9 51.9 L 19.5 26.1 L 27.6 29.1 L 43.4 16.2 L 55.5 9.9 L 82.2 24.6 L 88.5 31.1';
const TENERIFE_MAP_SOUTH_ROUTE_PATH =
	'M 88.5 31.1 L 75.9 59.5 L 44.8 95.4 L 35.1 88.4 L 24.7 80.8 L 6.9 51.9';
const TENERIFE_MAP_TEIDE_ROUTE_PATH = 'M 55.5 9.9 L 50.8 18.0 L 45.5 47.8 L 44.8 95.4';
const TENERIFE_SETTLEMENT_MARKERS: MapMarker[] = [
	{ id: 'puerto-de-la-cruz', label: 'Puerto de la Cruz', x: 6.25, z: 15.58 },
	{ id: 'la-orotava', label: 'La Orotava', x: 2.2, z: 12.4 },
	{ id: 'los-realejos', label: 'Los Realejos', x: -4.2, z: 13.1 },
	{ id: 'icod', label: 'Icod de los Vinos', x: -18, z: 8 },
	{ id: 'garachico', label: 'Garachico', x: -25, z: 9.2 },
	{ id: 'buenavista', label: 'Buenavista del Norte', x: -36, z: -1 },
	{ id: 'santa-cruz', label: 'Santa Cruz de Tenerife', x: 35, z: 7.2 },
	{ id: 'la-laguna', label: 'La Laguna', x: 29.5, z: 9.8 },
	{ id: 'candelaria', label: 'Candelaria', x: 24, z: -4 },
	{ id: 'adeje', label: 'Adeje', x: -20.5, z: -12.4 },
	{ id: 'los-cristianos', label: 'Los Cristianos', x: -11.5, z: -15.4 },
];

/** Projects a real city coordinate and applies small visual calibration for the current island mesh. */
const projectFullIslandCityMarker = (
	point: Parameters<typeof projectTenerifeGeoToFullIslandWorldPoint>[0],
	offset?: Parameters<typeof offsetWorldPointByMapPercent>[1],
): { x: number; z: number } => {
	const worldPoint = projectTenerifeGeoToFullIslandWorldPoint(point);

	return offset ? offsetWorldPointByMapPercent(worldPoint, offset) : worldPoint;
};
const TENERIFE_FULL_ISLAND_MARKERS: MapMarker[] = [
	{
		id: 'teide',
		label: TENERIFE_FULL_ISLAND_MAP_DATA.landmarks.teide.label,
		x: TENERIFE_FULL_ISLAND_MAP_DATA.landmarks.teide.x,
		z: TENERIFE_FULL_ISLAND_MAP_DATA.landmarks.teide.z,
	},
	{
		id: 'puerto-de-la-cruz-full',
		label: 'Puerto de la Cruz',
		...projectFullIslandCityMarker({ lat: 28.41397, lon: -16.54867 }, { top: -5 }),
	},
	{
		id: 'santa-cruz-de-tenerife-full',
		label: 'Santa Cruz de Tenerife',
		...projectTenerifeGeoToFullIslandWorldPoint({ lat: 28.46824, lon: -16.25462 }),
	},
	{
		id: 'los-realejos-full',
		label: 'Los Realejos',
		...projectTenerifeGeoToFullIslandWorldPoint({ lat: 28.36739, lon: -16.58335 }),
	},
	{
		id: 'la-laguna-full',
		label: 'La Laguna',
		...projectTenerifeGeoToFullIslandWorldPoint({ lat: 28.4899, lon: -16.3232 }),
	},
	{
		id: 'la-orotava-full',
		label: 'La Orotava',
		...projectFullIslandCityMarker({ lat: 28.39076, lon: -16.52309 }, { top: -5 }),
	},
];
const ARENA_MARKERS: MapMarker[] = [
	{ id: 'ember-camp', label: 'Ember Camp', x: -18, z: -12 },
	{ id: 'north-grove', label: 'North Grove', x: 5, z: 43 },
	{ id: 'south-trail', label: 'South Trail', x: 23, z: -43 },
	{ id: 'west-ridge', label: 'West Ridge', x: -52, z: 8 },
];

const MapSurface: React.FC<{
	bounds: MapBoundsType;
	mapMode: MapModeType;
	markers: MapMarker[];
	playerPoint: MapPointType | null;
	variant: 'mini' | 'full';
}> = ({ bounds, mapMode, markers, playerPoint, variant }) => {
	return (
		<div className={`hud-map-surface hud-map-surface-${variant}`}>
			<svg
				className='hud-map-shape'
				viewBox='0 0 100 100'
				aria-hidden='true'
				focusable='false'
				preserveAspectRatio='none'
			>
				{mapMode === 'tenerife-full-island' ? (
					<path
						className='hud-map-land hud-map-land-generated'
						d={TENERIFE_FULL_ISLAND_MAP_DATA.landPath}
						fillRule='evenodd'
					/>
				) : mapMode === 'tenerife-preview' ? (
					<>
						<path className='hud-map-land' d={TENERIFE_MAP_LAND_PATH} />
						<path className='hud-map-ridge' d={TENERIFE_MAP_RIDGE_PATH} />
						<path className='hud-map-road' d={TENERIFE_MAP_NORTH_ROUTE_PATH} />
						<path className='hud-map-road' d={TENERIFE_MAP_SOUTH_ROUTE_PATH} />
						<path className='hud-map-road' d={TENERIFE_MAP_TEIDE_ROUTE_PATH} />
					</>
				) : (
					<>
						<rect className='hud-map-land' x='7' y='7' width='86' height='86' rx='7' />
						<path className='hud-map-ridge' d='M13 63 C29 49 47 45 65 52 C74 56 81 55 88 49' />
						<path className='hud-map-road' d='M51 10 L51 90 M10 51 L90 51' />
					</>
				)}
			</svg>
			{variant === 'full'
				? markers.map((marker) => {
						const point = toMapPoint(marker.x, marker.z, bounds);

						return (
							<div
								className='hud-map-place'
								key={marker.id}
								style={{ left: `${point.left}%`, top: `${point.top}%` }}
							>
								<span className='hud-map-place-dot' />
								<span className='hud-map-place-label'>{marker.label}</span>
							</div>
						);
					})
				: null}
			{playerPoint ? (
				<span
					className='hud-map-player-marker'
					style={{ left: `${playerPoint.left}%`, top: `${playerPoint.top}%` }}
				/>
			) : null}
		</div>
	);
};

/**
 * Renders the current gameplay HUD and contextual interaction prompt.
 *
 * @param {PropsType} props - HUD props.
 * @returns {JSX.Element} The overlay HUD.
 */
const GameHud: React.FC<PropsType> = ({
	currentZoneName,
	isTenerifeModeEnabled,
	nearbyCollectible,
	objectiveLabel,
	playerPosition,
}) => {
	const [isMapOpen, setIsMapOpen] = useState(false);
	const playerStats = useGameStore(selectPlayerStats);
	const playerXp = useGameStore(selectPlayerXp);
	const nextLevelXp = useGameStore(selectPlayerNextLevelXp);
	const letters = useGameStore(selectInventoryLetters);
	const words = useGameStore(selectInventoryWords);
	const isInventoryOpen = useGameStore(selectIsInventoryOpen);
	const xpPercent = Math.min(100, Math.round((playerXp / nextLevelXp) * 100));
	const hpPercent = Math.min(100, Math.round((playerStats.hp / playerStats.maxHp) * 100));
	const equippedWord = words.at(-1)?.toUpperCase() ?? 'KEY';
	const quickSlots = [
		{ key: '1', label: 'Glyph', value: equippedWord },
		{ key: '2', label: 'Spark', value: letters.at(-1)?.toUpperCase() ?? '-' },
		{ key: '3', label: 'Craft', value: `${letters.length}` },
		{ key: '4', label: 'Codex', value: `${words.length}` },
	];
	const mapMode = getMapMode(
		isTenerifeModeEnabled,
		typeof window === 'undefined' ? '' : window.location.search,
	);
	const mapBounds = getMapBounds(mapMode);
	const mapMarkers =
		mapMode === 'tenerife-full-island'
			? TENERIFE_FULL_ISLAND_MARKERS
			: mapMode === 'tenerife-preview'
				? TENERIFE_SETTLEMENT_MARKERS
				: ARENA_MARKERS;
	const playerPoint = useMemo(
		() => getPlayerMapPoint(playerPosition, isTenerifeModeEnabled),
		[isTenerifeModeEnabled, playerPosition],
	);
	const mapTitle = isTenerifeModeEnabled ? 'Tenerife' : 'Arena Map';

	return (
		<div className='game-hud'>
			<section className='hud-player-frame' aria-label='Player status'>
				<div className='hud-player-portrait'>
					<span>{playerStats.level}</span>
				</div>
				<div className='hud-player-vitals'>
					<div className='hud-player-name-row'>
						<strong>Adventurer</strong>
						<span>Lv {playerStats.level}</span>
					</div>
					<div className='hud-unit-bar hud-unit-health' title='Health'>
						<div className='hud-unit-bar-fill' style={{ width: `${hpPercent}%` }} />
						<span>
							{playerStats.hp}/{playerStats.maxHp}
						</span>
					</div>
					<div className='hud-unit-bar hud-unit-xp' title='Experience'>
						<div className='hud-unit-bar-fill' style={{ width: `${xpPercent}%` }} />
						<span>
							{playerXp}/{nextLevelXp}
						</span>
					</div>
				</div>
			</section>

			<section className='hud-objective-tracker'>
				<div className='hud-zone-row'>
					<span>{currentZoneName}</span>
					<strong>Lv {playerStats.level}</strong>
				</div>
				<p className='hud-objective-text'>{objectiveLabel}</p>
				<div className='hud-world-row'>
					<span>{worldSummary.npcs} NPC</span>
					<span>{worldSummary.creatures} creatures</span>
				</div>
			</section>

			{nearbyCollectible ? (
				<div className='hud-interaction-prompt'>
					<span className='hud-key'>E</span>
					<span>
						Letter <strong>{nearbyCollectible.letter.toUpperCase()}</strong>
					</span>
				</div>
			) : null}

			<section className='hud-minimap-panel' aria-label='Minimap'>
				<div className='hud-minimap-header'>
					<strong>{mapTitle}</strong>
					<button
						aria-label='Open full map'
						className='hud-map-open-button'
						onClick={() => setIsMapOpen(true)}
						type='button'
					>
						Map
					</button>
				</div>
				<MapSurface
					bounds={mapBounds}
					mapMode={mapMode}
					markers={mapMarkers}
					playerPoint={playerPoint}
					variant='mini'
				/>
			</section>

			{isMapOpen ? (
				<div className='hud-world-map-overlay' role='dialog' aria-modal='true' aria-label='World map'>
					<div className='hud-world-map-panel'>
						<div className='hud-world-map-header'>
							<div>
								<span>Full Map</span>
								<strong>{mapTitle}</strong>
							</div>
							<button
								aria-label='Close full map'
								className='hud-map-close-button'
								onClick={() => setIsMapOpen(false)}
								type='button'
							>
								Close
							</button>
						</div>
						<MapSurface
							bounds={mapBounds}
							mapMode={mapMode}
							markers={mapMarkers}
							playerPoint={playerPoint}
							variant='full'
						/>
					</div>
				</div>
			) : null}

			<section className='hud-action-bar'>
				<div className='hud-command-panel'>
					<div className='hud-xp-track' title='Experience'>
						<div className='hud-xp-fill' style={{ width: `${xpPercent}%` }} />
						<span>
							{playerXp}/{nextLevelXp}
						</span>
					</div>

					<div className='hud-slot-row'>
						<button className='hud-skill-slot hud-skill-slot-primary' type='button'>
							<span className='hud-slot-key'>LMB</span>
							<strong>A</strong>
						</button>
						{quickSlots.map((slot) => (
							<button className='hud-skill-slot' key={slot.key} type='button'>
								<span className='hud-slot-key'>{slot.key}</span>
								<strong>{slot.value}</strong>
								<small>{slot.label}</small>
							</button>
						))}
						<button className='hud-skill-slot hud-skill-slot-primary' type='button'>
							<span className='hud-slot-key'>RMB</span>
							<strong>{isInventoryOpen ? 'I' : 'T'}</strong>
						</button>
					</div>
				</div>
			</section>
		</div>
	);
};

export default GameHud;
