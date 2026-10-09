/**
 * Latin / Betacode to Greek live transliteration utility for Josephus Reader.
 */

const DIGRAPHS: Record<string, string> = {
  'th': 'θ',
  'ph': 'φ',
  'ch': 'χ',
  'ps': 'ψ',
  'TH': 'Θ',
  'PH': 'Φ',
  'CH': 'Χ',
  'PS': 'Ψ',
  'Th': 'Θ',
  'Ph': 'Φ',
  'Ch': 'Χ',
  'Ps': 'Ψ',
};

const SINGLE_CHAR_MAP: Record<string, string> = {
  'a': 'α', 'b': 'β', 'g': 'γ', 'd': 'δ', 'e': 'ε', 'z': 'ζ', 'h': 'η',
  'q': 'θ', 'i': 'ι', 'k': 'κ', 'l': 'λ', 'm': 'μ', 'n': 'ν', 'c': 'ξ',
  'o': 'ο', 'p': 'π', 'r': 'ρ', 's': 'σ', 't': 'τ', 'u': 'υ', 'y': 'υ',
  'f': 'φ', 'x': 'χ', 'w': 'ω', 'v': 'ϝ',
  'A': 'Α', 'B': 'Β', 'G': 'Γ', 'D': 'Δ', 'E': 'Ε', 'Z': 'Ζ', 'H': 'Η',
  'Q': 'Θ', 'I': 'Ι', 'K': 'Κ', 'L': 'Λ', 'M': 'Μ', 'N': 'Ν', 'C': 'Ξ',
  'O': 'Ο', 'P': 'Π', 'R': 'Ρ', 'S': 'Σ', 'T': 'Τ', 'U': 'Υ', 'Y': 'Υ',
  'F': 'Φ', 'X': 'Χ', 'W': 'Ω', 'V': 'Ϝ',
  'j': 'ς', 'J': 'Σ',
};

/**
 * Transliterates Latin/Betacode input string to Greek Unicode.
 * Preserves spaces, numbers, punctuation, and Greek characters already entered.
 */
export function transliterateLatinToGreek(input: string): string {
  if (!input) return '';

  let res = '';
  let i = 0;
  const len = input.length;

  while (i < len) {
    const char = input[i];

    // Pass through non-ASCII or existing Greek characters
    if (char.charCodeAt(0) > 127) {
      res += char;
      i++;
      continue;
    }

    // Pass through spaces, numbers, and standard punctuation
    if (/[\s\d.,;:\-!?"'()\[\]]/.test(char)) {
      res += char;
      i++;
      continue;
    }

    // Check 2-char digraphs (e.g. th, ph, ch, ps)
    if (i + 1 < len) {
      const pair = input.substring(i, i + 2);
      if (DIGRAPHS[pair]) {
        res += DIGRAPHS[pair];
        i += 2;
        continue;
      }
    }

    // Check 1-char mapping
    if (SINGLE_CHAR_MAP[char]) {
      res += SINGLE_CHAR_MAP[char];
    } else {
      res += char;
    }
    i++;
  }

  // 1. Convert non-trailing final sigma (ς) into medial sigma (σ)
  res = res.replace(/ς(?![.·,;:!?"'\s)\]]|$)/g, 'σ');

  // 2. Convert trailing medial sigma (σ) into final sigma (ς)
  res = res.replace(/σ(?=[.·,;:!?"'\s)\]]|$)/g, 'ς');

  return res;
}

/**
 * Normalizes Greek string for diacritic-insensitive searching.
 * Strips accents, breathings, lowers case, and replaces ς with σ.
 */
export function normalizeGreekSearch(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(/[.,·;:!?"'»«()\[\]]/g, '')
    .trim();
}

/**
 * Finds the character range { start, end } of a query in text with 100% accurate mapping
 * back to original text character positions, ignoring Greek diacritics and accents.
 */
export function findMatchInText(text: string, query: string, normQ?: string): { start: number; end: number } | null {
  if (!text || !query) return null;
  const targetNormQ = normQ || normalizeGreekSearch(query);
  if (!targetNormQ) return null;

  // 1. Try direct exact/case-insensitive substring search first
  const directIdx = text.toLowerCase().indexOf(query.toLowerCase());
  if (directIdx !== -1) {
    return { start: directIdx, end: directIdx + query.length };
  }

  // 2. Build index map for diacritics-insensitive match
  let normText = '';
  const indexMap: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const normChar = char
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ς/g, 'σ');

    for (let j = 0; j < normChar.length; j++) {
      normText += normChar[j];
      indexMap.push(i);
    }
  }

  const normIdx = normText.indexOf(targetNormQ);
  if (normIdx === -1) return null;

  const start = indexMap[normIdx];
  const lastNormIdx = normIdx + targetNormQ.length - 1;
  const end = indexMap[lastNormIdx] + 1;

  return { start, end };
}

/**
 * Generates KWIC (Key Word In Context) snippet with accurate match boundaries.
 */
export function getKwicSnippet(text: string, query: string, normQ?: string): { before: string; match: string; after: string } {
  if (!text) return { before: '', match: '', after: '' };
  
  const matchRange = findMatchInText(text, query, normQ);
  if (!matchRange) {
    return { before: text.slice(0, 60), match: '', after: text.slice(60, 120) };
  }

  const { start, end } = matchRange;
  const kwicStart = Math.max(0, start - 45);
  const kwicEnd = Math.min(text.length, end + 45);

  return {
    before: (kwicStart > 0 ? '...' : '') + text.slice(kwicStart, start),
    match: text.slice(start, end),
    after: text.slice(end, kwicEnd) + (kwicEnd < text.length ? '...' : '')
  };
}
