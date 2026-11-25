/**
 * Master Corpus Configurations for Ancient Corpora Reader (ACR).
 * 
 * Declares all corpus identities, text versions, milestone schemes,
 * and academic citation metadata. Svelte components and services read
 * from this registry rather than hardcoding corpus or language values.
 */

export type TextDirection = 'ltr' | 'rtl';

/**
 * Bibliographic metadata for a specific textual edition or translation.
 */
export interface VersionBibliographicConfig {
	role: 'critical_edition' | 'translation' | 'ancient_witness';
	editor?: string;
	translator?: string;
	booktitle: string;
	series?: string;
	publisher: string;
	address?: string;
	year: string;
	volume?: string;
	sblQualifier?: string;
	applicableWorks?: string[];
	url?: string;
}

/**
 * Declares a specific textual witness or translation available within a corpus.
 */
export interface TextVersionConfig {
	id: string;              // Standardized DB/version ID (e.g. 'af_lake_grc', 'philo_cw_grc')
	language: string;        // Language code: 'grc', 'eng', 'lat', 'hbo', 'syr'
	title: string;           // Full title (e.g. 'Kirsopp Lake Greek Critical Text (1912)')
	shortTitle: string;      // Short header label (e.g. 'Lake Greek (1912)')
	versionLabel?: string;   // Short badge label / year (e.g. 'Lake 1912', 'Niese 1895')
	direction?: TextDirection; // Defaults to 'ltr'
	isDefaultVisible: boolean; // True if column should display on initial load
	order: number;           // Left-to-right display order
	bibliographic?: VersionBibliographicConfig;
	applicableWorks?: string[]; // Work codes where this version is extant (undefined = all works)
}

/**
 * Declares secondary milestone numbering schemes (e.g. Niese, Mangey).
 */
export interface MilestoneSchemeConfig {
	id: string;              // 'niese', 'mangey', 'stephanus', etc.
	label: string;           // 'Niese Section', 'Mangey Milestone'
	badgePrefix: string;     // '§', 'M.'
	badgeColorClass: string; // Tailwind color classes for pill
}

export type CitationStyle = 'chapter_section' | 'book_section' | 'division_section';

export interface CorpusLicenseEdition {
	label: string;
	source: string;
	license: string;
	url?: string;
}

export interface CorpusLicenseConfig {
	name: string;
	url?: string;
	notice?: string;
	editions?: CorpusLicenseEdition[];
}

/**
 * Complete metadata contract for a corpus.
 */
export interface CorpusConfig {
	id: string;              // e.g. 'af', 'philo', 'josephus', 'justin'
	enabled?: boolean;       // Defaults to true; false hides/disables corpus
	name: string;            // e.g. 'Apostolic Fathers'
	title?: string;          // Ergonomic alias for name
	subtitle: string;        // e.g. 'Early Christian Greek writings (1st–2nd century CE)'
	badge: string;           // Short badge for triggers (e.g. 'AF', 'Philo')
	era: string;             // Historical period (e.g. '1st–2nd c. CE')
	author: string;          // Author or collection designation
	primaryLanguage: string; // 'grc', 'lat', 'hbo', etc.
	defaultDictionary?: string; // e.g. 'lsj', 'lewis-short'
	availableLanguages: string[]; // ['grc', 'eng', 'lat']
	textVersions: TextVersionConfig[];
	milestoneScheme?: MilestoneSchemeConfig;
	coordinateScheme: 'book_only' | 'division_both';
	citationStyle?: CitationStyle;
	features: {
		hasScriptureCitations: boolean;
		hasTextualApparatus: boolean;
		hasAudio: boolean;
	};
	citation: {
		author: string;
		seriesTitle: string;
		defaultYear: string;
		publisher?: string;
	};
	license?: CorpusLicenseConfig;
}
