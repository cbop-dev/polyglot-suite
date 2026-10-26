import { test, expect } from 'vitest';
import { VocabEngine } from '$lib/engine/VocabEngine.js';
import { LexQuery } from '$lib/components/LexQuery.svelte.js';
import { Lexeme } from '$lib/Lexeme.js';
import { LxxVocabDataset } from '$lib/lxx/lxxDataset.js';
import { SblGntVocabDataset } from '$lib/sblgnt/sblgntDataset.js';
import { BhsVocabDataset } from '$lib/bhs/bhsDataset.js';

test('Lexemes have valid POS enums and descriptions across all datasets', async () => {
  const configs = [
    { db: 'lxx', ds: new LxxVocabDataset() },
    { db: 'sblgnt', ds: new SblGntVocabDataset() },
    { db: 'bhs', ds: new BhsVocabDataset() }
  ];

  for (const { db, ds } of configs) {
    const firstChapId = Number(Object.keys(Object.values(ds.booksDict.chapters)[0])[0]);
    const query = new LexQuery([firstChapId]);
    await VocabEngine.fetchLexemes(query, true, ds, db);

    expect(query.results.lexemeArray.length).toBeGreaterThan(0);

    for (const lex of query.results.lexemeArray.slice(0, 20)) {
      expect(lex.posEnums).toBeDefined();
      expect(lex.posEnums.length).toBeGreaterThan(0);

      for (const p of lex.posEnums) {
        expect(typeof p).toBe('number');
        expect(isNaN(p)).toBe(false);

        // Verify Lexeme.PosDict[p] access does not throw and has desc
        const directDesc = Lexeme.PosDict[p]?.desc;
        expect(directDesc).toBeDefined();
        expect(typeof directDesc).toBe('string');

        const helperDesc = Lexeme.getPosFromEnum(p)?.desc;
        expect(helperDesc).toBeDefined();
        expect(typeof helperDesc).toBe('string');
      }
    }
  }
});

test('Lexeme.PosDict handles invalid or NaN keys safely via Proxy', () => {
  expect(Lexeme.PosDict[NaN].desc).toBe('Unspecified');
  expect(Lexeme.PosDict[undefined].desc).toBe('Unspecified');
  expect(Lexeme.PosDict['invalid'].desc).toBe('Unspecified');
  expect(Lexeme.getPosFromEnum(NaN).desc).toBe('Unspecified');
  expect(Lexeme.getPosFromEnum(9999).desc).toBe('Unspecified');
});
