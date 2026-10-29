/**
 * Canonical Corpus Definitions and Mappings.
 * Auto-generated from SQLite `corpora` table via pipeline/generate_canonical_books.py.
 * DO NOT EDIT MANUALLY.
 */

export type TextDirection = 'ltr' | 'rtl';

export interface CorpusMetadata {
	id: string;
	title: string;
	language: string;
	direction: TextDirection;
	category: 'bible' | 'lexicon' | string;
	default_scheme: string;
	has_tokens: boolean;
	has_audio: boolean;
	license: string | null;
	attribution: string | null;
}

export const CANONICAL_CORPORA = [
  "bdb",
  "brenton-lxx",
  "kjv",
  "lsj",
  "ognt",
  "peshitta",
  "sblgnt",
  "swete_lxx",
  "vulgate",
  "webbe",
  "wlc"
] as const;

export type CorpusId = (typeof CANONICAL_CORPORA)[number];

export const CORPORA_METADATA: Record<CorpusId, CorpusMetadata> = {
  "bdb": {
    "id": "bdb",
    "title": "Brown-Driver-Briggs Hebrew and English Lexicon",
    "language": "hbo",
    "direction": "ltr",
    "category": "lexicon",
    "default_scheme": "MT",
    "has_tokens": false,
    "has_audio": false,
    "license": "Public Domain",
    "attribution": "Unabridged BDB (Eliran Wong / STEPBible)"
  },
  "brenton-lxx": {
    "id": "brenton-lxx",
    "title": "The Septuagint with an English Translation (Sir L.C.L. Brenton, 1851)",
    "language": "eng",
    "direction": "ltr",
    "category": "bible",
    "default_scheme": "LXX",
    "has_tokens": false,
    "has_audio": false,
    "license": "Public Domain",
    "attribution": "Samuel Bagster & Sons / eBible.org"
  },
  "kjv": {
    "id": "kjv",
    "title": "King James Version (with Apocrypha)",
    "language": "eng",
    "direction": "ltr",
    "category": "bible",
    "default_scheme": "ENG",
    "has_tokens": true,
    "has_audio": false,
    "license": "Public Domain",
    "attribution": "King James Bible 1611/1769 with Apocrypha"
  },
  "lsj": {
    "id": "lsj",
    "title": "Liddell-Scott-Jones Greek-English Lexicon (STEPBible Formatted)",
    "language": "grc",
    "direction": "ltr",
    "category": "lexicon",
    "default_scheme": "LXX",
    "has_tokens": false,
    "has_audio": false,
    "license": "CC BY",
    "attribution": "STEPBible.org / LSJ Lexicon"
  },
  "ognt": {
    "id": "ognt",
    "title": "Open Greek New Testament (NA28-aligned)",
    "language": "grc",
    "direction": "ltr",
    "category": "bible",
    "default_scheme": "ENG",
    "has_tokens": true,
    "has_audio": false,
    "license": "CC BY-SA 4.0",
    "attribution": "OpenGNT Project (Eliran Wong)"
  },
  "peshitta": {
    "id": "peshitta",
    "title": "The Syriac Peshitta (Leiden OT / SEDRA NT)",
    "language": "syc",
    "direction": "rtl",
    "category": "bible",
    "default_scheme": "Peshitta",
    "has_tokens": true,
    "has_audio": false,
    "license": "MIT / CC BY-NC 4.0",
    "attribution": "Peshitta Institute Leiden / George A. Kiraz (SEDRA) / ETCBC"
  },
  "sblgnt": {
    "id": "sblgnt",
    "title": "The Greek New Testament: SBL Edition",
    "language": "grc",
    "direction": "ltr",
    "category": "bible",
    "default_scheme": "ENG",
    "has_tokens": true,
    "has_audio": false,
    "license": "CC BY 4.0",
    "attribution": "Holmes (2010) / MorphGNT (Tauber)"
  },
  "swete_lxx": {
    "id": "swete_lxx",
    "title": "The Old Testament in Greek according to the Septuagint (H.B. Swete, 1930)",
    "language": "grc",
    "direction": "ltr",
    "category": "bible",
    "default_scheme": "LXX",
    "has_tokens": true,
    "has_audio": false,
    "license": "Public Domain / CC BY-NC-SA 4.0",
    "attribution": "Swete Septuagint & Biblical Data Pipeline Lemmatization"
  },
  "vulgate": {
    "id": "vulgate",
    "title": "Biblia Sacra Vulgata (Clementine Vulgate 1592/1598)",
    "language": "lat",
    "direction": "ltr",
    "category": "bible",
    "default_scheme": "Vulgate",
    "has_tokens": false,
    "has_audio": false,
    "license": "Public Domain",
    "attribution": "Clementine Vulgate Project"
  },
  "webbe": {
    "id": "webbe",
    "title": "World English Bible (British Edition with Apocrypha)",
    "language": "eng",
    "direction": "ltr",
    "category": "bible",
    "default_scheme": "ENG",
    "has_tokens": false,
    "has_audio": false,
    "license": "Public Domain",
    "attribution": "eBible.org / Rainbow Missions"
  },
  "wlc": {
    "id": "wlc",
    "title": "Westminster Leningrad Codex (Hebrew Old Testament)",
    "language": "hbo",
    "direction": "rtl",
    "category": "bible",
    "default_scheme": "MT",
    "has_tokens": true,
    "has_audio": false,
    "license": "Public Domain / CC BY 4.0",
    "attribution": "OpenScriptures MorphHB / J. Alan Groves Center"
  }
};

