import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/loaders/glTF';
import type { Scene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useScene } from 'react-babylonjs';
import {
	auditFullIslandImportedWaterMeshes,
	shouldHideImportedWater,
	updateOceanDebugState,
} from '@/scenes/environment/ocean/oceanDebug';
import {
	isTenerifeFullIslandTerrainMeshName,
	TENERIFE_FULL_ISLAND_MODEL_URL,
	TENERIFE_FULL_ISLAND_RUNTIME_SCALE,
} from './tenerifeFullIslandConfig';
import {
	clearTenerifeFullIslandHeightfield,
	rebuildTenerifeFullIslandHeightfield,
} from './tenerifeFullIslandHeightfield';
import { createTenerifeTerrainShaderMaterial } from './tenerifeTerrainShader';

type PropsType = {
	havokPlugin: HavokPlugin | null;
	onReadyChange?: (isReady: boolean) => void;
};

/**
 * One world-unit tile size for the projected UV.
 * The texture repeats every 20 m at player scale — fine enough for close-up detail.
 */
const ISLAND_UV_WORLD_TILE = 20;

type VolcanicZoneType = { maxWorldY: number; r: number; g: number; b: number };

/**
 * Height zones in world-Y space for the island-full terrain.
 * localY × TENERIFE_FULL_ISLAND_RUNTIME_SCALE (0.02) = worldY.
 * Puerto de la Cruz city level ≈ 16 m. Teide peak ≈ 73 m.
 */
const ISLAND_VOLCANIC_ZONES: VolcanicZoneType[] = [
	// Coastal volcanic beach / sandy shoreline
	{ maxWorldY: 1, r: 0.58, g: 0.52, b: 0.38 },
	// Dark basalt sea cliffs with sparse coastal scrub — olive-dark
	{ maxWorldY: 8, r: 0.22, g: 0.26, b: 0.15 },
	// Subtropical green belt — banana plantations, laurel forest (400–1100 m real)
	{ maxWorldY: 22, r: 0.31, g: 0.4, b: 0.21 },
	// Canarian pine forest zone — darker olive green (1100–2000 m real)
	{ maxWorldY: 40, r: 0.28, g: 0.35, b: 0.19 },
	// Upper volcanic slopes — reddish-brown lava and cinders (Teide National Park)
	{ maxWorldY: 60, r: 0.48, g: 0.24, b: 0.16 },
	// Teide caldera — pale grey pumice and volcanic ash (3100 m+ real)
	{ maxWorldY: Number.POSITIVE_INFINITY, r: 0.62, g: 0.57, b: 0.5 },
];

const getVolcanicColor = (worldY: number): VolcanicZoneType =>
	ISLAND_VOLCANIC_ZONES.find((z) => worldY <= z.maxWorldY) ??
	ISLAND_VOLCANIC_ZONES[ISLAND_VOLCANIC_ZONES.length - 1];

/**
 * Projects world-space XZ coordinates onto the UV channel so that
 * tiled textures repeat at a consistent player-scale frequency.
 *
 * Vertex positions are in LOCAL mesh space; multiplying by RUNTIME_SCALE gives world units.
 */
const applyIslandTerrainUv = (mesh: Mesh): void => {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

	if (!positions) {
		return;
	}

	const uvs: number[] = [];
	const uvScale = TENERIFE_FULL_ISLAND_RUNTIME_SCALE / ISLAND_UV_WORLD_TILE;

	for (let i = 0; i < positions.length; i += 3) {
		uvs.push(positions[i] * uvScale, positions[i + 2] * uvScale);
	}

	mesh.setVerticesData(VertexBuffer.UVKind, uvs, false);
};

/**
 * Paints per-vertex colours based on altitude to produce a volcanic zone gradient.
 * Uses LOCAL vertex Y converted to world space via RUNTIME_SCALE.
 * A sine-based variation prevents flat uniform banding.
 */
