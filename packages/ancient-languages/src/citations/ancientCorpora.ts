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
export const CORPUS_DEFAULT_DICTIONARIES: Record<AncientCorpusId, string> = {
	af: 'lsj',
	philo: 'lsj',
	josephus: 'lsj'
};

/**
 * Canonical primary language code by corpus ID.
 */
export const CORPUS_PRIMARY_LANGUAGES: Record<AncientCorpusId, string> = {
	af: 'grc',
	philo: 'grc',
	josephus: 'grc'
};

/**
 * Retrieve the canonical primary language code for a given corpus (e.g., 'grc', 'lat', 'heb').
 */
export function getCorpusPrimaryLanguage(corpusId: string): string {
	if (corpusId in CORPUS_PRIMARY_LANGUAGES) {
		return CORPUS_PRIMARY_LANGUAGES[corpusId as AncientCorpusId];
	}
	return 'grc';
}

/**
 * Retrieve the canonical default dictionary for a given corpus or language.
 */
export function getDefaultDictionary(langOrCorpus: string): string {
	if (langOrCorpus in CORPUS_DEFAULT_DICTIONARIES) {
		return CORPUS_DEFAULT_DICTIONARIES[langOrCorpus as AncientCorpusId];
	}
	return LANGUAGE_DEFAULT_DICTIONARIES[langOrCorpus] || 'lsj';
}

export interface AncientWorkMetadata {
	code: string;
	corpusId: AncientCorpusId;
	titleEnglish: string;
	titleGreek?: string;
	titleLatin?: string;
	abbrev: string;
	hasBooks?: boolean;
	hasChapters?: boolean;
	hasSections?: boolean;
}

export interface ParsedAncientCitation {
	corpusId?: AncientCorpusId;
	workCode: string;
	book?: number;
	chapter?: number;
	section?: number;
	rawCitation: string;
}

