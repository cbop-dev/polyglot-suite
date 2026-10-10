import hebrewDictData from './data/hebrew_morph_dict.json';

const hebrewDict = hebrewDictData as Record<string, string>;

// ==========================================
// 1. PROIEL Morphological Tag Decoder (Apostolic Fathers / Latin / Greek)
// ==========================================

export const PROIEL_POS_MAP: Record<string, string> = {
	'V-': 'Verb',
	'N-': 'Noun',
	'NP': 'Proper Noun',
	'A-': 'Adjective',
	'RA': 'Definite Article',
	'RD': 'Demonstrative Pronoun',
	'RI': 'Interrogative / Indefinite Pronoun',
	'RP': 'Personal Pronoun',
	'RR': 'Relative Pronoun',
	'R-': 'Pronoun',
	'C-': 'Conjunction',
	'P-': 'Preposition',
	'D-': 'Adverb',
	'I-': 'Interjection',
	'X-': 'Particle',
	'NU': 'Numeral'
};

export const PROIEL_TENSE_MAP: Record<string, string> = {
	P: 'Present',
	I: 'Imperfect',
	F: 'Future',
	A: 'Aorist',
	X: 'Perfect',
	Y: 'Pluperfect'
};

export const PROIEL_VOICE_MAP: Record<string, string> = {
	A: 'Active',
	M: 'Middle',
	P: 'Passive',
	E: 'Middle/Passive'
};

export const PROIEL_MOOD_MAP: Record<string, string> = {
	I: 'Indicative',
	S: 'Subjunctive',
	O: 'Optative',
	D: 'Imperative',
	M: 'Imperative',
	N: 'Infinitive',
	P: 'Participle'
};

export const PROIEL_PERSON_MAP: Record<string, string> = {
	'1': '1st Person',
	'2': '2nd Person',
	'3': '3rd Person'
};

export const PROIEL_CASE_MAP: Record<string, string> = {
	N: 'Nominative',
	G: 'Genitive',
	D: 'Dative',
	A: 'Accusative',
	V: 'Vocative'
};

export const PROIEL_NUMBER_MAP: Record<string, string> = {
	S: 'Singular',
	P: 'Plural'
};

export const PROIEL_GENDER_MAP: Record<string, string> = {
	M: 'Masculine',
	F: 'Feminine',
	N: 'Neuter'
};

export const PROIEL_DEGREE_MAP: Record<string, string> = {
	C: 'Comparative',
	S: 'Superlative'
};

// Aliases for compatibility
export const POS_MAP = PROIEL_POS_MAP;
export const TENSE_MAP = PROIEL_TENSE_MAP;
export const VOICE_MAP = PROIEL_VOICE_MAP;
export const MOOD_MAP = PROIEL_MOOD_MAP;
export const PERSON_MAP = PROIEL_PERSON_MAP;
export const CASE_MAP = PROIEL_CASE_MAP;
export const NUMBER_MAP = PROIEL_NUMBER_MAP;
export const GENDER_MAP = PROIEL_GENDER_MAP;
export const DEGREE_MAP = PROIEL_DEGREE_MAP;

export interface DecodedMorph {
	pos: string;
	details: string[];
	summary: string;
	rawCode: string;
}

/**
 * Decodes a Part of Speech tag and 8-character morphological analysis into human-readable labels.
 * E.g.:
 *   decodeMorph('V-', '-AMN----') -> { pos: 'Verb', details: ['Aorist Middle Infinitive'], summary: 'Verb • Aorist Middle Infinitive' }
 *   decodeMorph('V-', '3AAI-S--') -> { pos: 'Verb', details: ['Aorist Active Indicative', '3rd Person Singular'] }
 *   decodeMorph('N-', '----NSF-') -> { pos: 'Noun', details: ['Nominative Singular Feminine'] }
 */
