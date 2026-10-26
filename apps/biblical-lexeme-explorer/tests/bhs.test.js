
import { LexQuery } from "$lib/components/LexQuery.svelte";
import { Lexeme } from '$lib/Lexeme';
//import { LxxGreekLexeme, TfLxxDataset } from "$lib/lxx/tfLXX";
import { TfBhsDataset } from "$lib/bhs/bhs";
//import {Lexeme} from '$lib/Lexeme';
import * as BibleUtils from "$lib/utils/bible-utils.js";
import { GreekLexeme } from "$lib/Lexeme";
import { test, expect } from 'vitest'

const tfBHS = new TfBhsDataset

test('test', () => {
    expect(true).toBe(true);
})

test('combineRefs test', () => {
    const testData = [
        {
            in: ["Jonah 1:5", "Jonah 1:6"],
            out: "Jonah 1:5-6"
        },
        {
            in: ["Jonah 1:5", "Jonah 1:2", "Jonah 1:6"],
            out: "Jonah 1:2,5-6"
        },
        {
            in: ["2Sam 4:26"],
            out: "2Sam 4:26"
        },
        {
            in: ["SongofSongs"],
            out: "Cant"
        }
        


    ]
    for (const test of testData) {
        expect(tfBHS.booksDict.combineRefs(test.in)).toEqual(test.out);
    }
    expect(true).toBe(true);
});


test('lookupBookAbbrev',()=>{
    expect(true).toBe(true);
    const tests = [
        {input:'2 Sam', output: "2Sam"},
        {input:'Song of Songs', output: "Cant"},
        {input:'Isa', output: "Isa"},
        {input:'isa', output: "Isa"},
        {input:'Isaiah', output: "Isa"},
        {input:'1 Sam', output: "1Sam"},
        {input:'1Sam', output: "1Sam"},
        {input:'1Sa', output: "1Sam"},
        {input:'1 Sa', output: "1Sam"},
        {input:'I Sam', output: "1Sam"},
        {input:'I Sa', output: "1Sam"},
    ]

    for (const t of tests){
      expect(tfBHS.booksDict.lookupBookAbbrev(t.input)).toEqual(t.output);
    }
})

test('filterOutInvalidBooks with Isa and 1Sam',()=>{
    const tests = [
        {input: "Isa", output: "Isa"},
        {input: "Isa 1:1", output: "Isa 1:1"},
        {input: "1 Sam 1", output: "1Sam 1"},
        {input: "1Sa 1", output: "1Sam 1"},
        {input: "I Sa 1", output: "1Sam 1"},
    ];

    for (const t of tests){
        expect(tfBHS.booksDict.filterOutInvalidBooks(t.input)).toEqual(t.output);
    }
});

test('BHS lexemes and BDB dictionary errata: לוט and אכיש', async () => {
    const { bdbProvider } = await import('$lib/engine/BdbProvider.js');
    const { staticDatasetProvider } = await import('$lib/engine/StaticDatasetProvider.js');

    const lutLex = await staticDatasetProvider.getLexInfo('bhs', 3595);
    expect(lutLex).toBeDefined();
    expect(lutLex.strongs).toBe('H3874');
    expect(lutLex.gloss).toBe('enwrap');

    const achishLex = await staticDatasetProvider.getLexInfo('bhs', 367);
    expect(achishLex).toBeDefined();
    expect(achishLex.strongs).toBe('H397');
    expect(achishLex.gloss).toBe('Achish');

    const lutBdb = await bdbProvider.getEntry('לֹּ֖וט', 'לוט');
    expect(lutBdb.found).toBe(true);
    expect(lutBdb.entry.strongs).toBe('H3874');
    expect(lutBdb.entry.def).toContain('H3874. lut');
    expect(lutBdb.entry.def).not.toContain('Akish');

    const achishBdb = await bdbProvider.getEntry('אָכִישׁ', 'אכיש');
    expect(achishBdb.found).toBe(true);
    expect(achishBdb.entry.strongs).toBe('H397');
    expect(achishBdb.entry.def).toContain('H397. Akish');
});
