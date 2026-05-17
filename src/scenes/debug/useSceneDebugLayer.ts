import type { Scene as BabylonScene } from '@babylonjs/core/scene';
import { useEffect } from 'react';

/**
 * Enables the Babylon inspector only in development and keeps its
 * lifecycle tied to the mounted scene instance.
 *
 * @param {BabylonScene | null} sceneInstance - The active Babylon scene.
 */
export const useSceneDebugLayer = (sceneInstance: BabylonScene | null): void => {
	useEffect(() => {
		if (!sceneInstance || !import.meta.env.DEV) {
			return;
		}

		const getDebugLayer = () => sceneInstance.debugLayer;

		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.key !== 'i' && e.key !== 'I') {
				return;
			}

			if (getDebugLayer()?.isVisible()) {
				getDebugLayer()?.hide();
				return;
			}

			await import('@babylonjs/inspector');
			await getDebugLayer()?.show();
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);

			if (getDebugLayer()?.isVisible()) {
				getDebugLayer()?.hide();
			}
		};
	}, [sceneInstance]);
};
