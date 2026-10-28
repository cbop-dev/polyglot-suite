/**
 * Canonical Book Mapping, Normalization, and Abbreviation Service.
 *
 * Backed by auto-generated definitions in `canonicalBooks.generated.ts`
 * produced directly from SQLite `canonical_books`.
 */

import {
	CANONICAL_BOOK_DEFINITIONS,
	type CanonicalBook,
	cleanKey,
	normalizeBookName,
	resolveBookCode,
	getBookCanonicalIndex,
	getCanonicalSlug,
	getCanonicalBook,
	getCanonicalBookChapters
} from './canonicalBooks.generated.js';

export type BookDefinition = CanonicalBook;
export {
	CANONICAL_BOOK_DEFINITIONS,
	cleanKey,
	normalizeBookName,
	resolveBookCode,
	getBookCanonicalIndex,
	getCanonicalSlug,
	getCanonicalBook,
	getCanonicalBookChapters
};

/**
 * Standard abbreviation map mapping canonical abbreviations to known synonyms/aliases.
 */
export const bookAbbrevMap: Record<string, string[]> = {
	/* OT */
	'Gen': ['Genesis', 'Ge'],
	'Exod': ['Exodus'],
	'Lev': ['Leviticus'],
	'Num': ['Numbers'],
	'Deut': ['Deuteronomy', 'Dt', 'Deu'],
	'Josh': ['Joshua'],
	'Judg': ['Judges', 'Jdg', 'Jdgs', 'Judgs'],
	'Ruth': ['Ruth'],
	'1 Sam': ['1 Samuel', 'I Samuel', '1 Sa', '1 Sam', 'I Sa', 'I Sam'],
	'2 Sam': ['2 Samuel', 'II Samuel', '2 Sa', '2 Sam', 'II Sa', 'II Sam'],
	'1 Kgs': ['1 Kings', 'I Kings', '1 Kg', 'I Kg'],
	'2 Kgs': ['2 Kings', 'II Kings', '2 Kg', 'II Kg'],
	'1 Kgdms': ['1 Kingdoms', 'I Kingdoms', 'I Kgdms'],
	'2 Kgdms': ['2 Kingdoms', 'II Kingdoms', 'II Kgdms'],
	'3 Kgdms': ['3 Kingdoms', 'III Kingdoms', 'III Kgdms'],
	'4 Kgdms': ['4 Kingdoms', 'IV Kingdoms', 'IV Kgdms'],
	'1 Chr': ['1 Chronicles', '1 Chron', '1 Ch', 'I Chronicales', 'I Chron', 'I Ch'],
	'2 Chr': ['2 Chronicles', '2 Chron', '2 Ch', 'II Chronicales', 'II Chron', 'II Ch'],
	'Ezra': ['Ezra'],
	'Neh': ['Nehemiah'],
	'Tob': ['Tobit'],
	'Jdt': ['Judith'],
	'Esth': ['Esther', 'Est'],
	'1 Macc': ['1 Maccabees', '1 Macc', '1 Mac', '1 Maccab', 'I Macc', 'I Mac', 'I Maccab'],
	'2 Macc': ['2 Maccabees', '2 Macc', '2 Mac', '2 Maccab', 'II Macc', 'II Mac', 'II Maccab'],
	'3 Macc': ['3 Maccabees', '3 Macc', '3 Mac', '3 Maccab', 'III Macc', 'III Mac', 'III Maccab'],
	'4 Macc': ['4 Maccabees', '4 Macc', '4 Mac', '4 Maccab', 'IV Macc', 'IV Mac', 'IV Maccab'],
	'Job': ['Job'],
	'Ps(s)': ['Psalms', 'Psalm', 'Ps'],
	'Prov': ['Proverbs'],
	'Eccl': ['Ecclesiastes', 'Qoheleth', 'Qoh'],
	'Song': ['Song of Songs', 'Song of Solomon', 'Canticles', 'Cant'],
	'Wis': ['Wisdom of Solomon', 'Wisdom', 'Wisd'],
	'Sir': ['Sirach', 'Ecclesiasticus'],
	'Isa': ['Isaiah', 'Isa', 'Is'],
	'Jer': ['Jeremiah'],
	'Lam': ['Lamentations'],
	'Bar': ['Baruch'],
	'Ezek': ['Ezekiel'],
	'Dan': ['Daniel'],
	'Hos': ['Hosea'],
	'Joel': ['Joel'],
	'Amos': ['Amos'],
	'Obad': ['Obadiah'],
	'Jonah': ['Jonah'],
	'Mic': ['Micah'],
	'Nah': ['Nahum'],
	'Hab': ['Habakkuk'],
	'Zeph': ['Zephaniah'],
	'Hag': ['Haggai'],
	'Zech': ['Zechariah'],
	'Mal': ['Malachi'],
	/* NT */
	'Matt': ['Matthew', 'Mt'],
	'Mark': ['Mark', 'Mk'],
	'Luke': ['Luke', 'Lk'],
	'John': ['John', 'Jn'],
	'Acts': ['Acts'],
	'Rom': ['Romans', 'Ro'],
	'1 Cor': ['1 Corinthians', '1 Cor', 'I Corinthians', 'I Cor', '1 Co', 'I Co'],
	'2 Cor': ['2 Corinthians', '2 Cor', 'II Corinthians', 'II Cor', '2 Co', 'II Co'],
	'Gal': ['Galatians', 'Ga'],
	'Eph': ['Ephesians'],
	'Phil': ['Philippians', 'Php'],
	'Col': ['Colossians'],
	'1 Thess': ['1 Thessalonians', '1 Thess', 'I Thessalonians', 'I Thess', '1 Th', 'I Th'],
	'2 Thess': ['2 Thessalonians', '2 Thess', 'II Thessalonians', 'II Thess', '2 Th', 'II Th'],
	'1 Tim': ['1 Timothy', '1 Tim', 'I Timothy', 'I Tim', '1 Ti', 'I Ti'],
	'2 Tim': ['2 Timothy', '2 Tim', 'II Timothy', 'II Tim', '2 Ti', 'II Ti'],
	'Titus': ['Titus', 'Tit'],
	'Phlm': ['Philemon'],
	'Heb': ['Hebrews'],
	'Jas': ['James'],
	'1 Pet': ['1 Peter', '1 Pet', 'I Peter', 'I Pet', '1 Pe', 'I Pe', '1 P', 'I P'],
	'2 Pet': ['2 Peter', '2 Pet', 'II Peter', 'II Pet', '2 Pe', 'II Pe', '2 P', 'II P'],
	'1 John': ['1 John', 'I John', '1 Jn', 'I Jn', '1 J', 'I J'],
	'2 John': ['2 John', 'II John', '2 Jn', 'II Jn', '2 J', 'II J'],
	'3 John': ['3 John', 'III John', '3 Jn', 'III Jn', '3 J', 'III J'],
	'Jude': ['Jude'],
	'Rev': ['Revelation']
};

