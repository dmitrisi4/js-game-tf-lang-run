import type React from 'react';
import AssetLetterCollectible from './AssetLetterCollectible';
import type { CollectibleSpawnPoint } from './collectibleTypes';

type PropsType = {
	collectibles: CollectibleSpawnPoint[];
};

/**
 * Renders the active discovery collectibles for the current scene.
 *
 * @param {PropsType} props - Collectible list props.
 * @returns {JSX.Element} The collectibles subtree.
 */
const LetterCollectibles: React.FC<PropsType> = ({ collectibles }) => {
	return (
		<>
			{collectibles.map((collectible) => (
				<AssetLetterCollectible key={collectible.id} collectible={collectible} />
			))}
		</>
	);
};

export default LetterCollectibles;
