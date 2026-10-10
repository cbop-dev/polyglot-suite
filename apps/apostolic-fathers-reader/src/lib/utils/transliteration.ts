/**
 * Transliteration and script normalization utilities for Greek.
 * Reused from Polyglot Bible Reader (biblical-lexeme-explorer conventions):
 * - Single-character mapping
 * - 'x' -> 'ξ', 'c' -> 'χ', 'q' -> 'θ', 'f' -> 'φ', 'y' -> 'ψ', 'w' -> 'ω', 's' -> 'σ'/'ς'
 */

// Greek mapping table
const LATIN_TO_GREEK_MAP: Record<string, string> = {
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
	v: 'ϝ', V: 'Ϝ'
};

/**
 * Converts Latin Beta Code / phonetic text to Greek characters.
 * Final sigma is handled: word-final 'σ' becomes 'ς'.
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
