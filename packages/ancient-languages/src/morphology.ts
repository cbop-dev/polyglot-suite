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

// ==========================================
// 4. Unified Morphological Analysis & Attested Forms Models
// ==========================================

export interface MorphAnalysis {
	pos?: string;
	person?: string; // '1st', '2nd', '3rd'
	number?: string; // 'Singular', 'Plural', 'Dual'
	gender?: string; // 'Masculine', 'Feminine', 'Neuter'
	case?: string; // 'Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative'
	tense?: string; // 'Present', 'Imperfect', 'Future', 'Aorist', 'Perfect', 'Pluperfect'
	voice?: string; // 'Active', 'Middle', 'Passive', 'Middle/Passive'
	mood?: string; // 'Indicative', 'Subjunctive', 'Optative', 'Imperative', 'Infinitive', 'Participle'
	degree?: string; // 'Comparative', 'Superlative'
	rawCode?: string;
	summary?: string;
}

export interface AttestedForm {
	form: string;
	canonicalForm?: string;
	rawForms?: string[];
	count: number;
	analyses: MorphAnalysis[];
}

/**
 * Parses PROIEL POS and 8-character morphological analysis into a structured MorphAnalysis.
 */
export function parseProielMorph(posCode?: string, morphCode?: string): MorphAnalysis {
	const posKey = (posCode || '').trim();
	const m = (morphCode || '').trim();
	const rawCode = `${posKey} ${m}`.trim();

	const pos = PROIEL_POS_MAP[posKey] || (posKey ? posKey.replace(/-/g, '') : undefined);
	const analysis: MorphAnalysis = { pos, rawCode };

	if (!m || m === '--------' || m === '-') {
		analysis.summary = pos || rawCode;
		return analysis;
	}

	if (m.length >= 8) {
		const personChar = m[0];
		const tenseChar = m[1];
		const voiceChar = m[2];
		const moodChar = m[3];
		const caseChar = m[4];
		const numberChar = m[5];
		const genderChar = m[6];
		const degreeChar = m[7];

		if (personChar === '1') analysis.person = '1st';
		else if (personChar === '2') analysis.person = '2nd';
		else if (personChar === '3') analysis.person = '3rd';

		if (PROIEL_TENSE_MAP[tenseChar]) analysis.tense = PROIEL_TENSE_MAP[tenseChar];
		if (PROIEL_VOICE_MAP[voiceChar]) analysis.voice = PROIEL_VOICE_MAP[voiceChar];
		if (PROIEL_MOOD_MAP[moodChar]) analysis.mood = PROIEL_MOOD_MAP[moodChar];
		if (PROIEL_CASE_MAP[caseChar]) analysis.case = PROIEL_CASE_MAP[caseChar];
		if (PROIEL_NUMBER_MAP[numberChar]) analysis.number = PROIEL_NUMBER_MAP[numberChar];
		if (PROIEL_GENDER_MAP[genderChar]) analysis.gender = PROIEL_GENDER_MAP[genderChar];
		if (PROIEL_DEGREE_MAP[degreeChar]) analysis.degree = PROIEL_DEGREE_MAP[degreeChar];
	}

	const parts = [
		analysis.pos,
		analysis.tense,
		analysis.voice,
		analysis.mood,
		analysis.person ? `${analysis.person} ${analysis.number || ''}`.trim() : analysis.number,
		analysis.case,
		analysis.gender,
		analysis.degree
	].filter(Boolean);

	analysis.summary = parts.join(' • ');
	return analysis;
}

const PERSEUS_TENSE_MAP: Record<string, string> = {
	Pres: 'Present',
	Impf: 'Imperfect',
	Fut: 'Future',
	Aor: 'Aorist',
	Perf: 'Perfect',
	Plup: 'Pluperfect'
};

const PERSEUS_MOOD_MAP: Record<string, string> = {
	Ind: 'Indicative',
	Sub: 'Subjunctive',
	Opt: 'Optative',
	Imp: 'Imperative',
	Inf: 'Infinitive',
	Part: 'Participle'
};

