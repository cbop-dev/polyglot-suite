import { getLanguageIsoCode } from '../languages.js';
import type { CitationStyle } from '../ancient-corpora-types.js';

export type AncientCorpusId = string;

/**
 * Canonical default dictionary / lexicon identifiers by language code.
 */
export const LANGUAGE_DEFAULT_DICTIONARIES: Record<string, string> = {
	grc: 'lsj',   // Ancient Greek -> Liddell-Scott-Jones
	heb: 'bdb',   // Hebrew -> Brown-Driver-Briggs
	hbo: 'bdb',   // Biblical Hebrew -> Brown-Driver-Briggs
	syr: 'sedra', // Syriac -> SEDRA
	lat: 'lewis-short' // Latin -> Lewis & Short (future)
};

/**
 * Canonical default dictionary / lexicon identifiers by corpus ID.
 */
export const CORPUS_DEFAULT_DICTIONARIES: Record<string, string> = {
	af: 'lsj',
	philo: 'lsj',
	josephus: 'lsj'
};

/**
 * Canonical primary language code by corpus ID.
 */
export const CORPUS_PRIMARY_LANGUAGES: Record<string, string> = {
	af: 'grc',
	philo: 'grc',
	josephus: 'grc'
};

/**
 * Retrieve the canonical primary language code for a given corpus (e.g., 'grc', 'lat', 'heb').
 */
export function getCorpusPrimaryLanguage(corpusId: string): string {
	if (corpusId in CORPUS_PRIMARY_LANGUAGES) {
		return CORPUS_PRIMARY_LANGUAGES[corpusId];
	}
	return 'grc';
}

/**
 * Retrieve the canonical default dictionary for a given corpus or language.
 */
export function getDefaultDictionary(langOrCorpus: string): string {
	if (langOrCorpus in CORPUS_DEFAULT_DICTIONARIES) {
		return CORPUS_DEFAULT_DICTIONARIES[langOrCorpus];
	}
	const iso = getLanguageIsoCode(langOrCorpus);
	if (iso && iso in LANGUAGE_DEFAULT_DICTIONARIES) {
		return LANGUAGE_DEFAULT_DICTIONARIES[iso];
	}
	return LANGUAGE_DEFAULT_DICTIONARIES[langOrCorpus] || 'lsj';
}

export interface AncientWorkMetadata {
	code: string;
	corpusId?: string;
	titleEnglish: string;
	titleGreek?: string;
	titleLatin?: string;
	abbrev: string;
	divisionLabel?: string;
	hasBooks?: boolean;
	hasChapters?: boolean;
	hasSections?: boolean;
}

export interface ParsedAncientCitation {
	corpusId?: string;
	workCode: string;
	book?: number;
	chapter?: number;
	section?: number;
	rawCitation: string;
}

export interface FormatAncientCorpusCitationParams {
	corpusId?: string;
	citationStyle?: CitationStyle;
	workCode?: string;
	work?: { abbrev: string; divisionLabel?: string };
	book?: number | string;
	chapter?: number | string;
	division?: number | string;
	section?: number | string;
	customAbbrev?: string;
	milestone?: string;
}

export type FormatAncientCitationParams = FormatAncientCorpusCitationParams;

/**
 * Format an ancient corpus citation based on citationStyle or corpus conventions:
 * - 'chapter_section' (e.g. AF, Justin): `1 Clem. 1:2`, `1 Apol. 1:1`
 * - 'book_section' / 'division_section' (e.g. Philo, Josephus): `Opif. 15`, `Ant. 1.15`
 */
export function formatAncientCorpusCitation(params: FormatAncientCorpusCitationParams): string {
	const { corpusId, citationStyle, workCode, work, book, chapter, division, section, customAbbrev, milestone } = params;
	const abbrev = customAbbrev || work?.abbrev || workCode || '';

	if (milestone) {
		return abbrev ? `${abbrev} ${milestone}` : String(milestone);
	}

	const style: CitationStyle | undefined =
		citationStyle ??
		(corpusId === 'af' ? 'chapter_section' : corpusId === 'josephus' ? 'book_section' : corpusId === 'philo' ? 'division_section' : undefined);

	const div = division !== undefined ? division : (style === 'chapter_section' ? chapter : (book !== undefined ? book : chapter));

	if (style === 'chapter_section') {
		const c = chapter !== undefined ? chapter : division;
		if (c !== undefined && section !== undefined) return abbrev ? `${abbrev} ${c}:${section}` : `${c}:${section}`;
		if (c !== undefined) return abbrev ? `${abbrev} ${c}` : `${c}`;
		if (section !== undefined) return abbrev ? `${abbrev} ${section}` : `${section}`;
		return abbrev;
	}

	if (style === 'division_section') {
		if (book !== undefined && section !== undefined) return abbrev ? `${abbrev} ${book}.${section}` : `${book}.${section}`;
		if (division !== undefined && section !== undefined) return abbrev ? `${abbrev} ${division}.${section}` : `${division}.${section}`;
		if (section !== undefined) return abbrev ? `${abbrev} ${section}` : `${section}`;
		if (chapter !== undefined) return abbrev ? `${abbrev} ${chapter}` : `${chapter}`;
		if (div !== undefined) return abbrev ? `${abbrev} ${div}` : `${div}`;
		return abbrev;
	}

	if (style === 'book_section') {
		if (book !== undefined && section !== undefined) return abbrev ? `${abbrev} ${book}.${section}` : `${book}.${section}`;
		if (division !== undefined && section !== undefined) return abbrev ? `${abbrev} ${division}.${section}` : `${division}.${section}`;
		if (section !== undefined) return abbrev ? `${abbrev} ${section}` : `${section}`;
		if (book !== undefined) return abbrev ? `${abbrev} ${book}` : `${book}`;
		if (div !== undefined) return abbrev ? `${abbrev} ${div}` : `${div}`;
		return abbrev;
	}

	if (div !== undefined && section !== undefined) {
		return abbrev ? `${abbrev} ${div}.${section}` : `${div}.${section}`;
	}
	if (section !== undefined) {
		return abbrev ? `${abbrev} ${section}` : `${section}`;
	}
	if (div !== undefined) {
		return abbrev ? `${abbrev} ${div}` : `${div}`;
	}

	return abbrev;
}
