import { getDbWorker } from './dbWorker';

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
		const rawTokens = row.tokens_json ?? row[7];
		let parsedTokens: Token[] | undefined = undefined;
		if (rawTokens) {
			try {
				parsedTokens = typeof rawTokens === 'string' ? JSON.parse(rawTokens) : rawTokens;
			} catch (e) {
				console.warn('Failed to parse tokens JSON:', e);
			}
		}

		const unit: TextUnit = {
			id: (row.id ?? row[0]) as number,
			corpus_id: (row.corpus_id ?? row[1]) as string,
			work_code: (row.work_code ?? row[2]) as string,
			chapter: (row.chapter ?? row[3]) as number,
			section: (row.section ?? row[4]) as number,
			display_citation: (row.display_citation ?? row[5]) as string,
			text_content: (row.text_content ?? row[6]) as string,
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

export function stripGreekAccents(s: string): string {
	if (!s) return '';
	return s
		.normalize('NFD')
		.replace(/[\u0300-\u036f\u1dc0-\u1dff\u1ab0-\u1aff\u1f00-\u1fff]/g, '')
		.normalize('NFC')
		.toLowerCase()
		.replace(/[.,;:·]/g, '')
		.trim();
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
		dictionary: (r.dictionary ?? r[0]) as string,
		strongs_id: (r.strongs_id ?? r[1]) as string | undefined,
		lemma: (r.lemma ?? r[2]) as string,
		normalized_lemma: (r.normalized_lemma ?? r[3]) as string,
		transliteration: (r.transliteration ?? r[4]) as string | undefined,
		gloss: (r.gloss ?? r[5]) as string,
		definition: (r.definition ?? r[6]) as string
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
	const rawCounts = r.work_counts_json ?? r[4];
	let workCounts: Record<string, number> = {};
	if (rawCounts) {
		try {
			workCounts = typeof rawCounts === 'string' ? JSON.parse(rawCounts) : rawCounts;
		} catch (e) {
			console.warn('Failed to parse work_counts_json:', e);
		}
	}

	return {
		corpus_id: (r.corpus_id ?? r[0]) as string,
		lemma: (r.lemma ?? r[1]) as string,
		normalized_lemma: (r.normalized_lemma ?? r[2]) as string,
		total_count: (r.total_count ?? r[3]) as number,
		work_counts: workCounts
	};
}

export async function fetchConcordance(lemma: string): Promise<ConcordanceRef[]> {
	if (!lemma) return [];
	const worker = await getDbWorker();
	const clean = lemma.trim().replace(/[.,;:·]/g, '');

	const sql = `
		SELECT c.display_citation, c.work_unit_id, t.work_code, t.chapter, t.section, t.text_content
		FROM concordance_refs c
		JOIN text_units t ON t.id = c.work_unit_id
		WHERE c.lemma = ?
		ORDER BY t.work_code, t.chapter, t.section
		LIMIT 200
	`;
	const rows = await worker.db.query(sql, [clean]);
	return (rows as any[]).map((r) => ({
		display_citation: (r.display_citation ?? r[0]) as string,
		work_unit_id: (r.work_unit_id ?? r[1]) as number,
		work_code: (r.work_code ?? r[2]) as string,
		chapter: (r.chapter ?? r[3]) as number,
		section: (r.section ?? r[4]) as number,
		text_content: (r.text_content ?? r[5]) as string
	}));
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
		const rawCounts = r.work_counts_json ?? r[3];
		let workCounts: Record<string, number> = {};
		if (rawCounts) {
			try {
				workCounts = typeof rawCounts === 'string' ? JSON.parse(rawCounts) : rawCounts;
			} catch (e) {}
		}
		return {
			lemma: (r.lemma ?? r[0]) as string,
			normalized_lemma: (r.normalized_lemma ?? r[1]) as string,
			total_count: (r.total_count ?? r[2]) as number,
			work_counts: workCounts
		};
	});
}