export function decodeMorph(posCode?: string, morphCode?: string): DecodedMorph {
	const posKey = (posCode || '').trim();
	const m = (morphCode || '').trim();
	const rawCode = `${posKey} ${m}`.trim();

	const pos = PROIEL_POS_MAP[posKey] || (posKey ? posKey.replace(/-/g, '') : '');
	if (!m || m === '--------' || m === '-') {
		return { pos, details: [], summary: pos, rawCode };
	}

	const details: string[] = [];

	if (m.length >= 8) {
		const personChar = m[0];
		const tenseChar = m[1];
		const voiceChar = m[2];
		const moodChar = m[3];
		const caseChar = m[4];
		const numberChar = m[5];
		const genderChar = m[6];
		const degreeChar = m[7];

		if (posKey === 'V-') {
			// Verb: Tense + Voice + Mood
			const tvm = [PROIEL_TENSE_MAP[tenseChar], PROIEL_VOICE_MAP[voiceChar], PROIEL_MOOD_MAP[moodChar]]
				.filter(Boolean)
				.join(' ');
			if (tvm) {
				details.push(tvm);
			}

			// Finite verb person & number
			if (PROIEL_PERSON_MAP[personChar]) {
				const pn = [PROIEL_PERSON_MAP[personChar], PROIEL_NUMBER_MAP[numberChar]].filter(Boolean).join(' ');
				if (pn) {
					details.push(pn);
				}
			}

			// Participle case, number, gender
			if (moodChar === 'P' || PROIEL_CASE_MAP[caseChar] || PROIEL_GENDER_MAP[genderChar]) {
				const cng = [PROIEL_CASE_MAP[caseChar], PROIEL_NUMBER_MAP[numberChar], PROIEL_GENDER_MAP[genderChar]]
					.filter(Boolean)
					.join(' ');
				if (cng) {
					details.push(cng);
				}
			}
		} else {
			// Non-verb (Noun, Adjective, Pronoun, Article)
			if (PROIEL_PERSON_MAP[personChar]) {
				details.push(PROIEL_PERSON_MAP[personChar]);
			}

			const cng = [PROIEL_CASE_MAP[caseChar], PROIEL_NUMBER_MAP[numberChar], PROIEL_GENDER_MAP[genderChar]]
				.filter(Boolean)
				.join(' ');
			if (cng) {
				details.push(cng);
			}

			if (PROIEL_DEGREE_MAP[degreeChar]) {
				details.push(PROIEL_DEGREE_MAP[degreeChar]);
			}
		}
	}

	const summaryParts = [pos, ...details].filter(Boolean);
	const summary = summaryParts.join(' • ');

	return {
		pos,
		details,
		summary,
		rawCode
	};
}

export const decodeProielMorph = decodeMorph;

// ==========================================
// 2. MorphGNT & Swete LXX Greek Morphological Decoder
// ==========================================

export const GREEK_POS: Record<string, string> = {
	V: 'Verb',
	N: 'Noun',
	A: 'Adjective',
	RA: 'Article',
	RD: 'Demonstrative Pronoun',
	RI: 'Interrogative/Indefinite Pronoun',
	RP: 'Personal Pronoun',
	RR: 'Relative Pronoun',
	C: 'Conjunction',
	P: 'Preposition',
	D: 'Adverb',
	X: 'Particle',
	I: 'Interjection',
	PREP: 'Preposition',
	CONJ: 'Conjunction',
	ADV: 'Adverb',
	PRON: 'Pronoun',
	NUM: 'Numeral',
	INTERJ: 'Interjection',
	PART: 'Particle'
};

export const GREEK_TENSE: Record<string, string> = {
	P: 'Present',
	I: 'Imperfect',
	F: 'Future',
	A: 'Aorist',
	X: 'Perfect',
	Y: 'Pluperfect'
};

export const GREEK_VOICE: Record<string, string> = {
	A: 'Active',
	M: 'Middle',
	P: 'Passive',
	E: 'Middle/Passive'
};

export const GREEK_MOOD: Record<string, string> = {
	I: 'Indicative',
	S: 'Subjunctive',
	O: 'Optative',
	M: 'Imperative',
	N: 'Infinitive',
	P: 'Participle'
};

export const GREEK_CASE: Record<string, string> = {
	N: 'Nominative',
	G: 'Genitive',
	D: 'Dative',
	A: 'Accusative',
	V: 'Vocative'
};

export const GREEK_NUMBER: Record<string, string> = {
	S: 'Singular',
	P: 'Plural'
};