const PERSEUS_VOICE_MAP: Record<string, string> = {
	Act: 'Active',
	Mid: 'Middle',
	Pass: 'Passive',
	MidPass: 'Middle/Passive'
};

const PERSEUS_CASE_MAP: Record<string, string> = {
	Nom: 'Nominative',
	Gen: 'Genitive',
	Dat: 'Dative',
	Acc: 'Accusative',
	Voc: 'Vocative'
};

const PERSEUS_NUMBER_MAP: Record<string, string> = {
	Sg: 'Singular',
	Pl: 'Plural',
	Dual: 'Dual'
};

const PERSEUS_GENDER_MAP: Record<string, string> = {
	M: 'Masculine',
	F: 'Feminine',
	N: 'Neuter'
};

/**
 * Parses Perseus / Josephus-style grammatical strings (e.g., "Perf Ind MidPass 3s", "Nom Sg M")
 * into a structured MorphAnalysis.
 */
export function parsePerseusMorph(parseStr?: string, posStr?: string, descStr?: string): MorphAnalysis {
	const rawCode = (parseStr || '').trim();
	const normalizedPos = posStr
		? posStr.charAt(0).toUpperCase() + posStr.slice(1).toLowerCase()
		: undefined;

	const analysis: MorphAnalysis = {
		pos: normalizedPos,
		rawCode,
		summary: descStr || rawCode
	};

	if (!rawCode) return analysis;

	const tokens = rawCode.split(/\s+/);
	for (const token of tokens) {
		if (PERSEUS_TENSE_MAP[token]) {
			analysis.tense = PERSEUS_TENSE_MAP[token];
		} else if (PERSEUS_MOOD_MAP[token]) {
			analysis.mood = PERSEUS_MOOD_MAP[token];
		} else if (PERSEUS_VOICE_MAP[token]) {
			analysis.voice = PERSEUS_VOICE_MAP[token];
		} else if (PERSEUS_CASE_MAP[token]) {
			analysis.case = PERSEUS_CASE_MAP[token];
		} else if (PERSEUS_NUMBER_MAP[token]) {
			analysis.number = PERSEUS_NUMBER_MAP[token];
		} else if (PERSEUS_GENDER_MAP[token]) {
			analysis.gender = PERSEUS_GENDER_MAP[token];
		} else if (/^[123][sp]$/i.test(token)) {
			const p = token[0];
			const n = token[1].toLowerCase();
			analysis.person = p === '1' ? '1st' : p === '2' ? '2nd' : '3rd';
			analysis.number = n === 's' ? 'Singular' : 'Plural';
		}
	}

	// Infer POS if not provided
	if (!analysis.pos) {
		if (analysis.mood || analysis.tense || analysis.voice) {
			analysis.pos = 'Verb';
		} else if (analysis.case || analysis.gender) {
			analysis.pos = 'Noun';
		}
	}

	return analysis;
}

/**
 * Parses MorphGNT / Swete LXX Greek codes into structured MorphAnalysis.
 */
