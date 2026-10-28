import { describe, it, expect } from 'vitest';
import { getReaderVerseUrl } from '$lib/utils/navigation.js';
import * as BibleUtils from '$lib/utils/bible-utils.js';

describe('BLE Reader Navigation & Cross-Tradition Alignment', () => {
	it('generates reader URL for BHS reference (e.g. Ps 50:1)', () => {
		const url = getReaderVerseUrl('Ps 50:1', 'bhs');
		const parsed = new URL(url, 'http://localhost');
		expect(parsed.searchParams.get('version')).toBe('BHS');
		expect(parsed.searchParams.get('book')).toBe('Ps');
		expect(parsed.searchParams.get('chapter')).toBe('50');
		expect(parsed.searchParams.get('verse')).toBe('1');
	});

	it('generates reader URL for LXX reference (e.g. Ps 49:1 aligned to BHS Ps 50:1)', () => {
		const url = getReaderVerseUrl('Ps 49:1', 'lxx');
		const parsed = new URL(url, 'http://localhost');
		expect(parsed.searchParams.get('version')).toBe('LXX');
		expect(parsed.searchParams.get('book')).toBe('Ps');
		expect(parsed.searchParams.get('chapter')).toBe('49');
		expect(parsed.searchParams.get('verse')).toBe('1');
	});

	it('handles verse ranges by selecting first verse (e.g. Gen 1:1-5 -> verse 1)', () => {
		const url = getReaderVerseUrl('Gen 1:1-5', 'lxx');
		const parsed = new URL(url, 'http://localhost');
		expect(parsed.searchParams.get('chapter')).toBe('1');
		expect(parsed.searchParams.get('verse')).toBe('1');
	});

	it('maps SBLGNT to OpenGNT version alias', () => {
		const url = getReaderVerseUrl('John 1:1', 'sblgnt');
		const parsed = new URL(url, 'http://localhost');
		expect(parsed.searchParams.get('version')).toBe('OpenGNT');
		expect(parsed.searchParams.get('book')).toBe('John');
		expect(parsed.searchParams.get('chapter')).toBe('1');
	});

	it('standardizes and resolves book names across traditions', () => {
		expect(BibleUtils.standardizeBibleRef('2Sam 3:1')).toBe('2 Sam 3:1');
		expect(BibleUtils.getBookForVersion('Qoh', 'BHS')).toBe('Qoh');
		expect(BibleUtils.getBookForVersion('Qoh', 'LXX')).toBe('Qoh');
		expect(BibleUtils.getBookForVersion('Qoh', 'KJV')).toBe('Eccl');
	});
});