export const GREEK_GENDER: Record<string, string> = {
	M: 'Masculine',
	F: 'Feminine',
	N: 'Neuter'
};

export const GREEK_PERSON: Record<string, string> = {
	'1': '1st Person',
	'2': '2nd Person',
	'3': '3rd Person'
};

/**
 * Decodes Greek morphological tags from both Swete LXX and SBLGNT (MorphGNT).
 * @returns Array of human-readable grammatical breakdown badges
 */
export function decodeGreekMorph(code: string): string[] {
	if (!code) return [];
	const trimmed = code.trim();
	if (GREEK_POS[trimmed]) return [GREEK_POS[trimmed]];

	// 1. MorphGNT format: 11 characters, e.g. "V- 3AAI-S--", "N- ----NSF-", "RA ----ASM-"
	if (trimmed.length === 11 && trimmed[2] === ' ') {
		const posCode = trimmed.slice(0, 2).replace(/-/g, '').trim();
		const pos = GREEK_POS[posCode] || (posCode === 'RA' ? 'Definite Article' : posCode);
		const badges = [pos];

		const person = trimmed[3];
		const tense = trimmed[4];
		const voice = trimmed[5];
		const mood = trimmed[6];
		const kase = trimmed[7];
		const number = trimmed[8];
		const gender = trimmed[9];

		const t = GREEK_TENSE[tense] || '';
		const v = GREEK_VOICE[voice] || '';
		const md = GREEK_MOOD[mood] || '';
		const tvm = [t, v, md].filter(Boolean).join(' ');
		if (tvm) badges.push(tvm);

		if (person !== '-') {
			const pStr = GREEK_PERSON[person] || '';
			const nStr = GREEK_NUMBER[number] || '';
			badges.push([pStr, nStr].filter(Boolean).join(' '));
		}

		if (kase !== '-') {
			const c = GREEK_CASE[kase] || '';
			const n = person === '-' ? GREEK_NUMBER[number] || '' : '';
			const g = GREEK_GENDER[gender] || '';
			const cng = [c, n, g].filter(Boolean).join(' ');
			if (cng) badges.push(cng);
		}
		return badges;
	}

	// 2. Swete format: e.g. "V-AAI-3S", "N-DSF", "D-NSM", "A-NSF", "PRON-P1-S"
	const sweteParts = trimmed.split('-');
	if (sweteParts.length >= 2) {
		const posCode = sweteParts[0];
		const pos = posCode === 'D' ? 'Article / Demonstrative' : GREEK_POS[posCode] || posCode;
		const badges = [pos];

		if (posCode === 'V') {
			const tvm = sweteParts[1] || '';
			const t = GREEK_TENSE[tvm[0]] || '';
			const v = GREEK_VOICE[tvm[1]] || '';
			const m = GREEK_MOOD[tvm[2]] || '';
			const tvmStr = [t, v, m].filter(Boolean).join(' ');
			if (tvmStr) badges.push(tvmStr);

			const pn = sweteParts[2] || '';
			if (pn.length === 2 && GREEK_PERSON[pn[0]] && GREEK_NUMBER[pn[1]]) {
				badges.push(`${GREEK_PERSON[pn[0]]} ${GREEK_NUMBER[pn[1]]}`);
			} else if (pn.length === 3 && GREEK_CASE[pn[0]] && GREEK_NUMBER[pn[1]] && GREEK_GENDER[pn[2]]) {
				badges.push(`${GREEK_CASE[pn[0]]} ${GREEK_NUMBER[pn[1]]} ${GREEK_GENDER[pn[2]]}`);
			}
			return badges;
		} else {
			const cng = sweteParts[1] || '';
			if (cng.length === 3) {
				const c = GREEK_CASE[cng[0]] || '';
				const n = GREEK_NUMBER[cng[1]] || '';
				const g = GREEK_GENDER[cng[2]] || '';
				const cngStr = [c, n, g].filter(Boolean).join(' ');
				if (cngStr) badges.push(cngStr);
			} else if (cng.startsWith('P') && cng.length >= 2) {
				badges.push(
					`${GREEK_PERSON[cng[1]] || ''} ${sweteParts[2] ? GREEK_NUMBER[sweteParts[2]] || '' : ''}`.trim()
				);
			}
			return badges;
		}
	}

	return [trimmed];
}