export function parseGreekMorph(code?: string): MorphAnalysis {
	const trimmed = (code || '').trim();
	const analysis: MorphAnalysis = { rawCode: trimmed };
	if (!trimmed) return analysis;

	// MorphGNT format: 11 characters, e.g. "V- 3AAI-S--", "N- ----NSF-"
	if (trimmed.length === 11 && trimmed[2] === ' ') {
		const posCode = trimmed.slice(0, 2).replace(/-/g, '').trim();
		analysis.pos = GREEK_POS[posCode] || (posCode === 'RA' ? 'Article' : posCode);

		const p = trimmed[3];
		const t = trimmed[4];
		const v = trimmed[5];
		const m = trimmed[6];
		const c = trimmed[7];
		const n = trimmed[8];
		const g = trimmed[9];

		if (p === '1') analysis.person = '1st';
		else if (p === '2') analysis.person = '2nd';
		else if (p === '3') analysis.person = '3rd';

		if (GREEK_TENSE[t]) analysis.tense = GREEK_TENSE[t];
		if (GREEK_VOICE[v]) analysis.voice = GREEK_VOICE[v];
		if (GREEK_MOOD[m]) analysis.mood = GREEK_MOOD[m];
		if (GREEK_CASE[c]) analysis.case = GREEK_CASE[c];
		if (GREEK_NUMBER[n]) analysis.number = GREEK_NUMBER[n];
		if (GREEK_GENDER[g]) analysis.gender = GREEK_GENDER[g];

		return analysis;
	}

	// Swete format: e.g. "V-AAI-3S", "N-DSF"
	const parts = trimmed.split('-');
	if (parts.length >= 2) {
		const posCode = parts[0];
		analysis.pos = posCode === 'D' ? 'Article' : GREEK_POS[posCode] || posCode;

		if (posCode === 'V') {
			const tvm = parts[1] || '';
			if (GREEK_TENSE[tvm[0]]) analysis.tense = GREEK_TENSE[tvm[0]];
			if (GREEK_VOICE[tvm[1]]) analysis.voice = GREEK_VOICE[tvm[1]];
			if (GREEK_MOOD[tvm[2]]) analysis.mood = GREEK_MOOD[tvm[2]];

			const pn = parts[2] || '';
			if (pn.length === 2 && GREEK_PERSON[pn[0]]) {
				analysis.person = pn[0] === '1' ? '1st' : pn[0] === '2' ? '2nd' : '3rd';
				if (GREEK_NUMBER[pn[1]]) analysis.number = GREEK_NUMBER[pn[1]];
			} else if (pn.length === 3 && GREEK_CASE[pn[0]]) {
				analysis.case = GREEK_CASE[pn[0]];
				if (GREEK_NUMBER[pn[1]]) analysis.number = GREEK_NUMBER[pn[1]];
				if (GREEK_GENDER[pn[2]]) analysis.gender = GREEK_GENDER[pn[2]];
			}
			return analysis;
		} else {
			const cng = parts[1] || '';
			if (cng.length === 3) {
				if (GREEK_CASE[cng[0]]) analysis.case = GREEK_CASE[cng[0]];
				if (GREEK_NUMBER[cng[1]]) analysis.number = GREEK_NUMBER[cng[1]];
				if (GREEK_GENDER[cng[2]]) analysis.gender = GREEK_GENDER[cng[2]];
			}
			return analysis;
		}
	}

	return analysis;
}

/**
 * Parses Hebrew morphological codes (ETCBC/BHSA or Open Scriptures format) into structured MorphAnalysis.
 */
