import * as bibleUtils from './bible-utils.js';

/**
 * Generates a deep link URL into the Polyglot Bible Reader for a given reference and database.
 * @param {string} refString - Biblical reference string (e.g. "Gen 1:1", "Exod 3:14", "Matt 5:3")
 * @param {string} [dbAbbrev='lxx'] - Corpus identifier ('lxx', 'bhs', or 'sblgnt')
 * @returns {string} URL to polyglot-bible-reader
 */
export function getReaderVerseUrl(refString, dbAbbrev = 'lxx') {
	const rawBase =
		import.meta.env.PUBLIC_BIBLE_APP_URL ||
		(import.meta.env.DEV ? 'http://localhost:5173' : '/polyglot-suite/bible');
	const cleanBase = rawBase.replace(/\/+$/, '');

	if (!refString) return `${cleanBase}/`;
	const bcv = bibleUtils.getBookChapVerseFromRef(refString.trim());
	if (!bcv?.book) return `${cleanBase}/`;

	let version = 'LXX';
	const abbrev = (dbAbbrev || '').toLowerCase();
	if (abbrev === 'bhs') {
		version = 'BHS';
	} else if (abbrev === 'sblgnt') {
		version = 'SBLGNT';
	} else if (abbrev === 'lxx') {
		version = 'LXX';
	}

	const params = new URLSearchParams();
	params.set('version', version);
	params.set('book', bcv.book);
	if (bcv.chap) params.set('chapter', String(bcv.chap));
	if (bcv.v) {
		// Take first verse in case of a range like "1-5" or "1,3"
		const firstV = String(bcv.v).split(/[,-]/)[0].trim();
		if (firstV) params.set('verse', firstV);
	}

	return `${cleanBase}/?${params.toString()}`;
}
