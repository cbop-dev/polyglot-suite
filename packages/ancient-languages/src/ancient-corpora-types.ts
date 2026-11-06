/**
 * Master Corpus Configurations for Ancient Corpora Reader (ACR).
 * 
 * Declares all corpus identities, text versions, milestone schemes,
 * and academic citation metadata. Svelte components and services read
 * from this registry rather than hardcoding corpus or language values.
 */

export type TextDirection = 'ltr' | 'rtl';

/**
 * Declares a specific textual witness or translation available within a corpus.
 */
export interface TextVersionConfig {
	id: string;              // Unique DB/version ID (e.g. 'lake_grc', 'yonge_eng', 'af_lat')
	language: string;        // Language code: 'grc', 'eng', 'lat', 'hbo', 'syr'
	title: string;           // Full title (e.g. 'Kirsopp Lake Greek Critical Text (1912)')
	shortTitle: string;      // Short header label (e.g. 'Lake Greek (1912)')
	direction?: TextDirection; // Defaults to 'ltr'
	isDefaultVisible: boolean; // True if column should display on initial load
	order: number;           // Left-to-right display order
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

/**
 * Complete metadata contract for a corpus.
 */
export interface CorpusConfig {
	id: string;              // e.g. 'af', 'philo', 'josephus'
	name: string;            // e.g. 'Apostolic Fathers'
	title?: string;          // Ergonomic alias for name
	subtitle: string;        // e.g. 'Early Christian Greek writings (1st–2nd century CE)'
	badge: string;           // Short badge for triggers (e.g. 'AF', 'Philo')
	era: string;             // Historical period (e.g. '1st–2nd c. CE')
	author: string;          // Author or collection designation
	primaryLanguage: string; // 'grc', 'lat', 'hbo', etc.
	availableLanguages: string[]; // ['grc', 'eng', 'lat']
	textVersions: TextVersionConfig[];
	milestoneScheme?: MilestoneSchemeConfig;
	coordinateScheme: 'book_only' | 'division_both';
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
}