export function parseHebrewMorph(code?: string): MorphAnalysis {
	const trimmed = (code || '').trim();
	const analysis: MorphAnalysis = { rawCode: trimmed };
	if (!trimmed) return analysis;

	let stemCode = trimmed;
	if (trimmed.includes('|')) {
		const parts = trimmed.split('|').map((s) => s.trim());
		stemCode = parts[parts.length - 1] || trimmed;
	}

	// 1. Check dot-separated format (ETCBC/BHSA, e.g. "4c.verb.qal.perf.p3.m.sg", "4c.nmpr.m.sg.a")
	if (stemCode.includes('.')) {
		const parts = stemCode.split('.');
		for (const p of parts) {
			if (p === 'verb') analysis.pos = 'Verb';
			else if (p === 'subs' || p === 'nmpr') analysis.pos = 'Noun';
			else if (p === 'adjv') analysis.pos = 'Adjective';
			else if (p === 'art') analysis.pos = 'Article';
			else if (p === 'prps' || p === 'prde' || p === 'prin') analysis.pos = 'Pronoun';
			else if (p === 'prep') analysis.pos = 'Preposition';
			else if (p === 'conj') analysis.pos = 'Conjunction';
			// Person
			else if (p === 'p1') analysis.person = '1st';
			else if (p === 'p2') analysis.person = '2nd';
			else if (p === 'p3') analysis.person = '3rd';
			// Gender
			else if (p === 'm') analysis.gender = 'Masculine';
			else if (p === 'f') analysis.gender = 'Feminine';
			// Number
			else if (p === 'sg') analysis.number = 'Singular';
			else if (p === 'pl') analysis.number = 'Plural';
			else if (p === 'du') analysis.number = 'Dual';
			// Aspect / Tense / Mood
			else if (p === 'perf') { analysis.tense = 'Perfect'; }
			else if (p === 'impf' || p === 'wayq') { analysis.tense = 'Imperfect'; }
			else if (p === 'ptca') { analysis.mood = 'Participle'; analysis.voice = 'Active'; }
			else if (p === 'ptcp') { analysis.mood = 'Participle'; analysis.voice = 'Passive'; }
			else if (p === 'infc' || p === 'infa') { analysis.mood = 'Infinitive'; }
			else if (p === 'impv') { analysis.mood = 'Imperative'; }
			// Voice / Stem
			else if (p === 'qal' || p === 'piel' || p === 'hif') { analysis.voice = 'Active'; }
			else if (p === 'nif' || p === 'pual' || p === 'hof') { analysis.voice = 'Passive'; }
			else if (p === 'hit') { analysis.voice = 'Middle'; }
		}
		const badges = decodeHebrewMorph(trimmed);
		if (badges.length > 0) analysis.summary = badges.join(' • ');
		return analysis;
	}

	// 2. Open Scriptures format: V-qp3ms, N-fs, A-ms, etc.
	if (stemCode.startsWith('V-')) {
		analysis.pos = 'Verb';
		const rest = stemCode.slice(2);
		if (rest.length >= 2) {
			const aspect = rest[1];
			if (aspect === 'p') analysis.tense = 'Perfect';
			else if (aspect === 'i' || aspect === 'w') analysis.tense = 'Imperfect';
			else if (aspect === 'v') analysis.mood = 'Imperative';
			else if (aspect === 'c' || aspect === 'a') analysis.mood = 'Infinitive';
			else if (aspect === 'r') { analysis.mood = 'Participle'; analysis.voice = 'Active'; }
			else if (aspect === 's') { analysis.mood = 'Participle'; analysis.voice = 'Passive'; }

			if (rest[2] === '1') analysis.person = '1st';
			else if (rest[2] === '2') analysis.person = '2nd';
			else if (rest[2] === '3') analysis.person = '3rd';

			if (rest[3] === 'm') analysis.gender = 'Masculine';
			else if (rest[3] === 'f') analysis.gender = 'Feminine';

			if (rest[4] === 's') analysis.number = 'Singular';
			else if (rest[4] === 'p') analysis.number = 'Plural';
			else if (rest[4] === 'd') analysis.number = 'Dual';
		}
	} else if (stemCode.startsWith('N-') || stemCode.startsWith('A-')) {
		analysis.pos = stemCode.startsWith('N-') ? 'Noun' : 'Adjective';
		const rest = stemCode.slice(2);
		for (const char of rest) {
			if (char === 'm') analysis.gender = 'Masculine';
			else if (char === 'f') analysis.gender = 'Feminine';
			else if (char === 's') analysis.number = 'Singular';
			else if (char === 'p') analysis.number = 'Plural';
			else if (char === 'd') analysis.number = 'Dual';
		}
	}

	const badges = decodeHebrewMorph(trimmed);
	if (badges.length > 0) analysis.summary = badges.join(' • ');
	return analysis;
}

// ==========================================
// 5. Canonicalization & Attested Forms Grouping
// ==========================================

/**
 * Normalizes Greek lemma grave accents to acute accents.
 * e.g., παρὰ -> παρά, καὶ -> καί, διὰ -> διά
 */
export function normalizeLemmaAccents(str: string): string {
	if (!str) return '';
	return str.normalize('NFD').replace(/\u0300/g, '\u0301').normalize('NFC');
}

