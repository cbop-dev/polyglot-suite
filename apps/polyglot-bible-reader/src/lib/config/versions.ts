import { CANONICAL_BOOK_DEFINITIONS, normalizeBookName } from "./canonicalBooks.generated";
import {
  type CorpusMetadata,
  type CorpusId,
  CORPORA_METADATA,
  VERSION_TO_CORPUS_ID,
  CORPUS_ID_TO_VERSION,
  VERSION_GROUPS,
  ALL_BIBLE_VERSIONS,
  resolveCorpusId,
  resolveCorpus
} from "@polyglot/ancient-languages";

export {
  type CorpusMetadata,
  type CorpusId,
  CORPORA_METADATA,
  VERSION_TO_CORPUS_ID,
  CORPUS_ID_TO_VERSION,
  VERSION_GROUPS,
  ALL_BIBLE_VERSIONS,
  resolveCorpusId,
  resolveCorpus
};

export const biblesByLanguage = {
  english: ['KJV', 'Brenton'],
  greek: ['LXX', 'OpenGNT', 'SBLGNT']
};

export type TextDirection = 'ltr' | 'rtl';

export class Dataset {
  abbrev = '';
  language = '';
  description = '';
  lemmaInfoEnabled = false;
  testament = ''; // ot, nt, or both
  direction: TextDirection = 'ltr';

  constructor(abbrev: string, language: string, testament: string, description = '', lemmaInfoEnabled = false, direction: TextDirection = 'ltr') {
    this.abbrev = abbrev;
    this.language = language;
    this.testament = testament;
    this.description = description;
    this.lemmaInfoEnabled = lemmaInfoEnabled;
    this.direction = direction;
  }
}

/**
 * Static dictionary maintained for backwards compatibility, populated from CORPORA_METADATA.
 */
export const datasetsDict: Record<string, { language: string; testament: string; lemmas: boolean; direction: TextDirection }> = {
  'KJV': { language: 'English', testament: 'both', lemmas: false, direction: 'ltr' },
  'Vulgate': { language: 'Latin', testament: 'both', lemmas: false, direction: 'ltr' },
  'WEB': { language: 'English', testament: 'both', lemmas: false, direction: 'ltr' },
  'Brenton': { language: 'English', testament: 'ot', lemmas: false, direction: 'ltr' },
  'BHS': { language: 'Hebrew', testament: 'ot', lemmas: true, direction: 'rtl' },
  'LXX': { language: 'Greek', testament: 'ot', lemmas: true, direction: 'ltr' },
  'OpenGNT': { language: 'Greek', testament: 'nt', lemmas: true, direction: 'ltr' },
  'SBLGNT': { language: 'Greek', testament: 'nt', lemmas: true, direction: 'ltr' },
  'Peshitta': { language: 'Syriac', testament: 'both', lemmas: true, direction: 'rtl' }
};

// Also enrich with any new corpora defined dynamically
for (const meta of Object.values(CORPORA_METADATA)) {
  if (meta.category === 'bible' && !datasetsDict[meta.version]) {
    datasetsDict[meta.version] = {
      language: meta.languageName,
      testament: meta.testament,
      lemmas: meta.hasTokens,
      direction: meta.direction
    };
  }
}

/**
 * Case-insensitive aliases for URL parameters, legacy links, and alternate acronyms.
 */
export const VERSION_ALIASES: Record<string, string> = {
  sblgnt: 'SBLGNT',
  sbl: 'SBLGNT',
  ognt: 'OpenGNT',
  opengnt: 'OpenGNT',
  peshitta: 'Peshitta',
  syc: 'Peshitta'
};

export const dataSets: Dataset[] = Object.values(CORPORA_METADATA)
  .filter((m) => m.category === 'bible')
  .map((m) => new Dataset(m.version, m.languageName, m.testament, m.title, m.hasTokens, m.direction));

