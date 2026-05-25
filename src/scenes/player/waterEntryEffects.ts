import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Observer } from '@babylonjs/core/Misc/observable';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { Scene } from '@babylonjs/core/scene';

const SPLASH_PARTICLE_CAPACITY = 96;
const SPLASH_STOP_DURATION_SECONDS = 0.12;
const SPLASH_DISPOSE_DELAY_MS = 1200;
const FOAM_RING_DURATION_SECONDS = 0.72;

const createSplashParticleTexture = (scene: Scene): DynamicTexture => {
	const texture = new DynamicTexture('water-entry-splash-particle-texture', 64, scene, false);
	const context = texture.getContext();
	const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 30);

	gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
	gradient.addColorStop(0.45, 'rgba(207,251,255,0.72)');
	gradient.addColorStop(1, 'rgba(207,251,255,0)');
	context.clearRect(0, 0, 64, 64);
	context.fillStyle = gradient;
	context.beginPath();
	context.arc(32, 32, 30, 0, Math.PI * 2);
	context.fill();
	texture.update(false);

	return texture;
};

const createFoamEntryRing = (scene: Scene, position: Vector3): void => {
	const ring = MeshBuilder.CreateTorus(
		'player-water-entry-foam-ring',
		{
			diameter: 1.08,
			thickness: 0.035,
			tessellation: 72,
		},
		scene,
	);
	const material = new StandardMaterial('player-water-entry-foam-ring-material', scene);
	let elapsedSeconds = 0;
	let observer: Observer<Scene> | null = null;

	ring.position.copyFrom(position);
	ring.position.y += 0.018;
	ring.rotation.x = Math.PI / 2;
	ring.isPickable = false;
	ring.renderingGroupId = 1;

	material.alpha = 0.78;
	material.diffuseColor = Color3.FromHexString('#e5fffa');
	material.emissiveColor = Color3.FromHexString('#bdf8ff');
	material.specularColor = Color3.FromHexString('#ffffff');
	ring.material = material;

	observer = scene.onBeforeRenderObservable.add(() => {
		elapsedSeconds += Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);

		const progress = Math.min(elapsedSeconds / FOAM_RING_DURATION_SECONDS, 1);
		const scale = 1 + progress * 3.6;

		ring.scaling.set(scale, scale, scale);
		material.alpha = Math.max(0, 0.78 * (1 - progress));

		if (progress >= 1) {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}

			material.dispose();
			ring.dispose();
		}
	});
};

/** Emits a short one-shot splash when the player crosses into water. */
export const createWaterEntrySplash = (scene: Scene, position: Vector3): void => {
	const splash = new ParticleSystem('player-water-entry-splash', SPLASH_PARTICLE_CAPACITY, scene);

	createFoamEntryRing(scene, position);

	splash.particleTexture = createSplashParticleTexture(scene);
	splash.emitter = position.clone();
	splash.blendMode = ParticleSystem.BLENDMODE_STANDARD;
	splash.color1 = new Color4(0.84, 0.98, 1, 0.82);
	splash.color2 = new Color4(1, 1, 1, 0.68);
	splash.colorDead = new Color4(0.66, 0.9, 0.95, 0);
	splash.createDirectedSphereEmitter(
		0.42,
		new Vector3(-1.4, 0.28, -1.4),
		new Vector3(1.4, 1.9, 1.4),
	);
	splash.emitRate = 680;
	splash.gravity = new Vector3(0, -4.2, 0);
	splash.minLifeTime = 0.28;
	splash.maxLifeTime = 0.68;
	splash.minSize = 0.12;
	splash.maxSize = 0.42;
	splash.targetStopDuration = SPLASH_STOP_DURATION_SECONDS;
	splash.disposeOnStop = true;
	splash.start();

	window.setTimeout(() => {
		if (!splash.isDisposed) {
			splash.dispose();
		}
	}, SPLASH_DISPOSE_DELAY_MS);
};
