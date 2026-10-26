/**
 * Types for Biblical Lexeme Explorer engine and dataset services.
 */

export type CorpusDb = 'lxx' | 'bhs' | 'sblgnt' | string;

export interface LexemeMetadata {
    id: number;
    lemma: string;
    gloss?: string;
    count?: number;
    pos?: number | string;
    posNum?: number;
    posDesc?: string;
    total: number;
    beta?: string;
    plain?: string;
    strongs?: string;
}

export interface SectionQueryOptions {
    sections?: (number | string)[];
    refsText?: string;
    common?: boolean;
    unique?: boolean;
    excludePos?: (number | string)[];
    restrictPos?: (number | string)[];
    maxWords?: number;
    posDict?: Record<number | string, { desc?: string; abbrev?: string }>;
}

export interface SectionQueryResult {
    totalWords: number;
    totalLexemes: number;
    totalInstances?: number;
    lexemes: Record<string, LexemeMetadata>;
    common?: string[];
}

export interface RefsResult {
    total: number;
    bookcounts: Record<string | number, number>;
    refs: string[];
    nodes: number[];
}

export interface VerseTextResult {
    id: number | string;
    section: string;
    text: string;
}

export interface BookEntry {
    name?: string;
    abbrev?: string;
    node?: number | string;
    chapters?: Record<string, string>;
}
