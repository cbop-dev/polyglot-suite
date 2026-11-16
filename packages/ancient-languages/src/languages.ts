export type AncientLanguageId = 'greek' | 'hebrew' | 'syriac' | 'latin' | 'english';
export type LanguageCode = 'grc' | 'hbo' | 'heb' | 'lat' | 'syr' | 'eng';

export const LANGUAGE_ALIASES: Record<string, AncientLanguageId> = {
	// Greek
	greek: 'greek',
	grc: 'greek',
	gk: 'greek',
	el: 'greek',

	// Hebrew
	hebrew: 'hebrew',
	heb: 'hebrew',
	hbo: 'hebrew',
	he: 'hebrew',

	// Syriac
	syriac: 'syriac',
	syr: 'syriac',

	// Latin
	latin: 'latin',
	lat: 'latin',
	la: 'latin',

	// English
	english: 'english',
	eng: 'english',
	en: 'english'
};

export const LANGUAGE_PRIMARY_ISO: Record<AncientLanguageId, LanguageCode> = {
	greek: 'grc',
	hebrew: 'hbo',
	syriac: 'syr',
	latin: 'lat',
	english: 'eng'
};

/**
 * Normalizes any language code, abbreviation, or name into canonical AncientLanguageId ('greek' | 'hebrew' | 'syriac' | 'latin' | 'english').
 */
export function normalizeLanguage(langOrCode?: string | null): AncientLanguageId | null {
	if (!langOrCode) return null;
	const key = langOrCode.trim().toLowerCase();
	return LANGUAGE_ALIASES[key] || null;
}

/**
 * Resolves standard 3-letter ISO 639-3 code ('grc' | 'hbo' | 'lat' | 'syr' | 'eng') for any language alias.
 */
export function getLanguageIsoCode(langOrCode?: string | null): LanguageCode | '' {
	const norm = normalizeLanguage(langOrCode);
	return norm ? LANGUAGE_PRIMARY_ISO[norm] : '';
}

export function isGreekLanguage(lang?: string | null): boolean {
	return normalizeLanguage(lang) === 'greek';
}

export function isHebrewLanguage(lang?: string | null): boolean {
	return normalizeLanguage(lang) === 'hebrew';
}

export function isSyriacLanguage(lang?: string | null): boolean {
	return normalizeLanguage(lang) === 'syriac';
}

export function isLatinLanguage(lang?: string | null): boolean {
	return normalizeLanguage(lang) === 'latin';
}

export function isEnglishLanguage(lang?: string | null): boolean {
	return normalizeLanguage(lang) === 'english';
}

export class Languages {
	static LANGUAGE_CODES: Record<string, { name: string; short: string }> = {
		grc: { name: 'Greek', short: 'Gk' },
		hbo: { name: 'Hebrew', short: 'Heb' },
		heb: { name: 'Hebrew', short: 'Heb' },
		eng: { name: 'English', short: 'Eng' },
		lat: { name: 'Latin', short: 'Lat' },
		syr: { name: 'Syriac', short: 'Syr' }
	};

	static normalize(langOrCode?: string | null): AncientLanguageId | null {
		return normalizeLanguage(langOrCode);
	}

	static getIsoCode(langOrCode?: string | null): LanguageCode | '' {
		return getLanguageIsoCode(langOrCode);
	}

	static isGreek(lang?: string | null): boolean {
		return isGreekLanguage(lang);
	}

	static isHebrew(lang?: string | null): boolean {
		return isHebrewLanguage(lang);
	}

	static isSyriac(lang?: string | null): boolean {
		return isSyriacLanguage(lang);
	}

	static isLatin(lang?: string | null): boolean {
		return isLatinLanguage(lang);
	}

	static isEnglish(lang?: string | null): boolean {
		return isEnglishLanguage(lang);
	}

	/**
	 * @param code 
	 * @returns name of the associated language, or empty string if none found.
	 */
	static getNameFromCode(code: string): string {
		const key = (code || '').trim().toLowerCase();
		if (Object.hasOwn(this.LANGUAGE_CODES, key)) {
			return this.LANGUAGE_CODES[key]?.name || '';
		}
		const norm = normalizeLanguage(key);
		if (norm && norm in LANGUAGE_PRIMARY_ISO) {
			const iso = LANGUAGE_PRIMARY_ISO[norm];
			return this.LANGUAGE_CODES[iso]?.name || '';
		}
		return '';
	}

	/**
	 * @param code 
	 * @returns short name of the associated language, or empty string if none found.
	 */
	static getShortNameFromCode(code: string): string {
		const key = (code || '').trim().toLowerCase();
		if (Object.hasOwn(this.LANGUAGE_CODES, key)) {
			return this.LANGUAGE_CODES[key]?.short || '';
		}
		const norm = normalizeLanguage(key);
		if (norm && norm in LANGUAGE_PRIMARY_ISO) {
			const iso = LANGUAGE_PRIMARY_ISO[norm];
			return this.LANGUAGE_CODES[iso]?.short || '';
		}
		return '';
	}
}