// Expand abbreviations to include underscored and no-space variants
for (const [key, aliases] of Object.entries(bookAbbrevMap)) {
	const expanded = new Set(aliases);
	const toCheck = [...aliases, key];
	for (const name of toCheck) {
		if (name.includes(' ')) {
			expanded.add(name.replaceAll(' ', '_'));
			const noSpace = name.replaceAll(' ', '');
			if (key === 'Isa' || noSpace.toLowerCase() !== 'isa') {
				expanded.add(noSpace);
			}
		}
	}
	bookAbbrevMap[key] = Array.from(expanded);
}

export const bibleRefReverseLookupHash: Record<string, string> = {};

export function buildbibleRefReverseLookupHash(): void {
	Object.keys(bookAbbrevMap).forEach((abbrev) => {
		bookAbbrevMap[abbrev].forEach((bookName) => {
			bibleRefReverseLookupHash[abbrev] = abbrev;
			if (abbrev.toLowerCase() !== abbrev) {
				bibleRefReverseLookupHash[abbrev.toLowerCase()] = abbrev;
			}
			bibleRefReverseLookupHash[bookName] = abbrev;
			if (bookName.toLowerCase() !== bookName) {
				bibleRefReverseLookupHash[bookName.toLowerCase()] = abbrev;
			}
		});
	});
}
buildbibleRefReverseLookupHash();

/**
 * Given a book identifier and a Bible version, returns the preferred abbreviation/symbol
 * for that version (e.g. 'Qoh' for BHS vs 'Eccl' for KJV). If none found, returns empty string.
 */
