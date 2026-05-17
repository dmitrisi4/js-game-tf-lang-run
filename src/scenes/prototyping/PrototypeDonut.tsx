import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';

type PropsType = {
	havokPlugin: HavokPlugin | null;
};

/**
 * Provides a temporary physics-enabled scene prop used while the
 * gameplay loop is still under construction.
 *
 * @param {PropsType} props - Prototype prop configuration.
 * @returns {JSX.Element} The donut mesh node.
 */
const PrototypeDonut: React.FC<PropsType> = ({ havokPlugin }) => {
	return (
		<torus
			name='donut1'
			diameter={1.5}
			thickness={0.45}
			tessellation={32}
			position={new Vector3(0, 4, 0)}
		>
			{havokPlugin && (
				<physicsAggregate
					type={PhysicsShapeType.CONVEX_HULL}
					_options={{ mass: 1, restitution: 0.9 }}
				/>
			)}
		</torus>
	);
};

export default PrototypeDonut;
