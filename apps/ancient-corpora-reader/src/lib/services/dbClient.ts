import { getDbWorker } from './dbWorker.js';
import { findWork, resolveDivisionCoordinates } from '../config/canonicalWorks.js';
import {
	getCorpusConfig,
	getAllCorpora,
	type TextDirection
} from '../config/corpora.js';
import {
	stripGreekAccents,
	buildAttestedForms,
	getDefaultDictionary,
	getLanguageFontClass,
	type AttestedForm,
	type AncientCorpusId
} from '@polyglot/ancient-languages';
import { getRowVal, parseJsonField, unpackJsonBlob } from '@polyglot/db-vfs';
import type { PaginatedConcordance, ConcordanceRef as UiConcordanceRef } from '@polyglot/lemma-ui';

export { stripGreekAccents, type AttestedForm, type AncientCorpusId, type PaginatedConcordance };

export interface Token {
	w: string;
	l?: string;
	m?: string;
	p?: string;
	lang?: string;
	type?: string;
	book_code?: string;
	book_name?: string;
	bible_chapter?: number;
	bible_verse?: number;
	display?: string;
	raw?: string;
}

export interface TextUnit {
	id: number;
	corpus_id: string;
	version_id: string;
	work_code: string;
	chapter?: number;
	book?: number;
	section?: number;
	section_label?: string;
	section_num?: number;
	niese_section?: string;
	display_citation: string;
	milestone_ref?: string;
	mangey_ref?: string;
	is_supplement?: number;
	text_content: string;
	tokens?: Token[];
}

export interface TextVersion {
	versionId: string;
	language: string;
	label: string;
	shortLabel: string;
	direction: TextDirection;
	fontClass: string;
	textUnits: TextUnit[];
}

export interface LexiconEntry {
	dictionary: string;
	strongs_id?: string;
	lemma: string;
	normalized_lemma: string;
	pos?: string;
	transliteration?: string;
	gloss: string;
	definition: string;
}

export interface LemmaStat {
	corpus_id: string;
	lemma: string;
	normalized_lemma: string;
	total_count: number;
	concordance_count?: number;
	work_counts: Record<string, number>;
}

export interface ConcordanceRef extends UiConcordanceRef {
	display_citation: string;
	work_unit_id: number;
	work_code: string;
	corpus_id?: string;
	chapter?: number;
	book?: number;
	section?: number;
	section_num?: number;
	niese_section?: string;
	text_content: string;
	matched_word?: string;
	matched_words?: string[];
}

export interface LemmaSearchResult {
	lemma: string;
	normalized_lemma: string;
	total_count: number;
	work_counts: Record<string, number>;
	corpusId?: AncientCorpusId;
}

export interface BiblicalCitation {
	id: number;
	work_code: string;
	work_abbrev?: string;
	work_title?: string;
	chapter: number;
	section: number;
	work_unit_id: number;
	book_code: string;
	book_name: string;
	bible_chapter?: number;
	bible_verse?: number;
	display_citation: string;
	raw_citation: string;
	text_snippet?: string;
}

export type ScriptureCitation = BiblicalCitation;

export interface BiblicalBookSummary {
	book_code: string;
	book_name: string;
	total_count: number;
}

export type ScriptureBookSummary = BiblicalBookSummary;

export function getPrimaryVersionId(corpusId: AncientCorpusId): string {
	const cfg = getCorpusConfig(corpusId);
	const primary = cfg.textVersions.find((v) => v.language === cfg.primaryLanguage) || cfg.textVersions[0];
	return primary ? primary.id : corpusId;
}

export const PRIMARY_GREEK_CORPUS_IDS: Record<AncientCorpusId, string> = {
	af: 'lake_grc',
	philo: 'grc',
	josephus: 'josephus_grc'
};

export interface DivisionResult {
	corpusId?: AncientCorpusId;
	workCode?: string;
	division?: number;
	textVersions: TextVersion[];
	// Backwards-compatibility bridge for Phase 3 components:
	greek: TextUnit[];
	english: TextUnit[];
	latin: TextUnit[];
}

const divisionCache = new Map<string, DivisionResult>();
const MAX_DIVISION_CACHE_SIZE = 24;

export function clearDivisionCache(): void {
	divisionCache.clear();
}

/**
 * Fetch parallel text units for a specific division (chapter for AF & single-treatise Philo, book for Josephus & multi-book Philo)
 */
