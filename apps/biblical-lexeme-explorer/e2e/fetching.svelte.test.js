//import { expect, test } from '@playwright/test';
//import { LexQuery } from "$lib/components/LexQuery.svelte";
//import { tfLxxBooksDict, TF} from "$lib/lxx/tfLXX";


async function runServer(){

}
/*
test('pos fetch test',async ()=>{
    const nouns = [
    477801,
    ]
const adjs = [
    48973,
]
    const names = [
        251793,251829,252217,253034
    ]
    
    expect(true).toBe(true);
    for (const n of nouns){
        let query = new LexQuery()
        query.sections.push(n)
        ////console.debug("query.sections = " + query.sections.join(','));
        await TF.fetchLexemes(query);
       // ////console.debug(Object.entries(query.response.lexemes));
       expect(query.ready).toBe(true)
       expect(query.results.lexemeArray[0].posNum).toBe(0);
       expect(true).toBe(true);
    }

    expect(true).toBe(true);
    for (const adj of adjs){
        let query = new LexQuery()
        query.sections.push(adj)
        ////console.debug("query.sections = " + query.sections.join(','));
        await TF.fetchLexemes(query);
       // ////console.debug(Object.entries(query.response.lexemes));
       expect(query.ready).toBe(true)
       expect(query.results.lexemeArray[0].posNum).toBe(2);
       expect(true).toBe(true);
    }


    for (const n of names){
        let query = new LexQuery()
        query.sections.push(n)
        ////console.debug("query.sections = " + query.sections.join(','));
        await TF.fetchLexemes(query);
       // ////console.debug(Object.entries(query.response.lexemes));
       expect(query.ready).toBe(true)
       expect(query.results.lexemeArray[0].posNum).toBe(26);
       expect(true).toBe(true);
    }
})
*/