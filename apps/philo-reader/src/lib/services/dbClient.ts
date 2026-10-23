import { getDbWorker } from './dbWorker';
import { stripGreekAccents, buildAttestedForms, type AttestedForm } from '@polyglot/ancient-languages';
import { getRowVal, parseJsonField } from '@polyglot/db-vfs';

export { stripGreekAccents, type AttestedForm };

export interface Token {
	w: string;
	l?: string;
	m?: string;
	p?: string;
	lang?: string;
	type?: 'word' | 'citation' | 'apparatus' | string;
	book_code?: string;
	book_name?: string;
	bible_chapter?: number;
	bible_verse?: number;
	display?: string;
	raw?: string;
}

export interface BiblicalCitation {
	id: number;
	work_code: string;
	chapter: number;
	section: number;
	work_unit_id: number;
	book_code: string;
	book_name: string;
	bible_chapter?: number;
	bible_verse?: number;
	display_citation: string;
	raw_citation: string;
}

export interface TextUnit {
	id: number;
	corpus_id: 'grc' | 'eng' | string;
	work_code: string;
	chapter: number;
	section: number;
	display_citation: string;
	mangey_ref?: string;
	is_supplement: number;
	text_content: string;
	tokens?: Token[];
}

export interface LexiconEntry {
	dictionary: string;
	strongs_id?: string;
	lemma: string;
	normalized_lemma: string;
	transliteration?: string;
	gloss: string;
	definition: string;
}

export interface LemmaStat {
	corpus_id: string;
	lemma: string;
	normalized_lemma: string;
	total_count: number;
	work_counts: Record<string, number>;
}

export interface ConcordanceRef {
	display_citation: string;
	work_unit_id: number;
	work_code: string;
	chapter: number;
	section: number;
	text_content: string;
	matched_word?: string;
	matched_words?: string[];
}

export interface LemmaSearchResult {
	lemma: string;
	normalized_lemma: string;
	total_count: number;
	work_counts: Record<string, number>;
}

export interface FtsSearchResult {
	work_code: string;
	chapter: number;
	section: number;
	corpus_id: string;
	display_citation: string;
	text_content: string;
}

export async function fetchChapterSections(
	workCode: string,
	chapter: number
): Promise<{ greek: TextUnit[]; english: TextUnit[] }> {
	const worker = await getDbWorker();
	const sql = `
		SELECT id, corpus_id, work_code, chapter, section, display_citation, mangey_ref, is_supplement, text_content, tokens_json
		FROM text_units
		WHERE work_code = ? AND chapter = ?
		ORDER BY section ASC, corpus_id ASC
	`;
	const rows = await worker.db.query(sql, [workCode, chapter]);

	const greek: TextUnit[] = [];
	const english: TextUnit[] = [];

	for (const row of rows as any[]) {
		const rawTokens = getRowVal(row, 'tokens_json', 9);
		const parsedTokens = parseJsonField<Token[] | undefined>(rawTokens);

		const unit: TextUnit = {
			id: getRowVal<number>(row, 'id', 0),
			corpus_id: getRowVal<string>(row, 'corpus_id', 1),
			work_code: getRowVal<string>(row, 'work_code', 2),
			chapter: getRowVal<number>(row, 'chapter', 3),
			section: getRowVal<number>(row, 'section', 4),
			display_citation: getRowVal<string>(row, 'display_citation', 5),
			mangey_ref: getRowVal<string | undefined>(row, 'mangey_ref', 6),
			is_supplement: getRowVal<number>(row, 'is_supplement', 7),
			text_content: getRowVal<string>(row, 'text_content', 8),
			tokens: parsedTokens
		};

		if (unit.corpus_id === 'grc') {
			greek.push(unit);
		} else if (unit.corpus_id === 'eng') {
			english.push(unit);
		}
	}

	return { greek, english };
}

