import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const BUILD_DB_DIR = resolve(__dirname, '../build/db');

const REQUIRED_TABLES: Record<string, string[]> = {
	corpus_versions: ['id', 'language', 'title', 'version_label', 'direction', 'order_index'],
	corpus_works: ['code', 'slug', 'order_index', 'category', 'abbrev', 'title_english', 'total_divisions', 'division_label'],
	text_units: ['id', 'version_id', 'work_code', 'book', 'chapter', 'section', 'display_citation', 'milestone_ref', 'text_content'],
	text_unit_tokens: ['work_unit_id', 'tokens_json'],
	concordance_refs: ['corpus_id', 'lemma', 'work_unit_id', 'display_citation', 'work_code', 'matched_form', 'kwic_snippet'],
	lexicon_entries: ['id', 'dictionary', 'lemma', 'normalized_lemma', 'pos', 'transliteration', 'gloss', 'definition'],
	lemma_forms: ['id', 'corpus_id', 'lemma_key', 'normalized_lemma', 'forms_json']
};

describe('Database Schema Conformance', () => {
	const corpora = ['af', 'josephus', 'philo'];

	for (const corpus of corpora) {
		describe(`Corpus Database: ${corpus}`, () => {
			const dbPath = resolve(BUILD_DB_DIR, `${corpus}.sqlite3`);

			it(`compiled database exists at ${corpus}.sqlite3`, () => {
				expect(existsSync(dbPath)).toBe(true);
			});

			it(`implements all 7 canonical tables and required columns`, () => {
				const db = new DatabaseSync(dbPath, { readOnly: true });

				const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
				const tableNames = new Set(tables.map((t) => t.name));

				for (const [tbl, reqCols] of Object.entries(REQUIRED_TABLES)) {
					expect(tableNames.has(tbl), `Table '${tbl}' should exist in ${corpus}.sqlite3`).toBe(true);

					const pragma = db.prepare(`PRAGMA table_info(${tbl})`).all() as { name: string }[];
					const colNames = new Set(pragma.map((c) => c.name));

					for (const col of reqCols) {
						expect(colNames.has(col), `Column '${col}' should exist in table '${tbl}'`).toBe(true);
					}
				}

				db.close();
			});

			it(`has precomputed lemma_forms with > 0 records`, () => {
				const db = new DatabaseSync(dbPath, { readOnly: true });
				const row = db.prepare('SELECT COUNT(*) as count FROM lemma_forms').get() as { count: number };
				expect(row.count).toBeGreaterThan(0);
				db.close();
			});

			it(`has backward-compatibility views 'corpora' and 'canonical_works'`, () => {
				const db = new DatabaseSync(dbPath, { readOnly: true });
				const corporaCount = db.prepare('SELECT COUNT(*) as count FROM corpora').get() as { count: number };
				expect(corporaCount.count).toBeGreaterThan(0);

				const worksCount = db.prepare('SELECT COUNT(*) as count FROM canonical_works').get() as { count: number };
				expect(worksCount.count).toBeGreaterThan(0);
				db.close();
			});
		});
	}
});
