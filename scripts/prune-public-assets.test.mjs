import { access, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { prunePublicAssets, shouldPrunePublicAsset } from './prune-public-assets.mjs';

const exists = async (filePath) => {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
};

describe('prune-public-assets', () => {
	it('keeps runtime-loaded assets', () => {
		expect(shouldPrunePublicAsset('models/environment/tenerife-full-island-normalized.glb')).toBe(
			false,
		);
		expect(
			shouldPrunePublicAsset(
				'models/hero/pumkinboy-rigged-animated-character/source/Pumpkinboy_10Animations.glb',
			),
		).toBe(false);
		expect(shouldPrunePublicAsset('textures/Ground068_4K-JPG/Ground068_4K-JPG_Color.jpg')).toBe(
			false,
		);
	});

	it('prunes source-only model and texture files from build output', () => {
		expect(shouldPrunePublicAsset('models/build/buildings-pack-jan2019/OBJ/House1.obj')).toBe(true);
		expect(shouldPrunePublicAsset('models/build/buildings-pack-jan2019/FBX/House1.fbx')).toBe(true);
		expect(shouldPrunePublicAsset('models/hero/pumkinboy-rigged-animated-character.zip')).toBe(true);
		expect(shouldPrunePublicAsset('textures/Ground068_4K-JPG/Ground068_4K-JPG_NormalDX.jpg')).toBe(
			true,
		);
		expect(
			shouldPrunePublicAsset('textures/Ground068_4K-JPG/Ground068_4K-JPG_Displacement.jpg'),
		).toBe(true);
	});

	it('removes pruned files while preserving allowlisted files', async () => {
		const distDir = await mkdtemp(path.join(os.tmpdir(), 'keyarena-prune-'));
		const runtimeAsset = path.join(distDir, 'models/environment/tenerife-full-island-normalized.glb');
		const sourceAsset = path.join(distDir, 'models/build/buildings-pack-jan2019/OBJ/House1.obj');

		await mkdir(path.dirname(runtimeAsset), { recursive: true });
		await mkdir(path.dirname(sourceAsset), { recursive: true });
		await writeFile(runtimeAsset, 'runtime');
		await writeFile(sourceAsset, 'source');

		const removedFiles = await prunePublicAssets({ distDir });

		expect(removedFiles).toEqual(['models/build/buildings-pack-jan2019/OBJ/House1.obj']);
		expect(await exists(runtimeAsset)).toBe(true);
		expect(await exists(sourceAsset)).toBe(false);
	});
});
