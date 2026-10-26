import { test, expect } from 'vitest';
import lxxLexemes from '$lib/lxx/lxxLexes6.json';
import { GreekUtils } from '$lib/utils/greek-utils.js';
import { Lexeme } from '$lib/Lexeme.js';

test('LXX dataset contains no mangled ἀα/αα verbs or hallucinations', () => {
    const mangled = ['ἀαδίζω', 'ἁαδίζω', 'ἀαθίζω', 'ἀαλύπτω', 'ἀακράν', 'ἀάρειμι', 'ἀάπειμι', 'δοιέω', 'ὁανέω', 'αασιλεύω', 'αατρεύω', 'ααδιάζομαι'];
    for (const m of mangled) {
        expect(lxxLexemes.greek).not.toContain(m);
    }
});

test('LXX plain preserves letter casing for proper nouns', () => {
    const aaronIdx = lxxLexemes.greek.indexOf('Ἀαρών');
    expect(aaronIdx).toBeGreaterThanOrEqual(0);
    expect(lxxLexemes.plain[aaronIdx]).toBe('Ααρων');
    expect(lxxLexemes.plain[aaronIdx].charAt(0)).toBe('Α');
});

test('Case-sensitive search distinguishes lowercase vs uppercase Greek', () => {
    const itemsList = lxxLexemes.plain;

    // Simulate searching lowercase "αα"
    const inputLower = 'αα';
    const caseSensitiveMatchesLower = itemsList.filter(item => item.startsWith(inputLower));
    // Should NOT match "Ααρων"
    expect(caseSensitiveMatchesLower).not.toContain('Ααρων');

    // Simulate searching uppercase "Αα"
    const inputUpper = 'Αα';
    const caseSensitiveMatchesUpper = itemsList.filter(item => item.startsWith(inputUpper));
    // SHOULD match "Ααρων"
    expect(caseSensitiveMatchesUpper).toContain('Ααρων');

    // In case-insensitive mode, searching "αα" matches "Ααρων"
    const caseInsensitiveMatches = itemsList.filter(item => item.toLowerCase().startsWith(inputLower.toLowerCase()));
    expect(caseInsensitiveMatches).toContain('Ααρων');
});

test('Lexeme.makePlain preserves case for Greek', () => {
    expect(Lexeme.makePlain('Ἀαρών', 'greek')).toBe('Ααρων');
    expect(Lexeme.makePlain('λόγος', 'greek')).toBe('λογος');
});
