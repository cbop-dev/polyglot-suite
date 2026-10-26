
import { LexQuery } from "$lib/components/LexQuery.svelte";
import { Lexeme } from '$lib/Lexeme';
//import { LxxGreekLexeme, TfLxxDataset } from "$lib/lxx/tfLXX";
import { TfSblGntDataset } from "$lib/sblgnt/tfSblGnt.js";
//import {Lexeme} from '$lib/Lexeme';
import * as BibleUtils from "$lib/utils/bible-utils.js";
import { GreekLexeme } from "$lib/Lexeme";
import { test, expect } from 'vitest'

const tfSBL= new TfSblGntDataset()

test('test', () => {
    expect(true).toBe(true);
})

test('combineRefs test', () => {
    const testData = [
        {
            in: ["Jo 1:5", "John 1:6"],
            out: "John 1:5-6"
        },
        /*{
            in: ["Jo 1:5", "John 1:6"],
            out: "John 1:5-6"
        },*/
        {
            in: ["John 1:5", "John 1:2", "John 1:6"],
            out: "John 1:2,5-6"
        },
        {
            in: ["2Cor 4:26"],
            out: "2 Cor 4:26"
        },
        {
            in: ["Romans"],
            out: "Rom"
        }
        


    ]
    for (const test of testData) {
        expect(tfSBL.booksDict.combineRefs(test.in)).toEqual(test.out);
    }
    expect(true).toBe(true);
});


test('lookupBookAbbrev',()=>{
    expect(true).toBe(true);
    const tests = [
        {input:'2 Tim', output: "2 Tim"},
        {input:'Jude', output: "Jude"},
    ]



    for (const t of tests){
        
      expect(tfSBL.booksDict.lookupBookAbbrev(t.input)).toEqual(t.output);
    }

})