export async function fetchDivisionSections(
	corpusId: AncientCorpusId,
	workCode: string,
	division: number
): Promise<DivisionResult> {
	const cacheKey = `${corpusId}:${workCode}:${division}`;
	const cached = divisionCache.get(cacheKey);
	if (cached) {
		// Re-insert to mark as most recently used in LRU order
		divisionCache.delete(cacheKey);
		divisionCache.set(cacheKey, cached);
		return cached;
	}

	const worker = await getDbWorker(corpusId);
	const cfg = getCorpusConfig(corpusId);
	const greek: TextUnit[] = [];
	const english: TextUnit[] = [];
	const latin: TextUnit[] = [];

	// Resolve exact coordinates via work metadata (e.g. book_only vs division_both)
	const work = findWork(corpusId, workCode);
	const coords = resolveDivisionCoordinates(work, division);

	// Primary query: Direct indexed seek on idx_text_units_coords (work_code, book, chapter, section)
	// Fast first paint: only query text_units (no heavy tokens_json join)
	const sqlExact = `
		SELECT u.id, u.version_id, u.corpus_id, u.work_code, u.book, u.chapter, u.section,
		       u.section_label, u.section_num, u.niese_section, u.mangey_ref, u.is_supplement,
		       u.display_citation, u.milestone_ref, u.text_content
		FROM text_units u
		WHERE u.work_code = ? AND u.book = ? AND u.chapter = ?
		ORDER BY u.section ASC, u.id ASC
	`;
	let rows = await worker.db.query(sqlExact, [workCode, coords.book, coords.chapter]);

	// Resilient fallback for any work with non-standard coordinate schemas
	if (!rows || (rows as any[]).length === 0) {
		const sqlFallback = `
			SELECT u.id, u.version_id, u.corpus_id, u.work_code, u.book, u.chapter, u.section,
			       u.section_label, u.section_num, u.niese_section, u.mangey_ref, u.is_supplement,
			       u.display_citation, u.milestone_ref, u.text_content
			FROM text_units u
			WHERE u.work_code = ? AND (u.book = ? OR u.chapter = ?)
			ORDER BY u.section ASC, u.id ASC
		`;
		rows = await worker.db.query(sqlFallback, [workCode, division, division]);
	}

	const unitsByVersion = new Map<string, TextUnit[]>();

	for (const row of rows as any[]) {
		const versionId = getRowVal<string>(row, 'version_id', 1) || getRowVal<string>(row, 'corpus_id', 2);
		const unit: TextUnit = {
			id: getRowVal<number>(row, 'id', 0),
			version_id: versionId,
			corpus_id: versionId,
			work_code: getRowVal<string>(row, 'work_code', 3),
			book: getRowVal<number>(row, 'book', 4),
			chapter: getRowVal<number>(row, 'chapter', 5),
			section: getRowVal<number>(row, 'section', 6),
			section_label: getRowVal<string | undefined>(row, 'section_label', 7),
			section_num: getRowVal<number | undefined>(row, 'section_num', 8),
			niese_section: getRowVal<string | undefined>(row, 'niese_section', 9),
			mangey_ref: getRowVal<string | undefined>(row, 'mangey_ref', 10),
			is_supplement: getRowVal<number | undefined>(row, 'is_supplement', 11),
			display_citation: getRowVal<string>(row, 'display_citation', 12),
			milestone_ref: getRowVal<string | undefined>(row, 'milestone_ref', 13),
			text_content: getRowVal<string>(row, 'text_content', 14)
		};

		if (!unitsByVersion.has(versionId)) {
			unitsByVersion.set(versionId, []);
		}
		unitsByVersion.get(versionId)!.push(unit);

		// Backwards-compatibility bridge for Phase 3 components:
		if (versionId.endsWith('_grc') || versionId === 'grc') {
			greek.push(unit);
		} else if (versionId.endsWith('_eng') || versionId === 'eng') {
			english.push(unit);
		} else if (versionId.endsWith('_lat') || versionId === 'lat') {
			latin.push(unit);
		}
	}

	const textVersions: TextVersion[] = cfg.textVersions.map((v) => ({
		versionId: v.id,
		language: v.language,
		label: v.title,
		shortLabel: v.shortTitle,
		direction: v.direction || 'ltr',
		fontClass: getLanguageFontClass(v.language),
		textUnits: unitsByVersion.get(v.id) || []
	}));

	const result: DivisionResult = {
		corpusId,
		workCode,
		division,
		textVersions,
		greek,
		english,
		latin
	};

	// Store in bounded LRU cache
	if (divisionCache.size >= MAX_DIVISION_CACHE_SIZE) {
		const oldestKey = divisionCache.keys().next().value;
		if (oldestKey) {
			divisionCache.delete(oldestKey);
		}
	}
	divisionCache.set(cacheKey, result);

	return result;
}