// ==========================================
// 3. Hebrew Morphological Decoder (ETCBC BHSA & Open Scriptures)
// ==========================================

export interface HebrewPrefix {
	code: string;
	prefix: string;
	name: string;
	gloss: string;
	strongs: string;
	headword: string;
	key: string;
}

export const HEBREW_PREFIX_MAP: Record<string, HebrewPrefix> = {
	'Prep-b': {
		code: 'Prep-b',
		prefix: 'בְּ',
		name: 'Preposition',
		gloss: 'in, with, by',
		strongs: 'H9003',
		headword: 'בְּ',
		key: 'ב'
	},
	'Prep-k': {
		code: 'Prep-k',
		prefix: 'כְּ',
		name: 'Preposition',
		gloss: 'as, like',
		strongs: 'H9004',
		headword: 'כְּ',
		key: 'כ'
	},
	'Prep-l': {
		code: 'Prep-l',
		prefix: 'לְ',
		name: 'Preposition',
		gloss: 'to, for',
		strongs: 'H9005',
		headword: 'לְ',
		key: 'ל'
	},
	'Prep-m': {
		code: 'Prep-m',
		prefix: 'מִ',
		name: 'Preposition',
		gloss: 'from, out of',
		strongs: 'H4480',
		headword: 'מִן',
		key: 'מן'
	},
	'Conj-w': {
		code: 'Conj-w',
		prefix: 'וְ',
		name: 'Conjunction',
		gloss: 'and, but, then',
		strongs: 'H9000',
		headword: 'וְ',
		key: 'ו'
	},
	Art: {
		code: 'Art',
		prefix: 'הַ',
		name: 'Definite Article',
		gloss: 'the',
		strongs: 'H9009',
		headword: 'הַ',
		key: 'ה'
	},
	Interrog: {
		code: 'Interrog',
		prefix: 'הֲ',
		name: 'Interrogative Particle',
		gloss: 'whether, if',
		strongs: 'H9008',
		headword: 'הֲ',
		key: 'ה'
	},
	Rel: {
		code: 'Rel',
		prefix: 'שֶׁ',
		name: 'Relative Particle',
		gloss: 'who, which, that',
		strongs: 'H7945',
		headword: 'שֶׁ',
		key: 'ש'
	},
	'Pro-r': {
		code: 'Pro-r',
		prefix: 'שֶׁ',
		name: 'Relative Particle',
		gloss: 'who, which, that',
		strongs: 'H7945',
		headword: 'שֶׁ',
		key: 'ש'
	},
	DirObjM: {
		code: 'DirObjM',
		prefix: 'אֵת',
		name: 'Direct Object Marker',
		gloss: '[direct object]',
		strongs: 'H853',
		headword: 'אֵת',
		key: 'את'
	}
};

/**
 * Splits Hebrew compound morphology into prefix segments and stem segment.
 * E.g. "Prep-b | N-fs" -> { prefixes: [ { code: 'Prep-b', prefix: 'בְּ', ... } ], stem: 'N-fs' }
 * "Conj-w, Art | N-fs" -> { prefixes: [ Conj-w, Art ], stem: 'N-fs' }
 */
export function parseHebrewMorphSegments(morphCode: string): {
	prefixes: HebrewPrefix[];
	stem: string;
} {
	if (!morphCode) return { prefixes: [], stem: '' };
	const str = morphCode.trim();
	if (!str.includes('|')) {
		if (HEBREW_PREFIX_MAP[str]) {
			return { prefixes: [HEBREW_PREFIX_MAP[str]], stem: '' };
		}
		return { prefixes: [], stem: str };
	}

	const parts = str.split('|').map((p) => p.trim());
	const prefixStr = parts[0];
	const stemStr = parts.slice(1).join(' | ');

	const prefixCodes = prefixStr.split(',').map((c) => c.trim()).filter(Boolean);
	const prefixes: HebrewPrefix[] = prefixCodes.map((c) => {
		return (
			HEBREW_PREFIX_MAP[c] || {
				code: c,
				prefix: c,
				name: c,
				gloss: '',
				strongs: '',
				headword: c,
				key: c
			}
		);
	});

	return { prefixes, stem: stemStr };
}

