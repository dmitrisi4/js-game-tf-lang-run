import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

import {
	TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
	TENERIFE_FULL_ISLAND_SEABED_Y,
	TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
} from '@/scenes/environment/tenerifeFullIslandConfig';

const OCEAN_DEBUG_ID = 'keyarena-ocean-debug';
const WATERLIKE_PATTERN = /water|ocean|sea|atlantic|disc|plane/i;

export type FullIslandWaterMeshAuditEntryType = {
	averageY: number;
	isHidden: boolean;
	isWaterLike: boolean;
	materialName: string;
	meshName: string;
	totalVertices: number;
};

export type FullIslandWaterMeshAuditType = {
	hiddenWaterLikeMeshes: string[];
	meshes: FullIslandWaterMeshAuditEntryType[];
	waterLikeMeshes: string[];
};

type OceanDebugStateType = {
	activeUrl: string;
	customOceanHidden: boolean;
	importedWaterHidden: boolean;
	lastAudit: FullIslandWaterMeshAuditType | null;
	mode: string;
	waterSurfaceY: number;
	seabedY: number;
	deepWaterResetY: number;
};

const getSearchParams = (search?: string): URLSearchParams =>
	new URLSearchParams(search ?? (typeof window === 'undefined' ? '' : window.location.search));

/** Resolves whether ocean debug readouts should be visible. */
export const shouldShowOceanDebug = (search?: string): boolean =>
	getSearchParams(search).get('oceanDebug') === '1';

/** Resolves whether the custom ocean surface should be hidden for layer isolation. */
export const shouldHideCustomOcean = (search?: string): boolean =>
	getSearchParams(search).get('hideCustomOcean') === '1';

/** Resolves whether imported GLB water-looking meshes should stay visible. */
export const shouldShowImportedWater = (search?: string): boolean =>
	getSearchParams(search).get('showImportedWater') === '1';

/** Resolves whether imported GLB water-looking meshes should be hidden. */
export const shouldHideImportedWater = (search?: string): boolean => {
	const params = getSearchParams(search);

	return params.get('hideImportedWater') === '1' || !shouldShowImportedWater(search);
};

/** Identifies imported meshes or materials that are likely baked ocean/background planes. */
export const isWaterLikeImportedMesh = (meshName: string, materialName = ''): boolean =>
	WATERLIKE_PATTERN.test(meshName) || WATERLIKE_PATTERN.test(materialName);

const getMeshAverageY = (mesh: AbstractMesh): number => {
	mesh.computeWorldMatrix(true);

	const { minimumWorld, maximumWorld } = mesh.getBoundingInfo().boundingBox;

	return (minimumWorld.y + maximumWorld.y) / 2;
};

/** Builds a mesh audit and optionally hides imported water-looking meshes. */
export const auditFullIslandImportedWaterMeshes = (
	meshes: AbstractMesh[],
	hideImportedWater: boolean,
): FullIslandWaterMeshAuditType => {
	const auditEntries = meshes.map((mesh) => {
		const materialName = mesh.material?.name ?? '';
		const isWaterLike = isWaterLikeImportedMesh(mesh.name, materialName);

		if (hideImportedWater && isWaterLike) {
			mesh.setEnabled(false);
		}

		return {
			averageY: getMeshAverageY(mesh),
			isHidden: !mesh.isEnabled(),
			isWaterLike,
			materialName,
			meshName: mesh.name,
			totalVertices: mesh.getTotalVertices(),
		};
	});
	const waterLikeMeshes = auditEntries
		.filter((entry) => entry.isWaterLike)
		.map((entry) => entry.meshName);

	return {
		hiddenWaterLikeMeshes: auditEntries
			.filter((entry) => entry.isWaterLike && entry.isHidden)
			.map((entry) => entry.meshName),
		meshes: auditEntries,
		waterLikeMeshes,
	};
};

const getOceanDebugStore = (): { state: OceanDebugStateType } => {
	const store = globalThis as typeof globalThis & {
		__KEYARENA_OCEAN_DEBUG__?: { state: OceanDebugStateType };
	};

	if (!store.__KEYARENA_OCEAN_DEBUG__) {
		store.__KEYARENA_OCEAN_DEBUG__ = {
			state: {
				activeUrl: typeof window === 'undefined' ? '' : window.location.href,
				customOceanHidden: shouldHideCustomOcean(),
				deepWaterResetY: TENERIFE_FULL_ISLAND_DEEP_WATER_RESET_Y,
				importedWaterHidden: shouldHideImportedWater(),
				lastAudit: null,
				mode: 'island-full',
				seabedY: TENERIFE_FULL_ISLAND_SEABED_Y,
				waterSurfaceY: TENERIFE_FULL_ISLAND_WATER_SURFACE_Y,
			},
		};
	}

	return store.__KEYARENA_OCEAN_DEBUG__;
};

const renderOceanDebugElement = (state: OceanDebugStateType): void => {
	if (typeof document === 'undefined' || !shouldShowOceanDebug()) {
		return;
	}

	let element = document.getElementById(OCEAN_DEBUG_ID);

	if (!element) {
		element = document.createElement('pre');
		element.id = OCEAN_DEBUG_ID;
		element.style.cssText = [
			'position:fixed',
			'left:12px',
			'top:12px',
			'z-index:99999',
			'max-width:420px',
			'padding:10px 12px',
			'border:1px solid rgba(255,210,128,.7)',
			'border-radius:6px',
			'background:rgba(10,12,14,.82)',
			'color:#ffe3a3',
			'font:12px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
			'white-space:pre-wrap',
			'pointer-events:none',
		].join(';');
		document.body.appendChild(element);
	}

	const audit = state.lastAudit;
	const auditSummary = audit
		? {
				hiddenWaterLikeMeshes: audit.hiddenWaterLikeMeshes,
				waterLikeMeshes: audit.waterLikeMeshes,
			}
		: null;

	element.textContent = JSON.stringify(
		{
			activeUrl: state.activeUrl,
			customOceanHidden: state.customOceanHidden,
			deepWaterResetY: state.deepWaterResetY,
			importedWaterHidden: state.importedWaterHidden,
			mode: state.mode,
			seabedY: state.seabedY,
			waterSurfaceY: state.waterSurfaceY,
			waterMeshAudit: auditSummary,
		},
		null,
		2,
	);
};

/** Updates the dev-visible ocean debug state and overlay. */
export const updateOceanDebugState = (partial: Partial<OceanDebugStateType>): void => {
	const store = getOceanDebugStore();

	store.state = {
		...store.state,
		...partial,
		activeUrl: typeof window === 'undefined' ? store.state.activeUrl : window.location.href,
		customOceanHidden: shouldHideCustomOcean(),
		importedWaterHidden: shouldHideImportedWater(),
	};

	renderOceanDebugElement(store.state);

	if (shouldShowOceanDebug()) {
		console.info('[TenerifeOceanDebug]', store.state);
	}
};

/** Removes the ocean debug overlay when the debug flag is not active anymore. */
export const removeOceanDebugElement = (): void => {
	if (typeof document === 'undefined') {
		return;
	}

	document.getElementById(OCEAN_DEBUG_ID)?.remove();
};
