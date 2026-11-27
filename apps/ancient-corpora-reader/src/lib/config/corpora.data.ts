/**
 * Corpus Works Catalog for Ancient Corpora Reader (ACR).
 * 
 * Standardizes work metadata, codes, titles, and division structures
 * across Apostolic Fathers, Philo of Alexandria, Flavius Josephus, and Justin Martyr.
 * 
 * Sourced directly from the Tier-2 SQLite database corpus_works table
 * via ./canonicalWorks.generated.js.
 */

import type { AncientCorpusId } from '@polyglot/ancient-languages';
import { getCorpusConfig } from './corpora.js';
import {
	CANONICAL_CORPUS_WORKS,
	type CorpusWork
} from './canonicalWorks.generated.js';

export type { CorpusWork };

// Backward-compatibility alias
export type UnifiedCanonicalWork = CorpusWork;

export interface DivisionCoordinates {
	book: number;
	chapter: number;
}

function slugify(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const AF_WORKS: CorpusWork[] = CANONICAL_CORPUS_WORKS['af'] || [];
export const PHILO_WORKS: CorpusWork[] = CANONICAL_CORPUS_WORKS['philo'] || [];
export const JOSEPHUS_WORKS: CorpusWork[] = CANONICAL_CORPUS_WORKS['josephus'] || [];
export const JUSTIN_WORKS: CorpusWork[] = CANONICAL_CORPUS_WORKS['justin'] || [];
export const IRENAEUS_WORKS: CorpusWork[] = CANONICAL_CORPUS_WORKS['irenaeus'] || [];

export const ALL_CORPUS_WORKS: Record<AncientCorpusId, CorpusWork[]> = CANONICAL_CORPUS_WORKS;

// Backward-compatibility alias
export const ALL_CANONICAL_WORKS = ALL_CORPUS_WORKS;

/**
 * Formats a dot-separated page path (e.g. "1.4") into a human-readable label
 * using the work's hierarchyLevels (e.g. "Book 1, Chapter 4" or "Bk. 1, Ch. 4").
 */
export function formatPageLabel(work: CorpusWork | undefined, pagePath: string, short = false): string {
	if (!work) return pagePath;
	const levels = work.hierarchyLevels || [work.divisionLabel || 'Chapter', 'Section'];
	const parts = pagePath.split('.');
	const shortMap: Record<string, string> = {
		Book: 'Bk.',
		Chapter: 'Ch.',
		Section: 'Sec.',
		Part: 'Pt.',
		Homily: 'Hom.'
	};
	return parts
		.map((val, idx) => {
			const lvl = levels[idx] || `Level ${idx + 1}`;
			const lbl = short ? (shortMap[lvl] || `${lvl.slice(0, 3)}.`) : lvl;
			return `${lbl} ${val}`;
		})
		.join(', ');
}

/**
 * Returns the next or previous page path from work.pages, or undefined if at the boundary.
 */
export function getAdjacentPage(
	work: CorpusWork | undefined,
	currentPage: string,
	delta: -1 | 1
): string | undefined {
	if (!work?.pages || work.pages.length === 0) return undefined;
	const idx = work.pages.indexOf(currentPage);
	if (idx === -1) return delta > 0 ? work.pages[0] : undefined;
	return work.pages[idx + delta];
}

/**
 * Resolves a raw page/division input into a valid page path for the work.
 */
export function resolveWorkPage(work: CorpusWork | undefined, division?: string | number): string {
	if (!work?.pages || work.pages.length === 0) {
		return division !== undefined ? String(division) : String(work?.minDivision ?? 1);
	}
	if (division === undefined || division === null || division === '') {
		return work.pages[0];
	}
	const raw = String(division);
	if (work.pages.includes(raw)) return raw;
	// If a top-level number was given for a multi-level paginated work (e.g. "1" -> "1.1"),
	// match the first page starting with `${raw}.`
	const prefixMatch = work.pages.find((p) => p.startsWith(`${raw}.`));
	if (prefixMatch) return prefixMatch;
	return work.pages[0];
}

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
	corpusId: AncientCorpusId | string,
	workCode: string,
	division: number
): DivisionCoordinates;
export function resolveDivisionCoordinates(
	workOrCorpus: CorpusWork | AncientCorpusId | string | undefined,
	divisionOrCode: number | string,
	maybeDivision?: number
): DivisionCoordinates {
	let work: CorpusWork | undefined;
	let division: number;

	if (typeof workOrCorpus === 'string' && typeof divisionOrCode === 'string') {
		work = findWork(workOrCorpus as AncientCorpusId, divisionOrCode);
		division = typeof maybeDivision === 'number' ? maybeDivision : 1;
	} else if (typeof workOrCorpus === 'object' || workOrCorpus === undefined) {
		work = workOrCorpus;
		division = typeof divisionOrCode === 'number' ? divisionOrCode : 1;
	} else {
		division = 1;
	}

	const scheme = work?.coordinateScheme || (work?.corpusId ? getCorpusConfig(work.corpusId).coordinateScheme : 'division_both');
	if (scheme === 'book_only') {
		return { book: division, chapter: 0 };
	}
	return { book: division, chapter: division };
}

/**
 * Returns all works for a given corpus.
 */
export function getCorpusWorks(corpusId: AncientCorpusId | string): CorpusWork[] {
	return ALL_CORPUS_WORKS[corpusId as AncientCorpusId] || [];
}

/**
 * Finds a work within a corpus by code, slug, abbreviation, or title.
 */
export function findWork(corpusId: AncientCorpusId | string, codeOrSlug: string): CorpusWork | undefined {
	const list = getCorpusWorks(corpusId);
	if (!codeOrSlug) return list[0];
	const norm = slugify(codeOrSlug);

	// 1. Exact match on code, slug, English title, Greek title, Latin title, or abbrev
	const exact = list.find(
		(w) =>
			slugify(w.code) === norm ||
			w.slug === norm ||
			slugify(w.titleEnglish) === norm ||
			(w.titleSecondary && slugify(w.titleSecondary) === norm) ||
			(w.titleLatin && slugify(w.titleLatin) === norm) ||
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