const HEB_STEM_MAP: Record<string, string> = {
	q: 'Qal',
	n: 'Nif‘al',
	p: 'Pi‘el',
	P: 'Pu‘al',
	h: 'Hif‘il',
	H: 'Hof‘al',
	t: 'Hitpa“el',
	o: 'Polel',
	O: 'Polal',
	r: 'Hitpolel',
	m: 'Poel',
	M: 'Poal',
	k: 'Palel',
	K: 'Pulal'
};

const HEB_ASPECT_MAP: Record<string, string> = {
	p: 'Perfect',
	i: 'Imperfect',
	w: 'Wayyiqtol',
	v: 'Imperative',
	c: 'Infinitive Construct',
	a: 'Infinitive Absolute',
	r: 'Participle Active',
	s: 'Participle Passive'
};

const HEB_PERSON_MAP: Record<string, string> = {
	'1': '1st Person',
	'2': '2nd Person',
	'3': '3rd Person'
};

const HEB_GENDER_MAP: Record<string, string> = {
	m: 'Masculine',
	f: 'Feminine',
	c: 'Common'
};

const HEB_NUMBER_MAP: Record<string, string> = {
	s: 'Singular',
	p: 'Plural',
	d: 'Dual'
};

const HEB_STATE_MAP: Record<string, string> = {
	a: 'Absolute',
	c: 'Construct',
	e: 'Emphatic'
};

function decodeHebrewStemCode(rawStem: string): string[] {
	if (!rawStem) return [];
	const trimmed = rawStem.trim();

	// Verbs: V-qp3ms, V-qc, etc.
	if (trimmed.startsWith('V-')) {
		const badges = ['Verb'];
		const rest = trimmed.slice(2);
		if (rest.length >= 2) {
			const stemLetter = rest[0];
			const aspectLetter = rest[1];
			const stemName = HEB_STEM_MAP[stemLetter] || '';
			const aspectName = HEB_ASPECT_MAP[aspectLetter] || '';
			const sa = [stemName, aspectName].filter(Boolean).join(' ');
			if (sa) badges.push(sa);

			const p = rest[2] ? HEB_PERSON_MAP[rest[2]] || '' : '';
			const g = rest[3] ? HEB_GENDER_MAP[rest[3]] || '' : '';
			const n = rest[4] ? HEB_NUMBER_MAP[rest[4]] || '' : '';
			const pgn = [p, g, n].filter(Boolean).join(' ');
			if (pgn) badges.push(pgn);
		}
		return badges;
	}

	// Nouns / Adjectives: N-fs, N-mp, A-ms, etc.
	if (trimmed.startsWith('N-') || trimmed.startsWith('A-')) {
		const badges = [trimmed.startsWith('N-') ? 'Noun' : 'Adjective'];
		const rest = trimmed.slice(2);
		let g = '',
			n = '',
			st = '';
		for (const char of rest) {
			if (HEB_GENDER_MAP[char]) g = HEB_GENDER_MAP[char];
			else if (HEB_NUMBER_MAP[char]) n = HEB_NUMBER_MAP[char];
			else if (HEB_STATE_MAP[char]) st = HEB_STATE_MAP[char];
		}
		const gns = [g, n, st].filter(Boolean).join(' ');
		if (gns) badges.push(gns);
		return badges;
	}

	if (trimmed.startsWith('Pp')) return ['Personal Pronoun'];
	if (trimmed.startsWith('Pd')) return ['Demonstrative Pronoun'];
	if (trimmed.startsWith('Pr')) return ['Relative Pronoun'];
	if (trimmed === 'DirObjM') return ['Direct Object Marker'];
	if (trimmed === 'Interrog') return ['Interrogative Particle'];

	return [];
}

/**
 * Decodes Hebrew morphological codes (ETCBC BHSA and Open Scriptures format).
 * E.g. "Prep-b | N-fs", "V-qp3ms", "4c.verb.qal.perf.p3.m.sg", "4c.subs.f.sg.a"
 * @returns Array of human-readable grammatical breakdown badges
 */
