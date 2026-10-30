/**
 * Punctuation and Symbol Utilities for Ancient Languages.
 *
 * Strips punctuation and editorial/apparatus symbols across Greek, Hebrew,
 * Syriac, and Latin, while preserving letters, numbers, and combining
 * diacritical marks (accents, breathings, niqqud, cantillation).
 */

/**
 * Strips all punctuation and editorial apparatus marks from text,
 * preserving letters, numbers, and combining diacritical marks (e.g., Greek polytonic
 * accents, breathings, iota subscripts, Hebrew niqqud, Syriac vowels).
 */
export function stripPunctuation(text: string): string {
	if (!text) return '';
	// \p{P}: Unicode punctuation (includes ASCII .,;:!?, Greek Ano Teleia \u0387,
	//        Middle Dot \u00B7, Greek Question Mark \u037E, curly quotes, dashes, brackets)
	// \p{S}: Unicode symbols (apparatus markers †, ‡, ⟦, ⟧, ⟨, ⟩)
	// \s: Whitespace
	// Combining marks (\p{M}) and letters (\p{L}) are fully preserved.
	return text.replace(/[\p{P}\p{S}\s]+/gu, '');
}

/**
 * Strips only leading and trailing punctuation, editorial/apparatus symbols,
 * and whitespace from a word token, preserving any internal characters and all diacritics.
 */
export function trimPunctuation(word: string): string {
	if (!word) return '';
	return word
		.replace(/^[\p{P}\p{S}\s]+/gu, '')
		.replace(/[\p{P}\p{S}\s]+$/gu, '');
}
