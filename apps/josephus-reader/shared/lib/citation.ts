import { getWork } from './works';

export type SchemeId = 'niese';

export interface ParsedLocation {
  column: string;
  line: number | null;
}

export interface CitationScheme {
  readonly id: SchemeId;
  readonly columnRegex: RegExp;
  readonly hasUserFacingLines: boolean;
  readonly jumpPlaceholder: string;
  readonly label: string;
  parseColumnToken(raw: string): string | null;
  parseLocation(raw: string): ParsedLocation | null;
  formatCitation(column: string, line?: number | null): string;
}

const NIESE_COLUMN_RE = /^§?\s*(\d+)$/;

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '');
}

function makeNieseScheme(): CitationScheme {
  function parseColumnToken(raw: string): string | null {
    const norm = normalize(raw);
    const m = NIESE_COLUMN_RE.exec(norm);
    return m ? m[1] : null;
  }

  function parseLocation(raw: string): ParsedLocation | null {
    const norm = normalize(raw);
    if (!norm) return null;
    const m = NIESE_COLUMN_RE.exec(norm);
    if (m) return { column: m[1], line: null };
    return null;
  }

  function formatCitation(column: string, _line?: number | null): string {
    return `§ ${column}`;
  }

  return {
    id: 'niese',
    columnRegex: NIESE_COLUMN_RE,
    hasUserFacingLines: false,
    jumpPlaceholder: 'e.g. § 15 or 15',
    label: 'Niese Section',
    parseColumnToken,
    parseLocation,
    formatCitation
  };
}

const NIESE_SCHEME = makeNieseScheme();

export function scheme(_id?: string | null): CitationScheme {
  return NIESE_SCHEME;
}

export function schemeFor(_work?: string): CitationScheme {
  return NIESE_SCHEME;
}

export function formatCite(work: string, column: string, line?: number | null): string {
  return schemeFor(work).formatCitation(column, line);
}

export function formatHash(work: string, column: string, line?: number | null): string {
  return `#${formatCite(work, column, line)}`;
}

export function formatLocValue(_work: string, column: string): string {
  return column;
}

export interface AcademicCitationStyle {
  id: string;
  name: string;
  description: string;
  citationText: string;
}

export function generateCitations(workId: string, bookNum: number, nieseSec: string, edition: 'grc' | 'eng' = 'grc'): AcademicCitationStyle[] {
  const w = getWork(workId);
  const abbrev = w?.abbrev || workId;
  const engTitle = w?.englishTitle || workId;
  const greekTitle = w?.title || workId;

  const bibKeySec = nieseSec.replace(/[^a-zA-Z0-9]/g, '_');
  const bibChapter = nieseSec.replace(/[–-]/g, '--');

  if (edition === 'grc') {
    return [
      {
        id: 'sbl-grc',
        name: 'SBL (Society of Biblical Literature)',
        description: 'Standard abbreviation for Greek text of Josephus',
        citationText: `Josephus, ${abbrev} ${bookNum}.${nieseSec}`
      },
      {
        id: 'chicago-grc',
        name: 'Chicago Manual of Style (Notes & Bib)',
        description: 'Full scholarly citation format for Niese Greek edition',
        citationText: `Flavius Josephus, ${greekTitle}, ed. Benedikt Niese (Berlin: Weidmann, 1887–1890), book ${bookNum}, section ${nieseSec}.`
      },
      {
        id: 'mla-grc',
        name: 'MLA Style',
        description: 'Modern Language Association citation format (Niese edition)',
        citationText: `Josephus, Flavius. ${greekTitle}. Edited by Benedikt Niese, Weidmann, 1887–1890, book ${bookNum}, section ${nieseSec}.`
      },
      {
        id: 'apa-grc',
        name: 'APA Style (7th ed.)',
        description: 'APA reference for critical Greek edition',
        citationText: `Josephus, F. (1887–1890). ${greekTitle} (B. Niese, Ed.; Book ${bookNum}, § ${nieseSec}). Weidmann.`
      },
      {
        id: 'bibtex-grc',
        name: 'BibTeX',
        description: 'LaTeX citation entry for Niese Greek critical edition',
        citationText: `@inbook{josephus_grc_${workId.toLowerCase()}_b${bookNum}_s${bibKeySec},\n  author    = {Josephus, Flavius},\n  title     = {${greekTitle}},\n  editor    = {Niese, Benedikt},\n  volume    = {${bookNum}},\n  chapter   = {${bibChapter}},\n  publisher = {Weidmann},\n  address   = {Berlin},\n  year      = {1887--1890}\n}`
      }
    ];
  } else {
    return [
      {
        id: 'sbl-eng',
        name: 'SBL (Society of Biblical Literature)',
        description: 'Standard abbreviation for Whiston English translation',
        citationText: `Josephus, ${abbrev} ${bookNum}.${nieseSec} (trans. Whiston)`
      },
      {
        id: 'chicago-eng',
        name: 'Chicago Manual of Style (Notes & Bib)',
        description: 'Full scholarly citation format for Whiston English translation',
        citationText: `Flavius Josephus, ${engTitle}, trans. William Whiston (Auburn and Rochester, NY: Alden and Beardsley, 1856), book ${bookNum}, section ${nieseSec}.`
      },
      {
        id: 'mla-eng',
        name: 'MLA Style',
        description: 'Modern Language Association citation format (Whiston translation)',
        citationText: `Josephus, Flavius. ${engTitle}. Translated by William Whiston, Alden and Beardsley, 1856, book ${bookNum}, section ${nieseSec}.`
      },
      {
        id: 'apa-eng',
        name: 'APA Style (7th ed.)',
        description: 'APA reference for Whiston English translation',
        citationText: `Josephus, F. (1856). ${engTitle} (W. Whiston, Trans.; Book ${bookNum}, § ${nieseSec}). Alden and Beardsley.`
      },
      {
        id: 'bibtex-eng',
        name: 'BibTeX',
        description: 'LaTeX citation entry for Whiston English translation',
        citationText: `@inbook{josephus_eng_${workId.toLowerCase()}_b${bookNum}_s${bibKeySec},\n  author     = {Josephus, Flavius},\n  title      = {${engTitle}},\n  translator = {Whiston, William},\n  volume     = {${bookNum}},\n  chapter    = {${bibChapter}},\n  publisher  = {Alden and Beardsley},\n  year       = {1856}\n}`
      }
    ];
  }
}

export function formatSourceReference(workId: string, bookNum: number, nieseSec: string, lang: 'grc' | 'eng'): string {
  const w = getWork(workId);
  const title = lang === 'grc' ? (w?.title || workId) : (w?.englishTitle || workId);
  const ed = lang === 'grc' ? 'ed. Niese' : 'trans. Whiston / ed. Niese';
  return `— Flavius Josephus, ${title}, Book ${bookNum} § ${nieseSec} (${ed})`;
}
