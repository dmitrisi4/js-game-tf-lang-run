import type React from 'react';
import MainScene from '@/scenes/MainScene';
import InventoryOverlay from '@/ui/InventoryOverlay';
import TalentTreeOverlay from '@/ui/TalentTreeOverlay';

type PropsType = Record<string, never>;

const App: React.FC<PropsType> = () => {
	return (
		<>
			<MainScene />
			<InventoryOverlay />
			<TalentTreeOverlay />
		</>
	);
};

export default App;
