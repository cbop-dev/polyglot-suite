/**
 * Canonical Corpus Definitions and Mappings.
 * Auto-generated from SQLite `corpora` table via pipeline/generate_canonical_books.py.
 * DO NOT EDIT MANUALLY.
 */

export type TextDirection = 'ltr' | 'rtl';

export interface CorpusMetadata {
	id: CorpusId;
	version: string;
	shortTitle: string;
	title: string;
	language: string;
	languageName: string;
	direction: TextDirection;
	category: 'bible' | 'lexicon' | string;
	testament: 'ot' | 'nt' | 'both';
	defaultScheme: string;
	hasTokens: boolean;
	hasAudio: boolean;
	primaryDictionary: 'lsj' | 'bdb' | 'sedra' | string | null;
	aliases: string[];
	searchNames: string[];
	license: string | null;
	attribution: string | null;
}

export const CANONICAL_CORPORA = [
  "bdb",
  "brenton-lxx",
  "douay",
  "kjv",
  "lsj",
  "luther1912",
  "ognt",
  "peshitta",
  "sblgnt",
  "swete_lxx",
  "vamvas",
  "vulgate",
  "webbe",
  "wlc"
] as const;

export type CorpusId = (typeof CANONICAL_CORPORA)[number];

export const CORPORA_METADATA: Record<CorpusId, CorpusMetadata> = {
  "bdb": {
    "id": "bdb",
    "version": "BDB",
    "shortTitle": "BDB Hebrew Lexicon",
    "title": "Brown-Driver-Briggs Hebrew and English Lexicon",
    "language": "hbo",
    "languageName": "Hebrew",
    "direction": "ltr",
    "category": "lexicon",
    "testament": "ot",
    "defaultScheme": "MT",
    "hasTokens": false,
    "hasAudio": false,
    "primaryDictionary": "bdb",
    "aliases": [
      "bdb"
    ],
    "searchNames": [
      "Brown-Driver-Briggs Hebrew and English Lexicon",
      "BDB"
    ],
    "license": "Public Domain",
    "attribution": "Unabridged BDB (Eliran Wong / STEPBible)"
  },
  "brenton-lxx": {
    "id": "brenton-lxx",
    "version": "Brenton",
    "shortTitle": "Brenton LXX",
    "title": "The Septuagint with an English Translation (Sir L.C.L. Brenton, 1851)",
    "language": "eng",
    "languageName": "English",
    "direction": "ltr",
    "category": "bible",
    "testament": "ot",
    "defaultScheme": "LXX",
    "hasTokens": false,
    "hasAudio": false,
    "primaryDictionary": null,
    "aliases": [
      "brenton",
      "brenton-lxx"
    ],
    "searchNames": [
      "Brenton Septuagint Translation",
      "Brenton English Septuagint"
    ],
    "license": "Public Domain",
    "attribution": "Samuel Bagster & Sons / eBible.org"
  },
  "douay": {
    "id": "douay",
    "version": "Douay",
    "shortTitle": "Douay-Rheims",
    "title": "Douay-Rheims Bible (Challoner Revision with Apocrypha)",
    "language": "eng",
    "languageName": "English",
    "direction": "ltr",
    "category": "bible",
    "testament": "both",
    "defaultScheme": "Vulgate",
    "hasTokens": true,
    "hasAudio": false,
    "primaryDictionary": null,
    "aliases": [
      "douay",
      "dra",
      "douay-rheims"
    ],
    "searchNames": [
      "Douay-Rheims Bible",
      "Douay Rheims",
      "DRA",
      "Douay"
    ],
    "license": "Public Domain",
    "attribution": "eBible.org / John Murphy Co."
  },
  "kjv": {
    "id": "kjv",
    "version": "KJV",
    "shortTitle": "King James",
    "title": "King James Version (with Apocrypha)",
    "language": "eng",
    "languageName": "English",
    "direction": "ltr",
    "category": "bible",
    "testament": "both",
    "defaultScheme": "ENG",
    "hasTokens": false,
    "hasAudio": false,
    "primaryDictionary": null,
    "aliases": [
      "kjv",
      "av"
    ],
    "searchNames": [
      "King James Version",
      "Authorized Version",
      "AV"
    ],
    "license": "Public Domain",
    "attribution": "King James Bible 1611/1769 with Apocrypha"
  },
  "lsj": {
    "id": "lsj",
    "version": "LSJ",
    "shortTitle": "LSJ Greek Lexicon",
    "title": "Liddell-Scott-Jones Greek-English Lexicon (STEPBible Formatted)",
    "language": "grc",
    "languageName": "Greek",
    "direction": "ltr",
    "category": "lexicon",
    "testament": "both",
    "defaultScheme": "LXX",
    "hasTokens": false,
    "hasAudio": false,
    "primaryDictionary": "lsj",
    "aliases": [
      "lsj"
    ],
    "searchNames": [
      "Liddell-Scott-Jones Greek-English Lexicon",
      "LSJ"
    ],
    "license": "CC BY",
    "attribution": "STEPBible.org / LSJ Lexicon"
  },
  "luther1912": {
    "id": "luther1912",
    "version": "Luther1912",
    "shortTitle": "Luther 1912",
    "title": "Lutherbibel 1912 (mit den Apokryphen)",
    "language": "deu",
    "languageName": "German",
    "direction": "ltr",
    "category": "bible",
    "testament": "both",
    "defaultScheme": "German",
    "hasTokens": true,
    "hasAudio": false,
    "primaryDictionary": null,
    "aliases": [
      "luther1912",
      "luther",
      "ger1912",
      "deu1912"
    ],
    "searchNames": [
      "Lutherbibel 1912",
      "German Luther 1912",
      "Luther 1912 mit Apokryphen"
    ],
    "license": "Public Domain",
    "attribution": "eBible.org / Crosswire OSIS"
  },
  "ognt": {
    "id": "ognt",
    "version": "OpenGNT",
    "shortTitle": "Open GNT",
    "title": "Open Greek New Testament (NA28-aligned)",
    "language": "grc",
    "languageName": "Greek",
    "direction": "ltr",
    "category": "bible",
    "testament": "nt",
    "defaultScheme": "ENG",
    "hasTokens": true,
    "hasAudio": false,
    "primaryDictionary": "lsj",
    "aliases": [
      "ognt",
      "opengnt"
    ],
    "searchNames": [
      "Open Greek New Testament",
      "Greek New Testament"
    ],
    "license": "CC BY-SA 4.0",
    "attribution": "OpenGNT Project (Eliran Wong)"
  },
  "peshitta": {
    "id": "peshitta",
    "version": "Peshitta",
    "shortTitle": "Peshitta",
    "title": "The Syriac Peshitta (Leiden OT / SEDRA NT)",
    "language": "syc",
    "languageName": "Syriac",
    "direction": "rtl",
    "category": "bible",
    "testament": "both",
    "defaultScheme": "Peshitta",
    "hasTokens": true,
    "hasAudio": false,
    "primaryDictionary": "sedra",
    "aliases": [
      "peshitta",
      "syc"
    ],
    "searchNames": [
      "Syriac Peshitta",
      "Peshitta"
    ],
    "license": "MIT / CC BY-NC 4.0",
    "attribution": "Peshitta Institute Leiden / George A. Kiraz (SEDRA) / ETCBC"
  },
  "sblgnt": {
    "id": "sblgnt",
    "version": "SBLGNT",
    "shortTitle": "SBL Greek NT",
    "title": "The Greek New Testament: SBL Edition",
    "language": "grc",
    "languageName": "Greek",
    "direction": "ltr",
    "category": "bible",
    "testament": "nt",
    "defaultScheme": "ENG",
    "hasTokens": true,
    "hasAudio": false,
    "primaryDictionary": "lsj",
    "aliases": [
      "sbl",
      "sblgnt",
      "morphgnt"
    ],
    "searchNames": [
      "Society of Biblical Literature Greek New Testament",
      "SBL Greek New Testament",
      "MorphGNT",
      "Greek New Testament"
    ],
    "license": "CC BY 4.0",
    "attribution": "Holmes (2010) / MorphGNT (Tauber)"
  },
  "swete_lxx": {
    "id": "swete_lxx",
    "version": "LXX",
    "shortTitle": "Swete LXX",
    "title": "The Old Testament in Greek according to the Septuagint (H.B. Swete, 1930)",
    "language": "grc",
    "languageName": "Greek",
    "direction": "ltr",
    "category": "bible",
    "testament": "ot",
    "defaultScheme": "LXX",
    "hasTokens": true,
    "hasAudio": false,
    "primaryDictionary": "lsj",
    "aliases": [
      "lxx",
      "swete",
      "swete_lxx",
      "swete-lxx"
    ],
    "searchNames": [
      "Septuagint",
      "Greek Old Testament",
      "Swete Septuagint"
    ],
    "license": "Public Domain / CC BY-NC-SA 4.0",
    "attribution": "Swete Septuagint & Biblical Data Pipeline Lemmatization"
  },
  "vamvas": {
    "id": "vamvas",
    "version": "Vamvas",
    "shortTitle": "Vamvas Greek 1850",
    "title": "Modern Greek Bible (Neophytos Vamvas 1850)",
    "language": "ell",
    "languageName": "Modern Greek",
    "direction": "ltr",
    "category": "bible",
    "testament": "both",
    "defaultScheme": "ENG",
    "hasTokens": false,
    "hasAudio": false,
    "primaryDictionary": null,
    "aliases": [
      "vamvas",
      "grevamvas",
      "ell1850",
      "greek-modern"
    ],
    "searchNames": [
      "Modern Greek Bible",
      "Vamvas Bible",
      "Neophytos Vamvas",
      "\u039d\u03b5\u03cc\u03c6\u03c5\u03c4\u03bf\u03c2 \u0392\u03ac\u03bc\u03b2\u03b1\u03c2"
    ],
    "license": "Public Domain",
    "attribution": "scrollmapper/bible_databases"
  },
  "vulgate": {
    "id": "vulgate",
    "version": "Vulgate",
    "shortTitle": "Clementine Vulgate",
    "title": "Biblia Sacra Vulgata (Clementine Vulgate 1592/1598)",
    "language": "lat",
    "languageName": "Latin",
    "direction": "ltr",
    "category": "bible",
    "testament": "both",
    "defaultScheme": "Vulgate",
    "hasTokens": false,
    "hasAudio": false,
    "primaryDictionary": null,
    "aliases": [
      "vulgate",
      "vulgate-clementine"
    ],
    "searchNames": [
      "Latin Vulgate",
      "Clementine Vulgate",
      "Biblia Sacra Vulgata"
    ],
    "license": "Public Domain",
    "attribution": "Clementine Vulgate Project"
  },
  "webbe": {
    "id": "webbe",
    "version": "WEB",
    "shortTitle": "World English Bible",
    "title": "World English Bible (British Edition with Apocrypha)",
    "language": "eng",
    "languageName": "English",
    "direction": "ltr",
    "category": "bible",
    "testament": "both",
    "defaultScheme": "ENG",
    "hasTokens": false,
    "hasAudio": false,
    "primaryDictionary": null,
    "aliases": [
      "web",
      "webbe"
    ],
    "searchNames": [
      "World English Bible"
    ],
    "license": "Public Domain",
    "attribution": "eBible.org / Rainbow Missions"
  },
  "wlc": {
    "id": "wlc",
    "version": "BHS",
    "shortTitle": "Leningrad WLC",
    "title": "Westminster Leningrad Codex (Hebrew Old Testament)",
    "language": "hbo",
    "languageName": "Hebrew",
    "direction": "rtl",
    "category": "bible",
    "testament": "ot",
    "defaultScheme": "MT",
    "hasTokens": true,
    "hasAudio": false,
    "primaryDictionary": "bdb",
    "aliases": [
      "bhs",
      "wlc"
    ],
    "searchNames": [
      "Biblia Hebraica Stuttgartensia",
      "Hebrew Bible",
      "Tanakh",
      "Old Testament"
    ],
    "license": "Public Domain / CC BY 4.0",
    "attribution": "OpenScriptures MorphHB / J. Alan Groves Center"
  }
};