const applyVolcanicVertexColors = (mesh: Mesh): void => {
	const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

	if (!positions) {
		return;
	}

	const colors: number[] = [];

	for (let i = 0; i < positions.length; i += 3) {
		const lx = positions[i];
		const ly = positions[i + 1];
		const lz = positions[i + 2];
		const worldY = ly * TENERIFE_FULL_ISLAND_RUNTIME_SCALE;
		const zone = getVolcanicColor(worldY);
		// Frequency tuned for local space: sin variation every ~4 world units
		const variation = 0.91 + (Math.sin(lx * 0.003 + lz * 0.002) + 1) * 0.045;

		colors.push(zone.r * variation, zone.g * variation, zone.b * variation, 1);
	}

	mesh.setVerticesData(VertexBuffer.ColorKind, colors, false);
};

/**
 * Replaces the GLB-imported material on each terrain tile with a full volcanic
 * texture splatting shader: height-based texture blending + normal/AO/roughness micro-detail overlay.
 *
 * The original GLB albedo is discarded.
 */
const tuneTerrainMaterial = (mesh: Mesh, scene: Scene): void => {
	const material = createTenerifeTerrainShaderMaterial(scene);
	mesh.material = material;
};

/**
 * Loads the normalized full Tenerife island as the active large-scale terrain.
 *
 * The first runtime pass keeps the six source terrain tiles intact so later work
 * can split them into LOD or streamed chunks instead of undoing a merged mesh.
 */
const TenerifeFullIslandTerrain: React.FC<PropsType> = ({ onReadyChange }) => {
	const scene = useScene();
	const importedMeshesRef = useRef<AbstractMesh[]>([]);

	useEffect(() => {
		if (!scene) {
			onReadyChange?.(false);
			return;
		}

		let isDisposed = false;
		const previousSkipPointerMovePicking = scene.skipPointerMovePicking;
		scene.skipPointerMovePicking = true;
		onReadyChange?.(false);

		SceneLoader.ImportMeshAsync(undefined, '', TENERIFE_FULL_ISLAND_MODEL_URL, scene)
			.then((result) => {
				if (isDisposed) {
					for (const mesh of result.meshes) {
						mesh.dispose(false, true);
					}
					return;
				}

				importedMeshesRef.current = result.meshes;
				const waterMeshAudit = auditFullIslandImportedWaterMeshes(
					result.meshes,
					shouldHideImportedWater(),
				);
				updateOceanDebugState({
					lastAudit: waterMeshAudit,
				});

				for (const mesh of result.meshes) {
					mesh.isPickable = false;
					mesh.checkCollisions = false;

					if (!(mesh instanceof Mesh) || !isTenerifeFullIslandTerrainMeshName(mesh.name)) {
						continue;
					}

					mesh.scaling.setAll(TENERIFE_FULL_ISLAND_RUNTIME_SCALE);
					mesh.isPickable = true;
					mesh.checkCollisions = false;
					mesh.alwaysSelectAsActiveMesh = false;
					mesh.computeWorldMatrix(true);
					// Project UV from world XZ so texture tiles at player scale
					applyIslandTerrainUv(mesh);
					// Paint height-based volcanic zone colours per vertex
					applyVolcanicVertexColors(mesh);
					// Replace GLB material with full volcanic PBR override
					tuneTerrainMaterial(mesh, scene);
					mesh.freezeWorldMatrix();
					mesh.doNotSyncBoundingInfo = true;
				}

				rebuildTenerifeFullIslandHeightfield(result.meshes);
				onReadyChange?.(true);
			})
			.catch((error: unknown) => {
				console.error('[TenerifeFullIslandTerrain] Failed to load normalized island', error);
				onReadyChange?.(true);
			});

		return () => {
			isDisposed = true;
			scene.skipPointerMovePicking = previousSkipPointerMovePicking;
			onReadyChange?.(false);

			clearTenerifeFullIslandHeightfield();

			for (const mesh of importedMeshesRef.current) {
				if (!mesh.isDisposed()) {
					mesh.dispose(false, true);
				}
			}

			importedMeshesRef.current = [];
		};
	}, [onReadyChange, scene]);

	return null;
};

export default TenerifeFullIslandTerrain;