export const myDataSets = {
  dataSets: dataSets,
  lookup(abbrev: string): Dataset | undefined {
    if (!abbrev) return undefined;
    const meta = resolveCorpus(abbrev);
    if (!meta) return undefined;
    return dataSets.find((ds) => ds.abbrev.toLowerCase() === meta.version.toLowerCase())
      ?? new Dataset(meta.version, meta.languageName, meta.testament, meta.title, meta.hasTokens, meta.direction);
  },
  
  /**
   * @param {string} language The language to check for.
   * @returns {Dataset[]} an array of the versions which are in this language group 
   */
  getByLang(language: string): Dataset[] {
    return dataSets.filter((ds) => ds.language.toLowerCase() === language.toLowerCase());
  },

  getDirection(version: string): TextDirection {
    return resolveCorpus(version)?.direction ?? 'ltr';
  },

  isRtl(version: string): boolean {
    return this.getDirection(version) === 'rtl';
  }
};

export const availableBibles: string[] = Object.keys(datasetsDict);

export function getCorrectVersionName(fuzzyName: string): string | undefined {
  if (!fuzzyName) return undefined;
  const meta = resolveCorpus(fuzzyName);
  return meta?.version ?? undefined;
}

export function isValidVersion(versionName: string, caseSensitive = false): boolean {
  if (!versionName) return false;
  if (caseSensitive) {
    return ALL_BIBLE_VERSIONS.includes(versionName);
  }
  return !!resolveCorpus(versionName);
}

export interface VersionGroup {
  language: string;
  versions: string[];
}

export const versionGroups: VersionGroup[] = VERSION_GROUPS;

export function getVersionLanguage(version: string): string {
  if (!version) return '';
  return resolveCorpus(version)?.languageName ?? '';
}

export const allVersions: string[] = ALL_BIBLE_VERSIONS;

export function formatVersionLabel(opt: string, short=false): string {
  if (short){
    return opt
  }
  else{
    const ds = myDataSets.lookup(opt);

    return ds ? `${ds.language} (${ds?.abbrev})` : opt;
  }
  
}

import { VERSION_AVAILABLE_BOOKS, getCanonicalBookChapters } from './canonicalBooks.generated.js';

export const bhsBooks = VERSION_AVAILABLE_BOOKS['BHS'] || [];
export const lxxBooks = VERSION_AVAILABLE_BOOKS['LXX'] || [];
export const ntBooks = VERSION_AVAILABLE_BOOKS['OpenGNT'] || [];
export const sblgntBooks = VERSION_AVAILABLE_BOOKS['SBLGNT'] || [];
export const kjvBooks = VERSION_AVAILABLE_BOOKS['KJV'] || [];
export const vulgateBooks = VERSION_AVAILABLE_BOOKS['Vulgate'] || [];
export const webBooks = VERSION_AVAILABLE_BOOKS['WEB'] || [];
export const brentonBooks = VERSION_AVAILABLE_BOOKS['Brenton'] || [];

export function getVersionBooks(version: string): string[] {
  if (!version) return VERSION_AVAILABLE_BOOKS['OpenGNT'] || [];
  const clean = version.trim().toLowerCase();
  const resolved = VERSION_ALIASES[clean] || getCorrectVersionName(version) || version;
  return VERSION_AVAILABLE_BOOKS[resolved] || VERSION_AVAILABLE_BOOKS['OpenGNT'] || [];
}

export function isBookInVersion(book: string, version: string): boolean {
  const books = getVersionBooks(version);
  if (!books || books.length === 0) return false;
  const clean = book.trim().toLowerCase();
  return books.some((b) => b.toLowerCase() === clean);
}

export function getVersionBookChapters(version: string, book: string): number[] {
  const clean = (version || '').trim().toLowerCase();
  const resolved = VERSION_ALIASES[clean] || getCorrectVersionName(version) || version;
  return getCanonicalBookChapters(resolved, book);
}
