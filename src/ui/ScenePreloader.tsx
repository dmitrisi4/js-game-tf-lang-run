import type React from 'react';
import './scenePreloader.css';

type PropsType = {
	isVisible: boolean;
	label: string;
};

/**
 * Fullscreen loading overlay for initial Babylon scene preparation.
 *
 * @param {PropsType} props - Overlay visibility and current loading label.
 * @returns {JSX.Element | null} The loading overlay.
 */
const ScenePreloader: React.FC<PropsType> = ({ isVisible, label }) => {
	if (!isVisible) {
		return null;
	}

	return (
		<div className='scene-preloader' role='status' aria-live='polite'>
			<div className='scene-preloader-mark' aria-hidden='true'>
				<span />
				<span />
				<span />
			</div>
			<div className='scene-preloader-copy'>
				<strong>KEYARENA</strong>
				<span>{label}</span>
			</div>
			<div className='scene-preloader-bar' aria-hidden='true'>
				<span />
			</div>
		</div>
	);
};

export default ScenePreloader;
