import { describe, it, expect } from 'vitest';
import { lsjProvider, getGreekBucket, removeDiacritics, isCapitalized } from '../src/lib/engine/LsjProvider.js';

describe('LsjProvider Helpers', () => {
	it('correctly maps Greek initial letters to buckets', () => {
		expect(getGreekBucket('λόγος')).toBe('lambda');
		expect(getGreekBucket('ἀνίστημι')).toBe('alpha');
		expect(getGreekBucket('πορεύομαι')).toBe('pi');
		expect(getGreekBucket('γίνομαι')).toBe('gamma');
		expect(getGreekBucket('ψυχή')).toBe('psi');
		expect(getGreekBucket('ὦ')).toBe('omega');
		expect(getGreekBucket('')).toBe('other');
	});

	it('strips accents and normalizes diacritics', () => {
		expect(removeDiacritics('ἀγάπη')).toBe('αγαπη');
		expect(removeDiacritics('κηλιδόομαι')).toBe('κηλιδοομαι');
		expect(removeDiacritics('βίβλος')).toBe('βιβλοσ');
		expect(removeDiacritics('γινώσκω')).toBe('γινωσκω');
	});

	it('identifies capitalized proper nouns', () => {
		expect(isCapitalized('Ἀδάμ')).toBe(true);
		expect(isCapitalized('Δαυίδ')).toBe(true);
		expect(isCapitalized('λόγος')).toBe(false);
		expect(isCapitalized('ἀγάπη')).toBe(false);
	});
});

describe('LsjProvider Entry Lookup', () => {
	it('finds exact match for standard Greek lemma (λόγος)', async () => {
		const res = await lsjProvider.getEntry('λόγος');
		expect(res.found).toBe(true);
		expect(res.entry?.headword).toContain('λο');
		expect(res.entry?.def).toContain('λόγος');
	});

	it('finds deponent verb aligned to active headword (πορεύομαι -> πορεύω)', async () => {
		const res = await lsjProvider.getEntry('πορεύομαι');
		expect(res.found).toBe(true);
		expect(res.entry?.matchType).toBe('deponent_to_active');
		expect(res.entry?.headword).toContain('πορευ');
	});

	it('finds pronoun override (μου -> ἐγώ)', async () => {
		const res = await lsjProvider.getEntry('μου');
		expect(res.found).toBe(true);
		expect(res.entry?.matchType).toBe('manual_override');
		expect(res.entry?.headword).toContain('ἐγω');
	});

	it('handles proper noun gracefully when not in classical LSJ', async () => {
		const res = await lsjProvider.getEntry('Ἀδάμ');
		expect(res.isProper).toBe(true);
		expect(res.found).toBe(false);
	});
});
