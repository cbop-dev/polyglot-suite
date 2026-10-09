import { getBase, getGreekBucket } from './data';

export interface ActiveLemmaHighlight {
  lemma: string;        // Normalized lemma key (e.g. "επιτρεπω")
  displayLemma: string; // Display lemma string (e.g. "ἐπιτρέπω")
  hue: number;          // HSL hue angle (0-360)
}

export interface ActiveFormHighlight {
  word: string;         // Normalized word form (e.g. "επετρεπον")
  displayWord: string;  // Display word string (e.g. "ἐπέτρεπον")
  lemma?: string;       // Associated normalized lemma key if known
  hue: number;          // HSL hue angle matching associated lemma or standalone
}

export interface ActivePhraseHighlight {
  phrase: string;        // Normalized phrase key (e.g. "ιουδαιων αρχοντες")
  displayPhrase: string; // Original display phrase (e.g. "Ἰουδαίων ἄρχοντες")
  hue: number;          // HSL hue angle
}

export interface HighlightStore {
  lemmas: ActiveLemmaHighlight[];
  forms: ActiveFormHighlight[];
  phrases: ActivePhraseHighlight[];
}

const STORAGE_KEY = 'josephus_reader_highlights';

// 12 Curated distinct HSL Hues for high contrast & harmony
const BASE_HUES = [160, 40, 200, 340, 270, 20, 180, 80, 220, 310, 120, 290];

// Dynamic Lemma Inflection Cache (Idea A)
const _bucketCache: Record<string, Promise<any>> = {};
const _lemmaFormSets: Record<string, Set<string>> = {};

export function normalizeKey(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ').replace(/[.,·;:!?"'»«()\[\]]/g, '').trim();
}

export function getHighlights(): HighlightStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { lemmas: [], forms: [], phrases: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lemmas: [], forms: [], phrases: [] };
    const parsed = JSON.parse(raw);
    return {
      lemmas: Array.isArray(parsed.lemmas) ? parsed.lemmas : [],
      forms: Array.isArray(parsed.forms) ? parsed.forms : [],
      phrases: Array.isArray(parsed.phrases) ? parsed.phrases : []
    };
  } catch (err) {
    console.error('Error reading highlights from localStorage:', err);
    return { lemmas: [], forms: [], phrases: [] };
  }
}

function saveHighlights(store: HighlightStore) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('reader-highlights-changed', { detail: store }));
  } catch (err) {
    console.error('Error saving highlights to localStorage:', err);
  }
}

function getNextHue(store: HighlightStore): number {
  const usedHues = new Set<number>();
  store.lemmas.forEach(l => usedHues.add(l.hue));
  store.forms.forEach(f => usedHues.add(f.hue));
  store.phrases.forEach(p => usedHues.add(p.hue));

  // Find first unused hue from BASE_HUES
  for (const h of BASE_HUES) {
    if (!usedHues.has(h)) return h;
  }

  // Dynamic expansion using golden ratio algorithm if > 12 hues used
  const totalCount = store.lemmas.length + store.forms.length + store.phrases.length;
  return Math.round((totalCount * 137.5) % 360);
}

export function isLemmaHighlighted(lemmaKey: string): boolean {
  const store = getHighlights();
  const norm = normalizeKey(lemmaKey);
  return store.lemmas.some(l => l.lemma === norm);
}

export function isFormHighlighted(word: string): boolean {
  const store = getHighlights();
  const norm = normalizeKey(word);
  return store.forms.some(f => f.word === norm);
}

export function getLoadedLemmaFormSet(lemmaKey: string): Set<string> | undefined {
  return _lemmaFormSets[normalizeKey(lemmaKey)];
}

export async function ensureLemmaFormSet(displayLemma: string, lemmaKey?: string): Promise<Set<string>> {
  const norm = normalizeKey(lemmaKey || displayLemma);
  if (_lemmaFormSets[norm]) return _lemmaFormSets[norm];

  const bucket = getGreekBucket(displayLemma || lemmaKey || '');
  if (!_bucketCache[bucket]) {
    const url = `${getBase()}/data/lemmata/${bucket}.json`;
    _bucketCache[bucket] = fetch(url)
      .then(r => (r.ok ? r.json() : {}))
      .catch(err => {
        console.error(`Error loading lemmata bucket ${bucket}:`, err);
        return {};
      });
  }

  const data = await _bucketCache[bucket];
  const formSet = new Set<string>();
  formSet.add(norm);

  const entry = data[norm] || data[displayLemma] || Object.values(data).find((e: any) => e.lemma === displayLemma || normalizeKey(e.lemma) === norm);
  if (entry && Array.isArray(entry.occurrences)) {
    entry.occurrences.forEach((occ: any) => {
      if (occ && occ.word) {
        const wNorm = normalizeKey(occ.word);
        if (wNorm) formSet.add(wNorm);
      }
    });
  }

  _lemmaFormSets[norm] = formSet;

  // Dispatch event so active components update rendering with the newly loaded form set
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reader-highlights-changed', { detail: getHighlights() }));
  }

  return formSet;
}

