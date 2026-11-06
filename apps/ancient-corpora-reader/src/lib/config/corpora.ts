import * as CorpusTypes from "@polyglot/ancient-languages/corpora-types";
export const CORPORA_CONFIG: Record<string, CorpusTypes.CorpusConfig> = {
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
				id: 'lake_lat',
				language: 'lat',
				title: 'Latin Witness (Where Extant)',
				shortTitle: 'Latin Text',
				direction: 'ltr',
				isDefaultVisible: true,
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
export function getCorpusConfig(id?: string): CorpusTypes.CorpusConfig {
	if (id && id in CORPORA_CONFIG) {
		return CORPORA_CONFIG[id];
	}
	return CORPORA_CONFIG.af;
}

/**
 * Return all registered corpora in canonical display order.
 */
export function getAllCorpora(): CorpusTypes.CorpusConfig[] {
	return Object.values(CORPORA_CONFIG);
}

/**
 * Return all available text versions for a corpus.
 */
export function getCorpusTextVersions(id: string): CorpusTypes.TextVersionConfig[] {
	return getCorpusConfig(id).textVersions;
}
