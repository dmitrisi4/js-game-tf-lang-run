import { publicAssetUrl } from '@/utils/publicAssetUrl';
import { measureTenerifeAsyncStep, measureTenerifeSyncStep } from './tenerifePerformance';
import {
	buildTenerifeRoadLayerDataFromRuntime,
	buildTenerifeRoadsideBuildings,
	type TenerifeRoadLayerData,
	type TenerifeRuntimeRoadData,
} from './tenerifeRoadLayers';
import type { WorldBuilding } from './worldData';

export type TenerifeGeoData = {
	roadLayers: TenerifeRoadLayerData[];
	roadsideBuildings: WorldBuilding[];
};

export const TENERIFE_RUNTIME_ROADS_URL = publicAssetUrl('/data/tenerife/roads-runtime.json');

export const loadTenerifeGeoData = async (): Promise<TenerifeGeoData> => {
	const runtimeRoadData = await measureTenerifeAsyncStep(
		'Runtime road JSON fetch/parse',
		async () => {
			const response = await fetch(TENERIFE_RUNTIME_ROADS_URL);

			if (!response.ok) {
				throw new Error(`Failed to load Tenerife runtime roads: ${response.status}`);
			}

			return (await response.json()) as TenerifeRuntimeRoadData;
		},
	);

	const roadLayers = measureTenerifeSyncStep('Runtime road layer build', () =>
		buildTenerifeRoadLayerDataFromRuntime(runtimeRoadData),
	);
	const roadsideBuildings = measureTenerifeSyncStep('Roadside building placement generation', () =>
		buildTenerifeRoadsideBuildings(roadLayers),
	);

	return { roadLayers, roadsideBuildings };
};
