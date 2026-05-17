import type React from 'react';
import { buildLanguageTalentGroups } from '@/scenes/talents/languageTalentNodes';
import {
	selectDiscoveredLetters,
	selectDiscoveredWords,
	selectIsTalentTreeOpen,
} from '@/store/selectors';
import { useGameStore } from '@/store/useGameStore';
import './gameHud.css';

/**
 * Renders the language-based talent node interface.
 *
 * @returns {JSX.Element | null} The talent tree overlay when open.
 */
const TalentTreeOverlay: React.FC = () => {
	const isTalentTreeOpen = useGameStore(selectIsTalentTreeOpen);
	const discoveredLetters = useGameStore(selectDiscoveredLetters);
	const discoveredWords = useGameStore(selectDiscoveredWords);
	const groups = buildLanguageTalentGroups(discoveredLetters, discoveredWords);
	const unlockedCount = groups.reduce((total, group) => total + group.nodes.length, 0);

	if (!isTalentTreeOpen) {
		return null;
	}

	return (
		<div className='talent-overlay'>
			<div className='talent-backdrop' />
			<section className='talent-panel'>
				<header className='talent-header'>
					<div>
						<p className='talent-eyebrow'>Language Talents</p>
						<h2>Lexicon Web</h2>
					</div>
					<div className='talent-summary'>
						<span>Unlocked</span>
						<strong>{unlockedCount}</strong>
					</div>
				</header>

				{groups.length === 0 ? (
					<div className='talent-empty-state'>
						<p>No nodes unlocked.</p>
						<span>Loot letters or craft words to open the first branch.</span>
					</div>
				) : (
					<div className='talent-group-grid'>
						{groups.map((group) => (
							<section className='talent-group' key={group.id}>
								<div className='talent-group-header'>
									<div>
										<p>{group.language}</p>
										<h3>{group.title}</h3>
									</div>
									<span>{group.nodes.length}</span>
								</div>
								<p className='talent-group-subtitle'>{group.subtitle}</p>
								<div className='talent-node-map'>
									{group.nodes.map((node, index) => (
										<div
											className={`talent-node talent-node-${node.kind}`}
											key={node.id}
											style={{ '--node-depth': index % 4 } as React.CSSProperties}
										>
											<strong>{node.label}</strong>
											<span>{node.kind === 'symbol' ? `#${node.position}` : `Rank ${node.rank}`}</span>
											<small>{node.description}</small>
										</div>
									))}
								</div>
							</section>
						))}
					</div>
				)}
			</section>
		</div>
	);
};

export default TalentTreeOverlay;
