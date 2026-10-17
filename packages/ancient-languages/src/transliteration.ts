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

// Syriac single-character Latin mapping (SEDRA / CAL standard)
export const LATIN_TO_SYRIAC_MAP: Record<string, string> = {
	"'": '\u0710', '>': '\u0710', a: '\u0710', A: '\u0710', // Alaph
	b: '\u0712', B: '\u0712', // Beth
	g: '\u0713', G: '\u0713', // Gamal
	d: '\u0715', D: '\u0715', // Dalath
	h: '\u0717', H: '\u0717', // He
	w: '\u0718', W: '\u0718', u: '\u0718', U: '\u0718', o: '\u0718', O: '\u0718', // Waw
	z: '\u0719', Z: '\u0719', // Zayn
	x: '\u071A', X: '\u071A', // Heth
	T: '\u071B',              // Teth (capital T)
	y: '\u071D', Y: '\u071D', i: '\u071D', I: '\u071D', e: '\u071D', E: '\u071D', // Yodh
	k: '\u071F', K: '\u071F', // Kaph
	l: '\u0720', L: '\u0720', // Lamadh
	m: '\u0721', M: '\u0721', // Mim
	n: '\u0722', N: '\u0722', // Nun
	s: '\u0723',              // Semkath (lowercase s)
	'(': '\u0725', '<': '\u0725', '`': '\u0725', // E ('Ayin)
	p: '\u0726', P: '\u0726', f: '\u0726', F: '\u0726', // Pe
	S: '\u0728', c: '\u0728', C: '\u0728', // Sadhe
	q: '\u0729', Q: '\u0729', // Qaph
	r: '\u072A', R: '\u072A', // Resh
	$: '\u072B',              // Shin
	t: '\u072C'               // Taw (lowercase t)
};

// Syriac multi-character digraphs
export const SYRIAC_DIGRAPHS: Record<string, string> = {
	sh: '\u072B', SH: '\u072B', Sh: '\u072B', // Shin
	kh: '\u071A', KH: '\u071A', Kh: '\u071A', // Heth
	'h.': '\u071A', 'H.': '\u071A',          // Heth
	't.': '\u071B', 'T.': '\u071B',          // Teth
	th: '\u072C', TH: '\u072C', Th: '\u072C', // Taw
	's.': '\u0728', 'S.': '\u0728',          // Sadhe
	ts: '\u0728', TS: '\u0728', Ts: '\u0728', // Sadhe
	'e.': '\u0725', 'E.': '\u0725'           // E ('Ayin)
};

/**
 * Transliterates Latin input string to Syriac Unicode with 2-character digraph support.
 * Preserves spaces, numbers, punctuation, and native Syriac characters already entered.
 */
export function latinToSyriac(input: string): string {
	if (!input) return '';

	let res = '';
	let i = 0;
	const len = input.length;

	while (i < len) {
		const char = input[i];

		// Pass through non-ASCII or existing Syriac characters
		if (char.charCodeAt(0) > 127) {
			res += char;
			i++;
			continue;
		}

		// Pass through spaces, numbers, and standard punctuation (except translit tokens ', `, <, >, (, $, +)
		if (/[\s\d,;:!\?"\[\]]/.test(char)) {
			res += char;
			i++;
			continue;
		}

		// Check 2-char digraphs (e.g. sh, kh, h., t., s., ts, th)
		if (i + 1 < len) {
			const pair = input.substring(i, i + 2);
			if (SYRIAC_DIGRAPHS[pair]) {
				res += SYRIAC_DIGRAPHS[pair];
				i += 2;
				continue;
			}
		}

		// Check 1-char mapping
		if (LATIN_TO_SYRIAC_MAP[char]) {
			res += LATIN_TO_SYRIAC_MAP[char];
		} else {
			res += char;
		}
		i++;
	}

	return res;
}

const SYRIAC_PUNCT_DIACRITICS = /[\u0730-\u074F\u0300-\u036F\.\,\;\:\?\!\(\)\[\]]/g;

/**
 * Normalizes Syriac text for search/filtering by stripping vocalization points,
 * reading dots, and punctuation.
 */
export function toPlainSyriac(syriac: string): string {
	if (!syriac) return '';
	return syriac
		.normalize('NFD')
		.replace(SYRIAC_PUNCT_DIACRITICS, '')
		.normalize('NFC')
		.trim();
}

/**
 * Transliterates input based on language: 'greek' | 'hebrew' | 'syriac'.
 */
export function transliterate(input: string, lang: 'greek' | 'hebrew' | 'syriac'): string {
	if (lang === 'greek') {
		return latinToGreek(input);
	} else if (lang === 'hebrew') {
		return latinToHebrew(input);
	} else if (lang === 'syriac') {
		return latinToSyriac(input);
	}
	return input;
}

export interface KwicOptions {
	normQ?: string;
	radius?: number;
	lang?: string;
}

export interface KwicSnippet {
	before: string;
	match: string;
	after: string;
	start: number;
	end: number;
}

/**
 * Finds all character ranges { start, end } of a query in text with 100% accurate mapping
 * back to original text character positions, ignoring Greek diacritics/accents,
 * Hebrew vowels/accents, and Syriac vocalization marks.
 */
export function findAllMatchesInText(
	text: string,
	query: string,
	normQ?: string,
	lang?: string
): Array<{ start: number; end: number }> {
	if (!text || !query) return [];

	let q = query;
	const isGreek = lang === 'greek' || (!lang && /[\u0370-\u03ff\u1f00-\u1fff]/.test(text));
	const isHebrew = lang === 'hebrew' || (!lang && /[\u0590-\u05ff]/.test(text));
	const isSyriac = lang === 'syriac' || (!lang && /[\u0700-\u074f]/.test(text));

	if (!normQ && /[a-zA-Z]/.test(query)) {
		if (isGreek) {
			q = transliterateLatinToGreek(query);
		} else if (isHebrew) {
			q = latinToHebrew(query);
		} else if (isSyriac) {
			q = latinToSyriac(query);
		}
	}

	let targetNormQ = normQ;
	if (!targetNormQ) {
		if (isGreek) {
			targetNormQ = normalizeGreekSearch(q);
		} else if (isHebrew) {
			targetNormQ = q.replace(/[\u0591-\u05bd\u05bf-\u05c7]/g, '');
		} else if (isSyriac) {
			targetNormQ = q.replace(/[\u0730-\u074a]/g, '');
		} else {
			targetNormQ = q.toLowerCase();
		}
	}
	if (!targetNormQ) return [];

	// Build index map for diacritics/accents-insensitive match
	let normText = '';
	const indexMap: number[] = [];

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		let normChar = char;

		if (isGreek) {
			normChar = char
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase()
				.replace(/ς/g, 'σ');
		} else if (isHebrew) {
			normChar = char.replace(/[\u0591-\u05bd\u05bf-\u05c7]/g, '');
		} else if (isSyriac) {
			normChar = char.replace(/[\u0730-\u074a]/g, '');
		} else {
			normChar = char.toLowerCase();
		}

		for (let j = 0; j < normChar.length; j++) {
			normText += normChar[j];
			indexMap.push(i);
		}
	}

	const matches: Array<{ start: number; end: number }> = [];
	let normIdx = normText.indexOf(targetNormQ);

	while (normIdx !== -1) {
		const start = indexMap[normIdx];
		const lastNormIdx = normIdx + targetNormQ.length - 1;
		let end = indexMap[lastNormIdx] + 1;

		// Include any trailing combining marks on the final character
		while (
			end < text.length &&
			/[\u0300-\u036f\u0591-\u05bd\u05bf-\u05c7\u0730-\u074a]/.test(text[end])
		) {
			end++;
		}

		matches.push({ start, end });
		normIdx = normText.indexOf(targetNormQ, normIdx + targetNormQ.length);
	}

	return matches;
}

