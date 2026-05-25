import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Observer } from '@babylonjs/core/Misc/observable';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { Scene } from '@babylonjs/core/scene';

const WAKE_PARTICLE_CAPACITY = 160;
const WAKE_EMIT_RATE_MOVING = 88;
const WAKE_Y_OFFSET = 0.075;
const WAKE_BACK_OFFSET = 0.58;
const IDLE_RIPPLE_DIAMETER = 0.82;
const IDLE_RIPPLE_THICKNESS = 0.028;
const IDLE_RIPPLE_TESSELLATION = 64;
const IDLE_RIPPLE_DURATION_SECONDS = 0.82;
const IDLE_RIPPLE_SCALE_END = 3.4;
const IDLE_RIPPLE_ALPHA_START = 0.68;

export type WakeEmitterPositionInputType = {
	facingYaw: number;
	waterSurfaceY: number;
	x: number;
	z: number;
};

/** Resolves the wake emitter slightly behind the player's facing direction. */
export const getWakeEmitterPosition = ({
	facingYaw,
	waterSurfaceY,
	x,
	z,
}: WakeEmitterPositionInputType): Vector3 =>
	new Vector3(
		x - Math.sin(facingYaw) * WAKE_BACK_OFFSET,
		waterSurfaceY + WAKE_Y_OFFSET,
		z - Math.cos(facingYaw) * WAKE_BACK_OFFSET,
	);

const createWakeParticleTexture = (scene: Scene): DynamicTexture => {
	const texture = new DynamicTexture('water-wake-particle-texture', 64, scene, false);
	const ctx = texture.getContext();
	const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 28);

	grad.addColorStop(0, 'rgba(220,252,255,0.92)');
	grad.addColorStop(0.5, 'rgba(157,245,255,0.55)');
	grad.addColorStop(1, 'rgba(157,245,255,0)');
	ctx.clearRect(0, 0, 64, 64);
	ctx.fillStyle = grad;
	ctx.beginPath();
	ctx.arc(32, 32, 28, 0, Math.PI * 2);
	ctx.fill();
	texture.update(false);

	return texture;
};

// ─── Movement Wake ────────────────────────────────────────────────────────────

export type WaterMovementWakeType = {
	dispose: () => void;
	setActive: (isMoving: boolean) => void;
	setPosition: (x: number, z: number, facingYaw: number) => void;
};

/**
 * Creates a continuous particle wake system that follows the player at the
 * water surface level. Emit rate is throttled to zero when the player is idle.
 *
 * @param scene - Active Babylon scene.
 * @param waterSurfaceY - World Y of the water surface.
 * @returns Control handle for the wake system.
 */
export const createWaterMovementWake = (
	scene: Scene,
	waterSurfaceY: number,
): WaterMovementWakeType => {
	const emitterPosition = getWakeEmitterPosition({ facingYaw: 0, waterSurfaceY, x: 0, z: 0 });
	const wake = new ParticleSystem('player-water-wake', WAKE_PARTICLE_CAPACITY, scene);

	wake.particleTexture = createWakeParticleTexture(scene);
	wake.emitter = emitterPosition.clone();
	wake.blendMode = ParticleSystem.BLENDMODE_STANDARD;
	wake.renderingGroupId = 2;

	wake.color1 = new Color4(0.9, 1, 1, 0.86);
	wake.color2 = new Color4(0.72, 0.96, 1, 0.72);
	wake.colorDead = new Color4(0.74, 0.95, 1, 0);

	wake.createSphereEmitter(0.42, 0.12);
	wake.direction1 = new Vector3(-0.85, 0.02, -0.85);
	wake.direction2 = new Vector3(0.85, 0.04, 0.85);

	wake.gravity = new Vector3(0, 0, 0);
	wake.minEmitPower = 0.45;
	wake.maxEmitPower = 1.1;
	wake.updateSpeed = 0.016;

	wake.minLifeTime = 0.74;
	wake.maxLifeTime = 1.28;
	wake.minSize = 0.24;
	wake.maxSize = 1.05;

	wake.addSizeGradient(0, 0.2, 0.3);
	wake.addSizeGradient(0.52, 0.75, 1.08);
	wake.addSizeGradient(1, 0.1, 0.2);

	wake.emitRate = 0;
	wake.start();

	return {
		dispose: () => {
			wake.dispose();
		},
		setActive: (isMoving: boolean) => {
			wake.emitRate = isMoving ? WAKE_EMIT_RATE_MOVING : 0;
		},
		setPosition: (x: number, z: number, facingYaw: number) => {
			if (wake.emitter instanceof Vector3) {
				wake.emitter.copyFrom(getWakeEmitterPosition({ facingYaw, waterSurfaceY, x, z }));
			}
		},
	};
};

/**
 * Emits a single expanding torus ripple at the given position — used for idle
 * water disturbance while the player stands still in water.
 *
 * @param scene - Active Babylon scene.
 * @param position - World position at the water surface.
 */
export const createIdleWaterRipple = (scene: Scene, position: Vector3): void => {
	const ring = MeshBuilder.CreateTorus(
		'player-idle-water-ripple',
		{
			diameter: IDLE_RIPPLE_DIAMETER,
			thickness: IDLE_RIPPLE_THICKNESS,
			tessellation: IDLE_RIPPLE_TESSELLATION,
		},
		scene,
	);
	const material = new StandardMaterial('player-idle-water-ripple-material', scene);
	let elapsedSeconds = 0;
	let observer: Observer<Scene> | null = null;

	ring.position.copyFrom(position);
	ring.position.y += WAKE_Y_OFFSET;
	ring.rotation.x = Math.PI / 2;
	ring.isPickable = false;
	ring.renderingGroupId = 2;

	material.diffuseColor = Color3.FromHexString('#c8faff');
	material.emissiveColor = Color3.FromHexString('#9df5ff');
	material.specularColor = Color3.Black();
	material.alpha = IDLE_RIPPLE_ALPHA_START;
	ring.material = material;

	observer = scene.onBeforeRenderObservable.add(() => {
		elapsedSeconds += Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);

		const progress = Math.min(elapsedSeconds / IDLE_RIPPLE_DURATION_SECONDS, 1);
		const scale = 1 + progress * (IDLE_RIPPLE_SCALE_END - 1);

		ring.scaling.set(scale, scale, scale);
		material.alpha = Math.max(0, IDLE_RIPPLE_ALPHA_START * (1 - progress));

		if (progress >= 1) {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}

			material.dispose();
			ring.dispose();
		}
	});
};