export async function fetchLexiconEntry(lemma: string): Promise<LexiconEntry | null> {
	if (!lemma) return null;
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');
	const norm = stripGreekAccents(clean);

	const sql = `
		SELECT dictionary, strongs_id, lemma, normalized_lemma, transliteration, gloss, definition
		FROM lexicon_entries
		WHERE normalized_lemma = ? OR lemma = ?
		LIMIT 1
	`;
	const rows = await worker.db.query(sql, [norm, clean]);
	if (!rows || rows.length === 0) return null;

	const r = rows[0] as any;
	return {
		dictionary: getRowVal<string>(r, 'dictionary', 0),
		strongs_id: getRowVal<string | undefined>(r, 'strongs_id', 1),
		lemma: getRowVal<string>(r, 'lemma', 2),
		normalized_lemma: getRowVal<string>(r, 'normalized_lemma', 3),
		transliteration: getRowVal<string | undefined>(r, 'transliteration', 4),
		gloss: getRowVal<string>(r, 'gloss', 5),
		definition: getRowVal<string>(r, 'definition', 6)
	};
}

export async function fetchLemmaStats(lemma: string): Promise<LemmaStat | null> {
	if (!lemma) return null;
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');
	const norm = stripGreekAccents(clean);

	const sql = `
		SELECT corpus_id, lemma, normalized_lemma, total_count, work_counts_json
		FROM lemma_stats
		WHERE lemma = ? OR normalized_lemma = ?
		LIMIT 1
	`;
	const rows = await worker.db.query(sql, [clean, norm]);
	if (!rows || rows.length === 0) return null;

	const r = rows[0] as any;
	const rawCounts = getRowVal(r, 'work_counts_json', 4);
	const workCounts = parseJsonField<Record<string, number>>(rawCounts, {});

	return {
		corpus_id: getRowVal<string>(r, 'corpus_id', 0),
		lemma: getRowVal<string>(r, 'lemma', 1),
		normalized_lemma: getRowVal<string>(r, 'normalized_lemma', 2),
		total_count: getRowVal<number>(r, 'total_count', 3),
		work_counts: workCounts
	};
}

export async function fetchConcordance(lemma: string): Promise<ConcordanceRef[]> {
	if (!lemma) return [];
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');

	const sql = `
		SELECT c.display_citation, c.work_unit_id, t.work_code, t.chapter, t.section, t.text_content, t.tokens_json
		FROM concordance_refs c
		JOIN text_units t ON t.id = c.work_unit_id
		WHERE c.lemma = ?
		ORDER BY t.work_code, t.chapter, t.section
		LIMIT 200
	`;
	const rows = await worker.db.query(sql, [clean]);
	return (rows as any[]).map((r) => {
		const rawTokens = getRowVal<string | undefined>(r, 'tokens_json', 6);
		const tokens = parseJsonField<Token[] | undefined>(rawTokens);
		const matchedWords: string[] = [];

		if (tokens) {
			for (const tok of tokens) {
				if (tok.l === clean || tok.l === lemma) {
					const surface = tok.w.replace(/[.,;:·’—\s]/g, '').trim();
					if (surface && !matchedWords.includes(surface)) {
						matchedWords.push(surface);
					}
				}
			}
		}

		return {
			display_citation: getRowVal<string>(r, 'display_citation', 0),
			work_unit_id: getRowVal<number>(r, 'work_unit_id', 1),
			work_code: getRowVal<string>(r, 'work_code', 2),
			chapter: getRowVal<number>(r, 'chapter', 3),
			section: getRowVal<number>(r, 'section', 4),
			text_content: getRowVal<string>(r, 'text_content', 5),
			matched_word: matchedWords[0] || clean,
			matched_words: matchedWords
		};
	});
}

