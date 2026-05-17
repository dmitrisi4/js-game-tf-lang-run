import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import HavokPhysics from '@babylonjs/havok';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Engine, Scene } from 'react-babylonjs';
import SceneCamera from '@/scenes/camera/SceneCamera';
import { useSceneDebugLayer } from '@/scenes/debug/useSceneDebugLayer';
import type { CollectibleSpawnPoint } from '@/scenes/discovery/collectibleTypes';
import { findNearestCollectibleInRange } from '@/scenes/discovery/collectibleUtils';
import { STARTER_DISCOVERY_WORDS } from '@/scenes/discovery/discoveryRecipes';
import type { DiscoveryWaveId } from '@/scenes/discovery/discoveryWaves';
import { getCollectiblesForWave } from '@/scenes/discovery/discoveryWaves';
import LetterCollectibles from '@/scenes/discovery/LetterCollectibles';
import Environment from '@/scenes/environment/Environment';
import {
	getTenerifePlayerResetPosition,
	TENERIFE_PLAYER_START_POSITION,
} from '@/scenes/environment/tenerifePreviewConfig';
import { getZoneForPosition, type WorldZone } from '@/scenes/environment/worldZones';
import Player from '@/scenes/player/Player';
import PlayerInputBridge from '@/scenes/player/PlayerInputBridge';
import PlayerInteractionBridge from '@/scenes/player/PlayerInteractionBridge';
import { usePlayerInput } from '@/scenes/player/usePlayerInput';
import PrototypeDonut from '@/scenes/prototyping/PrototypeDonut';
import {
	selectInventoryWords,
	selectIsInventoryOpen,
	selectIsTalentTreeOpen,
} from '@/store/selectors';
import { useGameStore } from '@/store/useGameStore';
import GameHud from '@/ui/GameHud';
import ScenePreloader from '@/ui/ScenePreloader';
import '@babylonjs/core/Physics/physicsEngineComponent';

type PropsType = {
	children?: React.ReactNode;
};

const getObjectiveLabel = (activeWaveId: DiscoveryWaveId | null): string => {
	if (activeWaveId === 'starter') {
		return 'Explore the starter clearing and craft ARE, EAR, or ERA from A, R, E';
	}

	if (activeWaveId === 'ember') {
		return 'Follow the southern camp trail, collect F, I, R, E, then craft FIRE';
	}

	if (activeWaveId === 'grove') {
		return 'Travel north into the grove, collect G, R, O, V, E, then craft GROVE';
	}

	return 'Current arena objective complete';
};

/**
 * MainScene component that initializes the Babylon.js engine,
 * Havok physics, and handles the debug inspector toggle.
 *
 * @returns {JSX.Element} The rendered 3D scene.
 */
