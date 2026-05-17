import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import type React from 'react';
import TerrainGround from './TerrainGround';

type PropsType = {
	havokPlugin: HavokPlugin | null;
};

/**
 * Renders the prototype ground plane and attaches static physics when
 * the Havok plugin is available.
 *
 * @param {PropsType} props - Ground configuration props.
 * @returns {JSX.Element} The ground mesh.
 */
const Ground: React.FC<PropsType> = ({ havokPlugin }) => {
	return <TerrainGround havokPlugin={havokPlugin} />;
};

export default Ground;