export function decodeHebrewMorph(code: string): string[] {
	if (!code) return [];
	const trimmed = code.trim();

	// If compound morphology (e.g. "Prep-b | N-fs", "Conj-w, Art | N-fs")
	if (trimmed.includes('|')) {
		const { prefixes, stem } = parseHebrewMorphSegments(trimmed);
		const badges: string[] = [];
		for (const p of prefixes) {
			badges.push(`${p.name} ${p.prefix}`.trim());
		}
		if (stem) {
			const stemBadges = decodeHebrewMorph(stem);
			badges.push(...stemBadges);
		}
		return badges;
	}

	const desc = hebrewDict[trimmed];
	if (desc) {
		const parts = desc.split(',').map((p) => p.trim());
		const badges: string[] = [];
		const suffixParts: string[] = [];
		let isSuffix = false;

		for (const p of parts) {
			if (p === 'pronominal suffix') {
				isSuffix = true;
				continue;
			}
			const cap = p.charAt(0).toUpperCase() + p.slice(1);
			if (isSuffix) {
				suffixParts.push(
					cap
						.replace('Third person', '3p')
						.replace('Second person', '2p')
						.replace('First person', '1p')
				);
			} else {
				badges.push(
					cap
						.replace('Third person', '3rd Person')
						.replace('Second person', '2nd Person')
						.replace('First person', '1st Person')
				);
			}
		}
		if (suffixParts.length > 0) {
			badges.push(`Suffix: ${suffixParts.join(' ')}`);
		}
		return badges;
	}

	// Try Open Scriptures stem parser
	const openScripturesBadges = decodeHebrewStemCode(trimmed);
	if (openScripturesBadges && openScripturesBadges.length > 0) {
		return openScripturesBadges;
	}

	// Fallback: parse dot-separated components
	const parts = trimmed.split('.').filter((p) => p !== '4c');
	const HEB_PARTS: Record<string, string> = {
		verb: 'Verb',
		subs: 'Noun',
		adjv: 'Adjective',
		prep: 'Preposition',
		conj: 'Conjunction',
		art: 'Article',
		nmpr: 'Proper Noun',
		prin: 'Interrogative Pronoun',
		prps: 'Personal Pronoun',
		prde: 'Demonstrative Pronoun',
		inrg: 'Interrogative',
		nega: 'Negative',
		intj: 'Interjection',
		qal: 'Qal',
		nif: 'Nif‘al',
		piel: 'Pi‘el',
		pual: 'Pu‘al',
		hif: 'Hif‘il',
		hof: 'Hof‘al',
		hit: 'Hitpa“el',
		perf: 'Perfect',
		impf: 'Imperfect',
		wayq: 'Wayyiqtol',
		impv: 'Imperative',
		infc: 'Infinitive Construct',
		infa: 'Infinitive Absolute',
		ptca: 'Participle Active',
		ptcp: 'Participle Passive',
		p1: '1st Person',
		p2: '2nd Person',
		p3: '3rd Person',
		m: 'Masculine',
		f: 'Feminine',
		u: 'Common/Unknown',
		sg: 'Singular',
		pl: 'Plural',
		du: 'Dual',
		a: 'Absolute',
		c: 'Construct',
		e: 'Emphatic'
	};

	const badges = parts.map((p) => HEB_PARTS[p] || p.charAt(0).toUpperCase() + p.slice(1));
	return badges.length > 0 ? badges : [trimmed];
}

/**
 * Universal dispatcher for formatting morph badges according to language/corpus.
 */
export function formatMorphBadges(morph: string, lang = 'greek'): string[] {
	if (!morph) return [];
	if (lang === 'hebrew') {
		return decodeHebrewMorph(morph);
	}
	if (lang === 'greek') {
		return decodeGreekMorph(morph);
	}
	// Auto-detection fallback when lang is ambiguous
	if (
		morph.includes('|') ||
		morph.startsWith('Prep-') ||
		morph.startsWith('Conj-') ||
		morph.startsWith('4c.') ||
		morph.startsWith('DirObjM')
	) {
		return decodeHebrewMorph(morph);
	}
	return decodeGreekMorph(morph);
}