/**
 * Finds the first character range { start, end } of a query in text with 100% accurate mapping
 * back to original text character positions, ignoring Greek diacritics and accents.
 */
export function findMatchInText(
	text: string,
	query: string,
	normQ?: string,
	lang?: string
): { start: number; end: number } | null {
	if (!text || !query) return null;
	const all = findAllMatchesInText(text, query, normQ, lang);
	return all.length > 0 ? all[0] : null;
}

/**
 * Generates KWIC (Key Word In Context) snippet with accurate match boundaries.
 * Backwards compatible with (text, query, normQ) or (text, query, options).
 */
export function getKwicSnippet(
	text: string,
	query: string,
	optionsOrNormQ?: string | KwicOptions
): KwicSnippet {
	const defaultRadius = 45;
	let normQ: string | undefined;
	let radius = defaultRadius;
	let lang: string | undefined;

	if (typeof optionsOrNormQ === 'string') {
		normQ = optionsOrNormQ;
	} else if (optionsOrNormQ && typeof optionsOrNormQ === 'object') {
		normQ = optionsOrNormQ.normQ;
		radius = optionsOrNormQ.radius ?? defaultRadius;
		lang = optionsOrNormQ.lang;
	}

	if (!text) {
		return { before: '', match: '', after: '', start: -1, end: -1 };
	}

	const matchRange = findMatchInText(text, query, normQ, lang);
	if (!matchRange) {
		return {
			before: text.slice(0, radius),
			match: '',
			after: text.slice(radius, radius * 2),
			start: -1,
			end: -1
		};
	}

	const { start, end } = matchRange;
	const kwicStart = Math.max(0, start - radius);
	const kwicEnd = Math.min(text.length, end + radius);

	return {
		before: (kwicStart > 0 ? '...' : '') + text.slice(kwicStart, start),
		match: text.slice(start, end),
		after: text.slice(end, kwicEnd) + (kwicEnd < text.length ? '...' : ''),
		start,
		end
	};
}

/**
 * Generates all KWIC snippets for every occurrence of query found in text.
 */
export function getAllKwicSnippets(
	text: string,
	query: string,
	optionsOrNormQ?: string | KwicOptions
): KwicSnippet[] {
	const defaultRadius = 45;
	let normQ: string | undefined;
	let radius = defaultRadius;
	let lang: string | undefined;

	if (typeof optionsOrNormQ === 'string') {
		normQ = optionsOrNormQ;
	} else if (optionsOrNormQ && typeof optionsOrNormQ === 'object') {
		normQ = optionsOrNormQ.normQ;
		radius = optionsOrNormQ.radius ?? defaultRadius;
		lang = optionsOrNormQ.lang;
	}

	if (!text || !query) return [];

	const matches = findAllMatchesInText(text, query, normQ, lang);
	if (matches.length === 0) return [];

	return matches.map(({ start, end }) => {
		const kwicStart = Math.max(0, start - radius);
		const kwicEnd = Math.min(text.length, end + radius);

		return {
			before: (kwicStart > 0 ? '...' : '') + text.slice(kwicStart, start),
			match: text.slice(start, end),
			after: text.slice(end, kwicEnd) + (kwicEnd < text.length ? '...' : ''),
			start,
			end
		};
	});
}