/**
 * Fetch tokens for a list of work unit IDs in batches to progressively hydrate morphology
 */
export async function fetchDivisionTokens(
	corpusId: AncientCorpusId,
	workUnitIds: number[],
	onBatchLoaded?: (tokensByUnitId: Map<number, Token[]>) => void
): Promise<Map<number, Token[]>> {
	if (!workUnitIds || workUnitIds.length === 0) return new Map();

	const worker = await getDbWorker(corpusId);
	const resultMap = new Map<number, Token[]>();
	const BATCH_SIZE = 40;

	for (let i = 0; i < workUnitIds.length; i += BATCH_SIZE) {
		const slice = workUnitIds.slice(i, i + BATCH_SIZE);
		const placeholders = slice.map(() => '?').join(',');
		const sql = `
			SELECT work_unit_id, tokens_json
			FROM text_unit_tokens
			WHERE work_unit_id IN (${placeholders})
		`;
		const rows = await worker.db.query(sql, slice);
		const batchMap = new Map<number, Token[]>();

		const decompressPromises = (rows as any[]).map(async (row) => {
			const unitId = getRowVal<number>(row, 'work_unit_id', 0);
			const rawTokens = getRowVal(row, 'tokens_json', 1);
			const tokens = await unpackJsonBlob<Token[] | undefined>(rawTokens);
			return { unitId, tokens };
		});
		const decompressed = await Promise.all(decompressPromises);

		for (const { unitId, tokens } of decompressed) {
			if (unitId && tokens) {
				resultMap.set(unitId, tokens);
				batchMap.set(unitId, tokens);
			}
		}

		if (onBatchLoaded && batchMap.size > 0) {
			onBatchLoaded(batchMap);
		}
	}

	return resultMap;
}

/**
 * On-demand fallback: fetch tokens for a single work unit ID
 */
export async function fetchUnitTokens(
	corpusId: AncientCorpusId,
	workUnitId: number
): Promise<Token[] | null> {
	const worker = await getDbWorker(corpusId);
	const sql = `SELECT tokens_json FROM text_unit_tokens WHERE work_unit_id = ? LIMIT 1`;
	const rows = await worker.db.query(sql, [workUnitId]);
	if (!rows || (rows as any[]).length === 0) return null;
	const rawTokens = getRowVal(rows[0], 'tokens_json', 0);
	return (await unpackJsonBlob<Token[] | undefined>(rawTokens)) || null;
}

/**
 * Fetch available division indices (chapters or books) for a work
 */
export async function fetchAvailableDivisions(corpusId: AncientCorpusId, workCode: string): Promise<number[]> {
	const worker = await getDbWorker(corpusId);
	const sql = `
		SELECT DISTINCT CASE WHEN book > 0 THEN book ELSE chapter END AS div_num
		FROM text_units
		WHERE work_code = ?
		ORDER BY div_num ASC
	`;
	const rows = await worker.db.query(sql, [workCode]);
	return (rows as any[]).map((r) => getRowVal<number>(r, 'div_num', 0)).filter((n) => typeof n === 'number' && !isNaN(n));
}

/**
 * Fetch lexicon entry for a lemma using leading indexed columns (dictionary, lemma)
 */
