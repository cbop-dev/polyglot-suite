import { getDbWorker } from './dbWorker';
import { stripGreekAccents } from '@polyglot/ancient-languages';
import { getRowVal, parseJsonField } from '@polyglot/db-vfs';

export { stripGreekAccents };

export interface Token {
	w: string;
	l: string;
	m: string;
	p: string;
	lang: string;
}

export interface TextUnit {
	id: number;
	corpus_id: string;
	work_code: string;
	chapter: number;
	section: number;
	display_citation: string;
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

export async function fetchChapterSections(
	workCode: string,
	chapter: number
): Promise<{ greek: TextUnit[]; english: TextUnit[]; latin: TextUnit[] }> {
	const worker = await getDbWorker();
	const sql = `
		SELECT id, corpus_id, work_code, chapter, section, display_citation, text_content, tokens_json
		FROM text_units
		WHERE work_code = ? AND chapter = ?
		ORDER BY section ASC, corpus_id ASC
	`;
	const rows = await worker.db.query(sql, [workCode, chapter]);

	const greek: TextUnit[] = [];
	const english: TextUnit[] = [];
	const latin: TextUnit[] = [];

	for (const row of rows as any[]) {
		const rawTokens = getRowVal(row, 'tokens_json', 7);
		const parsedTokens = parseJsonField<Token[] | undefined>(rawTokens);

		const unit: TextUnit = {
			id: getRowVal<number>(row, 'id', 0),
			corpus_id: getRowVal<string>(row, 'corpus_id', 1),
			work_code: getRowVal<string>(row, 'work_code', 2),
			chapter: getRowVal<number>(row, 'chapter', 3),
			section: getRowVal<number>(row, 'section', 4),
			display_citation: getRowVal<string>(row, 'display_citation', 5),
			text_content: getRowVal<string>(row, 'text_content', 6),
			tokens: parsedTokens
		};

		if (unit.corpus_id === 'lake_grc') {
			greek.push(unit);
		} else if (unit.corpus_id === 'lake_eng') {
			english.push(unit);
		} else if (unit.corpus_id === 'lake_lat') {
			latin.push(unit);
		}
	}

	return { greek, english, latin };
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

export interface AttestedForm {
	form: string;
	count: number;
}

export async function fetchAttestedForms(lemma: string): Promise<AttestedForm[]> {
	if (!lemma) return [];
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');

	// Fetch all text units that contain occurrences of this lemma in their tokens
	const sql = `
		SELECT t.tokens_json
		FROM concordance_refs c
		JOIN text_units t ON t.id = c.work_unit_id
		WHERE c.lemma = ?
	`;
	const rows = await worker.db.query(sql, [clean]);
	const counts: Record<string, number> = {};

	for (const row of rows as any[]) {
		const raw = getRowVal<string | undefined>(row, 'tokens_json', 0);
		const tokens = parseJsonField<Token[] | undefined>(raw);
		if (!tokens) continue;

		for (const tok of tokens) {
			if (tok.l === clean || tok.l === lemma) {
				// Strip surface punctuation from word for form counting
				const surface = tok.w.replace(/[.,;:·’—\s]/g, '').trim();
				if (surface) {
					counts[surface] = (counts[surface] || 0) + 1;
				}
			}
		}
	}

	return Object.entries(counts)
		.map(([form, count]) => ({ form, count }))
		.sort((a, b) => b.count - a.count || a.form.localeCompare(b.form));
}
