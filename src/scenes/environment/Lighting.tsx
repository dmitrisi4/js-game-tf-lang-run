import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type React from 'react';

type PropsType = Record<string, never>;

/**
 * Defines the baseline scene lighting for the prototype environment.
 *
 * The lighting is intentionally simple, but already split from scene
 * composition so it can evolve independently as the art direction matures.
 *
 * @returns {JSX.Element} The lighting nodes.
 */
const Lighting: React.FC<PropsType> = () => {
	return (
		<>
			<hemisphericLight
				name='hemispheric-light'
				intensity={0.65}
				direction={new Vector3(0, 1, 0)}
				groundColor={Color3.FromHexString('#5d5a52')}
			/>
			<directionalLight
				name='sun-light'
				intensity={0.75}
				direction={new Vector3(-0.4, -1, 0.2)}
				position={new Vector3(10, 18, -8)}
			/>
		</>
	);
};

export default Lighting;