export async function fetchLexiconEntry(corpusId: AncientCorpusId, lemma: string): Promise<LexiconEntry | null> {
	if (!lemma) return null;
	const worker = await getDbWorker(corpusId);
	const clean = lemma.trim().replace(/[.,;:·]/g, '');
	const dict = getDefaultDictionary(corpusId);
	const dictAlt = dict === dict.toLowerCase() ? dict.toUpperCase() : dict.toLowerCase();

	// Step 1: Direct indexed seek on idx_lexicon_exact (dictionary, lemma)
	let rows = (await worker.db.query(
		`SELECT dictionary, strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition
		 FROM lexicon_entries
		 WHERE dictionary IN (?, ?) AND lemma = ?
		 LIMIT 1`,
		[dict, dictAlt, clean]
	)) as any[];

	// Step 2: Fallback to normalized index on idx_lexicon_lemma (dictionary, normalized_lemma)
	if (!rows || rows.length === 0) {
		const norm = stripGreekAccents(clean);
		if (norm !== clean) {
			rows = (await worker.db.query(
				`SELECT dictionary, strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition
				 FROM lexicon_entries
				 WHERE dictionary IN (?, ?) AND normalized_lemma = ?
				 LIMIT 1`,
				[dict, dictAlt, norm]
			)) as any[];
		}
	}

	if (!rows || (rows as any[]).length === 0) return null;

	const r = (rows as any[])[0];
	return {
		dictionary: getRowVal<string>(r, 'dictionary', 0),
		strongs_id: getRowVal<string | undefined>(r, 'strongs_id', 1),
		lemma: getRowVal<string>(r, 'lemma', 2),
		normalized_lemma: getRowVal<string>(r, 'normalized_lemma', 3),
		pos: getRowVal<string | undefined>(r, 'pos', 4),
		transliteration: getRowVal<string | undefined>(r, 'transliteration', 5),
		gloss: getRowVal<string>(r, 'gloss', 6),
		definition: getRowVal<string>(r, 'definition', 7)
	};
}

/**
 * Fetch lemma statistics from lemma_stats using primary key indexed seek (corpus_id, lemma)
 */
export async function fetchLemmaStats(corpusId: AncientCorpusId, lemma: string): Promise<LemmaStat | null> {
	if (!lemma) return null;
	const worker = await getDbWorker(corpusId);
	const clean = lemma.trim().replace(/[.,;:·]/g, '');
	const targetCorpus = getPrimaryVersionId(corpusId);

	// Step 1: Direct indexed seek on PRIMARY KEY (corpus_id, lemma)
	let rows = (await worker.db.query(
		`SELECT corpus_id, lemma, normalized_lemma, total_count, work_counts_json, concordance_count
		 FROM lemma_stats 
		 WHERE corpus_id = ? AND lemma = ? 
		 LIMIT 1;`,
		[targetCorpus, clean]
	)) as any[];

	// Step 2: Fallback to normalized lemma with LIMIT 1 if exact match misses
	if (!rows || rows.length === 0) {
		const norm = stripGreekAccents(clean);
		if (norm !== clean) {
			rows = (await worker.db.query(
				`SELECT corpus_id, lemma, normalized_lemma, total_count, work_counts_json, concordance_count
				 FROM lemma_stats
				 WHERE corpus_id = ? AND normalized_lemma = ?
				 LIMIT 1`,
				[targetCorpus, norm]
			)) as any[];
		}
	}

	if (!rows || rows.length === 0) return null;

	const topRow = rows[0];
	const rawCounts = getRowVal(topRow, 'work_counts_json', 4);
	const workCounts = parseJsonField<Record<string, number>>(rawCounts, {});
	const cCount = getRowVal<number | undefined>(topRow, 'concordance_count', 5);
	const tCount = getRowVal<number>(topRow, 'total_count', 3) || 0;

	return {
		corpus_id: getRowVal<string>(topRow, 'corpus_id', 0),
		lemma: getRowVal<string>(topRow, 'lemma', 1),
		normalized_lemma: getRowVal<string>(topRow, 'normalized_lemma', 2),
		total_count: tCount,
		concordance_count: cCount !== undefined && cCount !== null ? cCount : tCount,
		work_counts: workCounts
	};
}

/**
 * Fetch paginated concordance occurrences using single-lemma index pushdown
 */
