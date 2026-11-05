/**
 * Corpus Works Catalog for Ancient Corpora Reader (ACR).
 * 
 * Standardizes work metadata, codes, titles, and division structures
 * across Apostolic Fathers, Philo of Alexandria, and Flavius Josephus.
 */

import {
	AF_CANONICAL_WORKS,
	PHILO_CANONICAL_WORKS,
	JOSEPHUS_CANONICAL_WORKS
} from './canonicalWorks.data.js';

export interface CorpusWork {
	corpusId: string;
	code: string;                  // Canonical uppercase code ('1CLE', 'OPIF', 'WAR')
	slug: string;                  // URL-friendly slug ('1-clement', 'opif', 'war')
	orderIndex: number;
	category: string;
	abbrev: string;                // Standard academic abbreviation ('1 Clem.', 'Opif.', 'War')
	titleEnglish: string;
	titlePrimary: string;          // Greek title
	titleSecondary?: string;       // Latin title
	totalDivisions: number;        // Total books or chapters
	minDivision: number;           // Usually 1 (0 for 1 Clement preface)
	divisionLabel: 'Book' | 'Chapter';
	sectionsByDivision?: Record<number, number>;
}

export interface DivisionCoordinates {
	book: number;
	chapter: number;
}

function slugify(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const AF_WORKS: CorpusWork[] = (AF_CANONICAL_WORKS as any[]).map((w) => ({
	corpusId: 'af',
	code: w.code,
	slug: slugify(w.code),
	orderIndex: w.orderIndex,
	category: w.category,
	abbrev: w.titleEnglish.split(' ')[0] + '.',
	titleEnglish: w.titleEnglish,
	titlePrimary: w.titleGreek,
	titleSecondary: w.titleLatin,
	totalDivisions: w.totalChapters,
	minDivision: w.minChapter ?? 1,
	divisionLabel: 'Chapter'
}));

export const PHILO_WORKS: CorpusWork[] = (PHILO_CANONICAL_WORKS as any[]).map((w, idx) => ({
	corpusId: 'philo',
	code: w.code,
	slug: slugify(w.code),
	orderIndex: idx + 1,
	category: w.category || 'treatise',
	abbrev: w.abbrev,
	titleEnglish: w.titleEnglish,
	titlePrimary: w.titleGreek,
	titleSecondary: w.titleLatin,
	totalDivisions: w.totalBooks,
	minDivision: 1,
	divisionLabel: w.totalBooks > 1 ? 'Book' : 'Chapter',
	sectionsByDivision: w.sectionsByBook
}));

export const JOSEPHUS_WORKS: CorpusWork[] = (JOSEPHUS_CANONICAL_WORKS as any[]).map((w, idx) => ({
	corpusId: 'josephus',
	code: w.code,
	slug: slugify(w.code),
	orderIndex: idx + 1,
	category: w.category || 'history',
	abbrev: w.abbrev,
	titleEnglish: w.titleEnglish,
	titlePrimary: w.titleGreek,
	titleSecondary: w.titleLatin,
	totalDivisions: w.totalBooks,
	minDivision: 1,
	divisionLabel: 'Book',
	sectionsByDivision: w.sectionsByBook
}));

export const ALL_CORPUS_WORKS: Record<string, CorpusWork[]> = {
	af: AF_WORKS,
	philo: PHILO_WORKS,
	josephus: JOSEPHUS_WORKS
};

/**
 * Resolves the database storage coordinates (book, chapter) for a division
 * based on the work's structural metadata. Supports both (work, division)
 * and (corpusId, workCode, division).
 */
export function resolveDivisionCoordinates(
	work: CorpusWork | undefined,
	division: number
): DivisionCoordinates;
export function resolveDivisionCoordinates(
	corpusId: string,
	workCode: string,
	division: number
): DivisionCoordinates;
export function resolveDivisionCoordinates(
	workOrCorpus: CorpusWork | string | undefined,
	divisionOrCode: number | string,
	maybeDivision?: number
): DivisionCoordinates {
	let work: CorpusWork | undefined;
	let division: number;

	if (typeof workOrCorpus === 'string' && typeof divisionOrCode === 'string') {
		work = findWork(workOrCorpus, divisionOrCode);
		division = typeof maybeDivision === 'number' ? maybeDivision : 1;
	} else if (typeof workOrCorpus === 'object' || workOrCorpus === undefined) {
		work = workOrCorpus;
		division = typeof divisionOrCode === 'number' ? divisionOrCode : 1;
	} else {
		division = 1;
	}

	if (work?.corpusId === 'josephus') {
		return { book: division, chapter: 0 };
	}
	return { book: division, chapter: division };
}

/**
 * Retrieve all works for a given corpus ID.
 */
export function getCorpusWorks(corpusId: string): CorpusWork[] {
	return ALL_CORPUS_WORKS[corpusId] || [];
}

/**
 * Find a work in a corpus by its exact code, slug, abbreviation, or title.
 */
export function findWork(corpusId: string, codeOrSlug: string): CorpusWork | undefined {
	const list = getCorpusWorks(corpusId);
	if (!codeOrSlug) return list[0];
	const norm = slugify(codeOrSlug);

	// 1. Exact match on code, slug, English title, Secondary title, or abbrev
	const exact = list.find(
		(w) =>
			slugify(w.code) === norm ||
			w.slug === norm ||
			slugify(w.titleEnglish) === norm ||
			(w.titleSecondary && slugify(w.titleSecondary) === norm) ||
			slugify(w.abbrev) === norm
	);
	if (exact) return exact;

	// 2. Prefix / alias match (e.g. 'ant' -> 'antiquities', 'war' -> 'war')
	return list.find(
		(w) =>
			w.slug.startsWith(norm) ||
			norm.startsWith(w.slug) ||
			slugify(w.titleEnglish).startsWith(norm) ||
			slugify(w.abbrev).startsWith(norm)
	);
}
