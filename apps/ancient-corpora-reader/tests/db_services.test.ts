import { describe, it, expect } from 'vitest';
import {
	PRIMARY_GREEK_CORPUS_IDS,
	type AncientCorpusId
} from '../src/lib/services/dbClient.js';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { existsSync } from 'node:fs';

describe('Multi-Corpus Database Service Layer', () => {
	it('maps primary Greek corpus IDs correctly for all three corpora', () => {
		expect(PRIMARY_GREEK_CORPUS_IDS.af).toBe('lake_grc');
		expect(PRIMARY_GREEK_CORPUS_IDS.philo).toBe('grc');
		expect(PRIMARY_GREEK_CORPUS_IDS.josephus).toBe('josephus_grc');
	});

	it('validates paginated CTE query structure for Josephus', () => {
		const josephusDbPath = path.resolve(__dirname, '../../josephus-reader/static/db/josephus.sqlite3');
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

		// Verify CTE pagination pushdown query
		const pagedSql = `
			WITH top_refs AS (
				SELECT display_citation, work_unit_id
				FROM concordance_refs
				WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
				ORDER BY work_unit_id ASC
				LIMIT ? OFFSET ?
			)
			SELECT r.display_citation, r.work_unit_id, t.work_code, t.book, t.section_num, t.niese_section, t.text_content
			FROM top_refs r
			JOIN text_units t ON t.id = r.work_unit_id;
		`;
		const page1 = db.prepare(pagedSql).all('josephus_grc', 'λόγος', 'λογος', 50, 0) as any[];
		expect(page1.length).toBe(50);
		expect(page1[0].display_citation).toBeDefined();
		expect(page1[0].text_content).toBeDefined();

		const page2 = db.prepare(pagedSql).all('josephus_grc', 'λόγος', 'λογος', 50, 50) as any[];
		expect(page2.length).toBe(50);
		expect(page2[0].work_unit_id).toBeGreaterThan(page1[page1.length - 1].work_unit_id);

		db.close();
	});

	it('validates paginated CTE query structure for Philo', () => {
		const philoDbPath = path.resolve(__dirname, '../../philo-reader/pipeline/build/philo.sqlite3');
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
			WITH top_refs AS (
				SELECT display_citation, work_unit_id
				FROM concordance_refs
				WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
				ORDER BY work_unit_id ASC
				LIMIT ? OFFSET ?
			)
			SELECT r.display_citation, r.work_unit_id, t.work_code, t.chapter, t.section, t.text_content
			FROM top_refs r
			JOIN text_units t ON t.id = r.work_unit_id;
		`;
		const page1 = db.prepare(pagedSql).all('grc', 'θεός', 'θεος', 50, 0) as any[];
		expect(page1.length).toBe(50);
		expect(page1[0].display_citation).toBeDefined();

		const page2 = db.prepare(pagedSql).all('grc', 'θεός', 'θεος', 50, 50) as any[];
		expect(page2.length).toBe(50);
		expect(page2[0].work_unit_id).toBeGreaterThan(page1[page1.length - 1].work_unit_id);

		db.close();
	});

	it('validates paginated CTE query structure for Apostolic Fathers', () => {
		const afDbPath = path.resolve(__dirname, '../../apostolic-fathers-reader/pipeline/build/apostolic-fathers.sqlite3');
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
			WITH top_refs AS (
				SELECT display_citation, work_unit_id
				FROM concordance_refs
				WHERE corpus_id = ? AND (lemma = ? OR lemma = ?)
				ORDER BY work_unit_id ASC
				LIMIT ? OFFSET ?
			)
			SELECT r.display_citation, r.work_unit_id, t.work_code, t.chapter, t.section, t.text_content
			FROM top_refs r
			JOIN text_units t ON t.id = r.work_unit_id;
		`;
		const page1 = db.prepare(pagedSql).all('lake_grc', 'θεός', 'θεος', 25, 0) as any[];
		expect(page1.length).toBe(25);
		expect(page1[0].display_citation).toBeDefined();

		db.close();
	});

	it('aggregates total occurrences for Greek article variations in Philo lemma_stats', () => {
		const philoDbPath = path.resolve(__dirname, '../../philo-reader/pipeline/build/philo.sqlite3');
		if (!existsSync(philoDbPath)) return;

		const db = new DatabaseSync(philoDbPath, { readOnly: true });

		const statsSql = `
			SELECT corpus_id, lemma, normalized_lemma, total_count, work_counts_json
			FROM lemma_stats
			WHERE corpus_id = ? AND (lemma = ? OR normalized_lemma = ?)
			ORDER BY
				CASE
					WHEN lemma = ? THEN 1
					WHEN normalized_lemma = ? THEN 2
					ELSE 3
				END ASC,
				total_count DESC
		`;
		const rows = db.prepare(statsSql).all('grc', 'ὅ', 'ο', 'ὅ', 'ο') as any[];
		expect(rows.length).toBeGreaterThan(1);

		let totalSum = 0;
		for (const r of rows) {
			totalSum += r.total_count;
		}

		// Verify the sum reflects the full corpus occurrences (~52,500+) rather than 1
		expect(totalSum).toBeGreaterThan(50000);

		db.close();
	});
});
