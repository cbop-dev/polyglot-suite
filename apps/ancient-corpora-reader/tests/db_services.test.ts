import { describe, it, expect } from 'vitest';
import {
	getPrimaryVersionId,
	PRIMARY_GREEK_CORPUS_IDS,
	type AncientCorpusId
} from '../src/lib/services/dbClient.js';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { existsSync } from 'node:fs';

const BUILD_DB_DIR = path.resolve(__dirname, '../build/db');

describe('Multi-Corpus Database Service Layer', () => {
	it('maps primary Greek corpus IDs correctly for all three corpora', () => {
		expect(PRIMARY_GREEK_CORPUS_IDS.af).toBe('lake_grc');
		expect(PRIMARY_GREEK_CORPUS_IDS.philo).toBe('grc');
		expect(PRIMARY_GREEK_CORPUS_IDS.josephus).toBe('josephus_grc');
	});

	it('resolves primary version IDs dynamically via getPrimaryVersionId', () => {
		expect(getPrimaryVersionId('af')).toBe('lake_grc');
		expect(getPrimaryVersionId('philo')).toBe('grc');
		expect(getPrimaryVersionId('josephus')).toBe('josephus_grc');
	});

	it('executes universal division query against canonical SQLite database', () => {
		const afDbPath = path.resolve(BUILD_DB_DIR, 'af.sqlite3');
		expect(existsSync(afDbPath)).toBe(true);
		const db = new DatabaseSync(afDbPath, { readOnly: true });

		const sql = `
			SELECT u.id, u.version_id, u.corpus_id, u.work_code, u.book, u.chapter, u.section,
			       u.section_label, u.display_citation, u.milestone_ref, u.text_content,
			       tok.tokens_json
			FROM text_units u
			LEFT JOIN text_unit_tokens tok ON tok.work_unit_id = u.id
			WHERE u.work_code = ? AND u.book = ? AND u.chapter = ?
			ORDER BY u.section ASC, u.id ASC;
		`;
		const rows = db.prepare(sql).all('1CLE', 1, 1) as any[];
		expect(rows.length).toBeGreaterThan(0);

		// Group by version_id
		const versions = new Set(rows.map((r) => r.version_id));
		expect(versions.has('lake_grc')).toBe(true);
		expect(versions.has('lake_eng')).toBe(true);

		db.close();
	});

	it('executes universal lemma_forms querying without corpus branching', () => {
		for (const corpus of ['af', 'philo', 'josephus'] as const) {
			const dbPath = path.resolve(BUILD_DB_DIR, `${corpus}.sqlite3`);
			expect(existsSync(dbPath)).toBe(true);
			const db = new DatabaseSync(dbPath, { readOnly: true });

			const sql = `
				SELECT forms_json
				FROM lemma_forms
				WHERE lemma_key = ? OR normalized_lemma = ?
				LIMIT 1;
			`;
			const row = db.prepare(sql).get('θεός', 'θεος') as { forms_json: string } | undefined;
			expect(row).toBeDefined();
			if (row) {
				const parsed = JSON.parse(row.forms_json);
				expect(parsed.forms).toBeDefined();
				expect(Array.isArray(parsed.forms)).toBe(true);
				expect(parsed.forms.length).toBeGreaterThan(0);
			}
			db.close();
		}
	});

	it('validates covering concordance_refs query structure for Josephus', () => {
		const josephusDbPath = path.resolve(BUILD_DB_DIR, 'josephus.sqlite3');
		if (!existsSync(josephusDbPath)) return;

		const db = new DatabaseSync(josephusDbPath, { readOnly: true });

		// Verify count query
		const countSql = `
			SELECT COUNT(*) AS total
			FROM concordance_refs
			WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
		`;
		const countRow = db.prepare(countSql).get('josephus_grc', 'λόγος', 'λογος') as any;
		expect(countRow.total).toBeGreaterThan(100);

		// Verify direct covering query on concordance_refs
		const pagedSql = `
			SELECT display_citation, work_unit_id, work_code, 
			       book, chapter, section, niese_section, 
			       matched_form, kwic_snippet
			FROM concordance_refs
			WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
			ORDER BY work_unit_id ASC
			LIMIT ? OFFSET ?
		`;
		const page1 = db.prepare(pagedSql).all('josephus_grc', 'λόγος', 'λογος', 50, 0) as any[];
		expect(page1.length).toBe(50);
		expect(page1[0].display_citation).toBeDefined();
		expect(page1[0].kwic_snippet).toBeDefined();

		const page2 = db.prepare(pagedSql).all('josephus_grc', 'λόγος', 'λογος', 50, 50) as any[];
		expect(page2.length).toBe(50);
		expect(page2[0].work_unit_id).toBeGreaterThan(page1[page1.length - 1].work_unit_id);

		db.close();
	});

	it('validates covering concordance_refs query structure for Philo', () => {
		const philoDbPath = path.resolve(BUILD_DB_DIR, 'philo.sqlite3');
		if (!existsSync(philoDbPath)) return;

		const db = new DatabaseSync(philoDbPath, { readOnly: true });

		const countSql = `
			SELECT COUNT(*) AS total
			FROM concordance_refs
			WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
		`;
		const countRow = db.prepare(countSql).get('grc', 'θεός', 'θεος') as any;
		expect(countRow.total).toBeGreaterThan(200);

		const pagedSql = `
			SELECT display_citation, work_unit_id, work_code, 
			       book, chapter, section, niese_section, 
			       matched_form, kwic_snippet
			FROM concordance_refs
			WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
			ORDER BY work_unit_id ASC
			LIMIT ? OFFSET ?
		`;
		const page1 = db.prepare(pagedSql).all('grc', 'θεός', 'θεος', 50, 0) as any[];
		expect(page1.length).toBe(50);
		expect(page1[0].display_citation).toBeDefined();
		expect(page1[0].kwic_snippet).toBeDefined();

		const page2 = db.prepare(pagedSql).all('grc', 'θεός', 'θεος', 50, 50) as any[];
		expect(page2.length).toBe(50);
		expect(page2[0].work_unit_id).toBeGreaterThan(page1[page1.length - 1].work_unit_id);

		db.close();
	});

	it('validates covering concordance_refs query structure for Apostolic Fathers', () => {
		const afDbPath = path.resolve(BUILD_DB_DIR, 'af.sqlite3');
		if (!existsSync(afDbPath)) return;

		const db = new DatabaseSync(afDbPath, { readOnly: true });

		const countSql = `
			SELECT COUNT(*) AS total
			FROM concordance_refs
			WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
		`;
		const countRow = db.prepare(countSql).get('lake_grc', 'θεός', 'θεος') as any;
		expect(countRow.total).toBeGreaterThan(50);

		const pagedSql = `
			SELECT display_citation, work_unit_id, work_code, 
			       book, chapter, section, niese_section, 
			       matched_form, kwic_snippet
			FROM concordance_refs
			WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
			ORDER BY work_unit_id ASC
			LIMIT ? OFFSET ?
		`;
		const page1 = db.prepare(pagedSql).all('lake_grc', 'θεός', 'θεος', 25, 0) as any[];
		expect(page1.length).toBe(25);
		expect(page1[0].display_citation).toBeDefined();
		expect(page1[0].kwic_snippet).toBeDefined();

		db.close();
	});
});
