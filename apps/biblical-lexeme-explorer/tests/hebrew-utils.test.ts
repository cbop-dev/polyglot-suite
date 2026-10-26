import { test, expect } from 'vitest'
import { HebrewUtils as hu } from '$lib/utils/hebrew-utils.js';
import { Lexeme } from '$lib/Lexeme.js';



test('test', () => {
    expect(true).toBe(true);
})


test('make plain test', () => {
    const hMap = { "אֹמַר": "אמר" };
    for (const [h1, h2] of Object.entries(hMap)) {
        expect(hu.makePlain(h1)).toBe(h2);
    }

})


test('make plain on copy test', () => {
    const hMap = { "אֹמַר": "אמר" };
    for (const [h1, h2] of Object.entries(hMap)) {
        expect(hu.makePlain(h1)).toBe(h2);
        const lemma1 = new Lexeme(1, 'hebrew',h1);
        const lemma2 = new Lexeme();
        lemma2.copyFrom(lemma1);
        expect(lemma1.plain).toBe(h2);
        expect(lemma2.plain).toBe(h2);
        expect(lemma2.plain).toBe(lemma1.plain);

    }

})


test('convert/revert final consonants', () => {
    const tests = [
        { input: "ברכ", output: "ברך" },
        { input: "ברכה", output: "ברכה" },
        { input: "נתנ", output: "נתן" },
        { input: "נתנה", output: "נתנה" },
        { input: "מצ", output: "מץ" },
        { input: "מצא", output: "מצא" },
    ]

    for (const t of tests) {
        const [input, output] = [hu.normalizeHebrew(t.input), hu.normalizeHebrew(t.output)];
        expect(hu.convertFinalConsonant(input)).toBe(output);
        expect(hu.removeFinalConsonants(output)).toBe(input);
    }
});