const MainScene: React.FC<PropsType> = () => {
	const [havokPlugin, setHavokPlugin] = useState<HavokPlugin | null>(null);
	const [hasRenderedReadyFrame, setHasRenderedReadyFrame] = useState(false);
	const [isEnvironmentReady, setIsEnvironmentReady] = useState(false);
	const [sceneInstance, setSceneInstance] = useState<BabylonScene | null>(null);
	const [isPhysicsReady, setIsPhysicsReady] = useState(false);
	const [playerMesh, setPlayerMesh] = useState<Mesh | null>(null);
	const [activeWaveId, setActiveWaveId] = useState<DiscoveryWaveId | null>('starter');
	const [collectibles, setCollectibles] = useState<CollectibleSpawnPoint[]>(() =>
		getCollectiblesForWave('starter'),
	);
	const [nearbyCollectible, setNearbyCollectible] = useState<CollectibleSpawnPoint | null>(null);
	const [playerPosition, setPlayerPosition] = useState<Vector3>(() =>
		TENERIFE_PLAYER_START_POSITION.clone(),
	);
	const [currentZone, setCurrentZone] = useState<WorldZone>(() =>
		getZoneForPosition({
			x: TENERIFE_PLAYER_START_POSITION.x,
			z: TENERIFE_PLAYER_START_POSITION.z,
		}),
	);
	const craftedWords = useGameStore(selectInventoryWords);
	const isInventoryOpen = useGameStore(selectIsInventoryOpen);
	const isTalentTreeOpen = useGameStore(selectIsTalentTreeOpen);
	const isGameplayInputEnabled = !isInventoryOpen && !isTalentTreeOpen;
	const isTenerifeModeEnabled =
		typeof window !== 'undefined' &&
		new URLSearchParams(window.location.search).get('tenerife') === '1';
	const commands = usePlayerInput(isGameplayInputEnabled);

	useSceneDebugLayer(sceneInstance);

	useEffect(() => {
		const initHavok = async () => {
			const havokInstance = await HavokPhysics();
			const plugin = new HavokPlugin(true, havokInstance);
			setHavokPlugin(plugin);
		};
		initHavok();
	}, []);

	useEffect(() => {
		if (!sceneInstance || !havokPlugin) {
			setIsPhysicsReady(false);
			setIsEnvironmentReady(false);
			setHasRenderedReadyFrame(false);
			return;
		}

		sceneInstance.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
		setIsPhysicsReady(true);

		return () => {
			setIsPhysicsReady(false);
		};
	}, [havokPlugin, sceneInstance]);

	useEffect(() => {
		if (!sceneInstance || !isPhysicsReady || !isEnvironmentReady || !playerMesh) {
			setHasRenderedReadyFrame(false);
			return;
		}

		const observer = sceneInstance.onAfterRenderObservable.add(() => {
			setHasRenderedReadyFrame(true);
			sceneInstance.onAfterRenderObservable.remove(observer);
		});

		return () => {
			sceneInstance.onAfterRenderObservable.remove(observer);
		};
	}, [isEnvironmentReady, isPhysicsReady, playerMesh, sceneInstance]);

	useEffect(() => {
		if (!playerMesh) {
			setNearbyCollectible(null);
			return;
		}

		let animationFrameId = 0;

		const syncNearbyCollectible = () => {
			const nextCollectible = findNearestCollectibleInRange(collectibles, playerMesh.absolutePosition);
			const nextZone = getZoneForPosition({
				x: playerMesh.absolutePosition.x,
				z: playerMesh.absolutePosition.z,
			});

			setNearbyCollectible((currentCollectible) =>
				currentCollectible?.id === nextCollectible?.id ? currentCollectible : nextCollectible,
			);
			setCurrentZone((zone) => (zone.id === nextZone.id ? zone : nextZone));
			setPlayerPosition((currentPosition) =>
				Vector3.DistanceSquared(currentPosition, playerMesh.absolutePosition) < 0.16
					? currentPosition
					: playerMesh.absolutePosition.clone(),
			);
			animationFrameId = requestAnimationFrame(syncNearbyCollectible);
		};

		syncNearbyCollectible();

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [collectibles, playerMesh]);

	useEffect(() => {
		const craftedStarterWord = STARTER_DISCOVERY_WORDS.some((word) => craftedWords.includes(word));

		if (activeWaveId === 'starter' && craftedStarterWord && collectibles.length === 0) {
			setActiveWaveId('ember');
			setCollectibles(getCollectiblesForWave('ember'));
			return;
		}

		if (activeWaveId === 'ember' && craftedWords.includes('fire') && collectibles.length === 0) {
			setActiveWaveId('grove');
			setCollectibles(getCollectiblesForWave('grove'));
			return;
		}

		if (activeWaveId === 'grove' && craftedWords.includes('grove') && collectibles.length === 0) {
			setActiveWaveId(null);
		}
	}, [activeWaveId, collectibles.length, craftedWords]);

	const objectiveLabel = getObjectiveLabel(activeWaveId);
	const isSceneLoading =
		!isPhysicsReady || !isEnvironmentReady || !playerMesh || !hasRenderedReadyFrame;
	const preloaderLabel = !isPhysicsReady
		? 'Starting physics'
		: !isEnvironmentReady
			? isTenerifeModeEnabled
				? 'Loading Tenerife roads and buildings'
				: 'Loading arena assets'
			: !playerMesh
				? 'Preparing player'
				: 'Rendering scene';
	const shouldRenderPlayer = isPhysicsReady && (!isTenerifeModeEnabled || isEnvironmentReady);
	const playerSpawnPosition =
		isTenerifeModeEnabled && sceneInstance
			? getTenerifePlayerResetPosition(sceneInstance)
			: undefined;

	return (
		<>
			<Engine
				antialias
				adaptToDeviceRatio
				canvasId='babylon-canvas'
				style={{ width: '100%', height: '100vh' }}
			>
				<Scene
					onSceneMount={(args) => {
						setSceneInstance(args.scene);
					}}
				>
					<PlayerInputBridge commands={commands} />
					<PlayerInteractionBridge
						collectibles={collectibles}
						commands={commands}
						playerMesh={playerMesh}
						onCollect={(collectibleId) => {
							setCollectibles((currentCollectibles) =>
								currentCollectibles.filter((collectible) => collectible.id !== collectibleId),
							);
						}}
					/>
					<SceneCamera isCameraInputEnabled={isGameplayInputEnabled} targetMesh={playerMesh} />
					{isPhysicsReady && (
						<Environment havokPlugin={havokPlugin} onReadyChange={setIsEnvironmentReady} />
					)}
					{shouldRenderPlayer && (
						<Player commands={commands} onCreated={setPlayerMesh} spawnPosition={playerSpawnPosition} />
					)}
					<LetterCollectibles collectibles={collectibles} />
					{isPhysicsReady && <PrototypeDonut havokPlugin={havokPlugin} />}
				</Scene>
			</Engine>
			<GameHud
				currentZoneName={currentZone.displayName}
				isTenerifeModeEnabled={isTenerifeModeEnabled}
				nearbyCollectible={nearbyCollectible}
				objectiveLabel={objectiveLabel}
				playerPosition={playerPosition}
			/>
			<ScenePreloader isVisible={isSceneLoading} label={preloaderLabel} />
		</>
	);
};

export default MainScene;
