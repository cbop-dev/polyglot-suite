import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

describe('Josephus SQLite Database Sanity Suite', () => {
	const dbPath = path.resolve(__dirname, '../static/db/josephus.sqlite3');
	const configPath = path.resolve(__dirname, '../static/db/config.json');

	it('has generated database with 4096 page size', () => {
		expect(existsSync(dbPath)).toBe(true);
		const db = new DatabaseSync(dbPath, { readOnly: true });
		const row = db.prepare('PRAGMA page_size').get() as any;
		expect(row.page_size).toBe(4096);
		db.close();
	});

	it('contains 4 canonical works and valid metadata', () => {
		const db = new DatabaseSync(dbPath, { readOnly: true });
		const works = db.prepare('SELECT code, total_books, title_english FROM canonical_works ORDER BY order_index').all() as any[];
		expect(works.length).toBe(4);
		expect(works.map(w => w.code)).toEqual(['Antiquities', 'War', 'Life', 'Apion']);
		expect(works[0].total_books).toBe(20);
		expect(works[1].total_books).toBe(7);
		expect(works[2].total_books).toBe(1);
		expect(works[3].total_books).toBe(2);
		db.close();
	});

	it('contains parallel Greek and English text units with token metadata', () => {
		const db = new DatabaseSync(dbPath, { readOnly: true });
		const counts = db.prepare('SELECT corpus_id, count(*) as count FROM text_units GROUP BY corpus_id').all() as any[];
		const grcCount = counts.find(c => c.corpus_id === 'josephus_grc')?.count;
		const engCount = counts.find(c => c.corpus_id === 'josephus_eng')?.count;

		expect(grcCount).toBe(2304);
		expect(engCount).toBe(2304);

		// First section of Antiquities Book 1
		const firstSec = db.prepare("SELECT text_content, tokens_json FROM text_units WHERE work_code='Antiquities' AND book=1 AND corpus_id='josephus_grc' ORDER BY id LIMIT 1").get() as any;
		expect(firstSec.text_content).toContain('Τοῖς τὰς ἱστορίας');

		const tokens = JSON.parse(firstSec.tokens_json);
		expect(tokens.length).toBeGreaterThan(10);
		expect(tokens[0].w).toBe('Τοῖς');
		expect(tokens[0].l).toBe('ὁ');

		db.close();
	});

	it('returns rich LSJ dictionary definition for ποιεω', () => {
		const db = new DatabaseSync(dbPath, { readOnly: true });
		const entry = db.prepare("SELECT lemma, gloss, definition FROM lexicon_entries WHERE lemma='ποιέω'").get() as any;
		expect(entry).toBeDefined();
		expect(entry.gloss).toContain('make, do');
		expect(entry.definition).toContain('Dor. ποιϝέω');
		db.close();
	});

	it('returns morphological parsing from attested_forms for inflections', () => {
		const db = new DatabaseSync(dbPath, { readOnly: true });
		const form = db.prepare("SELECT lemma, pos, parse_code, description FROM attested_forms WHERE form='ποιήσομεν'").get() as any;
		expect(form).toBeDefined();
		expect(form.lemma).toBe('ποιέω');
		expect(form.pos).toBe('verb');
		expect(form.parse_code).toBe('Fut Ind Act 1p');
		db.close();
	});

	it('has valid VFS chunking config.json', () => {
		expect(existsSync(configPath)).toBe(true);
		const config = JSON.parse(readFileSync(configPath, 'utf-8'));
		expect(config.serverMode).toBe('chunked');
		expect(config.requestChunkSize).toBe(4096);
		expect(config.urlPrefix).toBe('josephus.db.');
		expect(config.serverChunkSize).toBe(5242880);
	});
});
