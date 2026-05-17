export type LanguageTalentNodeKind = 'symbol' | 'word';

export type LanguageTalentNode = {
	id: string;
	label: string;
	description: string;
	groupId: string;
	kind: LanguageTalentNodeKind;
	language: string;
	position: number;
	rank: number;
	unlocked: boolean;
};

export type LanguageTalentGroup = {
	id: string;
	title: string;
	subtitle: string;
	language: string;
	nodes: LanguageTalentNode[];
};

const ENGLISH_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

const getAlphabetPosition = (letter: string): number => ENGLISH_ALPHABET.indexOf(letter) + 1;

const getSymbolGroupId = (letter: string): string => {
	if (VOWELS.has(letter)) {
		return 'english-vowels';
	}

	const position = getAlphabetPosition(letter);

	if (position <= 9) {
		return 'english-consonants-early';
	}

	if (position <= 18) {
		return 'english-consonants-middle';
	}

	return 'english-consonants-late';
};

const getWordGroupId = (word: string): string => {
	if (word.length <= 3) {
		return 'english-roots-short';
	}

	if (word.length <= 5) {
		return 'english-roots-bound';
	}

	return 'english-roots-long';
};

const groupDefinitions: Record<string, Omit<LanguageTalentGroup, 'nodes'>> = {
	'english-vowels': {
		id: 'english-vowels',
		title: 'Vowel Wells',
		subtitle: 'Open sounds that carry energy through the word.',
		language: 'English',
	},
	'english-consonants-early': {
		id: 'english-consonants-early',
		title: 'First Consonants',
		subtitle: 'Alphabet positions 1-9. Quick starts and simple cuts.',
		language: 'English',
	},
	'english-consonants-middle': {
		id: 'english-consonants-middle',
		title: 'Middle Consonants',
		subtitle: 'Alphabet positions 10-18. Linking force and structure.',
		language: 'English',
	},
	'english-consonants-late': {
		id: 'english-consonants-late',
		title: 'Terminal Consonants',
		subtitle: 'Alphabet positions 19-26. Ending force and impact.',
		language: 'English',
	},
	'english-roots-short': {
		id: 'english-roots-short',
		title: 'Short Roots',
		subtitle: 'Crafted words with three or fewer letters.',
		language: 'English',
	},
	'english-roots-bound': {
		id: 'english-roots-bound',
		title: 'Bound Words',
		subtitle: 'Four and five letter crafted forms.',
		language: 'English',
	},
	'english-roots-long': {
		id: 'english-roots-long',
		title: 'Long Forms',
		subtitle: 'Extended words and future language branches.',
		language: 'English',
	},
};

const createSymbolNode = (letter: string): LanguageTalentNode => {
	const position = getAlphabetPosition(letter);
	const groupId = getSymbolGroupId(letter);

	return {
		id: `symbol-${letter}`,
		label: letter.toUpperCase(),
		description: `${VOWELS.has(letter) ? 'Vowel' : 'Consonant'} ${position} in the English alphabet.`,
		groupId,
		kind: 'symbol',
		language: 'English',
		position,
		rank: 1,
		unlocked: true,
	};
};

const createWordNode = (word: string): LanguageTalentNode => {
	const groupId = getWordGroupId(word);
	const position = word
		.split('')
		.reduce((total, letter) => total + Math.max(0, getAlphabetPosition(letter)), 0);

	return {
		id: `word-${word}`,
		label: word.toUpperCase(),
		description: `${word.length}-letter crafted English root.`,
		groupId,
		kind: 'word',
		language: 'English',
		position,
		rank: word.length,
		unlocked: true,
	};
};

export const buildLanguageTalentGroups = (
	discoveredLetters: string[],
	discoveredWords: string[],
): LanguageTalentGroup[] => {
	const uniqueLetters = Array.from(new Set(discoveredLetters.map((letter) => letter.toLowerCase())))
		.filter((letter) => ENGLISH_ALPHABET.includes(letter))
		.sort((a, b) => getAlphabetPosition(a) - getAlphabetPosition(b));
	const uniqueWords = Array.from(new Set(discoveredWords.map((word) => word.toLowerCase()))).sort();
	const nodes = [...uniqueLetters.map(createSymbolNode), ...uniqueWords.map(createWordNode)];

	return Object.values(groupDefinitions)
		.map((group) => ({
			...group,
			nodes: nodes.filter((node) => node.groupId === group.id),
		}))
		.filter((group) => group.nodes.length > 0);
};
