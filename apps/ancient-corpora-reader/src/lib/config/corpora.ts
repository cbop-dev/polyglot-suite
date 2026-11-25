import * as CorpusTypes from "@polyglot/ancient-languages/corpora-types";
import { CANONICAL_CORPUS_VERSIONS } from "./corpusVersions.generated.js";

export const CORPORA_CONFIG: Record<string, CorpusTypes.CorpusConfig> = {
	af: {
		id: 'af',
		enabled: true,
		name: 'Apostolic Fathers',
		title: 'Apostolic Fathers',
		subtitle: 'Early Christian Greek writings (1st–2nd century CE)',
		badge: 'AF',
		era: '1st–2nd c. CE',
		author: 'Early Christian Fathers',
		primaryLanguage: 'grc',
		defaultDictionary: 'lsj',
		availableLanguages: ['grc', 'eng', 'lat'],
		coordinateScheme: 'division_both',
		citationStyle: 'chapter_section',
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
		license: {
			name: 'Public Domain / CC BY-SA 4.0',
			notice: 'Greek, Latin, and English texts from Kirsopp Lake (Loeb Classical Library, 1912–1913), in the public domain; linguistic annotations CC BY-SA 4.0.',
			editions: [
				{ label: 'Greek & English', source: 'Kirsopp Lake, The Apostolic Fathers (LCL, 1912–1913)', license: 'Public Domain' }
			]
		},
		textVersions: CANONICAL_CORPUS_VERSIONS['af'] || []
	},

	philo: {
		id: 'philo',
		enabled: true,
		name: 'Philo of Alexandria',
		title: 'Philo of Alexandria',
		subtitle: 'Hellenistic Jewish philosophical & allegorical treatises',
		badge: 'Philo',
		era: 'c. 20 BCE – 50 CE',
		author: 'Philo of Alexandria',
		primaryLanguage: 'grc',
		defaultDictionary: 'lsj',
		availableLanguages: ['grc', 'eng'],
		coordinateScheme: 'division_both',
		citationStyle: 'division_section',
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
		license: {
			name: 'CC BY-NC 4.0 / Public Domain',
			notice: 'Cohn–Wendland Greek (Public Domain) via Giuseppe Celano Lemmatized Ancient Greek XML (CC BY-NC 4.0); English translation by C. D. Yonge (1854–1855, Public Domain).',
			editions: [
				{ label: 'Greek Critical Text', source: 'Cohn & Wendland (1896–1915) via LemmatizedAncientGreekXML', license: 'CC BY-NC 4.0', url: 'https://github.com/gcelano/LemmatizedAncientGreekXML' },
				{ label: 'English Translation', source: 'C. D. Yonge (1854–1855)', license: 'Public Domain' }
			]
		},
		textVersions: CANONICAL_CORPUS_VERSIONS['philo'] || []
	},

	josephus: {
		id: 'josephus',
		enabled: true,
		name: 'Flavius Josephus',
		title: 'Flavius Josephus',
		subtitle: 'Jewish history, autobiography, and defense of antiquity',
		badge: 'Josephus',
		era: 'c. 37 – 100 CE',
		author: 'Flavius Josephus',
		primaryLanguage: 'grc',
		defaultDictionary: 'lsj',
		availableLanguages: ['grc', 'eng'],
		coordinateScheme: 'book_only',
		citationStyle: 'book_section',
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
		license: {
			name: 'Public Domain / CC BY-SA 4.0',
			notice: 'Benedikt Niese Greek (1885–1890, Public Domain) via Perseus / OpenGreekAndLatin; English translations by H. St. J. Thackeray & William Whiston (Public Domain).',
			editions: [
				{ label: 'Greek Critical Text', source: 'Benedikt Niese (1885–1890)', license: 'Public Domain' },
				{ label: 'English Translation', source: 'H. St. J. Thackeray / William Whiston', license: 'Public Domain' }
			]
		},
		textVersions: CANONICAL_CORPUS_VERSIONS['josephus'] || []
	},

	justin: {
		id: 'justin',
		enabled: true,
		name: 'Justin Martyr',
		title: 'Justin Martyr',
		subtitle: '2nd-century Christian apologist (Apologies & Dialogue with Trypho)',
		badge: 'Justin',
		era: 'c. 100 – 165 CE',
		author: 'Justin Martyr',
		primaryLanguage: 'grc',
		defaultDictionary: 'lsj',
		availableLanguages: ['grc', 'eng'],
		coordinateScheme: 'division_both',
		citationStyle: 'chapter_section',
		features: {
			hasScriptureCitations: false,
			hasTextualApparatus: false,
			hasAudio: false
		},
		citation: {
			author: 'Justin Martyr',
			seriesTitle: 'First & Second Apologies; Dialogue with Trypho (ANF Vol. 1)',
			defaultYear: '1885'
		},
		license: {
			name: 'CC BY-NC 4.0 / Public Domain',
			url: 'https://creativecommons.org/licenses/by-nc/4.0/',
			notice: 'Pre-lemmatized Greek text from Giuseppe Celano’s Lemmatized Ancient Greek XML (CC BY-NC 4.0, derived from First1KGreek tlg0645); English translation from Roberts & Donaldson, Ante-Nicene Fathers Vol. 1 (CCEL, Public Domain).',
			editions: [
				{
					label: 'Greek Text & Lemmatization',
					source: 'Giuseppe Celano, LemmatizedAncientGreekXML (tlg0645)',
					license: 'CC BY-NC 4.0',
					url: 'https://github.com/gcelano/LemmatizedAncientGreekXML'
				},
				{
					label: 'English Translation',
					source: 'Roberts & Donaldson, Ante-Nicene Fathers Vol. 1 (CCEL)',
					license: 'Public Domain',
					url: 'https://www.ccel.org/ccel/schaff/anf01'
				}
			]
		},
		textVersions: CANONICAL_CORPUS_VERSIONS['justin'] || []
	}
};

