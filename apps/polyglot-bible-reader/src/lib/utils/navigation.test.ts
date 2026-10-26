import { describe, it, expect } from 'vitest';
import { getLexemeExplorerUrl } from './navigation.js';

describe('getLexemeExplorerUrl', () => {
	it('generates a URL with id, lemma, panel, and corpus for Greek LXX', () => {
		const url = getLexemeExplorerUrl({
			corpusId: 'lxx',
			id: 8110,
			lemma: 'θεός',
			panel: 'lex'
		});
		expect(url).toContain('/lxx/?');
		expect(url).toContain('id=8110');
		expect(url).toContain('panel=lex');
		expect(url).toContain('lemma=');
	});

	it('generates a URL with lexemeId alias for Hebrew BHS', () => {
		const url = getLexemeExplorerUrl({
			corpusId: 'wlc',
			lexemeId: 391,
			lemma: 'אֱלֹהִים',
			panel: 'lex'
		});
		expect(url).toContain('/bhs/?');
		expect(url).toContain('id=391');
		expect(url).toContain('panel=lex');
	});

	it('maps NT Greek versions to sblgnt with id', () => {
		const url = getLexemeExplorerUrl({
			version: 'OpenGNT',
			id: 8110,
			lemma: 'θεός'
		});
		expect(url).toContain('/sblgnt/?');
		expect(url).toContain('id=8110');
	});

	it('generates book chapter refs links', () => {
		const url = getLexemeExplorerUrl({
			book: 'GEN',
			chapter: 1,
			verse: 1,
			panel: 'book'
		});
		expect(url).toContain('/bhs/?');
		expect(url).toContain('panel=book');
		expect(url).toContain('refs=');
	});
});
