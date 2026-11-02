import type { AncientCorpusId } from '@polyglot/ancient-languages';
import {
	AF_CANONICAL_WORKS,
	PHILO_CANONICAL_WORKS,
	JOSEPHUS_CANONICAL_WORKS
} from './canonicalWorks.data.js';

export interface UnifiedCanonicalWork {
	corpusId: AncientCorpusId;
	code: string;
	slug: string;
	titleEnglish: string;
	titleGreek: string;
	titleLatin?: string;
	abbrev: string;
	category?: string;
	divisionLabel: 'Chapter' | 'Book';
	totalDivisions: number;
	minDivision: number;
	sectionsByDivision?: Record<number, number>;
}

export const CORPUS_TITLES: Record<AncientCorpusId, { name: string; subtitle: string; badge: string }> = {
	af: {
		name: 'Apostolic Fathers',
		subtitle: 'Early Christian Greek writings (1st–2nd century CE)',
		badge: 'AF'
	},
	philo: {
		name: 'Philo of Alexandria',
		subtitle: 'Hellenistic Jewish philosophical & allegorical treatises',
		badge: 'Philo'
	},
	josephus: {
		name: 'Flavius Josephus',
		subtitle: 'Jewish history, autobiography, and defense of antiquity',
		badge: 'Josephus'
	}
};

function slugify(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const ALL_CANONICAL_WORKS: Record<AncientCorpusId, UnifiedCanonicalWork[]> = {
	af: (AF_CANONICAL_WORKS as any[]).map((w) => ({
		corpusId: 'af',
		code: w.code,
		slug: slugify(w.code),
		titleEnglish: w.titleEnglish,
		titleGreek: w.titleGreek,
		titleLatin: w.titleLatin,
		abbrev: w.titleEnglish.split(' ')[0] + '.',
		category: w.category,
		divisionLabel: 'Chapter',
		totalDivisions: w.totalChapters,
		minDivision: w.minChapter ?? 1
	})),
	philo: (PHILO_CANONICAL_WORKS as any[]).map((w) => ({
		corpusId: 'philo',
		code: w.code,
		slug: slugify(w.code),
		titleEnglish: w.titleEnglish,
		titleGreek: w.titleGreek,
		titleLatin: w.titleLatin,
		abbrev: w.abbrev,
		category: w.category,
		divisionLabel: w.totalBooks > 1 ? 'Book' : 'Chapter',
		totalDivisions: w.totalBooks,
		minDivision: 1,
		sectionsByDivision: w.sectionsByBook
	})),
	josephus: (JOSEPHUS_CANONICAL_WORKS as any[]).map((w) => ({
		corpusId: 'josephus',
		code: w.code,
		slug: slugify(w.code),
		titleEnglish: w.titleEnglish,
		titleGreek: w.titleGreek,
		titleLatin: w.titleLatin,
		abbrev: w.abbrev,
		category: w.category,
		divisionLabel: 'Book',
		totalDivisions: w.totalBooks,
		minDivision: 1,
		sectionsByDivision: w.sectionsByBook
	}))
};

export function getCorpusWorks(corpusId: AncientCorpusId): UnifiedCanonicalWork[] {
	return ALL_CANONICAL_WORKS[corpusId] || [];
}

export function findWork(corpusId: AncientCorpusId, codeOrSlug: string): UnifiedCanonicalWork | undefined {
	const list = getCorpusWorks(corpusId);
	if (!codeOrSlug) return list[0];
	const norm = slugify(codeOrSlug);
	return list.find((w) => slugify(w.code) === norm || w.slug === norm || slugify(w.titleEnglish) === norm);
}
