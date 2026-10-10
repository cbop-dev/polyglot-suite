/**
 * Transliteration and script normalization utilities for Ancient Greek and Hebrew.
 * 
 * Supports:
 * - Single-character Beta Code transliteration for Greek and Hebrew
 * - Digraph-aware Greek transliteration (e.g. th -> θ, ph -> φ, ch -> χ, ps -> ψ)
 * - Hebrew final-consonant transformations (kaf, mem, nun, pe, tsade)
 * - Greek polytonic diacritic / accent stripping and normalization
 * - Hebrew vowel (niqqud) and cantillation stripping
 * - Accurate diacritic-insensitive text matching and KWIC snippet generation
 */

// Greek single-character Beta Code mapping
export const LATIN_TO_GREEK_MAP: Record<string, string> = {
	a: 'α', A: 'Α',
	b: 'β', B: 'Β',
	g: 'γ', G: 'Γ',
	d: 'δ', D: 'Δ',
	e: 'ε', E: 'Ε',
	z: 'ζ', Z: 'Ζ',
	h: 'η', H: 'Η',
	q: 'θ', Q: 'Θ',
	i: 'ι', I: 'Ι',
	k: 'κ', K: 'Κ',
	l: 'λ', L: 'Λ',
	m: 'μ', M: 'Μ',
	n: 'ν', N: 'Ν',
	x: 'ξ', X: 'Ξ',
	o: 'ο', O: 'Ο',
	p: 'π', P: 'Π',
	r: 'ρ', R: 'Ρ',
	s: 'σ', S: 'Σ',
	t: 'τ', T: 'Τ',
	u: 'υ', U: 'Υ',
	f: 'φ', F: 'Φ',
	c: 'χ', C: 'Χ',
	y: 'ψ', Y: 'Ψ',
	w: 'ω', W: 'Ω',
	v: 'ϝ', V: 'Ϝ',
	j: 'ς', J: 'Σ'
};

// Greek multi-character digraphs
export const GREEK_DIGRAPHS: Record<string, string> = {
	th: 'θ', TH: 'Θ', Th: 'Θ',
	ph: 'φ', PH: 'Φ', Ph: 'Φ',
	ch: 'χ', CH: 'Χ', Ch: 'Χ',
	ps: 'ψ', PS: 'Ψ', Ps: 'Ψ'
};

// Hebrew mapping table (upper/lower case supported)
export const LATIN_TO_HEBREW_MAP: Record<string, string> = {
	')': '\u05D0', // Alef
	'(': '\u05E2', // Ayin
	'>': '\u05D0', // Alef
	'<': '\u05E2', // Ayin
	a: '\u05D0', A: '\u05D0', // Alef
	b: '\u05D1', B: '\u05D1', // Bet
	g: '\u05D2', G: '\u05D2', // Gimel
	d: '\u05D3', D: '\u05D3', // Dalet
	h: '\u05D4', H: '\u05D4', // He
	w: '\u05D5', W: '\u05D5', // Waw
	z: '\u05D6', Z: '\u05D6', // Zayin
	x: '\u05D7', X: '\u05D7', // Het
	'+': '\u05D8',           // Tet
	v: '\u05D8', V: '\u05D8', // Tet
	t: '\u05EA', T: '\u05EA', // Taw
	y: '\u05D9', Y: '\u05D9', // Yod
	k: '\u05DB', K: '\u05DB', // Kaf
	l: '\u05DC', L: '\u05DC', // Lamed
	m: '\u05DE', M: '\u05DE', // Mem
	n: '\u05E0', N: '\u05E0', // Nun
	s: '\u05E1', S: '\u05E1', // Samekh
	p: '\u05E4', P: '\u05E4', // Pe
	c: '\u05E6', C: '\u05E6', // Tsade
	q: '\u05E7', Q: '\u05E7', // Qof
	r: '\u05E8', R: '\u05E8', // Resh
	'#': '\u05E9',           // Shin / Sin general
	'&': '\u05E9',           // Shin / Sin general
	$: '\u05E9',             // Shin
	f: '\uFB2B', F: '\uFB2B', // Sin with dot
	j: '\u05E9', J: '\u05E9'  // Shin
};

// Mapping from regular Hebrew consonants to final forms
export const HEBREW_FINAL_CONSONANTS: Record<string, string> = {
	'\u05DB': '\u05DA', // kaf -> final kaf
	'\u05DE': '\u05DD', // mem -> final mem
	'\u05E0': '\u05DF', // nun -> final nun
	'\u05E4': '\u05E3', // pe -> final pe
	'\u05E6': '\u05E5'  // tsade -> final tsade
};