/**
 * Canonicalizes a Greek word form for display and grouping in Attested Forms grids.
 * - Lowercases capital letters with accents/breathings (e.g., Ἔμελλε -> ἔμελλε)
 * - Normalizes grave accents to acute accents (\u0300 -> \u0301)
 * - Groups movable nu (ἐφελκυστικὸν ν) into a single canonical representation, e.g. ἔμελλε(ν)
 */
export function getCanonicalForm(rawWord: string): string {
	if (!rawWord) return '';

	let w = rawWord.replace(/[.,·;:!?"'»«()\[\]⟦⟧⟨⟩⸂⸃⸆⸇⸀⸁⸄⸅†‡*\s]/gu, '').trim();
	if (!w) return '';

	w = w.toLowerCase();
	w = w.normalize('NFD').replace(/\u0300/g, '\u0301');

	// Strip secondary enclitic accent on final syllable if an earlier accent exists
	const accentMatches = w.match(/\u0301/g) || [];
	if (accentMatches.length > 1) {
		const lastIdx = w.lastIndexOf('\u0301');
		if (lastIdx !== -1) {
			w = w.slice(0, lastIdx) + w.slice(lastIdx + 1);
		}
	}

	w = w.normalize('NFC');

	if (w.endsWith('ν')) {
		const stem = w.slice(0, -1);
		const normStem = stem.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		if (/[ε|σι|τι|ει]$/.test(normStem)) {
			return `${stem}(ν)`;
		}
	} else {
		const normW = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		if (/[ε|σι|τι|ει]$/.test(normW)) {
			return `${w}(ν)`;
		}
	}

	return w;
}

/**
 * Given a list of occurrences, produces a deduplicated, sorted list of canonical attested form strings.
 * e.g., ["ἔμελλε", "Ἔμελλε", "ἔμελλεν", "Ἔμελλεν"] => ["ἔμελλε(ν)"]
 */
export function getCanonicalAttestedForms(occurrences: Array<{ word?: string }>): string[] {
	if (!occurrences || !Array.isArray(occurrences)) return [];

	const canonicalMap = new Map<string, string>();

	for (const o of occurrences) {
		if (!o || !o.word) continue;
		const raw = o.word.trim();
		if (!raw) continue;
		const canonical = getCanonicalForm(raw);
		if (!canonicalMap.has(canonical)) {
			canonicalMap.set(canonical, canonical);
		}
	}

	return Array.from(canonicalMap.values()).sort((a, b) => a.localeCompare(b, 'el'));
}

/**
 * Checks whether an occurrence word form matches a selected form filter (canonicalized).
 */
export function isFormFilterMatch(occWord: string, filterWord: string): boolean {
	if (!filterWord || !occWord) return true;
	if (occWord === filterWord) return true;

	const canonicalOcc = getCanonicalForm(occWord);
	const canonicalFilter = getCanonicalForm(filterWord);
	if (canonicalOcc === canonicalFilter) return true;

	const norm = (s: string) =>
		s
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/ς/g, 'σ');
	const stripNu = (s: string) => (s.endsWith('ν') ? s.slice(0, -1) : s);

	const nOcc = norm(occWord);
	const nFilter = norm(filterWord);
	return nOcc === nFilter || stripNu(nOcc) === stripNu(nFilter);
}

export interface RawTokenOccurrence {
	word: string;
	pos?: string;
	morph?: string;
	morphAnalysis?: MorphAnalysis;
}

/**
 * Groups and aggregates occurrences into unified AttestedForm objects.
 * Handles canonical movable-nu grouping, frequency counts, and collection of morph analyses.
 */
export function buildAttestedForms(
	items: RawTokenOccurrence[],
	options: { canonicalize?: boolean; lang?: string } = {}
): AttestedForm[] {
	const canonicalize = options.canonicalize ?? true;
	const isGreek = (options.lang || 'greek') === 'greek';

	const formMap = new Map<
		string,
		{
			canonicalForm: string;
			rawForms: Set<string>;
			count: number;
			analysesMap: Map<string, MorphAnalysis>;
		}
	>();

	for (const item of items) {
		if (!item || !item.word) continue;
		const rawWord = item.word.replace(/[.,·;:!?"'»«()\[\]⟦⟧⟨⟩⸂⸃⸆⸇⸀⸁⸄⸅†‡*\s]/gu, '').trim();
		if (!rawWord) continue;

		const key = canonicalize && isGreek ? getCanonicalForm(rawWord) : rawWord;

		let entry = formMap.get(key);
		if (!entry) {
			entry = {
				canonicalForm: key,
				rawForms: new Set<string>(),
				count: 0,
				analysesMap: new Map<string, MorphAnalysis>()
			};
			formMap.set(key, entry);
		}

		entry.count++;
		entry.rawForms.add(rawWord);

		// Resolve morph analysis
		let analysis = item.morphAnalysis;
		if (!analysis && (item.pos || item.morph)) {
			analysis = parseProielMorph(item.pos, item.morph);
		}
		if (analysis) {
			const aKey = analysis.rawCode || analysis.summary || JSON.stringify(analysis);
			if (!entry.analysesMap.has(aKey)) {
				entry.analysesMap.set(aKey, analysis);
			}
		}
	}

	return Array.from(formMap.entries())
		.map(([key, val]) => ({
			form: key,
			canonicalForm: val.canonicalForm,
			rawForms: Array.from(val.rawForms),
			count: val.count,
			analyses: Array.from(val.analysesMap.values())
		}))
		.sort((a, b) => b.count - a.count || a.form.localeCompare(b.form, 'el'));
}

// ==========================================
// 6. Inflection Filtering Logic (Goal 2)
// ==========================================

export interface InflectionFilterCriteria {
	mood?: string[];
	tense?: string[];
	voice?: string[];
	person?: string[];
	number?: string[];
	case?: string[];
	gender?: string[];
	degree?: string[];
}

export interface AvailableInflections {
	isVerb: boolean;
	hasParticiple: boolean;
	moods: string[];
	tenses: string[];
	voices: string[];
	persons: string[];
	numbers: string[];
	cases: string[];
	genders: string[];
	degrees: string[];
}

/**
 * Checks if any inflection criteria filter is currently active.
 */
export function isCriteriaActive(criteria?: InflectionFilterCriteria | null): boolean {
	if (!criteria) return false;
	return Object.values(criteria).some((arr) => Array.isArray(arr) && arr.length > 0);
}

/**
 * Counts total active filter pills across all dimensions.
 */
export function countActiveFilters(criteria?: InflectionFilterCriteria | null): number {
	if (!criteria) return 0;
	return Object.values(criteria).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
}

/**
 * Inspects all attested forms of a lemma and extracts the dimensions/options actually present.
 */
export function extractAvailableInflections(forms: AttestedForm[]): AvailableInflections {
	const moodSet = new Set<string>();
	const tenseSet = new Set<string>();
	const voiceSet = new Set<string>();
	const personSet = new Set<string>();
	const numberSet = new Set<string>();
	const caseSet = new Set<string>();
	const genderSet = new Set<string>();
	const degreeSet = new Set<string>();

	// Calculate POS weights to determine dominant POS and filter out corrupt/stray verbal forms
	let verbWeight = 0;
	let nonVerbWeight = 0;
	let hasVerbalFeatures = false;

	for (const f of forms) {
		const weight = f.count || 1;
		for (const a of f.analyses) {
			if (a.pos === 'Verb') {
				verbWeight += weight;
			} else if (a.pos) {
				nonVerbWeight += weight;
			}
			if (a.tense || a.mood || a.voice) {
				hasVerbalFeatures = true;
			}
		}
	}

	const isVerb = verbWeight > 0
		? verbWeight >= nonVerbWeight
		: (nonVerbWeight === 0 && hasVerbalFeatures);

	let hasParticiple = false;

	for (const f of forms) {
		for (const a of f.analyses) {
			if (isVerb) {
				// Lemma is primarily verbal: ignore stray non-verbal analyses
				if (a.pos && a.pos !== 'Verb') continue;
				if (a.mood === 'Participle') {
					hasParticiple = true;
				}
				if (a.mood) moodSet.add(a.mood);
				if (a.tense) tenseSet.add(a.tense);
				if (a.voice) voiceSet.add(a.voice);
			} else {
				// Lemma is non-verbal (noun, preposition, pronoun, etc.): ignore stray verbal analyses
				if (a.pos === 'Verb') continue;
			}

			if (a.person) personSet.add(a.person);
			if (a.number) numberSet.add(a.number);
			if (a.case) caseSet.add(a.case);
			if (a.gender) genderSet.add(a.gender);
			if (a.degree) degreeSet.add(a.degree);
		}
	}

	const sortOrder = (items: Set<string>, canonical: string[]) => {
		return canonical.filter((c) => items.has(c));
	};

	return {
		isVerb,
		hasParticiple,
		moods: isVerb
			? sortOrder(moodSet, [
					'Indicative',
					'Subjunctive',
					'Optative',
					'Imperative',
					'Infinitive',
					'Participle'
				])
			: [],
		tenses: isVerb
			? sortOrder(tenseSet, [
					'Present',
					'Imperfect',
					'Future',
					'Aorist',
					'Perfect',
					'Pluperfect'
				])
			: [],
		voices: isVerb ? sortOrder(voiceSet, ['Active', 'Middle', 'Passive', 'Middle/Passive']) : [],
		persons: sortOrder(personSet, ['1st', '2nd', '3rd']),
		numbers: sortOrder(numberSet, ['Singular', 'Plural', 'Dual']),
		cases: sortOrder(caseSet, ['Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative']),
		genders: sortOrder(genderSet, ['Masculine', 'Feminine', 'Neuter']),
		degrees: sortOrder(degreeSet, ['Comparative', 'Superlative'])
	};
}

/**
 * Filters a list of AttestedForm objects against multi-select InflectionFilterCriteria.
 * (OR within a dimension, AND across dimensions).
 */
export function filterAttestedForms(
	forms: AttestedForm[],
	criteria?: InflectionFilterCriteria | null
): AttestedForm[] {
	if (!forms || forms.length === 0) return [];
	if (!isCriteriaActive(criteria)) return forms;

	return forms.filter((f) => {
		if (!f.analyses || f.analyses.length === 0) return false;
		return f.analyses.some((a) => {
			if (
				criteria?.mood &&
				criteria.mood.length > 0 &&
				(!a.mood || !criteria.mood.includes(a.mood))
			) {
				return false;
			}
			if (
				criteria?.tense &&
				criteria.tense.length > 0 &&
				(!a.tense || !criteria.tense.includes(a.tense))
			) {
				return false;
			}
			if (
				criteria?.voice &&
				criteria.voice.length > 0 &&
				(!a.voice || !criteria.voice.includes(a.voice))
			) {
				return false;
			}
			if (
				criteria?.person &&
				criteria.person.length > 0 &&
				(!a.person || !criteria.person.includes(a.person))
			) {
				return false;
			}
			if (
				criteria?.number &&
				criteria.number.length > 0 &&
				(!a.number || !criteria.number.includes(a.number))
			) {
				return false;
			}
			if (
				criteria?.case &&
				criteria.case.length > 0 &&
				(!a.case || !criteria.case.includes(a.case))
			) {
				return false;
			}
			if (
				criteria?.gender &&
				criteria.gender.length > 0 &&
				(!a.gender || !criteria.gender.includes(a.gender))
			) {
				return false;
			}
			if (
				criteria?.degree &&
				criteria.degree.length > 0 &&
				(!a.degree || !criteria.degree.includes(a.degree))
			) {
				return false;
			}
			return true;
		});
	});
}


