import { LexQuery } from "$lib/components/LexQuery.svelte";
import { Lexeme } from '$lib/Lexeme';
import { LxxGreekLexeme, TfLxxDataset } from "$lib/lxx/tfLXX";
//import {Lexeme} from '$lib/Lexeme';
import * as BibleUtils from "$lib/utils/bible-utils.js";
import { GreekLexeme } from "$lib/Lexeme";
import { test, expect } from 'vitest'
const tfLXX = new TfLxxDataset();

test('test', () => {
    expect(true).toBe(true);
})


test('joinInRanges', () => {

    const testData = [
        { in: [3, 2, 1, "2", 6, 5, 6], out: "1-3,5-6" },
        { in: ["2"], out: "2" },
        { in: [2], out: "2" },
        { in: [2, 2], out: "2" },
        { in: [2, "2"], out: "2" },
        { in: [2, 1, 10, "9", "2"], out: "1-2,9-10" },
        { in: [3, 2, 1, 5], out: "1-3,5" },
    ]
    for (const t of testData) {
        expect(tfLXX.booksDict.joinInRanges(t.in)).toEqual(t.out)
    }
    expect(true).toBe(true);
})


test('getRef test', () => {

    const testData = [
        { id: 623705, abbrev: '4Kgdms' }

    ]
    expect(tfLXX.booksDict.getRef(623705)).toBe('4Kgdms');
    for (const test of testData) {
        expect(tfLXX.booksDict.getRef(test.id)).toBe(test.abbrev);
    }
});

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
            out: "2Kgdms 4:26"
        }
        ,
        {
            in: ["4Mac 4:26"],
            out: "4Mac 4:26"
        }
        


    ]
    for (const test of testData) {
        expect(tfLXX.booksDict.combineRefs(test.in)).toEqual(test.out);
    }
    expect(true).toBe(true);
});


test('joinRanges test', () => {
    const testData = [
        {
            in: ["5", "6"],
            out: "5-6"
        },
        {
            in: ["5", "2", "6"],
            out: "2,5-6"
        }


    ]
    for (const test of testData) {
        expect(tfLXX.booksDict.joinInRanges(test.in)).toEqual(test.out);
    }
    expect(true).toBe(true);
})


test('getPosNum', () => {
    const testData = [
        // {desc:'proper noun or name', num: 26},
        { desc: "Noun", pos: Lexeme.PosEnum.NOUN },
    ]
    expect(true).toBe(true);
    expect(Lexeme.PosDict[Lexeme.PosEnum.NOUN]['desc']).toEqual("Noun");
    for (const t of testData) {

        expect(Lexeme.PosDict[t.pos].desc).toEqual(t.desc);



    }
})

test('filterOutInvalidBooks',()=>{
    expect(true).toBe(true);
    const tests = [
        {input:"1 Sam 1; Mark 3", output: "1Kgdms 1"},
        {input:"1 Sam 1:2; Mark 3", output: "1Kgdms 1:2"},
        {input:"1 Sam 1:2; 2 Sam 2:3", output: "1Kgdms 1:2; 2Kgdms 2:3"},
    ]
    expect(tfLXX.booksDict.lookupBookAbbrev("1 Sam")).toBe("1Kgdms");
    expect(BibleUtils.expandRefs("1 Sam 1; Mark 3")[0]).toEqual("1 Sam 1");
    expect(tfLXX.booksDict.combineRefs(["1Sam 1"])).toEqual("1Kgdms 1");

    for (const t of tests){
      
      expect(tfLXX.booksDict.filterOutInvalidBooks(t.input)).toEqual(t.output);
    }

})

test('getRef',()=>{
    expect(true).toBe(true);
    const tests = [
        {input:623703, output: "2Kgdms"},
    ]



    for (const t of tests){
        
      expect(tfLXX.booksDict.getRef(t.input)).toEqual(t.output);
    }

})

test('lookupBookAbbrev',()=>{
    expect(true).toBe(true);
    const tests = [
        {input:'2 Mac', output: "2Mac"},
        {input:'2 Sam', output: "2Kgdms"},
        {input:'Isa', output: "Isa"},
        {input:'isa', output: "Isa"},
        {input:'Isaiah', output: "Isa"},
        {input:'1 Sam', output: "1Kgdms"},
        {input:'1Sam', output: "1Kgdms"},
        {input:'1Sa', output: "1Kgdms"},
        {input:'1 Sa', output: "1Kgdms"},
        {input:'I Sam', output: "1Kgdms"},
        {input:'I Sa', output: "1Kgdms"},
        {input:'1Kgdms', output: "1Kgdms"},
    ]

    for (const t of tests){
      expect(tfLXX.booksDict.lookupBookAbbrev(t.input)).toEqual(t.output);
    }
})

test('filterOutInvalidBooks with Isa and 1Kgdms',()=>{
    const tests = [
        {input: "Isa", output: "Isa"},
        {input: "Isa 1:1", output: "Isa 1:1"},
        {input: "1 Sam 1", output: "1Kgdms 1"},
        {input: "I Sa 1", output: "1Kgdms 1"},
    ];

    for (const t of tests){
        expect(tfLXX.booksDict.filterOutInvalidBooks(t.input)).toEqual(t.output);
    }
});