/**
 * Mapping of UI version names, abbreviations, and aliases to canonical database CorpusId.
 */
export const VERSION_TO_CORPUS_ID: Record<string, CorpusId> = {
  "bhs": "wlc",
  "BHS": "wlc",
  "wlc": "wlc",
  "WLC": "wlc",
  "lxx": "swete_lxx",
  "LXX": "swete_lxx",
  "swete_lxx": "swete_lxx",
  "swete-lxx": "swete_lxx",
  "ognt": "ognt",
  "OGNT": "ognt",
  "opengnt": "ognt",
  "OpenGNT": "ognt",
  "sblgnt": "sblgnt",
  "SBLGNT": "sblgnt",
  "sbl": "sblgnt",
  "peshitta": "peshitta",
  "Peshitta": "peshitta",
  "syc": "peshitta",
  "kjv": "kjv",
  "KJV": "kjv",
  "vulgate": "vulgate",
  "Vulgate": "vulgate",
  "vulgate-clementine": "vulgate",
  "webbe": "webbe",
  "web": "webbe",
  "WEB": "webbe",
  "brenton-lxx": "brenton-lxx",
  "brenton": "brenton-lxx",
  "Brenton": "brenton-lxx",
  "bdb": "bdb",
  "BDB": "bdb",
  "lsj": "lsj",
  "LSJ": "lsj"
};

/**
 * Primary UI display label for each corpus.
 */
export const CORPUS_ID_TO_VERSION: Record<CorpusId, string> = {
  "wlc": "BHS",
  "swete_lxx": "LXX",
  "ognt": "OpenGNT",
  "sblgnt": "SBLGNT",
  "peshitta": "Peshitta",
  "kjv": "KJV",
  "vulgate": "Vulgate",
  "webbe": "WEB",
  "brenton-lxx": "Brenton",
  "bdb": "BDB",
  "lsj": "LSJ"
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
  "24": "swete_lxx",
  "40": "ognt",
  "41": "sblgnt"
};

export const CORPUS_ID_TO_WORK_ID: Record<CorpusId, number> = {
  "vulgate": 1,
  "wlc": 2,
  "kjv": 5,
  "webbe": 6,
  "brenton-lxx": 7,
  "peshitta": 8,
  "swete_lxx": 24,
  "ognt": 40,
  "sblgnt": 41,
  "bdb": 2,
  "lsj": 24
};

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