/**
 * Mapping of UI version names, abbreviations, and aliases to canonical database CorpusId.
 */
export const VERSION_TO_CORPUS_ID: Record<string, CorpusId> = {
  "BDB": "bdb",
  "bdb": "bdb",
  "Brenton": "brenton-lxx",
  "brenton": "brenton-lxx",
  "brenton-lxx": "brenton-lxx",
  "Douay": "douay",
  "douay": "douay",
  "dra": "douay",
  "douay-rheims": "douay",
  "KJV": "kjv",
  "kjv": "kjv",
  "av": "kjv",
  "LSJ": "lsj",
  "lsj": "lsj",
  "Luther1912": "luther1912",
  "luther1912": "luther1912",
  "luther": "luther1912",
  "ger1912": "luther1912",
  "deu1912": "luther1912",
  "OpenGNT": "ognt",
  "opengnt": "ognt",
  "ognt": "ognt",
  "Peshitta": "peshitta",
  "peshitta": "peshitta",
  "syc": "peshitta",
  "SBLGNT": "sblgnt",
  "sblgnt": "sblgnt",
  "sbl": "sblgnt",
  "morphgnt": "sblgnt",
  "LXX": "swete_lxx",
  "lxx": "swete_lxx",
  "swete_lxx": "swete_lxx",
  "swete": "swete_lxx",
  "swete-lxx": "swete_lxx",
  "Vamvas": "vamvas",
  "vamvas": "vamvas",
  "grevamvas": "vamvas",
  "ell1850": "vamvas",
  "greek-modern": "vamvas",
  "Vulgate": "vulgate",
  "vulgate": "vulgate",
  "vulgate-clementine": "vulgate",
  "WEB": "webbe",
  "web": "webbe",
  "webbe": "webbe",
  "BHS": "wlc",
  "bhs": "wlc",
  "wlc": "wlc",
  "WLC": "wlc",
  "OGNT": "ognt",
  "AV": "kjv",
  "DRA": "douay"
};

