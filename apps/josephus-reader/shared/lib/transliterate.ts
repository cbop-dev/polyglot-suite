/**
 * Shared transliteration & KWIC utilities for Josephus Reader.
 * Canonical implementation housed in @polyglot/ancient-languages.
 */
export {
  transliterateLatinToGreek,
  normalizeGreekSearch,
  findMatchInText,
  findAllMatchesInText,
  getKwicSnippet,
  getAllKwicSnippets,
  type KwicSnippet,
  type KwicOptions
} from '@polyglot/ancient-languages';
