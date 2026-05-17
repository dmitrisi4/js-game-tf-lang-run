import { describe, expect, it } from 'vitest';
import { buildLanguageTalentGroups } from './languageTalentNodes';

describe('language talent nodes', () => {
	it('groups discovered letters and crafted words into language branches', () => {
		const groups = buildLanguageTalentGroups(['a', 'r', 'e', 'a'], ['are']);
		const groupIds = groups.map((group) => group.id);

		expect(groupIds).toContain('english-vowels');
		expect(groupIds).toContain('english-consonants-middle');
		expect(groupIds).toContain('english-roots-short');
		expect(groups.flatMap((group) => group.nodes).map((node) => node.id)).toEqual([
			'symbol-a',
			'symbol-e',
			'symbol-r',
			'word-are',
		]);
	});
});