export const ANCIENT_CORPORA_WORKS: Record<AncientCorpusId, Record<string, AncientWorkMetadata>> = {
	af: {
		'1-clem': { code: '1-clem', corpusId: 'af', titleEnglish: '1 Clement', abbrev: '1 Clem.', hasChapters: true, hasSections: true },
		'2-clem': { code: '2-clem', corpusId: 'af', titleEnglish: '2 Clement', abbrev: '2 Clem.', hasChapters: true, hasSections: true },
		'ign-eph': { code: 'ign-eph', corpusId: 'af', titleEnglish: 'Ignatius to the Ephesians', abbrev: 'Ign. Eph.', hasChapters: true, hasSections: true },
		'ign-magn': { code: 'ign-magn', corpusId: 'af', titleEnglish: 'Ignatius to the Magnesians', abbrev: 'Ign. Magn.', hasChapters: true, hasSections: true },
		'ign-trall': { code: 'ign-trall', corpusId: 'af', titleEnglish: 'Ignatius to the Trallians', abbrev: 'Ign. Trall.', hasChapters: true, hasSections: true },
		'ign-rom': { code: 'ign-rom', corpusId: 'af', titleEnglish: 'Ignatius to the Romans', abbrev: 'Ign. Rom.', hasChapters: true, hasSections: true },
		'ign-phld': { code: 'ign-phld', corpusId: 'af', titleEnglish: 'Ignatius to the Philadelphians', abbrev: 'Ign. Phld.', hasChapters: true, hasSections: true },
		'ign-smyrn': { code: 'ign-smyrn', corpusId: 'af', titleEnglish: 'Ignatius to the Smyrnaeans', abbrev: 'Ign. Smyrn.', hasChapters: true, hasSections: true },
		'ign-pol': { code: 'ign-pol', corpusId: 'af', titleEnglish: 'Ignatius to Polycarp', abbrev: 'Ign. Pol.', hasChapters: true, hasSections: true },
		'pol-phil': { code: 'pol-phil', corpusId: 'af', titleEnglish: 'Polycarp to the Philippians', abbrev: 'Pol. Phil.', hasChapters: true, hasSections: true },
		'mart-pol': { code: 'mart-pol', corpusId: 'af', titleEnglish: 'Martyrdom of Polycarp', abbrev: 'Mart. Pol.', hasChapters: true, hasSections: true },
		'did': { code: 'did', corpusId: 'af', titleEnglish: 'Didache', abbrev: 'Did.', hasChapters: true, hasSections: true },
		'barn': { code: 'barn', corpusId: 'af', titleEnglish: 'Barnabas', abbrev: 'Barn.', hasChapters: true, hasSections: true },
		'herm-vis': { code: 'herm-vis', corpusId: 'af', titleEnglish: 'Shepherd of Hermas, Visions', abbrev: 'Herm. Vis.', hasChapters: true, hasSections: true },
		'herm-com': { code: 'herm-com', corpusId: 'af', titleEnglish: 'Shepherd of Hermas, Mandates', abbrev: 'Herm. Mand.', hasChapters: true, hasSections: true },
		'herm-sim': { code: 'herm-sim', corpusId: 'af', titleEnglish: 'Shepherd of Hermas, Similitudes', abbrev: 'Herm. Sim.', hasChapters: true, hasSections: true },
		'diogn': { code: 'diogn', corpusId: 'af', titleEnglish: 'Epistle to Diognetus', abbrev: 'Diogn.', hasChapters: true, hasSections: true },
		'papias': { code: 'papias', corpusId: 'af', titleEnglish: 'Fragments of Papias', abbrev: 'Papias', hasChapters: true, hasSections: true }
	},
	philo: {
		'opif': { code: 'opif', corpusId: 'philo', titleEnglish: 'De Opificio Mundi', abbrev: 'Opif.', hasSections: true },
		'leg': { code: 'leg', corpusId: 'philo', titleEnglish: 'Legum Allegoriae', abbrev: 'Leg.', hasBooks: true, hasSections: true },
		'cher': { code: 'cher', corpusId: 'philo', titleEnglish: 'De Cherubim', abbrev: 'Cher.', hasSections: true },
		'sacr': { code: 'sacr', corpusId: 'philo', titleEnglish: 'De Sacrificiis Abelis et Caini', abbrev: 'Sacr.', hasSections: true },
		'det': { code: 'det', corpusId: 'philo', titleEnglish: 'Quod Deterius Potiori Insidiari Soleat', abbrev: 'Det.', hasSections: true },
		'post': { code: 'post', corpusId: 'philo', titleEnglish: 'De Posteritate Caini', abbrev: 'Post.', hasSections: true },
		'gig': { code: 'gig', corpusId: 'philo', titleEnglish: 'De Gigantibus', abbrev: 'Gig.', hasSections: true },
		'deus': { code: 'deus', corpusId: 'philo', titleEnglish: 'Quod Deus Sit Immutabilis', abbrev: 'Deus', hasSections: true },
		'agr': { code: 'agr', corpusId: 'philo', titleEnglish: 'De Agricultura', abbrev: 'Agr.', hasSections: true },
		'plant': { code: 'plant', corpusId: 'philo', titleEnglish: 'De Plantatione', abbrev: 'Plant.', hasSections: true },
		'ebr': { code: 'ebr', corpusId: 'philo', titleEnglish: 'De Ebrietate', abbrev: 'Ebr.', hasSections: true },
		'sobr': { code: 'sobr', corpusId: 'philo', titleEnglish: 'De Sobrietate', abbrev: 'Sobr.', hasSections: true },
		'conf': { code: 'conf', corpusId: 'philo', titleEnglish: 'De Confusione Linguarum', abbrev: 'Conf.', hasSections: true },
		'migr': { code: 'migr', corpusId: 'philo', titleEnglish: 'De Migratione Abrahami', abbrev: 'Migr.', hasSections: true },
		'her': { code: 'her', corpusId: 'philo', titleEnglish: 'Quis Rerum Divinarum Heres Sit', abbrev: 'Her.', hasSections: true },
		'congr': { code: 'congr', corpusId: 'philo', titleEnglish: 'De Congressu Eruditionis Gratia', abbrev: 'Congr.', hasSections: true },
		'fuga': { code: 'fuga', corpusId: 'philo', titleEnglish: 'De Fuga et Inventione', abbrev: 'Fug.', hasSections: true },
		'mut': { code: 'mut', corpusId: 'philo', titleEnglish: 'De Mutatione Nominum', abbrev: 'Mut.', hasSections: true },
		'somn': { code: 'somn', corpusId: 'philo', titleEnglish: 'De Somniis', abbrev: 'Somn.', hasBooks: true, hasSections: true },
		'abr': { code: 'abr', corpusId: 'philo', titleEnglish: 'De Abrahamo', abbrev: 'Abr.', hasSections: true },
		'ios': { code: 'ios', corpusId: 'philo', titleEnglish: 'De Iosepho', abbrev: 'Ios.', hasSections: true },
		'mos': { code: 'mos', corpusId: 'philo', titleEnglish: 'De Vita Mosis', abbrev: 'Mos.', hasBooks: true, hasSections: true },
		'dec': { code: 'dec', corpusId: 'philo', titleEnglish: 'De Decalogo', abbrev: 'Decal.', hasSections: true },
		'spec': { code: 'spec', corpusId: 'philo', titleEnglish: 'De Specialibus Legibus', abbrev: 'Spec.', hasBooks: true, hasSections: true },
		'virt': { code: 'virt', corpusId: 'philo', titleEnglish: 'De Virtutibus', abbrev: 'Virt.', hasSections: true },
		'praem': { code: 'praem', corpusId: 'philo', titleEnglish: 'De Praemiis et Poenis', abbrev: 'Praem.', hasSections: true },
		'prob': { code: 'prob', corpusId: 'philo', titleEnglish: 'Quod Omnis Probus Liber Sit', abbrev: 'Prob.', hasSections: true },
		'contemp': { code: 'contemp', corpusId: 'philo', titleEnglish: 'De Vita Contemplativa', abbrev: 'Contempl.', hasSections: true },
		'aet': { code: 'aet', corpusId: 'philo', titleEnglish: 'De Aeternitate Mundi', abbrev: 'Aet.', hasSections: true },
		'flacc': { code: 'flacc', corpusId: 'philo', titleEnglish: 'In Flaccum', abbrev: 'Flacc.', hasSections: true },
		'legat': { code: 'legat', corpusId: 'philo', titleEnglish: 'Legatio ad Gaium', abbrev: 'Legat.', hasSections: true },
		'hyp': { code: 'hyp', corpusId: 'philo', titleEnglish: 'Hypothetica', abbrev: 'Hypoth.', hasSections: true },
		'prov': { code: 'prov', corpusId: 'philo', titleEnglish: 'De Providentia', abbrev: 'Prov.', hasBooks: true, hasSections: true },
		'anim': { code: 'anim', corpusId: 'philo', titleEnglish: 'De Animalibus', abbrev: 'Anim.', hasSections: true }
	},
	josephus: {
		'ant': { code: 'ant', corpusId: 'josephus', titleEnglish: 'Antiquities of the Jews', abbrev: 'Ant.', hasBooks: true, hasSections: true },
		'war': { code: 'war', corpusId: 'josephus', titleEnglish: 'The Jewish War', abbrev: 'War', hasBooks: true, hasSections: true },
		'life': { code: 'life', corpusId: 'josephus', titleEnglish: 'The Life of Flavius Josephus', abbrev: 'Life', hasSections: true },
		'apion': { code: 'apion', corpusId: 'josephus', titleEnglish: 'Against Apion', abbrev: 'Apion', hasBooks: true, hasSections: true }
	}
};