export function getBookForVersion(bookIdentifier: string, version: string, chapter?: number): string {
	const canonical = normalizeBookName(bookIdentifier);
	if (!canonical) return '';

	if (canonical.versionBooks && canonical.versionBooks[version]) {
		return canonical.versionBooks[version]!;
	}

	return canonical.standardAbbrev;
}

/**
 * Backward-compatible helper matching legacy getBookFile(version, canonicalBook, chapter?).
 */
export function getBookFile(version: string, canonicalBook: string, chapter?: number): string {
	return getBookForVersion(canonicalBook, version, chapter);
}

/**
 * Formats a book abbreviation for user display:
 * - Replaces underscores with spaces (e.g. '1_Cor' -> '1 Cor', '2_Pet' -> '2 Pet')
 * - Adds a space after a leading number (e.g. '2Mac' -> '2 Mac', '1Sam' -> '1 Sam')
 */
export function formatBookAbbreviation(name?: string | null): string {
	if (!name) return '';
	return name.replace(/_/g, ' ').replace(/^([1-4])\s*([a-zA-Z])/, '$1 $2').trim();
}

/**
 * Formats any reference string (e.g. "2PE 1:1" or "ECC 1:2" or "Qoh 1:2") into a human-readable reference,
 * prioritizing versionBooks for the given version (e.g. "Qoh 1:2" for BHS vs "Eccl 1:2" for KJV),
 * falling back to standardAbbrev (e.g. "2 Pet 1:1").
 */
export function formatDisplayReference(ref?: string | null, version?: string): string {
	if (!ref) return '';
	const trimmed = ref.trim();
	const parts = trimmed.split(' ');
	if (parts.length >= 2) {
		const bookPart = parts.slice(0, -1).join(' ');
		const cvPart = parts[parts.length - 1];
		const versionBook = getBookForVersion(bookPart, version || '');
		const displayBook = formatBookAbbreviation(versionBook || bookPart);
		return `${displayBook} ${cvPart}`;
	} else {
		const versionBook = getBookForVersion(trimmed, version || '');
		return formatBookAbbreviation(versionBook || trimmed);
	}
}

/**
 * Match input string 'lookup' with Bible book names or abbreviations.
 * Falls back to fuzzy / substring search if not an exact match.
 */
export function matchBookName(lookup: string, booksDict: any = null): string {
	if (!lookup) return '';
	if (booksDict?.lookupBookAbbrev) {
		return booksDict.lookupBookAbbrev(lookup);
	}
	const low = lookup.toLowerCase();
	if (bibleRefReverseLookupHash[low]) {
		const abbrev = bibleRefReverseLookupHash[low];
		return bookAbbrevMap[abbrev]?.[0] || abbrev;
	}
	for (const b in bibleRefReverseLookupHash) {
		if (b.toLowerCase().startsWith(low)) {
			return b;
		}
	}
	for (const b in bibleRefReverseLookupHash) {
		if (b.toLowerCase().includes(low)) {
			return b;
		}
	}
	const canon = normalizeBookName(lookup);
	if (canon) return canon.title;

	return '';
}

/**
 * Resolves a book name or alias to its primary standard abbreviation.
 */
export function getBookAbbrev(lookup: string): string {
	const match = matchBookName(lookup);
	return match ? bibleRefReverseLookupHash[match] || '' : '';
}

/**
 * Returns the sort order index for a book.
 */
export function getBookOrder(bookName: string, booksDict: any = null): number {
	let order = -1;
	const abbrev = getBookAbbrev(bookName);
	if (abbrev) {
		if (booksDict) {
			const found = Object.values(booksDict).map((b: any, i: number) => [b.syn, i]).find(([syn]: any) => syn?.includes?.(abbrev));
			if (found && (found as any).length > 1) order = (found as any)[1];
		} else {
			const found = matchBookName(abbrev);
			if (found) order = Object.keys(bookAbbrevMap).indexOf(abbrev);
		}
	}
	return order;
}

/**
 * Compare function to sort books by their canonical Bible order.
 */
export function sortBooksFunc(b1: string, b2: string, booksDict: any = null): number {
	return getBookOrder(b1, booksDict) - getBookOrder(b2, booksDict);
}
