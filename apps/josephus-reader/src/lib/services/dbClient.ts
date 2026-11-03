import { getDbWorker } from './dbWorker';
import { stripGreekAccents, buildAttestedForms, getDefaultDictionary, type AttestedForm } from '@polyglot/ancient-languages';
import { getRowVal, parseJsonField } from '@polyglot/db-vfs';

export { stripGreekAccents, type AttestedForm };

export interface Token {
	w: string;
	l?: string;
	m?: string;
	p?: string;
	lang?: string;
}

export interface TextUnit {
	id: number;
	corpus_id: 'josephus_grc' | 'josephus_eng' | string;
	work_code: string;
	book: number;
	section_num: number;
	niese_section: string;
	display_citation: string;
	text_content: string;
	tokens?: Token[];
}

export interface LexiconEntry {
	dictionary: string;
	strongs_id?: string;
	lemma: string;
	normalized_lemma: string;
	pos?: string;
	gloss: string;
	definition: string;
}

export interface MorphEntry {
	lemma: string;
	form: string;
	pos: string;
	parse_code: string;
	description: string;
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
	book: number;
	section_num: number;
	niese_section: string;
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

export async function fetchBookSections(
	workCode: string,
	book: number
): Promise<{ greek: TextUnit[]; english: TextUnit[] }> {
	const worker = await getDbWorker();
	const sql = `
		SELECT id, corpus_id, work_code, book, section_num, niese_section, display_citation, text_content, tokens_json
		FROM text_units
		WHERE work_code = ? AND book = ?
		ORDER BY id ASC
	`;
	const rows = await worker.db.query(sql, [workCode, book]);

	const greek: TextUnit[] = [];
	const english: TextUnit[] = [];

	for (const row of rows as any[]) {
		const rawTokens = getRowVal(row, 'tokens_json', 8);
		const parsedTokens = parseJsonField<Token[] | undefined>(rawTokens);

		const unit: TextUnit = {
			id: getRowVal<number>(row, 'id', 0),
			corpus_id: getRowVal<string>(row, 'corpus_id', 1),
			work_code: getRowVal<string>(row, 'work_code', 2),
			book: getRowVal<number>(row, 'book', 3),
			section_num: getRowVal<number>(row, 'section_num', 4),
			niese_section: getRowVal<string>(row, 'niese_section', 5),
			display_citation: getRowVal<string>(row, 'display_citation', 6),
			text_content: getRowVal<string>(row, 'text_content', 7),
			tokens: parsedTokens
		};

		if (unit.corpus_id === 'josephus_grc') {
			greek.push(unit);
		} else if (unit.corpus_id === 'josephus_eng') {
			english.push(unit);
		}
	}

	return { greek, english };
}

export async function fetchLexiconEntry(lemma: string): Promise<LexiconEntry | null> {
	if (!lemma) return null;
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');
	const dict = getDefaultDictionary('josephus');
	const dictAlt = dict === dict.toLowerCase() ? dict.toUpperCase() : dict.toLowerCase();

	// Step 1: Direct indexed seek on idx_lexicon_exact (dictionary, lemma)
	let rows = (await worker.db.query(
		`SELECT dictionary, strongs_id, lemma, normalized_lemma, pos, gloss, definition
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
				`SELECT dictionary, strongs_id, lemma, normalized_lemma, pos, gloss, definition
				 FROM lexicon_entries
				 WHERE dictionary IN (?, ?) AND normalized_lemma = ?
				 LIMIT 1`,
				[dict, dictAlt, norm]
			)) as any[];
		}
	}

	if (!rows || rows.length === 0) return null;

	const r = rows[0] as any;
	return {
		dictionary: getRowVal<string>(r, 'dictionary', 0),
		strongs_id: getRowVal<string | undefined>(r, 'strongs_id', 1),
		lemma: getRowVal<string>(r, 'lemma', 2),
		normalized_lemma: getRowVal<string>(r, 'normalized_lemma', 3),
		pos: getRowVal<string | undefined>(r, 'pos', 4),
		gloss: getRowVal<string>(r, 'gloss', 5),
		definition: getRowVal<string>(r, 'definition', 6)
	};
}

export async function fetchWordMorph(word: string): Promise<MorphEntry | null> {
	if (!word) return null;
	const worker = await getDbWorker();
	const clean = word.trim().replace(/^[«»"'()\[\]†*—·.,;:]+|[«»"'()\[\]†*—·.,;:]+$/g, '');
	const cleanLower = clean.toLowerCase();

	const sql = `
		SELECT lemma, form, pos, parse_code, description
		FROM attested_forms
		WHERE form = ? OR form = ?
		LIMIT 1
	`;
	const rows = await worker.db.query(sql, [clean, cleanLower]);
	if (!rows || rows.length === 0) return null;

	const r = rows[0] as any;
	return {
		lemma: getRowVal<string>(r, 'lemma', 0),
		form: getRowVal<string>(r, 'form', 1),
		pos: getRowVal<string>(r, 'pos', 2),
		parse_code: getRowVal<string>(r, 'parse_code', 3),
		description: getRowVal<string>(r, 'description', 4)
	};
}

export async function fetchLemmaStats(lemma: string): Promise<LemmaStat | null> {
	if (!lemma) return null;
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');

	// Step 1: Direct indexed seek on PRIMARY KEY (corpus_id, lemma)
	let rows = (await worker.db.query(
		`SELECT corpus_id, lemma, normalized_lemma, total_count, work_counts_json
		 FROM lemma_stats
		 WHERE corpus_id = 'grc' AND lemma = ?
		 LIMIT 1`,
		[clean]
	)) as any[];

	// Step 2: Fallback to normalized lemma with LIMIT 1 if exact match misses
	if (!rows || rows.length === 0) {
		const norm = stripGreekAccents(clean);
		if (norm !== clean) {
			rows = (await worker.db.query(
				`SELECT corpus_id, lemma, normalized_lemma, total_count, work_counts_json
				 FROM lemma_stats
				 WHERE corpus_id = 'grc' AND normalized_lemma = ?
				 LIMIT 1`,
				[norm]
			)) as any[];
		}
	}

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
	const norm = stripGreekAccents(clean);

	const sql = `
		WITH top_refs AS (
			SELECT display_citation, work_unit_id
			FROM concordance_refs
			WHERE corpus_id = 'josephus_grc' AND (lemma = ? OR lemma = ?)
			ORDER BY work_unit_id ASC
			LIMIT 200
		)
		SELECT r.display_citation, r.work_unit_id, t.work_code, t.book, t.section_num, t.niese_section, t.text_content
		FROM top_refs r
		JOIN text_units t ON t.id = r.work_unit_id
	`;
	const rows = await worker.db.query(sql, [clean, norm]);
	return (rows as any[]).map((r) => {
		return {
			display_citation: getRowVal<string>(r, 'display_citation', 0),
			work_unit_id: getRowVal<number>(r, 'work_unit_id', 1),
			work_code: getRowVal<string>(r, 'work_code', 2),
			book: getRowVal<number>(r, 'book', 3),
			section_num: getRowVal<number>(r, 'section_num', 4),
			niese_section: getRowVal<string>(r, 'niese_section', 5),
			text_content: getRowVal<string>(r, 'text_content', 6),
			matched_word: clean,
			matched_words: [clean]
		};
	});
}

export async function fetchAttestedFormsForLemma(lemma: string): Promise<AttestedForm[]> {
	if (!lemma) return [];
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');

	const sql = `
		SELECT lemma, form, pos, parse_code, description
		FROM attested_forms
		WHERE lemma = ?
		ORDER BY form ASC
	`;
	const rows = await worker.db.query(sql, [clean]);
	const rawItems = (rows as any[]).map((r) => {
		const form = getRowVal<string>(r, 'form', 1);
		return {
			lemma: getRowVal<string>(r, 'lemma', 0),
			form,
			word: form,
			pos: getRowVal<string>(r, 'pos', 2),
			parse: getRowVal<string>(r, 'parse_code', 3),
			description: getRowVal<string>(r, 'description', 4)
		};
	});

	return buildAttestedForms(rawItems);
}

export async function searchLemmata(query: string, limit = 50): Promise<LemmaSearchResult[]> {
	if (!query) return [];
	const worker = await getDbWorker();
	const clean = query.trim().replace(/[.,;:·]/g, '');
	const norm = stripGreekAccents(clean);

	const sql = `
		SELECT lemma, normalized_lemma, total_count, work_counts_json
		FROM lemma_stats
		WHERE normalized_lemma LIKE ? OR lemma LIKE ?
		ORDER BY total_count DESC
		LIMIT ?
	`;
	const rows = await worker.db.query(sql, [`${norm}%`, `${clean}%`, limit]);
	return (rows as any[]).map((r) => ({
		lemma: getRowVal<string>(r, 'lemma', 0),
		normalized_lemma: getRowVal<string>(r, 'normalized_lemma', 1),
		total_count: getRowVal<number>(r, 'total_count', 2),
		work_counts: parseJsonField<Record<string, number>>(getRowVal(r, 'work_counts_json', 3), {})
	}));
}
