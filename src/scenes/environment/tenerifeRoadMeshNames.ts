import type { TenerifeRoadLayerId } from './tenerifeRoadLayers';

export const TENERIFE_GEO_ROAD_MESH_PREFIX = 'tenerife-geo-roads-';

/**
 * Builds the stable runtime mesh name for generated Tenerife road overlays.
 */
export const getTenerifeRoadOverlayMeshName = (
	layerId: TenerifeRoadLayerId,
	nameSuffix: string,
): string => `${TENERIFE_GEO_ROAD_MESH_PREFIX}${layerId}-${nameSuffix}`;

/**
 * Resolves whether a mesh is one of the generated Tenerife road overlay meshes.
 */
export const isTenerifeRoadOverlayMeshName = (meshName: string): boolean =>
	meshName.startsWith(TENERIFE_GEO_ROAD_MESH_PREFIX);

/**
 * Resolves whether a road overlay should be used as a visual foot support.
 */
export const isTenerifeRoadVisualSupportMeshName = (meshName: string): boolean =>
	isTenerifeRoadOverlayMeshName(meshName) && !meshName.endsWith('-centerline');