export async function fetchConcordancePage(
	corpusId: AncientCorpusId,
	lemma: string,
	offset: number = 0,
	pageSize: number = 50,
	knownTotalCount?: number
): Promise<PaginatedConcordance> {
	if (!lemma) {
		return { refs: [], totalCount: 0, hasMore: false, nextOffset: 0 };
	}

	const worker = await getDbWorker(corpusId);
	const clean = lemma.trim().replace(/[.,;:·]/g, '');
	const targetCorpus = getPrimaryVersionId(corpusId);

	let targetLemma = clean;
	let totalCount = knownTotalCount;

	// Step 1: Resolve exact target lemma from lemma_stats (or normalized fallback)
	// ONLY if totalCount was not already supplied by the caller
	if (totalCount === undefined) {
		const statRows = (await worker.db.query(
			`SELECT lemma, concordance_count, total_count FROM lemma_stats 
			 WHERE corpus_id = ? AND lemma = ? LIMIT 1`,
			[targetCorpus, clean]
		)) as any[];

		if (statRows && statRows.length > 0) {
			targetLemma = getRowVal<string>(statRows[0], 'lemma', 0) || clean;
			const cCount = getRowVal<number | undefined>(statRows[0], 'concordance_count', 1);
			totalCount = cCount !== undefined && cCount !== null ? cCount : getRowVal<number>(statRows[0], 'total_count', 2, 0);
		} else {
			const stripped = stripGreekAccents(clean);
			const normRows = (await worker.db.query(
				`SELECT lemma, concordance_count, total_count FROM lemma_stats 
				 WHERE corpus_id = ? AND normalized_lemma = ?
				 ORDER BY total_count DESC LIMIT 1`,
				[targetCorpus, stripped]
			)) as any[];

			if (normRows && normRows.length > 0) {
				targetLemma = getRowVal<string>(normRows[0], 'lemma', 0) || clean;
				const cCount = getRowVal<number | undefined>(normRows[0], 'concordance_count', 1);
				totalCount = cCount !== undefined && cCount !== null ? cCount : getRowVal<number>(normRows[0], 'total_count', 2, 0);
			} else {
				// Fast fallback count directly from covering table
				const countRows = await worker.db.query(
					`SELECT COUNT(*) AS total FROM concordance_refs WHERE corpus_id = ? AND lemma = ?`,
					[targetCorpus, targetLemma]
				);
				totalCount = countRows && (countRows as any[]).length > 0 ? getRowVal<number>((countRows as any[])[0], 'total', 0) : 0;
			}
		}
	}

	if (totalCount === 0 || offset >= totalCount) {
		return { refs: [], totalCount, hasMore: false, nextOffset: offset };
	}

	// Step 2: Direct Covering Query from concordance_refs (ZERO JOINS, ZERO TEMP B-TREE SORT)
	// Because PRIMARY KEY starts with (corpus_id, lemma, work_unit_id), rows for a fixed lemma
	// are ALREADY physically ordered by work_unit_id ASC in SQLite's B-Tree.
	const sql = `
		SELECT 
			display_citation, work_unit_id, work_code, 
			book, chapter, section, niese_section, 
			matched_form, kwic_snippet
		FROM concordance_refs
		WHERE corpus_id = ? AND lemma = ?
		ORDER BY work_unit_id ASC
		LIMIT ? OFFSET ?
	`;
	const rows = await worker.db.query(sql, [targetCorpus, targetLemma, pageSize, offset]);
	const pagedRefs: ConcordanceRef[] = (rows as any[]).map((r) => {
		const matchedWord = getRowVal<string>(r, 'matched_form', 7) || clean;
		const sec = getRowVal<number>(r, 'section', 5);
		return {
			display_citation: getRowVal<string>(r, 'display_citation', 0),
			work_unit_id: getRowVal<number>(r, 'work_unit_id', 1),
			work_code: getRowVal<string>(r, 'work_code', 2),
			book: getRowVal<number>(r, 'book', 3),
			chapter: getRowVal<number>(r, 'chapter', 4),
			section: sec,
			section_num: sec,
			niese_section: getRowVal<string | undefined>(r, 'niese_section', 6),
			text_content: getRowVal<string>(r, 'kwic_snippet', 8),
			matched_word: matchedWord,
			matched_words: [matchedWord]
		};
	});

	const nextOffset = offset + pagedRefs.length;
	// If fewer rows than pageSize were returned, we have reached the exact end of data
	const resolvedTotal = pagedRefs.length < pageSize ? nextOffset : Math.max(totalCount, nextOffset);
	const hasMore = pagedRefs.length === pageSize && nextOffset < resolvedTotal;

	return {
		refs: pagedRefs,
		totalCount: resolvedTotal,
		hasMore,
		nextOffset
	};
}

/**
 * Legacy single-request concordance fetcher (defaults to initial page of results)
 */
export async function fetchConcordance(corpusId: AncientCorpusId, lemma: string): Promise<ConcordanceRef[]> {
	const result = await fetchConcordancePage(corpusId, lemma, 0, 100);
	return result.refs as ConcordanceRef[];
}

