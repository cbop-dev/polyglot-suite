/**
 * Ancient language font and direction styling utilities.
 */

export type SupportedLanguage = 'hebrew' | 'greek' | 'syriac' | 'latin' | 'english' | string;

/**
 * Preferred font family CSS stacks by language code or name.
 * Greek prioritizes 'GFS Didot' matching Polyglot Bible Reader.
 */
export const LANGUAGE_FONT_FAMILIES: Record<string, string> = {
	grc: "'GFS Didot', 'EB Garamond', 'Gentium Plus', 'Charis SIL', 'SBL BibLit', serif",
	greek: "'GFS Didot', 'EB Garamond', 'Gentium Plus', 'Charis SIL', 'SBL BibLit', serif",
	lat: "'Gentium Plus', 'Charis SIL', 'EB Garamond', serif",
	latin: "'Gentium Plus', 'Charis SIL', 'EB Garamond', serif",
	heb: "'Ezra SIL', 'SBL Hebrew', serif",
	hebrew: "'Ezra SIL', 'SBL Hebrew', serif",
	hbo: "'Ezra SIL', 'SBL Hebrew', serif",
	syr: "'Estrangelo Marcus', 'Noto Sans Syriac', serif",
	syriac: "'Estrangelo Marcus', 'Noto Sans Syriac', serif",
	eng: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif",
	english: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif"
};

/**
 * Returns the preferred CSS font-family string for a given language code or name.
 */
export function getLanguageFontFamily(langOrCorpus?: string): string {
	if (!langOrCorpus) return LANGUAGE_FONT_FAMILIES.grc;
	const key = langOrCorpus.toLowerCase().trim();
	return LANGUAGE_FONT_FAMILIES[key] || LANGUAGE_FONT_FAMILIES.grc;
}

/**
 * Returns CSS classes for font family and language tag based on language or database abbreviation.
 * 
 * @param lang Language name (e.g., 'hebrew', 'greek', 'syriac', 'latin', 'grc', 'lat')
 * @param dbAbbrev Database abbreviation (e.g., 'bhs', 'wlc', 'lxx', 'sblgnt', 'peshitta')
 * @returns Space-delimited CSS class string (e.g., 'font-greek greek greek-font')
 */
export function getLanguageFontClass(lang?: string, dbAbbrev?: string): string {
	const l = (lang || '').toLowerCase().trim();
	const db = (dbAbbrev || '').toLowerCase().trim();

	if (l === 'hebrew' || l === 'heb' || l === 'hbo' || db === 'bhs' || db === 'wlc') {
		return 'font-hebrew hebrew';
	}
	if (l === 'syriac' || l === 'syr' || db === 'peshitta') {
		return 'font-syriac syriac';
	}
	if (l === 'latin' || l === 'lat' || db === 'vulgate') {
		return 'font-latin latin latin-font';
	}
	if (l === 'english' || l === 'eng' || db === 'kjv' || db === 'web') {
		return 'font-english';
	}
	return 'font-greek greek greek-font';
}

/**
 * Determines whether the specified language or database abbreviation uses right-to-left (RTL) text direction.
 */
export function isRtlLanguage(lang?: string, dbAbbrev?: string): boolean {
    const l = (lang || '').toLowerCase().trim();
    const db = (dbAbbrev || '').toLowerCase().trim();

    return l === 'hebrew' || l === 'syriac' || db === 'bhs' || db === 'wlc' || db === 'peshitta';
}

/**
 * Returns 'rtl' or 'ltr' text direction for the specified language or database abbreviation.
 */
export function getLanguageDirection(lang?: string, dbAbbrev?: string): 'rtl' | 'ltr' {
    return isRtlLanguage(lang, dbAbbrev) ? 'rtl' : 'ltr';
}
