import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_DIST_DIR = 'dist';

const SOURCE_ONLY_EXTENSIONS = new Set([
	'.blend',
	'.fbx',
	'.mtl',
	'.mtlx',
	'.obj',
	'.tres',
	'.usdc',
]);

const RUNTIME_ASSET_ALLOWLIST = new Set([
	'models/build/buildings-pack-jan2019/OBJ/Building1_Small.mtl',
	'models/build/buildings-pack-jan2019/OBJ/Building1_Small.obj',
	'models/build/buildings-pack-jan2019/OBJ/Building2_Small.mtl',
	'models/build/buildings-pack-jan2019/OBJ/Building2_Small.obj',
	'models/build/buildings-pack-jan2019/OBJ/Building3_Small.mtl',
	'models/build/buildings-pack-jan2019/OBJ/Building3_Small.obj',
	'models/build/buildings-pack-jan2019/OBJ/Building4.mtl',
	'models/build/buildings-pack-jan2019/OBJ/Building4.obj',
	'models/build/buildings-pack-jan2019/OBJ/House1.mtl',
	'models/build/buildings-pack-jan2019/OBJ/House1.obj',
	'models/build/buildings-pack-jan2019/OBJ/House2.mtl',
	'models/build/buildings-pack-jan2019/OBJ/House2.obj',
	'models/collectibles/collectible-letter-crystal.glb',
	'models/environment/puerto-de-la-cruz-terrain.glb',
	'models/environment/tenerife-full-island-normalized.glb',
	'models/environment/tenerife-island-location.glb',
	'models/hero/pumkinboy-rigged-animated-character/source/Pumpkinboy_10Animations.glb',
	'models/player/crafter-npc-alie.glb',
	'models/player/player-adventurer-prototype.glb',
	'models/player/player-hero-rigged.glb',
	'textures/Ground068_4K-JPG/Ground068_4K-JPG_AmbientOcclusion.jpg',
	'textures/Ground068_4K-JPG/Ground068_4K-JPG_Color.jpg',
	'textures/Ground068_4K-JPG/Ground068_4K-JPG_NormalGL.jpg',
	'textures/Ground068_4K-JPG/Ground068_4K-JPG_Roughness.jpg',
	'textures/tenerife/puerto-city-albedo.png',
	'textures/tenerife/puerto-city-normal.png',
	'textures/tenerife/puerto-city-orm.png',
	'textures/tenerife/puerto-city-road-mask.png',
]);

/** Normalizes a build-output asset path so prune rules are platform-independent. */
export const normalizeAssetPath = (assetPath) => assetPath.split(path.sep).join('/');

/** Returns whether a copied public asset should be removed from production output. */
export const shouldPrunePublicAsset = (assetPath) => {
	const normalizedPath = normalizeAssetPath(assetPath);
	const extension = path.extname(normalizedPath).toLowerCase();

	if (RUNTIME_ASSET_ALLOWLIST.has(normalizedPath)) {
		return false;
	}

	if (normalizedPath.endsWith('/.DS_Store') || normalizedPath === '.DS_Store') {
		return true;
	}

	if (SOURCE_ONLY_EXTENSIONS.has(extension)) {
		return true;
	}

	if (extension === '.zip') {
		return true;
	}

	if (normalizedPath.startsWith('models/player/source/')) {
		return true;
	}

	if (normalizedPath === 'models/land/tenerife._islas_canarias.glb') {
		return true;
	}

	if (normalizedPath === 'models/environment/tenerife-full-island-runtime-low.glb') {
		return true;
	}

	if (
		normalizedPath.includes('_NormalDX') ||
		normalizedPath.includes('_Displacement') ||
		normalizedPath === 'textures/Ground068_4K-JPG/Ground068.png'
	) {
		return true;
	}

	return false;
};

const listFiles = async (directory, rootDirectory = directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await listFiles(entryPath, rootDirectory)));
			continue;
		}

		if (entry.isFile()) {
			files.push(path.relative(rootDirectory, entryPath));
		}
	}

	return files;
};

/** Removes source-only files copied from Vite `public` into the production `dist` directory. */
export const prunePublicAssets = async ({ distDir = DEFAULT_DIST_DIR } = {}) => {
	const files = await listFiles(distDir);
	const removedFiles = files.filter(shouldPrunePublicAsset);

	await Promise.all(
		removedFiles.map((assetPath) => rm(path.join(distDir, assetPath), { force: true })),
	);

	return removedFiles.sort();
};

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
	const distDir = process.argv[2] ?? DEFAULT_DIST_DIR;
	const removedFiles = await prunePublicAssets({ distDir });

	console.log(`[prune-public-assets] removed ${removedFiles.length} copied public assets`);
}
