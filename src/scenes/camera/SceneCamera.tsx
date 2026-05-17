import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Observer } from '@babylonjs/core/Misc/observable';
import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useScene } from 'react-babylonjs';

const CAMERA_DISTANCE = 8.5;
const CAMERA_FOCUS_CENTER_OFFSET = 0.72;
const CAMERA_LERP_AMOUNT = 0.12;
const CAMERA_LOOK_SENSITIVITY = 0.005;
const MIN_CAMERA_PITCH = -0.2;
const MAX_CAMERA_PITCH = 0.45;

type PropsType = {
	isCameraInputEnabled: boolean;
	targetMesh: Mesh | null;
};

/**
 * Provides the prototype follow camera that tracks the authoritative player mesh.
 *
 * @param {PropsType} props - Camera target props.
 * @returns {JSX.Element} The scene camera node.
 */
const SceneCamera: React.FC<PropsType> = ({ isCameraInputEnabled, targetMesh }) => {
	const scene = useScene();
	const cameraRef = useRef<FreeCamera | null>(null);
	const yawRef = useRef(0);
	const pitchRef = useRef(0.12);
	const lastPointerPositionRef = useRef<Vector3 | null>(null);
	const activePointerIdRef = useRef<number | null>(null);
	const isCameraDragActiveRef = useRef(false);
	const isCameraInputEnabledRef = useRef(isCameraInputEnabled);

	useEffect(() => {
		isCameraInputEnabledRef.current = isCameraInputEnabled;
		if (!isCameraInputEnabled) {
			activePointerIdRef.current = null;
			isCameraDragActiveRef.current = false;
			lastPointerPositionRef.current = null;
		}
	}, [isCameraInputEnabled]);

	useEffect(() => {
		if (!scene) {
			return;
		}

		const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
		camera.setTarget(Vector3.Zero());
		scene.activeCamera = camera;
		cameraRef.current = camera;

		return () => {
			if (scene.activeCamera === camera) {
				scene.activeCamera = null;
			}

			cameraRef.current = null;
			camera.dispose();
		};
	}, [scene]);

	useEffect(() => {
		if (!scene) {
			return;
		}

		const canvas = scene.getEngine().getRenderingCanvas();

		if (!canvas) {
			return;
		}

		const startCameraDrag = (e: PointerEvent) => {
			if (!isCameraInputEnabledRef.current) {
				return;
			}

			activePointerIdRef.current = e.pointerId;
			isCameraDragActiveRef.current = true;
			lastPointerPositionRef.current = new Vector3(e.clientX, e.clientY, 0);
			canvas.setPointerCapture?.(e.pointerId);
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (
				!isCameraInputEnabledRef.current ||
				!isCameraDragActiveRef.current ||
				activePointerIdRef.current !== e.pointerId
			) {
				lastPointerPositionRef.current = null;
				return;
			}

			const previousPointerPosition = lastPointerPositionRef.current;
			const fallbackDelta = previousPointerPosition
				? {
						x: e.clientX - previousPointerPosition.x,
						y: e.clientY - previousPointerPosition.y,
					}
				: { x: 0, y: 0 };

			lastPointerPositionRef.current = new Vector3(e.clientX, e.clientY, 0);

			yawRef.current += (e.movementX || fallbackDelta.x) * CAMERA_LOOK_SENSITIVITY;
			pitchRef.current = Math.min(
				MAX_CAMERA_PITCH,
				Math.max(
					MIN_CAMERA_PITCH,
					pitchRef.current - (e.movementY || fallbackDelta.y) * CAMERA_LOOK_SENSITIVITY,
				),
			);
		};

		const resetCameraDrag = () => {
			if (activePointerIdRef.current !== null) {
				if (canvas.hasPointerCapture?.(activePointerIdRef.current)) {
					canvas.releasePointerCapture(activePointerIdRef.current);
				}
			}

			activePointerIdRef.current = null;
			isCameraDragActiveRef.current = false;
			lastPointerPositionRef.current = null;
		};

		const stopCameraDrag = (e: PointerEvent) => {
			if (activePointerIdRef.current !== e.pointerId) {
				return;
			}

			resetCameraDrag();
		};

		const preventContextMenu = (e: MouseEvent) => {
			if (isCameraDragActiveRef.current) {
				e.preventDefault();
			}
		};

		canvas.addEventListener('pointerdown', startCameraDrag);
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', stopCameraDrag);
		window.addEventListener('pointercancel', stopCameraDrag);
		window.addEventListener('blur', resetCameraDrag);
		canvas.addEventListener('contextmenu', preventContextMenu);

		return () => {
			canvas.removeEventListener('pointerdown', startCameraDrag);
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', stopCameraDrag);
			window.removeEventListener('pointercancel', stopCameraDrag);
			window.removeEventListener('blur', resetCameraDrag);
			canvas.removeEventListener('contextmenu', preventContextMenu);
		};
	}, [scene]);

	useEffect(() => {
		if (!scene) {
			return;
		}

		let observer: Observer<BabylonScene> | null = null;

		observer = scene.onBeforeRenderObservable.add(() => {
			if (!cameraRef.current || !targetMesh) {
				return;
			}

			const orbitDirection = new Vector3(
				Math.sin(yawRef.current) * Math.cos(pitchRef.current),
				Math.sin(pitchRef.current),
				Math.cos(yawRef.current) * Math.cos(pitchRef.current),
			).normalize();
			const targetPosition = targetMesh.absolutePosition;
			const focusTarget = new Vector3(
				targetPosition.x,
				targetPosition.y + CAMERA_FOCUS_CENTER_OFFSET,
				targetPosition.z,
			);
			const desiredPosition = focusTarget.subtract(orbitDirection.scale(CAMERA_DISTANCE));

			cameraRef.current.position = Vector3.Lerp(
				cameraRef.current.position,
				desiredPosition,
				CAMERA_LERP_AMOUNT,
			);
			cameraRef.current.setTarget(focusTarget);
		});

		return () => {
			if (observer) {
				scene.onBeforeRenderObservable.remove(observer);
			}
		};
	}, [scene, targetMesh]);

	return null;
};

export default SceneCamera;