/**
 * Fetch full text for a section on demand (e.g. when user expands KWIC preview)
 */
export async function fetchSectionText(corpusId: AncientCorpusId, workUnitId: number): Promise<string> {
	if (!workUnitId) return '';
	const worker = await getDbWorker(corpusId);
	const rows = (await worker.db.query(
		`SELECT text_content FROM text_units WHERE id = ? LIMIT 1`,
		[workUnitId]
	)) as any[];
	return rows && rows.length > 0 ? getRowVal<string>(rows[0], 'text_content', 0) : '';
}

/**
 * Batch fetch full text for multiple sections on demand (1 single SQL query)
 */
export async function fetchSectionsTextBatch(corpusId: AncientCorpusId, workUnitIds: number[]): Promise<Record<number, string>> {
	if (!workUnitIds || workUnitIds.length === 0) return {};
	const uniqueIds = Array.from(new Set(workUnitIds.filter(Boolean)));
	if (uniqueIds.length === 0) return {};

	const worker = await getDbWorker(corpusId);
	const placeholders = uniqueIds.map(() => '?').join(',');
	const rows = (await worker.db.query(
		`SELECT id, text_content FROM text_units WHERE id IN (${placeholders})`,
		uniqueIds
	)) as any[];

	const result: Record<number, string> = {};
	if (rows && rows.length > 0) {
		for (const r of rows) {
			const id = getRowVal<number>(r, 'id', 0);
			const text = getRowVal<string>(r, 'text_content', 1);
			if (id !== undefined) {
				result[id] = text;
			}
		}
	}
	return result;
}

/**
 * Fetch attested grammatical forms for a lemma from canonical lemma_forms
 */
export async function fetchAttestedForms(corpusId: AncientCorpusId, lemma: string): Promise<AttestedForm[]> {
	if (!lemma) return [];
	const worker = await getDbWorker(corpusId);
	const clean = lemma.trim().replace(/[.,;:·]/g, '');
	const norm = stripGreekAccents(clean);

	const sql = `
		SELECT forms_json
		FROM lemma_forms
		WHERE lemma_key = ? OR normalized_lemma = ?
		LIMIT 1
	`;
	const rows = await worker.db.query(sql, [clean, norm]);
	if (!rows || (rows as any[]).length === 0) return [];

	const rawJson = getRowVal<string | undefined>((rows as any[])[0], 'forms_json', 0);
	if (!rawJson) return [];

	const parsed = parseJsonField<{ forms?: AttestedForm[] } | AttestedForm[]>(rawJson);
	if (Array.isArray(parsed)) return parsed;
	return parsed?.forms || [];
}

/**
 * Search lemmata within a single corpus
 */
export async function searchLemmas(
	corpusId: AncientCorpusId,
	query: string,
	limit: number = 30
): Promise<LemmaSearchResult[]> {
	if (!query.trim()) return [];
	const worker = await getDbWorker(corpusId);
	const clean = query.trim().replace(/[.,;:·]/g, '');
	const norm = stripGreekAccents(clean);
	const targetCorpus = getPrimaryVersionId(corpusId);

	const sql = `
		SELECT lemma, normalized_lemma, total_count, work_counts_json
		FROM lemma_stats
		WHERE corpus_id = ? AND (normalized_lemma LIKE ? OR lemma LIKE ?)
		ORDER BY total_count DESC
		LIMIT ?
	`;
	const rows = await worker.db.query(sql, [targetCorpus, `%${norm}%`, `%${clean}%`, limit]);
	return (rows as any[]).map((r) => ({
		lemma: getRowVal<string>(r, 'lemma', 0),
		normalized_lemma: getRowVal<string>(r, 'normalized_lemma', 1),
		total_count: getRowVal<number>(r, 'total_count', 2),
		work_counts: parseJsonField<Record<string, number>>(getRowVal(r, 'work_counts_json', 3), {}),
		corpusId
	}));
}

/**
 * Search lemmata across all three corpora in parallel
 */
export async function searchLemmasAcrossCorpora(
	query: string,
	limitPerCorpus: number = 10
): Promise<Record<AncientCorpusId, LemmaSearchResult[]>> {
	const corpora: AncientCorpusId[] = getAllCorpora().map((c) => c.id as AncientCorpusId);
	const results: Record<AncientCorpusId, LemmaSearchResult[]> = {
		af: [],
		philo: [],
		josephus: []
	};

	const responses = await Promise.allSettled(
		corpora.map((cid) => searchLemmas(cid, query, limitPerCorpus))
	);

	responses.forEach((resp, idx) => {
		const cid = corpora[idx];
		if (resp.status === 'fulfilled') {
			results[cid] = resp.value;
		}
	});

	return results;
}

