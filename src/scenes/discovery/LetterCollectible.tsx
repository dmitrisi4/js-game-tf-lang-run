import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type React from 'react';
import { useRef } from 'react';
import { useBeforeRender } from 'react-babylonjs';
import type { CollectibleSpawnPoint } from './collectibleTypes';

type PropsType = {
	collectible: CollectibleSpawnPoint;
};

/**
 * Renders the fallback collectible placeholder for the discovery loop.
 *
 * @param {PropsType} props - Collectible props.
 * @returns {JSX.Element} The collectible scene node.
 */
const LetterCollectible: React.FC<PropsType> = ({ collectible }) => {
	const meshRef = useRef<Mesh | null>(null);

	useBeforeRender(() => {
		if (!meshRef.current) {
			return;
		}

		const baseY = collectible.position.y;
		meshRef.current.position.y = baseY + Math.sin(performance.now() * 0.003 + baseY) * 0.15;
		meshRef.current.rotation.y += 0.02;
	});

	return (
		<sphere
			name={`collectible-letter-${collectible.id}`}
			diameter={0.7}
			position={new Vector3(collectible.position.x, collectible.position.y, collectible.position.z)}
			onCreated={(mesh) => {
				meshRef.current = mesh;
			}}
		>
			<standardMaterial
				name={`collectible-letter-material-${collectible.id}`}
				diffuseColor={Color3.FromHexString('#f3cd57')}
				emissiveColor={Color3.FromHexString('#6d5212')}
				specularColor={Color3.FromHexString('#3a2a0b')}
			/>
		</sphere>
	);
};

export default LetterCollectible;