export function preloadActiveLemmaFormSets() {
  const store = getHighlights();
  store.lemmas.forEach(l => {
    ensureLemmaFormSet(l.displayLemma, l.lemma);
  });
}

export function toggleLemmaHighlight(displayLemma: string, lemmaKey?: string): boolean {
  const store = getHighlights();
  const norm = normalizeKey(lemmaKey || displayLemma);
  const existingIdx = store.lemmas.findIndex(l => l.lemma === norm);

  if (existingIdx !== -1) {
    // Remove highlight
    store.lemmas.splice(existingIdx, 1);
    delete _lemmaFormSets[norm];
    saveHighlights(store);
    return false;
  } else {
    // Add highlight
    const hue = getNextHue(store);
    store.lemmas.push({
      lemma: norm,
      displayLemma: displayLemma.trim(),
      hue
    });
    // Update any existing form highlights that share this lemma to match its hue
    store.forms.forEach(f => {
      if (f.lemma === norm) f.hue = hue;
    });
    saveHighlights(store);
    ensureLemmaFormSet(displayLemma, norm);
    return true;
  }
}

export function toggleFormHighlight(displayWord: string, lemmaKey?: string): boolean {
  const store = getHighlights();
  const norm = normalizeKey(displayWord);
  const normLemma = lemmaKey ? normalizeKey(lemmaKey) : undefined;
  const existingIdx = store.forms.findIndex(f => f.word === norm);

  if (existingIdx !== -1) {
    // Remove highlight
    store.forms.splice(existingIdx, 1);
    saveHighlights(store);
    return false;
  } else {
    // Determine hue: match associated lemma's hue if highlighted, or assign new hue
    let hue: number;
    if (normLemma) {
      const matchLemma = store.lemmas.find(l => l.lemma === normLemma);
      hue = matchLemma ? matchLemma.hue : getNextHue(store);
    } else {
      hue = getNextHue(store);
    }

    store.forms.push({
      word: norm,
      displayWord: displayWord.trim(),
      lemma: normLemma,
      hue
    });
    saveHighlights(store);
    return true;
  }
}

export function removeLemmaHighlight(lemmaKey: string) {
  const store = getHighlights();
  const norm = normalizeKey(lemmaKey);
  delete _lemmaFormSets[norm];
  store.lemmas = store.lemmas.filter(l => l.lemma !== norm);
  saveHighlights(store);
}

export function removeFormHighlight(word: string) {
  const store = getHighlights();
  const norm = normalizeKey(word);
  store.forms = store.forms.filter(f => f.word !== norm);
  saveHighlights(store);
}

export function isPhraseHighlighted(displayPhrase: string): boolean {
  const store = getHighlights();
  const norm = normalizeKey(displayPhrase);
  return store.phrases.some(p => p.phrase === norm);
}

export function togglePhraseHighlight(displayPhrase: string): boolean {
  const store = getHighlights();
  const norm = normalizeKey(displayPhrase);
  if (!norm) return false;

  const existingIdx = store.phrases.findIndex(p => p.phrase === norm);
  if (existingIdx !== -1) {
    store.phrases.splice(existingIdx, 1);
    saveHighlights(store);
    return false;
  } else {
    const hue = getNextHue(store);
    store.phrases.push({
      phrase: norm,
      displayPhrase: displayPhrase.trim(),
      hue
    });
    saveHighlights(store);
    return true;
  }
}

export function removePhraseHighlight(displayPhrase: string) {
  const store = getHighlights();
  const norm = normalizeKey(displayPhrase);
  store.phrases = store.phrases.filter(p => p.phrase !== norm);
  saveHighlights(store);
}

export function clearAllHighlights() {
  for (const k in _lemmaFormSets) delete _lemmaFormSets[k];
  saveHighlights({ lemmas: [], forms: [], phrases: [] });
}

export interface WordHighlightResult {
  isForm: boolean;
  isLemma: boolean;
  isPhrase?: boolean;
  hue?: number;
  style?: string;
}

/**
 * Normalizes Greek lemma accents so no lemma ends with or contains grave accents (\u0300 -> \u0301).
 * e.g., παρὰ -> παρά, καὶ -> καί, διὰ -> διά
 */
export function normalizeLemmaAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/\u0300/g, '\u0301').normalize('NFC');
}

/**
 * Canonicalizes a Greek word form for display and grouping in Attested Forms grids.
 * - Lowercases capital letters with accents/breathings (e.g., Ἔμελλε -> ἔμελλε)
 * - Normalizes grave accents to acute accents (\u0300 -> \u0301)
 * - Groups movable nu (ἐφελκυστικὸν ν) into a single canonical representation, e.g. ἔμελλε(ν)
 */
