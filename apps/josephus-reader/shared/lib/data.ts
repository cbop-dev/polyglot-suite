export interface Section {
  niese: string;
  section_num?: number;
  grc: string;
  eng: string;
}

export interface BookData {
  work_id: string;
  book: number;
  title: string;
  sections: Section[];
}

export interface MorphEntry {
  lemma: string;
  lemma_norm?: string;
  pos?: string;
  parse: string;
  desc: string;
}

export interface LsjEntry {
  key: string;
  greek_key?: string;
  lemma?: string;
  pos?: string;
  gloss?: string;
  def: string;
}

export interface LemmaRef {
  lemma: string;
  count: number;
}

const _morphShardCache: Record<string, Promise<Record<string, MorphEntry>>> = {};
const _dictShardCache: Record<string, Promise<Record<string, LsjEntry>>> = {};
let _lemmataCache: Promise<Record<string, LemmaRef>> | null = null;

export function getBase(): string {
  if (typeof window !== 'undefined') {
    if ((window as any).__BASE_PATH__ !== undefined) {
      return (window as any).__BASE_PATH__.replace(/\/$/, '');
    }
    if (window.location && window.location.pathname.startsWith('/josephus-reader')) {
      return '/josephus-reader';
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) {
    return import.meta.env.BASE_URL.replace(/\/$/, '');
  }
  return '';
}

export function getGreekBucket(text: string): string {
  if (!text) return 'other';
  const norm = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (!norm) return 'other';
  const ch = norm[0].toLowerCase();
  const map: Record<string, string> = {
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
    'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
    'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
    'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi',
    'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau',
    'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi',
    'ω': 'omega'
  };
  return map[ch] || 'other';
}

export function fetchBook(work: string, book: number): Promise<BookData> {
  const url = `${getBase()}/data/${work}/book-${book}.json`;
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
    return r.json();
  });
}

export function fetchMorphForWord(word: string): Promise<Record<string, MorphEntry>> {
  const bucket = getGreekBucket(word);
  if (_morphShardCache[bucket]) return _morphShardCache[bucket];
  const url = `${getBase()}/data/morph/${bucket}.json`;
  _morphShardCache[bucket] = fetch(url)
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return _morphShardCache[bucket];
}

export function fetchDictionaryForWord(key: string): Promise<Record<string, LsjEntry>> {
  const bucket = getGreekBucket(key);
  if (_dictShardCache[bucket]) return _dictShardCache[bucket];
  const url = `${getBase()}/data/dictionary/${bucket}.json`;
  _dictShardCache[bucket] = fetch(url)
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return _dictShardCache[bucket];
}

export function fetchMorphMap(): Promise<Record<string, MorphEntry>> {
  const url = `${getBase()}/data/morph_map.json`;
  return fetch(url).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
}

export function fetchDictionary(): Promise<Record<string, LsjEntry>> {
  const url = `${getBase()}/data/dictionary.json`;
  return fetch(url).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
}

export interface LemmaOccurrence {
  work: string;
  book: number;
  sec: string;
  word: string;
}

export interface LemmaEntryData {
  lemma: string;
  count: number;
  occurrences: LemmaOccurrence[];
}

const _lemmaShardCache: Record<string, Promise<Record<string, LemmaEntryData>>> = {};

function normalizeKey(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ');
}

export function fetchLemmaData(lemmaNorm: string): Promise<LemmaEntryData | null> {
  const bucket = getGreekBucket(lemmaNorm);
  if (!_lemmaShardCache[bucket]) {
    const url = `${getBase()}/data/lemmata/${bucket}.json`;
    _lemmaShardCache[bucket] = fetch(url)
      .then(r => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return _lemmaShardCache[bucket].then(shardData => {
    if (!shardData) return null;
    const keyNorm = normalizeKey(lemmaNorm);
    const match = shardData[lemmaNorm] || shardData[keyNorm] || Object.values(shardData).find((e: any) => normalizeKey(e.lemma) === keyNorm);
    return match || null;
  });
}

export interface SearchSectionItem {
  w: string;
  b: number;
  s: string;
  g: string;
  n: string;
  e: string;
}

let _searchIndexCache: Promise<SearchSectionItem[]> | null = null;

export function fetchSearchIndex(): Promise<SearchSectionItem[]> {
  if (_searchIndexCache) return _searchIndexCache;
  const url = `${getBase()}/data/search_index.json`;
  _searchIndexCache = fetch(url)
    .then(r => (r.ok ? r.json() : []))
    .catch(() => []);
  return _searchIndexCache;
}

