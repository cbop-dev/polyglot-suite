import { describe, it, expect } from 'vitest';
import {
	normalizeBookName,
	resolveBookCode,
	getBookCanonicalIndex,
	getCanonicalSlug,
	getCanonicalBook,
	getBookForVersion,
	formatBookAbbreviation,
	formatDisplayReference,
	cleanString,
	splitBookChap,
	bookChapVerseToString,
	getBookChapVerseFromRef,
	expandRefs,
	combineRefs,
	standardizeBibleRef,
	filterOutInvalidBooks,
	matchBookName,
	getBookAbbrev,
	getBookOrder,
	sortBooksFunc
} from '../src/index.js';

describe('Ancient Languages: Bible Books & References', () => {
	describe('Book Normalization & USFM Codes', () => {
		it('normalizes various book representations to canonical book definitions', () => {
			const gen = normalizeBookName('Gen');
			expect(gen?.code).toBe('GEN');
			expect(gen?.title).toBe('Genesis');
			expect(gen?.testament).toBe('ot');

			const qoh = normalizeBookName('Qoh');
			expect(qoh?.code).toBe('ECC');
			expect(qoh?.slug).toBe('ecclesiastes');

			const pet = normalizeBookName('2 Pet');
			expect(pet?.code).toBe('2PE');
			expect(pet?.standardAbbrev).toBe('2_Pet');
		});

		it('resolves USFM codes accurately', () => {
			expect(resolveBookCode('Genesis')).toBe('GEN');
			expect(resolveBookCode('1 Samuel')).toBe('1SA');
			expect(resolveBookCode('1 Kingdoms')).toBe('1SA');
			expect(resolveBookCode('Ps')).toBe('PSA');
			expect(resolveBookCode('2 Esdras')).toBe('2ES');
		});

		it('gets version-specific book names', () => {
			expect(getBookForVersion('Qoh', 'BHS')).toBe('Qoh');
			expect(getBookForVersion('Qoh', 'KJV')).toBe('Eccl');
			expect(getBookForVersion('Cant', 'BHS')).toBe('Cant');
			expect(getBookForVersion('Cant', 'KJV')).toBe('Song');
			expect(getBookForVersion('1Mac', 'LXX')).toBe('1Mac');
		});

		it('formats book abbreviations for display', () => {
			expect(formatBookAbbreviation('1_Cor')).toBe('1 Cor');
			expect(formatBookAbbreviation('2_Pet')).toBe('2 Pet');
			expect(formatBookAbbreviation('2Mac')).toBe('2 Mac');
		});

		it('formats display references', () => {
			expect(formatDisplayReference('Qoh 1:2', 'KJV')).toBe('Eccl 1:2');
			expect(formatDisplayReference('Qoh 1:2', 'BHS')).toBe('Qoh 1:2');
			expect(formatDisplayReference('2PE 1:1')).toBe('2 Pet 1:1');
		});
	});

	describe('Reference Parsing & Manipulation', () => {
		it('parses references into book, chapter, and verse', () => {
			expect(getBookChapVerseFromRef('2Sam')).toEqual({ book: '2Sam', chap: null, v: null });
			expect(getBookChapVerseFromRef('2 Sam')).toEqual({ book: '2 Sam', chap: null, v: null });
			expect(getBookChapVerseFromRef('2 Sam 1')).toEqual({ book: '2 Sam', chap: '1', v: null });
			expect(getBookChapVerseFromRef('Isa 58:1-2')).toEqual({ book: 'Isa', chap: '58', v: '1-2' });
		});

		it('converts bookChapVerse object to string', () => {
			expect(bookChapVerseToString({ book: '2 Sam', chap: '1', v: null })).toBe('2 Sam 1');
			expect(bookChapVerseToString({ book: 'Gen', chap: '1', v: '1' })).toBe('Gen 1:1');
		});

		it('expands multi-verse and multi-chapter references', () => {
			expect(expandRefs('Isa 58:1-2')).toEqual(['Isa 58:1', 'Isa 58:2']);
			expect(expandRefs('Gen 1:1,3')).toEqual(['Gen 1:1', 'Gen 1:3']);
			expect(expandRefs('Matt 1:1-3; 2:1')).toEqual(['Matt 1:1', 'Matt 1:2', 'Matt 1:3', 'Matt 2:1']);
		});

		it('combines and consolidates references cleanly', () => {
			const expanded = ['Gen 2', 'Gen 3', 'Gen 4:15', 'Gen 1'].map((r) => expandRefs(r)).flat();
			expect(combineRefs(expanded)).toBe('Gen 1-3; 4:15');

			const samExpanded = ['2 Sam 3'].map((r) => expandRefs(r)).flat();
			expect(combineRefs(samExpanded)).toBe('2 Sam 3');
		});

		it('standardizes bible references with space and underscores', () => {
			expect(standardizeBibleRef('2Kg 2:14')).toBe('2 Kg 2:14');
			expect(standardizeBibleRef('1_Corinthians 1:1')).toBe('1 Corinthians 1:1');
		});

		it('sorts books by authentic canonical order', () => {
			expect(getBookOrder('Exod')).toBeGreaterThan(getBookOrder('Gen'));
			const books = ['Exod', 'Gen'];
			books.sort(sortBooksFunc);
			expect(books).toEqual(['Gen', 'Exod']);
		});

		it('filters out invalid book names', () => {
			expect(filterOutInvalidBooks('Gent')).toBe('');
			expect(filterOutInvalidBooks('Gen')).toBe('Gen');
			expect(filterOutInvalidBooks('isa 58:1-2')).toBe('isa 58:1-2');
		});
	});

	describe('Corpora & Version Metadata (Single Source of Truth)', () => {
		it('resolves corpus metadata by version, id, and alias', async () => {
			const { resolveCorpus, resolveCorpusId, CORPORA_METADATA } = await import('../src/index.js');

			// Check canonical metadata map
			expect(CORPORA_METADATA['sblgnt']).toBeDefined();
			expect(CORPORA_METADATA['sblgnt'].version).toBe('SBLGNT');
			expect(CORPORA_METADATA['sblgnt'].languageName).toBe('Greek');
			expect(CORPORA_METADATA['sblgnt'].primaryDictionary).toBe('lsj');
			expect(CORPORA_METADATA['sblgnt'].hasTokens).toBe(true);

			expect(CORPORA_METADATA['wlc'].version).toBe('BHS');
			expect(CORPORA_METADATA['wlc'].direction).toBe('rtl');
			expect(CORPORA_METADATA['wlc'].primaryDictionary).toBe('bdb');

			// resolveCorpusId
			expect(resolveCorpusId('SBLGNT')).toBe('sblgnt');
			expect(resolveCorpusId('sbl')).toBe('sblgnt');
			expect(resolveCorpusId('BHS')).toBe('wlc');
			expect(resolveCorpusId('wlc')).toBe('wlc');
			expect(resolveCorpusId(41)).toBe('sblgnt');
			expect(resolveCorpusId(2)).toBe('wlc');

			// resolveCorpus polymorphic metadata
			const sbl = resolveCorpus('SBLGNT');
			expect(sbl?.id).toBe('sblgnt');
			expect(sbl?.languageName).toBe('Greek');
			expect(sbl?.testament).toBe('nt');

			const peshitta = resolveCorpus('Peshitta');
			expect(peshitta?.id).toBe('peshitta');
			expect(peshitta?.direction).toBe('rtl');
			expect(peshitta?.primaryDictionary).toBe('sedra');
		});
	});
});