/**
 * Format an ancient corpus citation based on its conventions:
 * - AF: `1 Clem. 1:2` (chapter:section) or `Barn. 4:1`
 * - Philo: `Opif. 15` (section) or `Leg. 1.25` (book.section)
 * - Josephus: `Ant. 1.15` (book.section) or `Life 10`
 */
export function formatAncientCorpusCitation(params: {
	corpusId: AncientCorpusId;
	workCode: string;
	book?: number | string;
	chapter?: number | string;
	section?: number | string;
	customAbbrev?: string;
}): string {
	const { corpusId, workCode, book, chapter, section, customAbbrev } = params;
	const workMeta = ANCIENT_CORPORA_WORKS[corpusId]?.[workCode];
	const abbrev = customAbbrev || workMeta?.abbrev || workCode;

	if (corpusId === 'af') {
		if (chapter && section) return `${abbrev} ${chapter}:${section}`;
		if (chapter) return `${abbrev} ${chapter}`;
		if (section) return `${abbrev} ${section}`;
		return abbrev;
	}

	if (corpusId === 'philo') {
		if (book && section) return `${abbrev} ${book}.${section}`;
		if (section) return `${abbrev} ${section}`;
		if (chapter) return `${abbrev} ${chapter}`;
		return abbrev;
	}

	if (corpusId === 'josephus') {
		if (book && section) return `${abbrev} ${book}.${section}`;
		if (section) return `${abbrev} ${section}`;
		if (book) return `${abbrev} ${book}`;
		return abbrev;
	}

	return `${abbrev} ${[book, chapter, section].filter(Boolean).join('.')}`;
}
