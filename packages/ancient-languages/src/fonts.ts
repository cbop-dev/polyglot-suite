/**
 * Ancient language font and direction styling utilities.
 */

export type SupportedLanguage = 'hebrew' | 'greek' | 'syriac' | 'latin' | 'english' | string;

/**
 * Returns CSS classes for font family and language tag based on language or database abbreviation.
 * 
 * @param lang Language name (e.g., 'hebrew', 'greek', 'syriac', 'latin')
 * @param dbAbbrev Database abbreviation (e.g., 'bhs', 'wlc', 'lxx', 'sblgnt', 'peshitta')
 * @returns Space-delimited CSS class string (e.g., 'font-hebrew hebrew')
 */
export function getLanguageFontClass(lang?: string, dbAbbrev?: string): string {
    const l = (lang || '').toLowerCase().trim();
    const db = (dbAbbrev || '').toLowerCase().trim();

    if (l === 'hebrew' || db === 'bhs' || db === 'wlc') {
        return 'font-hebrew hebrew';
    }
    if (l === 'syriac' || db === 'peshitta') {
        return 'font-syriac syriac';
    }
    if (l === 'latin' || db === 'vulgate') {
        return 'font-latin latin';
    }
    if (l === 'english' || db === 'kjv' || db === 'web') {
        return 'font-english';
    }
    return 'font-greek greek';
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