export async function searchLemmas(query: string, limit: number = 30): Promise<LemmaSearchResult[]> {
	if (!query.trim()) return [];
	const worker = await getDbWorker();
	const clean = query.trim();
	const norm = stripGreekAccents(clean);
	const qNorm = `%${norm}%`;
	const qRaw = `%${clean}%`;

	const sql = `
		SELECT lemma, normalized_lemma, total_count, work_counts_json
		FROM lemma_stats
		WHERE normalized_lemma LIKE ? OR lemma LIKE ?
		ORDER BY total_count DESC
		LIMIT ?
	`;
	const rows = await worker.db.query(sql, [qNorm, qRaw, limit]);
	return (rows as any[]).map((r) => {
		const rawCounts = getRowVal(r, 'work_counts_json', 3);
		const workCounts = parseJsonField<Record<string, number>>(rawCounts, {});

		return {
			lemma: getRowVal<string>(r, 'lemma', 0),
			normalized_lemma: getRowVal<string>(r, 'normalized_lemma', 1),
			total_count: getRowVal<number>(r, 'total_count', 2),
			work_counts: workCounts
		};
	});
}

export async function searchFts(query: string, corpusId?: string, limit: number = 50): Promise<FtsSearchResult[]> {
	if (!query.trim()) return [];
	const worker = await getDbWorker();
	const clean = query.trim().replace(/['"*]/g, '');
	if (!clean) return [];

	let sql = `
		SELECT work_code, chapter, section, corpus_id, display_citation, text_content
		FROM text_units_fts
		WHERE text_units_fts MATCH ?
	`;
	const params: any[] = [clean];

	if (corpusId) {
		sql += ` AND corpus_id = ?`;
		params.push(corpusId);
	}

	sql += ` LIMIT ?`;
	params.push(limit);

	const rows = await worker.db.query(sql, params);
	return (rows as any[]).map((r) => ({
		work_code: getRowVal<string>(r, 'work_code', 0),
		chapter: getRowVal<number>(r, 'chapter', 1),
		section: getRowVal<number>(r, 'section', 2),
		corpus_id: getRowVal<string>(r, 'corpus_id', 3),
		display_citation: getRowVal<string>(r, 'display_citation', 4),
		text_content: getRowVal<string>(r, 'text_content', 5)
	}));
}

export async function fetchAttestedForms(lemma: string): Promise<AttestedForm[]> {
	if (!lemma) return [];
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');

	const sql = `
		SELECT t.tokens_json
		FROM concordance_refs c
		JOIN text_units t ON t.id = c.work_unit_id
		WHERE c.lemma = ?
	`;
	const rows = await worker.db.query(sql, [clean]);
	const rawItems: { word: string; pos?: string; morph?: string }[] = [];

	for (const row of rows as any[]) {
		const raw = getRowVal<string | undefined>(row, 'tokens_json', 0);
		const tokens = parseJsonField<Token[] | undefined>(raw);
		if (!tokens) continue;

		for (const tok of tokens) {
			if (tok.l === clean || tok.l === lemma) {
				rawItems.push({
					word: tok.w,
					pos: tok.p,
					morph: tok.m
				});
			}
		}
	}

	return buildAttestedForms(rawItems, { canonicalize: true, lang: 'greek' });
}

export async function searchBiblicalCitations(
	bookCode?: string,
	chapter?: number,
	verse?: number
): Promise<BiblicalCitation[]> {
	const worker = await getDbWorker();
	let sql = `
		SELECT id, work_code, chapter, section, work_unit_id, book_code, book_name, bible_chapter, bible_verse, display_citation, raw_citation
		FROM biblical_citations
		WHERE 1=1
	`;
	const params: any[] = [];
	if (bookCode) {
		sql += ` AND book_code = ?`;
		params.push(bookCode);
	}
	if (chapter !== undefined) {
		sql += ` AND bible_chapter = ?`;
		params.push(chapter);
	}
	if (verse !== undefined) {
		sql += ` AND bible_verse = ?`;
		params.push(verse);
	}
	sql += ` ORDER BY work_code, chapter, section LIMIT 100`;

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
		raw_citation: getRowVal<string>(r, 'raw_citation', 10)
	}));
}

