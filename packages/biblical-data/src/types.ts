/**
 * TypeScript Type Definitions for Biblical Corpora Datasets & LSJ Dictionary.
 */

export type CorpusName = 'lxx' | 'sblgnt' | 'bhs';

export interface Lexeme {
  id: number;
  lemma: string;
  gloss: string;
  pos: number;
  total: number;
  beta: string;
  plain: string;
  strongs: string;
}

export type LexemesDict = Record<string, Lexeme>;

export interface BookInfo {
  name: string;
  abbrev: string;
  node: number;
  words: number;
  chapters: Record<string, string>;
}

export type BooksDict = Record<string, BookInfo>;

export interface SectionEntry {
  words: number;
  lex: Record<string, number>;
}

export type SectionsDict = Record<string, SectionEntry>;

export interface ConcordanceEntry {
  total: number;
  bookcounts: Record<string, number>;
  refs: string[];
  nodes: number[];
}

export type ConcordanceDict = Record<string, ConcordanceEntry>;

export interface VerseEntry {
  id: number;
  section: string;
  text: string;
}

export type VersesDict = Record<string, VerseEntry>;

export interface DictionaryEntry {
  headword: string;
  lsjIndex?: string;
  matchType?: 'exact' | 'variation' | 'plain' | 'neuter_adjective' | 'override';
  def: string;
}

export type DictionaryShard = Record<string, DictionaryEntry>;
