import { describe, it, expect } from 'vitest';
import {
	latinToGreek,
	transliterateLatinToGreek,
	latinToHebrew,
	toPlainGreek,
	stripGreekAccents,
	normalizeGreekSearch,
	toPlainHebrew,
	transliterate,
	findMatchInText,
	getKwicSnippet,
	formatHebrew,
	formatGreek,
	decodeMorph,
	decodeGreekMorph,
	decodeHebrewMorph,
	formatMorphBadges,
	parseHebrewMorphSegments
} from '../src/index.js';

describe('@polyglot/ancient-languages', () => {
	describe('Greek transliteration & normalization', () => {
		it('transliterates basic Latin Beta Code to Greek', () => {
			expect(latinToGreek('logos')).toBe('λογος');
			expect(latinToGreek('en arxh')).toBe('εν αρξη');
			expect(latinToGreek('c')).toBe('χ');
			expect(latinToGreek('q')).toBe('θ');
			expect(latinToGreek('f')).toBe('φ');
			expect(latinToGreek('y')).toBe('ψ');
			expect(latinToGreek('w')).toBe('ω');
		});

		it('supports digraphs in transliterateLatinToGreek', () => {
			expect(transliterateLatinToGreek('theos')).toBe('θεος');
			expect(transliterateLatinToGreek('christos')).toBe('χριστος');
			expect(transliterateLatinToGreek('psalmos')).toBe('ψαλμος');
			expect(transliterateLatinToGreek('philosophia')).toBe('φιλοσοφια');
		});

		it('normalizes Greek and strips polytonic accents', () => {
			expect(toPlainGreek('λόγος')).toBe('λογοσ');
			expect(toPlainGreek('Ἐν ἀρχῇ')).toBe('εν αρχη');
			expect(stripGreekAccents('Ἰησοῦς')).toBe('ιησους');
			expect(normalizeGreekSearch('Χριστός!')).toBe('χριστοσ');
		});

		it('formats Greek diacritics toggle', () => {
			expect(formatGreek('λόγος', true)).toBe('λόγος');
			expect(formatGreek('λόγος', false)).toBe('λογος');
		});

		it('finds match in text and extracts KWIC snippet', () => {
			const text = 'Ἐν ἀρχῇ ἦν ὁ λόγος καὶ ὁ λόγος ἦν πρὸς τὸν θεόν';
			const match = findMatchInText(text, 'logos');
			expect(match).not.toBeNull();

			const snippet = getKwicSnippet(text, 'logos');
			expect(snippet.match).toBe('λόγος');
		});
	});

	describe('Hebrew transliteration & normalization', () => {
		it('transliterates Latin to Hebrew with final consonants', () => {
			expect(latinToHebrew('b')).toBe('ב');
			expect(latinToHebrew('adm')).toBe('אדם');
			expect(latinToHebrew('mlk')).toBe('מלך');
		});

		it('normalizes pointed Hebrew', () => {
			expect(toPlainHebrew('בְּרֵאשִׁית')).toBe('בראשית');
			expect(toPlainHebrew('אָדָם')).toBe('אדמ');
		});

		it('formats Hebrew diacritics by mode', () => {
			const pointed = 'בְּרֵאשִׁית';
			expect(formatHebrew(pointed, 'all')).toBe(pointed);
			expect(formatHebrew(pointed, 'none')).toBe('בראשׁית');
		});
	});

	describe('Morphological decoders', () => {
		it('decodes PROIEL Apostolic Fathers morphology', () => {
			const res = decodeMorph('V-', '-AMN----');
			expect(res.pos).toBe('Verb');
			expect(res.details).toEqual(['Aorist Middle Infinitive']);
			expect(res.summary).toBe('Verb • Aorist Middle Infinitive');

			const res2 = decodeMorph('V-', '3AAI-S--');
			expect(res2.pos).toBe('Verb');
			expect(res2.details).toEqual(['Aorist Active Indicative', '3rd Person Singular']);
		});

		it('decodes Swete LXX and MorphGNT Greek morphology', () => {
			expect(decodeGreekMorph('V-AAI-3S')).toEqual([
				'Verb',
				'Aorist Active Indicative',
				'3rd Person Singular'
			]);
			expect(decodeGreekMorph('V- 3AAI-S--')).toEqual([
				'Verb',
				'Aorist Active Indicative',
				'3rd Person Singular'
			]);
		});

		it('decodes Hebrew morphology & prefixes', () => {
			const parsed = parseHebrewMorphSegments('Prep-b | N-fs');
			expect(parsed.prefixes).toHaveLength(1);
			expect(parsed.prefixes[0].prefix).toBe('בְּ');
			expect(parsed.stem).toBe('N-fs');

			expect(decodeHebrewMorph('V-qp3ms')).toEqual([
				'Verb',
				'Qal Perfect',
				'3rd Person Masculine Singular'
			]);
			expect(formatMorphBadges('Prep-b | N-fs', 'hebrew')).toEqual([
				'Preposition בְּ',
				'Noun',
				'Feminine Singular'
			]);
		});
	});
});
