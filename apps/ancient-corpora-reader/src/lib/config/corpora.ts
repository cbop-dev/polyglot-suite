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

export const CORPORA_CONFIG: Record<string, CorpusConfig> = {
	af: {
		id: 'af',
		name: 'Apostolic Fathers',
		title: 'Apostolic Fathers',
		subtitle: 'Early Christian Greek writings (1st–2nd century CE)',
		badge: 'AF',
		era: '1st–2nd c. CE',
		author: 'Early Christian Fathers',
		primaryLanguage: 'grc',
		availableLanguages: ['grc', 'eng', 'lat'],
		coordinateScheme: 'division_both',
		features: {
			hasScriptureCitations: false,
			hasTextualApparatus: true,
			hasAudio: false
		},
		citation: {
			author: 'Kirsopp Lake',
			seriesTitle: 'The Apostolic Fathers (Loeb Classical Library)',
			defaultYear: '1912'
		},
		textVersions: [
			{
				id: 'lake_grc',
				language: 'grc',
				title: 'Kirsopp Lake Greek Critical Text (1912)',
				shortTitle: 'Lake Greek (1912)',
				direction: 'ltr',
				isDefaultVisible: true,
				order: 1
			},
			{
				id: 'af_lat',
				language: 'lat',
				title: 'Latin Witness (Where Extant)',
				shortTitle: 'Latin Text',
				direction: 'ltr',
				isDefaultVisible: false,
				order: 2
			},
			{
				id: 'lake_eng',
				language: 'eng',
				title: 'Kirsopp Lake English Translation (1912)',
				shortTitle: 'English (Lake)',
				direction: 'ltr',
				isDefaultVisible: true,
				order: 3
			}
		]
	},

	philo: {
		id: 'philo',
		name: 'Philo of Alexandria',
		title: 'Philo of Alexandria',
		subtitle: 'Hellenistic Jewish philosophical & allegorical treatises',
		badge: 'Philo',
		era: 'c. 20 BCE – 50 CE',
		author: 'Philo of Alexandria',
		primaryLanguage: 'grc',
		availableLanguages: ['grc', 'eng'],
		coordinateScheme: 'division_both',
		milestoneScheme: {
			id: 'mangey',
			label: 'Mangey Milestone',
			badgePrefix: 'M.',
			badgeColorClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
		},
		features: {
			hasScriptureCitations: true,
			hasTextualApparatus: false,
			hasAudio: false
		},
		citation: {
			author: 'Philo of Alexandria',
			seriesTitle: 'The Works of Philo Judaeus',
			defaultYear: '1854'
		},
		textVersions: [
			{
				id: 'grc',
				language: 'grc',
				title: 'Cohn-Wendland Greek Critical Text',
				shortTitle: 'Cohn-Wendland Greek',
				direction: 'ltr',
				isDefaultVisible: true,
				order: 1
			},
			{
				id: 'eng',
				language: 'eng',
				title: 'C. D. Yonge English Translation',
				shortTitle: 'Yonge English',
				direction: 'ltr',
				isDefaultVisible: true,
				order: 2
			}
		]
	},

	josephus: {
		id: 'josephus',
		name: 'Flavius Josephus',
		title: 'Flavius Josephus',
		subtitle: 'Jewish history, autobiography, and defense of antiquity',
		badge: 'Josephus',
		era: 'c. 37 – 100 CE',
		author: 'Flavius Josephus',
		primaryLanguage: 'grc',
		availableLanguages: ['grc', 'eng'],
		coordinateScheme: 'book_only',
		milestoneScheme: {
			id: 'niese',
			label: 'Niese Section',
			badgePrefix: '§',
			badgeColorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
		},
		features: {
			hasScriptureCitations: false,
			hasTextualApparatus: false,
			hasAudio: false
		},
		citation: {
			author: 'Flavius Josephus',
			seriesTitle: 'The Works of Flavius Josephus (Ed. B. Niese)',
			defaultYear: '1895'
		},
		textVersions: [
			{
				id: 'josephus_grc',
				language: 'grc',
				title: 'Benedikt Niese Greek Critical Text (1885–1895)',
				shortTitle: 'Niese Greek',
				direction: 'ltr',
				isDefaultVisible: true,
				order: 1
			},
			{
				id: 'josephus_eng',
				language: 'eng',
				title: 'H. St. J. Thackeray & William Whiston English Translation',
				shortTitle: 'English Translation',
				direction: 'ltr',
				isDefaultVisible: true,
				order: 2
			}
		]
	}
};

/**
 * Retrieve the configuration for a given corpus ID, falling back to AF.
 */
export function getCorpusConfig(id?: string): CorpusConfig {
	if (id && id in CORPORA_CONFIG) {
		return CORPORA_CONFIG[id];
	}
	return CORPORA_CONFIG.af;
}

/**
 * Return all registered corpora in canonical display order.
 */
export function getAllCorpora(): CorpusConfig[] {
	return Object.values(CORPORA_CONFIG);
}

/**
 * Return all available text versions for a corpus.
 */
export function getCorpusTextVersions(id: string): TextVersionConfig[] {
	return getCorpusConfig(id).textVersions;
}