/**
 * Primary UI display label for each corpus.
 */
export const CORPUS_ID_TO_VERSION: Record<CorpusId, string> = {
  "bdb": "BDB",
  "brenton-lxx": "Brenton",
  "douay": "Douay",
  "kjv": "KJV",
  "lsj": "LSJ",
  "luther1912": "Luther1912",
  "ognt": "OpenGNT",
  "peshitta": "Peshitta",
  "sblgnt": "SBLGNT",
  "swete_lxx": "LXX",
  "vamvas": "Vamvas",
  "vulgate": "Vulgate",
  "webbe": "WEB",
  "wlc": "BHS"
};

/**
 * Legacy numeric workId mapping for backward compatibility.
 */
export const WORK_ID_TO_CORPUS_ID: Record<number, CorpusId> = {
  "1": "vulgate",
  "2": "wlc",
  "5": "kjv",
  "6": "webbe",
  "7": "brenton-lxx",
  "8": "peshitta",
  "9": "douay",
  "10": "luther1912",
  "11": "vamvas",
  "24": "swete_lxx",
  "40": "ognt",
  "41": "sblgnt",
  "100": "bdb",
  "101": "lsj"
};

export const CORPUS_ID_TO_WORK_ID: Record<CorpusId, number> = {
  "vulgate": 1,
  "wlc": 2,
  "kjv": 5,
  "webbe": 6,
  "brenton-lxx": 7,
  "peshitta": 8,
  "douay": 9,
  "luther1912": 10,
  "vamvas": 11,
  "swete_lxx": 24,
  "ognt": 40,
  "sblgnt": 41,
  "bdb": 100,
  "lsj": 101
};