/**
 * Generic scripture citation apparatus: Fetch citation counts grouped by biblical book.
 * Works for any corpus that contains a biblical_citations table (e.g. Philo).
 */
export async function fetchScriptureSummaries(corpusId: AncientCorpusId): Promise<ScriptureBookSummary[]> {
	try {
		const worker = await getDbWorker(corpusId);
		const sql = `
			SELECT book_code, book_name, COUNT(*) as cnt
			FROM biblical_citations
			GROUP BY book_code, book_name
			ORDER BY cnt DESC
		`;
		const rows = await worker.db.query(sql);
		return (rows as any[]).map((r) => ({
			book_code: getRowVal<string>(r, 'book_code', 0),
			book_name: getRowVal<string>(r, 'book_name', 1),
			total_count: getRowVal<number>(r, 'cnt', 2)
		}));
	} catch (err) {
		// Corpora without biblical_citations table (e.g. AF, Josephus) return empty list
		return [];
	}
}

/**
 * Generic scripture citation apparatus: Search biblical citations in corpus treatises.
 * Supports filtering by bookCode, chapter, verse, and workCode.
 */
export async function searchScriptureCitations(
	corpusId: AncientCorpusId,
	options: {
		bookCode?: string;
		chapter?: number;
		verse?: number;
		workCode?: string;
		limit?: number;
	} = {}
): Promise<ScriptureCitation[]> {
	const { bookCode, chapter, verse, workCode, limit = 200 } = options;
	try {
		const worker = await getDbWorker(corpusId);
		let sql = `
			SELECT c.id, c.work_code, c.chapter, c.section, c.work_unit_id,
			       c.book_code, c.book_name, c.bible_chapter, c.bible_verse,
			       c.display_citation, c.raw_citation, t.text_content
			FROM biblical_citations c
			LEFT JOIN text_units t ON t.id = c.work_unit_id
			WHERE 1=1
		`;
		const params: any[] = [];
		if (bookCode) {
			sql += ` AND c.book_code = ?`;
			params.push(bookCode);
		}
		if (chapter !== undefined && chapter > 0) {
			sql += ` AND c.bible_chapter = ?`;
			params.push(chapter);
		}
		if (verse !== undefined && verse > 0) {
			sql += ` AND c.bible_verse = ?`;
			params.push(verse);
		}
		if (workCode) {
			sql += ` AND c.work_code = ?`;
			params.push(workCode);
		}
		sql += ` ORDER BY c.id ASC LIMIT ?`;
		params.push(limit);

		const rows = await worker.db.query(sql, params);
		return (rows as any[]).map((r) => ({
			id: getRowVal<number>(r, 'id', 0),
			work_code: getRowVal<string>(r, 'work_code', 1),
			chapter: getRowVal<number>(r, 'chapter', 2),
			section: getRowVal<number>(r, 'section', 3),
			work_unit_id: getRowVal<number>(r, 'work_unit_id', 4),
			book_code: getRowVal<string>(r, 'book_code', 5),
			book_name: getRowVal<string>(r, 'book_name', 6),
			bible_chapter: getRowVal<number | undefined>(r, 'bible_chapter', 7),
			bible_verse: getRowVal<number | undefined>(r, 'bible_verse', 8),
			display_citation: getRowVal<string>(r, 'display_citation', 9),
			raw_citation: getRowVal<string>(r, 'raw_citation', 10),
			text_snippet: getRowVal<string | undefined>(r, 'text_content', 11)
		}));
	} catch (err) {
		return [];
	}
}

/**
 * Backwards compatibility wrapper for Philo biblical summaries
 */
export async function fetchPhiloBiblicalSummaries(): Promise<BiblicalBookSummary[]> {
	return fetchScriptureSummaries('philo');
}

/**
 * Backwards compatibility wrapper for Philo biblical citations search
 */
export async function searchPhiloBiblicalCitations(
	bookCode?: string,
	workCode?: string,
	limit: number = 100
): Promise<BiblicalCitation[]> {
	return searchScriptureCitations('philo', { bookCode, workCode, limit });
}
