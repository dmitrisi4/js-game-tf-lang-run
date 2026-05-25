import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Scene } from '@babylonjs/core/scene';

const WATERLINE_DISC_RADIUS = 0.76;
const WATERLINE_DISC_TESSELLATION = 72;
const WATERLINE_TEXTURE_SIZE = 128;
const WATERLINE_BOB_SPEED = 2.4;
const WATERLINE_ALPHA_MIN = 0.5;
const WATERLINE_ALPHA_MAX = 0.95;
const WATERLINE_Y_OFFSET = 0.055;

export type PlayerWaterLineType = {
	dispose: () => void;
	setPosition: (x: number, z: number) => void;
	setVisible: (visible: boolean) => void;
};

/** Draws concentric ripple rings on a DynamicTexture canvas for the waterline disc. */
const buildWaterlineTexture = (scene: Scene): DynamicTexture => {
	const texture = new DynamicTexture(
		'player-waterline-texture',
		WATERLINE_TEXTURE_SIZE,
		scene,
		false,
	);
	const ctx = texture.getContext();
	const cx = WATERLINE_TEXTURE_SIZE / 2;
	const cy = WATERLINE_TEXTURE_SIZE / 2;

	ctx.clearRect(0, 0, WATERLINE_TEXTURE_SIZE, WATERLINE_TEXTURE_SIZE);

	const outerGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, cx);
	outerGlow.addColorStop(0, 'rgba(157,245,255,0.0)');
	outerGlow.addColorStop(0.45, 'rgba(157,245,255,0.24)');
	outerGlow.addColorStop(0.74, 'rgba(200,250,255,0.72)');
	outerGlow.addColorStop(0.88, 'rgba(255,255,255,0.92)');
	outerGlow.addColorStop(0.96, 'rgba(157,245,255,0.55)');
	outerGlow.addColorStop(1, 'rgba(157,245,255,0.0)');
	ctx.fillStyle = outerGlow;
	ctx.beginPath();
	ctx.arc(cx, cy, cx, 0, Math.PI * 2);
	ctx.fill();

	const ringRadii = [0.62, 0.72, 0.82];
	for (const ratio of ringRadii) {
		const r = cx * ratio;
		const ringGrad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 2);
		ringGrad.addColorStop(0, 'rgba(255,255,255,0)');
		ringGrad.addColorStop(0.5, 'rgba(200,252,255,0.28)');
		ringGrad.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = ringGrad;
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.fill();
	}

	texture.update(false);

	return texture;
};

/**
 * Creates a waterline disc effect that sits at the water surface level,
 * following the player's X/Z position. The disc is visible only when
 * the player is submerged and pulses gently to simulate foam/bioluminescence.
 *
 * @param scene - Active Babylon scene.
 * @param waterSurfaceY - World Y of the water surface.
 * @returns Control handle for the waterline effect.
 */
export const createPlayerWaterLine = (scene: Scene, waterSurfaceY: number): PlayerWaterLineType => {
	const disc = MeshBuilder.CreateDisc(
		'player-waterline-disc',
		{
			radius: WATERLINE_DISC_RADIUS,
			tessellation: WATERLINE_DISC_TESSELLATION,
		},
		scene,
	);
	disc.rotation.x = Math.PI / 2;
	disc.position.y = waterSurfaceY + WATERLINE_Y_OFFSET;
	disc.isPickable = false;
	disc.renderingGroupId = 2;
	disc.setEnabled(false);

	const material = new StandardMaterial('player-waterline-disc-material', scene);
	const texture = buildWaterlineTexture(scene);

	material.diffuseTexture = texture;
	material.emissiveColor = Color3.FromHexString('#9df5ff');
	material.specularColor = Color3.Black();
	material.backFaceCulling = false;
	material.useAlphaFromDiffuseTexture = true;
	material.alpha = WATERLINE_ALPHA_MAX;

	disc.material = material;

	let elapsedSeconds = 0;
	let observer: Observer<Scene> | null = scene.onBeforeRenderObservable.add(() => {
		elapsedSeconds += Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
		const bobPhase = Math.sin(elapsedSeconds * WATERLINE_BOB_SPEED) * 0.5 + 0.5;
		material.alpha = WATERLINE_ALPHA_MIN + (WATERLINE_ALPHA_MAX - WATERLINE_ALPHA_MIN) * bobPhase;
	});

	return {
		dispose: () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
				observer = null;
			}
			texture.dispose();
			material.dispose();
			disc.dispose();
		},
		setPosition: (x: number, z: number) => {
			disc.position.x = x;
			disc.position.z = z;
		},
		setVisible: (visible: boolean) => {
			disc.setEnabled(visible);
		},
	};
};