/**
 * Dynamic version groups arranged by language for UI menus.
 */
export const VERSION_GROUPS: { language: string; versions: string[] }[] = [
  {
    "language": "Hebrew",
    "versions": [
      "BHS"
    ]
  },
  {
    "language": "Greek",
    "versions": [
      "LXX",
      "OpenGNT",
      "SBLGNT"
    ]
  },
  {
    "language": "Latin",
    "versions": [
      "Vulgate"
    ]
  },
  {
    "language": "Syriac",
    "versions": [
      "Peshitta"
    ]
  },
  {
    "language": "English",
    "versions": [
      "Brenton",
      "Douay",
      "KJV",
      "WEB"
    ]
  },
  {
    "language": "German",
    "versions": [
      "Luther1912"
    ]
  },
  {
    "language": "Modern Greek",
    "versions": [
      "Vamvas"
    ]
  }
];

/**
 * List of all active Bible versions.
 */
export const ALL_BIBLE_VERSIONS: string[] = VERSION_GROUPS.flatMap((g) => g.versions);

/**
 * Resolves any version abbreviation, alias, corpus ID, or legacy work_id into a canonical CorpusId.
 */
export function resolveCorpusId(input: string | number | null | undefined, fallback: CorpusId = 'wlc'): CorpusId {
	if (input === null || input === undefined) return fallback;
	if (typeof input === 'number') {
		return WORK_ID_TO_CORPUS_ID[input] || fallback;
	}
	const clean = String(input).trim();
	if (!clean) return fallback;
	if (VERSION_TO_CORPUS_ID[clean]) return VERSION_TO_CORPUS_ID[clean];
	const lower = clean.toLowerCase();
	if (VERSION_TO_CORPUS_ID[lower]) return VERSION_TO_CORPUS_ID[lower];
	const match = CANONICAL_CORPORA.find((c) => c.toLowerCase() === lower);
	if (match) return match;
	return fallback;
}

/**
 * Universal resolver returning full CorpusMetadata for any acronym, slug, alias, or legacy workId.
 */
export function resolveCorpus(input: string | number | null | undefined): CorpusMetadata | undefined {
	if (input === null || input === undefined) return undefined;
	if (typeof input === 'number') {
		const cid = WORK_ID_TO_CORPUS_ID[input];
		return cid ? CORPORA_METADATA[cid] : undefined;
	}
	const clean = String(input).trim();
	if (!clean) return undefined;
	const cid = VERSION_TO_CORPUS_ID[clean] || VERSION_TO_CORPUS_ID[clean.toLowerCase()];
	if (cid && CORPORA_METADATA[cid]) return CORPORA_METADATA[cid];
	const lower = clean.toLowerCase();
	const match = CANONICAL_CORPORA.find((c) => c.toLowerCase() === lower);
	if (match && CORPORA_METADATA[match]) return CORPORA_METADATA[match];
	return undefined;
}
