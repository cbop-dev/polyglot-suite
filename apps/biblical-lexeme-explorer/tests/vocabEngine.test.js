import { VocabEngine } from '$lib/engine/VocabEngine.js';
import { Lexeme } from '$lib/Lexeme.js';
import { LexQuery } from '$lib/components/LexQuery.svelte.js';
import { LxxVocabDataset } from '$lib/lxx/lxxDataset.js';
import { SblGntVocabDataset } from '$lib/sblgnt/sblgntDataset.js';
import { BhsVocabDataset } from '$lib/bhs/bhsDataset.js';
import { test, expect } from 'vitest';

test('VocabEngine.fetchLexInfo for LXX', async () => {
	const lxx = new LxxVocabDataset();
	const lemma = new Lexeme();
	await VocabEngine.fetchLexInfo(8093, lemma, lxx.posDict, 'lxx');
	expect(lemma.id).toBe(8093);
	expect(lemma.lemma).toBe('καί');
	expect(lemma.total).toBe(60263);
});


test('VocabEngine.fetchLexInfo for SBLGNT', async () => {
	const sbl = new SblGntVocabDataset();
	const lemma = new Lexeme();
	await VocabEngine.fetchLexInfo(8253, lemma, sbl.posDict, 'sblgnt');
	expect(lemma.id).toBe(8253);
	expect(lemma.lemma).toBe('Ἀαρών');
	expect(lemma.total).toBe(5);
});

test('VocabEngine.fetchLexInfo for BHS', async () => {
	const bhs = new BhsVocabDataset();
	const lemma = new Lexeme();
	await VocabEngine.fetchLexInfo(1, lemma, bhs.posDict, 'bhs');
	expect(lemma.id).toBe(1);
	expect(lemma.lemma).toBe('אָב');
	expect(lemma.total).toBe(1217);
});

test('VocabEngine.fetchRefs', async () => {
	const query = new LexQuery();
	await VocabEngine.fetchRefs(8093, null, query, 'lxx');
	expect(query.results.refs.length).toBeGreaterThan(0);
	expect(Object.keys(query.results.bookCounts).length).toBeGreaterThan(0);
});

test('VocabEngine.fetchText', async () => {
	const result = await VocabEngine.fetchText(655362, 'lxx');
	expect(result).toHaveProperty('id');
	expect(result).toHaveProperty('section', 'Gen 1:1');
	expect(result.text.toLowerCase()).toContain('ἐν ἀρχῇ');
});

test('VocabEngine cross-app deep link ID verification (theos & elohim)', async () => {
	const lxx = new LxxVocabDataset();
	const theos = new Lexeme();
	await VocabEngine.fetchLexInfo(8110, theos, lxx.posDict, 'lxx');
	expect(theos.id).toBe(8110);
	expect(theos.lemma).toBe('θεός');
	expect(theos.strongs).toBe('G2316');

	const sbl = new SblGntVocabDataset();
	const theosNt = new Lexeme();
	await VocabEngine.fetchLexInfo(8110, theosNt, sbl.posDict, 'sblgnt');
	expect(theosNt.id).toBe(8110);
	expect(theosNt.lemma).toBe('θεός');

	const bhs = new BhsVocabDataset();
	const elohim = new Lexeme();
	await VocabEngine.fetchLexInfo(391, elohim, bhs.posDict, 'bhs');
	expect(elohim.id).toBe(391);
	expect(elohim.lemma).toBe('אֱלֹהִים');
	expect(elohim.strongs).toBe('H430');
});