export function getCanonicalForm(rawWord: string): string {
  if (!rawWord) return '';

  let w = rawWord.replace(/[.,·;:!?"'»«()\[\]]/g, '').trim();
  if (!w) return '';

  w = w.toLowerCase();
  w = w.normalize('NFD').replace(/\u0300/g, '\u0301');

  // Strip secondary enclitic accent on final syllable if an earlier accent exists
  const accentMatches = w.match(/\u0301/g) || [];
  if (accentMatches.length > 1) {
    const lastIdx = w.lastIndexOf('\u0301');
    if (lastIdx !== -1) {
      w = w.slice(0, lastIdx) + w.slice(lastIdx + 1);
    }
  }

  w = w.normalize('NFC');

  if (w.endsWith('ν')) {
    const stem = w.slice(0, -1);
    const normStem = stem.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/[ε|σι|τι|ει]$/.test(normStem)) {
      return `${stem}(ν)`;
    }
  } else {
    const normW = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/[ε|σι|τι|ει]$/.test(normW)) {
      return `${w}(ν)`;
    }
  }

  return w;
}

/**
 * Given a list of occurrences, produces a deduplicated, sorted list of canonical attested form strings.
 * e.g., ["ἔμελλε", "Ἔμελλε", "ἔμελλεν", "Ἔμελλεν"] => ["ἔμελλε(ν)"]
 */
export function getCanonicalAttestedForms(occurrences: Array<{ word?: string }>): string[] {
  if (!occurrences || !Array.isArray(occurrences)) return [];

  const canonicalMap = new Map<string, string>();

  for (const o of occurrences) {
    if (!o || !o.word) continue;
    const raw = o.word.trim();
    if (!raw) continue;
    const canonical = getCanonicalForm(raw);
    if (!canonicalMap.has(canonical)) {
      canonicalMap.set(canonical, canonical);
    }
  }

  return Array.from(canonicalMap.values()).sort((a, b) => a.localeCompare(b, 'el'));
}

/**
 * Checks whether an occurrence word form matches a selected form filter (canonicalized).
 */
export function isFormFilterMatch(occWord: string, filterWord: string): boolean {
  if (!filterWord || !occWord) return true;
  if (occWord === filterWord) return true;

  const canonicalOcc = getCanonicalForm(occWord);
  const canonicalFilter = getCanonicalForm(filterWord);
  if (canonicalOcc === canonicalFilter) return true;

  const normOcc = normalizeKey(occWord);
  const normFilter = normalizeKey(filterWord);
  const stripNu = (s: string) => (s.endsWith('ν') ? s.slice(0, -1) : s);

  return normOcc === normFilter || stripNu(normOcc) === stripNu(normFilter);
}

export function matchSingleWord(normWord: string, normTarget: string): boolean {
  if (!normWord || !normTarget) return false;
  if (normWord === normTarget) return true;

  // Account for Greek movable nu (ἐφελκυστικὸν ν) at word end (e.g. μελλει / μελλειν, εστι / εστιν)
  const stripNu = (s: string) => (s.endsWith('ν') ? s.slice(0, -1) : s);
  if (stripNu(normWord) === stripNu(normTarget)) return true;

  return false;
}

export function isWordPhraseMatch(normWord: string, normPhrase: string): boolean {
  if (!normWord || !normPhrase) return false;

  if (normPhrase.includes(' ')) {
    const phraseWords = normPhrase.split(/\s+/).filter(Boolean);
    return phraseWords.some(w => matchSingleWord(normWord, w));
  }

  return matchSingleWord(normWord, normPhrase);
}

export function getWordHighlightInfo(rawWord: string, store: HighlightStore): WordHighlightResult {
  const norm = normalizeKey(rawWord);
  if (!norm) return { isForm: false, isLemma: false, isPhrase: false };

  // 1. Check exact form match first (takes precedence for vibrant styling)
  const formMatch = store.forms.find(f => f.word === norm);
  if (formMatch) {
    return {
      isForm: true,
      isLemma: false,
      isPhrase: false,
      hue: formMatch.hue,
      style: `--hl-hue: ${formMatch.hue};`
    };
  }

  // 2. Check lemma match using loaded form sets with prefix fallback
  const lemmaMatch = store.lemmas.find(l => {
    const formsSet = getLoadedLemmaFormSet(l.lemma);
    if (formsSet) {
      return formsSet.has(norm);
    }
    return norm === l.lemma || (l.lemma.length >= 3 && norm.startsWith(l.lemma.slice(0, Math.min(l.lemma.length, 5))));
  });

  if (lemmaMatch) {
    return {
      isForm: false,
      isLemma: true,
      isPhrase: false,
      hue: lemmaMatch.hue,
      style: `--hl-hue: ${lemmaMatch.hue};`
    };
  }

  // 3. Check custom phrase match
  if (store.phrases && store.phrases.length > 0) {
    const phraseMatch = store.phrases.find(p => {
      const pNorm = normalizeKey(p.phrase || p.displayPhrase);
      return isWordPhraseMatch(norm, pNorm);
    });

    if (phraseMatch) {
      return {
        isForm: false,
        isLemma: false,
        isPhrase: true,
        hue: phraseMatch.hue,
        style: `--hl-hue: ${phraseMatch.hue};`
      };
    }
  }

  return { isForm: false, isLemma: false, isPhrase: false };
}