const installedConfigGlob =
	typeof import.meta.glob === 'function'
		? import.meta.glob('../../../static/db/*/config.json')
		: {};

const INSTALLED_CORPUS_IDS: Set<string> = new Set(
	Object.keys(installedConfigGlob)
		.map((path) => path.match(/\/static\/db\/([^/]+)\/config\.json$/)?.[1])
		.filter((id): id is string => Boolean(id))
);

/**
 * Returns true if the corpus database chunks (static/db/<id>/config.json) are installed on disk.
 */
export function isCorpusInstalled(id: string): boolean {
	if (INSTALLED_CORPUS_IDS.size === 0) {
		return id in CORPORA_CONFIG;
	}
	return INSTALLED_CORPUS_IDS.has(id);
}

/**
 * Returns true if the corpus is enabled in configuration.
 */
export function isCorpusEnabled(id: string): boolean {
	const cfg = CORPORA_CONFIG[id];
	return Boolean(cfg && cfg.enabled !== false);
}

/**
 * Return all registered corpora in CORPORA_CONFIG (regardless of install/enabled status).
 */
export function getRegisteredCorpora(): CorpusTypes.CorpusConfig[] {
	return Object.values(CORPORA_CONFIG);
}

/**
 * Return all corpora that are both enabled and installed on disk.
 */
export function getActiveCorpora(): CorpusTypes.CorpusConfig[] {
	return Object.values(CORPORA_CONFIG).filter(
		(cfg) => cfg.enabled !== false && isCorpusInstalled(cfg.id)
	);
}

/**
 * Retrieve the configuration for a given corpus ID, falling back to the first active corpus.
 */
export function getCorpusConfig(id?: string): CorpusTypes.CorpusConfig {
	if (id && id in CORPORA_CONFIG) {
		return CORPORA_CONFIG[id];
	}
	return getActiveCorpora()[0] || CORPORA_CONFIG.af;
}

/**
 * Return all active (enabled and installed) corpora in canonical display order.
 */
export function getAllCorpora(): CorpusTypes.CorpusConfig[] {
	return getActiveCorpora();
}

/**
 * Return all available text versions for a corpus.
 */
export function getCorpusTextVersions(id: string): CorpusTypes.TextVersionConfig[] {
	return getCorpusConfig(id).textVersions;
}
