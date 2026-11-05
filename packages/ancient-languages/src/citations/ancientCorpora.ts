export type AncientCorpusId = 'af' | 'philo' | 'josephus';

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

export interface FormatAncientCitationParams {
	corpusId?: string;
	workCode?: string;
	work?: { abbrev: string; divisionLabel?: string };
	book?: number | string;
	chapter?: number | string;
	division?: number | string;
	section?: number | string;
	customAbbrev?: string;
	milestone?: string;
}

/**
 * Format an ancient corpus citation based on its conventions:
 * - AF: `1 Clem. 1:2` (chapter:section) or `Barn. 4:1`
 * - Philo: `Opif. 15` (section) or `Leg. 1.25` (book.section)
 * - Josephus: `Ant. 1.15` (book.section) or `Life 10`
 */
export function formatAncientCorpusCitation(params: FormatAncientCitationParams): string {
	const { corpusId, workCode, work, book, chapter, division, section, customAbbrev, milestone } = params;
	const abbrev = customAbbrev || work?.abbrev || workCode || '';

	if (milestone) {
		return abbrev ? `${abbrev} ${milestone}` : String(milestone);
	}

	const div = division !== undefined ? division : (corpusId === 'af' ? chapter : (book !== undefined ? book : chapter));

	if (corpusId === 'af') {
		const c = chapter !== undefined ? chapter : division;
		if (c !== undefined && section !== undefined) return abbrev ? `${abbrev} ${c}:${section}` : `${c}:${section}`;
		if (c !== undefined) return abbrev ? `${abbrev} ${c}` : `${c}`;
		if (section !== undefined) return abbrev ? `${abbrev} ${section}` : `${section}`;
		return abbrev;
	}

	if (corpusId === 'philo') {
		if (book !== undefined && section !== undefined) return abbrev ? `${abbrev} ${book}.${section}` : `${book}.${section}`;
		if (division !== undefined && section !== undefined) return abbrev ? `${abbrev} ${division}.${section}` : `${division}.${section}`;
		if (section !== undefined) return abbrev ? `${abbrev} ${section}` : `${section}`;
		if (chapter !== undefined) return abbrev ? `${abbrev} ${chapter}` : `${chapter}`;
		if (div !== undefined) return abbrev ? `${abbrev} ${div}` : `${div}`;
		return abbrev;
	}

	if (corpusId === 'josephus') {
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