// Reverse mapping: final forms to regular consonants
export const HEBREW_REGULAR_CONSONANTS: Record<string, string> = {
	'\u05DA': '\u05DB', // final kaf -> kaf
	'\u05DD': '\u05DE', // final mem -> mem
	'\u05DF': '\u05E0', // final nun -> nun
	'\u05E3': '\u05E4', // final pe -> pe
	'\u05E5': '\u05E6'  // final tsade -> tsade
};

/**
 * Converts Latin Beta Code text to Greek characters.
 * Single-character based: word-final 'σ' becomes 'ς'.
 */
export function latinToGreek(input: string): string {
	if (!input) return '';
	let result = '';
	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		result += LATIN_TO_GREEK_MAP[char] ?? char;
	}
	// Convert medial sigma at the end of word or string to final sigma 'ς'
	return result.replace(/σ(?=[.,;·:!?\s\)\"\'\]]|$)/g, 'ς');
}

/**
 * Transliterates Latin/Betacode input string to Greek Unicode with 2-character digraph support.
 * Preserves spaces, numbers, punctuation, and Greek characters already entered.
 */
export function transliterateLatinToGreek(input: string): string {
	if (!input) return '';

	let res = '';
	let i = 0;
	const len = input.length;

	while (i < len) {
		const char = input[i];

		// Pass through non-ASCII or existing Greek characters
		if (char.charCodeAt(0) > 127) {
			res += char;
			i++;
			continue;
		}

		// Pass through spaces, numbers, and standard punctuation
		if (/[\s\d.,;:\-!?"'()\[\]]/.test(char)) {
			res += char;
			i++;
			continue;
		}

		// Check 2-char digraphs (e.g. th, ph, ch, ps)
		if (i + 1 < len) {
			const pair = input.substring(i, i + 2);
			if (GREEK_DIGRAPHS[pair]) {
				res += GREEK_DIGRAPHS[pair];
				i += 2;
				continue;
			}
		}

		// Check 1-char mapping
		if (LATIN_TO_GREEK_MAP[char]) {
			res += LATIN_TO_GREEK_MAP[char];
		} else {
			res += char;
		}
		i++;
	}

	// 1. Convert non-trailing final sigma (ς) into medial sigma (σ)
	res = res.replace(/ς(?![.·,;:!?"'\s)\]]|$)/g, 'σ');

	// 2. Convert trailing medial sigma (σ) into final sigma (ς)
	res = res.replace(/σ(?=[.·,;:!?"'\s)\]]|$)/g, 'ς');

	return res;
}

/**
 * Converts trailing Hebrew letters in each word to their final form.
 */
export function convertHebrewFinalConsonants(hebrew: string): string {
	if (!hebrew) return '';
	return hebrew.replace(/([\u05DB\u05DE\u05E0\u05E4\u05E6])(?=[\s.,:;!?\)\"\'\]]|$)/g, (_, c) => {
		return HEBREW_FINAL_CONSONANTS[c] || c;
	});
}

/**
 * Converts any final Hebrew consonants back to regular consonants.
 */
export function removeHebrewFinalConsonants(hebrew: string): string {
	if (!hebrew) return '';
	return hebrew.replace(/[\u05DA\u05DD\u05DF\u05E3\u05E5]/g, (c) => {
		return HEBREW_REGULAR_CONSONANTS[c] || c;
	});
}

/**
 * Converts Latin text to Hebrew consonants with correct final letter forms.
 */
export function latinToHebrew(input: string): string {
	if (!input) return '';
	const chars: string[] = [];
	for (let i = 0; i < input.length; i++) {
		const c = input[i];
		chars.push(LATIN_TO_HEBREW_MAP[c] ?? c);
	}
	const hebrewRaw = chars.join('');
	return convertHebrewFinalConsonants(hebrewRaw);
}

/**
 * Normalizes Greek text for search/filtering:
 * - Strips combining accents, breathings, and diacritics
 * - Lowercases
 * - Maps final sigma 'ς' to 'σ'
 */
export function toPlainGreek(greek: string): string {
	if (!greek) return '';
	return greek
		.normalize('NFD')
		.replace(/[\u0300-\u036f\u0313\u0314\u0342\u0345\u0308']+/g, '')
		.normalize('NFC')
		.toLowerCase()
		.replace(/ς/g, 'σ')
		.replace(/[.,;·:!?᾽’”“«»\-—\(\)\[\]⟦⟧⟨⟩⸂⸃⸆⸇⸀⸁⸄⸅⸈⸉⸊⸋†‡*0-9\s]+/gu, ' ')
		.trim();
}

/**
 * Strips polytonic Greek accents, breathings, and diacritical marks.
 * Handles both decomposed (NFD) combining diacritics and precomposed (NFC) characters,
 * ensuring clean headword matching against lexicon indices.
 */
export function stripGreekAccents(s: string): string {
	if (!s) return '';
	return s
		.normalize('NFD')
		.replace(/[\u0300-\u036f\u1dc0-\u1dff\u1ab0-\u1aff\u1f00-\u1fff]/g, '')
		.normalize('NFC')
		.toLowerCase()
		.replace(/[.,;:·]/g, '')
		.trim();
}

/**
 * Normalizes Greek string for diacritic-insensitive search matching.
 */
export function normalizeGreekSearch(str: string): string {
	if (!str) return '';
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/ς/g, 'σ')
		.replace(/[.,·;:!?"'»«()\[\]]/g, '')
		.trim();
}

/**
 * Normalizes Hebrew text for search/filtering:
 * - Strips niqqud (vowels), cantillation, meteg, and punctuation
 * - Converts final consonants to normal forms for uniform matching
 */
export function toPlainHebrew(hebrew: string): string {
	if (!hebrew) return '';
	// Strip Hebrew vowel points & cantillation marks (\u0591 - \u05C7)
	const stripped = hebrew.replace(/[\u0591-\u05C7]/g, '');
	// Normalize final consonants so מ and ם match identically
	const normalizedConsonants = removeHebrewFinalConsonants(stripped);
	return normalizedConsonants.replace(/[\s\u05BE]+/g, ' ').trim();
}

/**
 * Transliterates input based on language: 'greek' | 'hebrew'.
 */
export function transliterate(input: string, lang: 'greek' | 'hebrew'): string {
	if (lang === 'greek') {
		return latinToGreek(input);
	} else if (lang === 'hebrew') {
		return latinToHebrew(input);
	}
	return input;
}

/**
 * Finds the character range { start, end } of a query in text with 100% accurate mapping
 * back to original text character positions, ignoring Greek diacritics and accents.
 */
export function findMatchInText(
	text: string,
	query: string,
	normQ?: string
): { start: number; end: number } | null {
	if (!text || !query) return null;
	let q = query;
	if (!normQ && /[a-zA-Z]/.test(query) && /[\u0370-\u03ff\u1f00-\u1fff]/.test(text)) {
		q = transliterateLatinToGreek(query);
	}
	const targetNormQ = normQ || normalizeGreekSearch(q);
	if (!targetNormQ) return null;

	// 1. Try direct exact/case-insensitive substring search first
	const directIdx = text.toLowerCase().indexOf(query.toLowerCase());
	if (directIdx !== -1) {
		return { start: directIdx, end: directIdx + query.length };
	}

	// 2. Build index map for diacritics-insensitive match
	let normText = '';
	const indexMap: number[] = [];

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const normChar = char
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/ς/g, 'σ');

		for (let j = 0; j < normChar.length; j++) {
			normText += normChar[j];
			indexMap.push(i);
		}
	}

	const normIdx = normText.indexOf(targetNormQ);
	if (normIdx === -1) return null;

	const start = indexMap[normIdx];
	const lastNormIdx = normIdx + targetNormQ.length - 1;
	const end = indexMap[lastNormIdx] + 1;

	return { start, end };
}

/**
 * Generates KWIC (Key Word In Context) snippet with accurate match boundaries.
 */
export function getKwicSnippet(
	text: string,
	query: string,
	normQ?: string
): { before: string; match: string; after: string } {
	if (!text) return { before: '', match: '', after: '' };

	const matchRange = findMatchInText(text, query, normQ);
	if (!matchRange) {
		return { before: text.slice(0, 60), match: '', after: text.slice(60, 120) };
	}

	const { start, end } = matchRange;
	const kwicStart = Math.max(0, start - 45);
	const kwicEnd = Math.min(text.length, end + 45);

	return {
		before: (kwicStart > 0 ? '...' : '') + text.slice(kwicStart, start),
		match: text.slice(start, end),
		after: text.slice(end, kwicEnd) + (kwicEnd < text.length ? '...' : '')
	};
}
