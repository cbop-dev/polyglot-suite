/**
 * Biblical Reference Parsing, Validation, Expansion, and Formatting Utilities.
 */

import { matchBookName, sortBooksFunc } from './bookMapping.js';

export interface BookChapVerse {
	book: string | null;
	chap: string | null;
	v: string | null;
}

/**
 * Normalizes multi-spaces and underscores to single spaces.
 */
export function cleanString(str: string): string {
	if (!str) return '';
	return str.replaceAll(/[\s_]+/g, ' ').trim();
}

export function cleanNumString(numString: string): string {
	return cleanString(numString);
}

/**
 * Parses a comma-separated list of numbers and number ranges into an array of integers.
 * E.g., "1,2,4-7" -> [1, 2, 4, 5, 6, 7]
 */
export function createNumArrayFromStringListRange(numString: string): number[] {
	numString = cleanNumString(numString);
	if (!numString) return [];
	const nums: number[] = [];
	const sepGroups = numString.split(',');
	for (const group of sepGroups) {
		const ranges = group.split('-');
		const min = parseInt(ranges[0], 10);
		const max = ranges.length > 1 ? parseInt(ranges[1], 10) : null;

		if (ranges.length > 2) {
			return [];
		} else if (ranges.length === 2 && max !== null) {
			if (min <= max) {
				for (let i = min; i <= max; i++) {
					if (!nums.includes(i)) nums.push(i);
				}
			}
		} else if (ranges.length === 1 && !isNaN(min)) {
			if (!nums.includes(min)) nums.push(min);
		}
	}
	return nums.sort((a, b) => a - b);
}

/**
 * Splits a reference string into book and chapter.
 * E.g., "Gen 1" -> { book: "Gen", chap: "1" }
 */
export function splitBookChap(string: string): { book: string | null; chap: string | null } {
	const matches = cleanString(string).match(/^(([1-4]+ *)?[a-zA-Z ]+)( +([0-9a-z-]+))?$/);
	let theBook: string | null = null;
	let theChap: string | null = null;

	if (matches && matches.length >= 5) {
		theBook = matches[1] || null;
		theChap = matches[4] ? matches[4] : null;
	} else if (matches && matches[1]) {
		theBook = matches[1];
	}

	return { book: theBook, chap: theChap };
}

/**
 * Converts a BookChapVerse object back to a reference string.
 */
export function bookChapVerseToString(bcv: BookChapVerse): string {
	let ret = bcv.book ? bcv.book + ' ' : '';
	ret += bcv.chap ? bcv.chap : '';
	if (ret.length && bcv.v) ret += ':';
	if (bcv.v) ret += bcv.v;
	return ret.trim();
}

/**
 * Parses any reference string into its book, chapter, and verse components.
 * E.g., "1 Cor 2:3-4" -> { book: "1 Cor", chap: "2", v: "3-4" }
 */
export function getBookChapVerseFromRef(refString: string): BookChapVerse {
	refString = cleanString(refString);
	let book: string | null = null;
	let chap: string | null = null;
	let v: string | null = null;

	const colonSplit = refString.split(':');
	if (colonSplit.length === 2) {
		const [bookChap, verse] = colonSplit;
		if (verse) {
			const bookChapObj = splitBookChap(bookChap);
			book = bookChapObj.book;
			chap = bookChapObj.chap;
			v = verse;
		}
	} else {
		const bookChapObj = splitBookChap(refString);
		book = bookChapObj.book;
		chap = bookChapObj.chap;
	}
	return { book, chap, v };
}

/**
 * Extracts chapter and verse components from a "C:V" or "C" string.
 */
export function getChapVerseFromRef(string: string): { chap: string | null; v: string | null } {
	string = cleanString(string);
	const vSplit = string.split(':');
	const chap = vSplit.length > 0 ? vSplit[0] : null;
	const v = vSplit.length > 1 ? vSplit[1] : null;
	return { chap, v };
}

/**
 * Sorting comparison function for chapter and verse strings.
 */
export function sortChapVerseFunc(ref1: string, ref2: string): number {
	const chapV1 = getChapVerseFromRef(ref1);
	const chapV2 = getChapVerseFromRef(ref2);
	let retVal = 0;

	if (chapV1.chap && chapV2.chap) {
		const chapRange1 = createNumArrayFromStringListRange(chapV1.chap);
		const chapRange2 = createNumArrayFromStringListRange(chapV2.chap);
		if (chapRange1.length > 0 && chapRange2.length > 0) {
			if (chapRange1[0] === chapRange2[0]) {
				if (chapV1.v && chapV2.v) {
					const vRange1 = createNumArrayFromStringListRange(chapV1.v);
					const vRange2 = createNumArrayFromStringListRange(chapV2.v);
					if (vRange1.length > 0 && vRange2.length > 0) {
						retVal = vRange1[0] - vRange2[0];
					}
				} else {
					if (!chapV1.v) {
						retVal = -1;
					} else {
						retVal = 1;
					}
				}
			} else {
				retVal = chapRange1[0] - chapRange2[0];
			}
		} else {
			retVal = !chapV1.chap ? -1 : 1;
		}
	} else {
		retVal = !chapV1.chap ? -1 : 1;
	}
	return retVal;
}

/**
 * Sorts chapter:verse references, e.g. ["12:3", "15:2", "12"].
 */
export function sortChapVerseRefs(cv1: string, cv2: string): number {
	const a = cv1.split(':');
	const b = cv2.split(':');
	let retVal = 0;
	if (a[0] === b[0]) {
		if (a[1] && b[1]) {
			retVal = parseInt(a[1], 10) - parseInt(b[1], 10);
		} else if (!a[1]) {
			retVal = -1;
		} else if (!b[1]) {
			retVal = 1;
		} else {
			retVal = 0;
		}
	} else if (a[0] && b[0]) {
		retVal = parseInt(a[0], 10) - parseInt(b[0], 10);
	} else if (!a[0]) {
		retVal = -1;
	} else if (!b[0]) {
		retVal = 1;
	}
	return retVal;
}

/**
 * Expands compound reference strings (semicolon-separated, comma-separated, ranges)
 * into individual standalone references.
 * E.g., "Matt 3:2-4" -> ["Matt 3:2", "Matt 3:3", "Matt 3:4"]
 */
export function expandRefs(refString: string, splitVerseRanges = true): string[] {
	const refArray: string[] = [];
	refString = cleanString(refString);
	let latestBook = '';

	for (const ref of refString.split(';').filter((s) => s)) {
		if (ref.length) {
			let bookCv = getBookChapVerseFromRef(ref);
			if (bookCv.book) {
				latestBook = bookCv.book;
			} else if (latestBook) {
				bookCv = getBookChapVerseFromRef(latestBook + ' ' + ref);
			}

			if (bookCv.book) {
				if (!bookCv.chap) {
					refArray.push(bookCv.book);
				} else if (bookCv.v?.includes(',')) {
					for (const vv of bookCv.v.split(',')) {
						if (vv.includes('-') && splitVerseRanges) {
							for (const v of createNumArrayFromStringListRange(vv)) {
								refArray.push(bookCv.book + ' ' + bookCv.chap + (v ? ':' + v : ''));
							}
						} else {
							refArray.push(bookCv.book + ' ' + bookCv.chap + (vv ? ':' + vv : ''));
						}
					}
				} else if (bookCv.v?.includes('-') && splitVerseRanges) {
					for (const v of createNumArrayFromStringListRange(bookCv.v)) {
						refArray.push(bookCv.book + ' ' + bookCv.chap + (v ? ':' + v : ''));
					}
				} else if (bookCv.chap?.includes('-') && !bookCv.v) {
					for (const c of createNumArrayFromStringListRange(bookCv.chap)) {
						refArray.push(bookCv.book + ' ' + c);
					}
				} else {
					refArray.push(bookCv.book + ' ' + bookCv.chap + (bookCv.v ? ':' + bookCv.v : ''));
				}
			}
		}
	}
	return refArray;
}

/**
 * Formats an array of numbers into sorted, compact hyphenated ranges.
 * E.g., [1, 2, 3, 5, 6] -> "1-3,5-6"
 */
export function joinInRanges(numArray: (number | string)[], separator = ',', spreader = '-'): string {
	const uniqueArray = [...new Set(numArray.map((x) => Number(String(x).replaceAll(/[a-z]/g, ''))))].sort((x, y) => x - y);
	if (uniqueArray.length === 0) return '';
	if (uniqueArray.length === 1) return uniqueArray[0].toString();

	let rangeString = '';
	let curRangeStart = uniqueArray[0];
	let curRangeEnd = uniqueArray[0];

	for (let i = 1; i < uniqueArray.length; i++) {
		const num = uniqueArray[i];
		if (num === curRangeEnd + 1) {
			curRangeEnd = num;
		} else {
			if (rangeString.length > 0) rangeString += separator;
			rangeString += curRangeStart === curRangeEnd ? curRangeStart.toString() : curRangeStart.toString() + spreader + curRangeEnd.toString();
			curRangeStart = num;
			curRangeEnd = num;
		}
	}

	if (rangeString.length > 0) rangeString += separator;
	rangeString += curRangeStart === curRangeEnd ? curRangeStart.toString() : curRangeStart.toString() + spreader + curRangeEnd.toString();

	return rangeString;
}

export function joinChapters(chapterVerseRefArray: string[]): string[] {
	return chapterVerseRefArray;
}

/**
 * Combines an array of individual verse or chapter references into a compact, human-readable reference string.
 * E.g., ["Gen 1", "Gen 2", "Gen 3", "Gen 4:15"] -> "Gen 1-3; 4:15"
 */
export function combineRefs(refArray: string[], booksDict: any = null): string {
	const refList: Record<string, Record<string, any> | 'all'> = {};

	for (const ref of refArray) {
		const bcv = getBookChapVerseFromRef(ref.trim());
		if (bcv.book && !refList[bcv.book]) {
			refList[bcv.book] = {};
		}
		if (bcv.book && !bcv.chap && !bcv.v) {
			refList[bcv.book] = 'all';
		} else if (bcv.book && bcv.chap && !bcv.v && refList[bcv.book] !== 'all') {
			(refList[bcv.book] as Record<string, any>)[bcv.chap] = 'all';
		} else if (bcv.book && bcv.chap && bcv.v && refList[bcv.book] !== 'all') {
			const bDict = refList[bcv.book] as Record<string, any>;
			if (!bDict[bcv.chap]) {
				bDict[bcv.chap] = [bcv.v];
			} else if (bDict[bcv.chap] !== 'all' && Array.isArray(bDict[bcv.chap])) {
				bDict[bcv.chap].push(bcv.v);
			}
		}
	}

	const combined = Object.entries(refList)
		.sort(([b1], [b2]) => sortBooksFunc(b1, b2, booksDict))
		.map(([b, chapList]) => {
			let chaps = '';
			if (chapList !== 'all' && Object.keys(chapList).length > 0) {
				const wholeChaps = Object.entries(chapList)
					.filter(([, vv]) => vv === 'all' || vv.length === 0)
					.map(([c]) => c);
				chaps += joinInRanges(wholeChaps, '; ');

				const chapsWithVerses = Object.entries(chapList)
					.filter(([, vv]) => vv !== 'all' && vv.length > 0)
					.map(([c, vv]) => {
						const vvString = Array.isArray(vv) ? vv.join(',') : String(vv);
						return c + ':' + joinInRanges(vvString.split(','));
					})
					.join('; ');

				chaps = [chaps, chapsWithVerses].filter(Boolean).join('; ');
			}
			return b + (chaps ? ' ' + chaps : '');
		})
		.join('; ');

	return combined;
}

function cleanRepeatedSymbols(input: string): string {
	return input.replaceAll(/;+/g, ';').replace(/:+/g, ':').replace(/[\t ]+/g, ' ');
}

export function formatBibRefs(inputString: string): string {
	const books: Record<string, Record<string, any[]>> = {};
	let lastBook = '';

	cleanRepeatedSymbols(inputString)
		.replaceAll(/[\t_]+/g, ' ')
		.replace(/(:[0-9-,]+ +)/g, '$1\n')
		.replaceAll(';', '\n')
		.split('\n')
		.filter((s) => s.trim())
		.map((item) => item.trim())
		.forEach((l) => {
			if (l.trim().length > 0) {
				let vv = '';
				let bc = '';
				const parts = l.split(':').map((item) => item.trim()).filter((s) => s);
				bc = parts[0] || '';
				vv = parts[1] || '';
				let b = '';
				let c: any = '';

				const bcArray = bc.split(' ').map((item) => item.trim()).filter((s) => s);
				if (bcArray.length > 2) {
					b = bcArray[0] + ' ' + bcArray[1];
					c = bcArray[2];
				} else if (bcArray.length === 2) {
					b = bcArray[0];
					c = bcArray[1];
				} else if (parseInt(bcArray[0], 10)) {
					c = parseInt(bcArray[0], 10);
					b = lastBook;
				} else {
					b = bcArray[0];
					c = '';
				}

				lastBook = b;
				vv.split(',').map((item) => item.trim()).forEach((v) => {
					if (!books[b]) books[b] = {};
					if (!books[b][c]) books[b][c] = [];
					if (!books[b][c].includes(v)) {
						if (v.includes('-')) {
							const [start, finish] = v.split('-');
							if (parseInt(start, 10) < parseInt(finish, 10)) {
								for (let i = parseInt(start, 10); i <= parseInt(finish, 10); i++) {
									books[b][c].push(i);
								}
							} else {
								books[b][c].push(v);
							}
						} else {
							books[b][c].push(v);
						}
					}
				});
			}
		});

	let output = '';
	let bdemarc = '';
	Object.keys(books)
		.sort((x, y) => sortBooksFunc(x, y))
		.forEach((b) => {
			let cdemarc = '';
			output = output + bdemarc + b + ' ';
			Object.keys(books[b])
				.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
				.forEach((c) => {
					output = output + cdemarc + c.toString();
					const vv = books[b][c];
					if (vv.length && vv[0] !== 0) {
						output += ':' + joinInRanges(vv);
					}
					cdemarc = '; ';
				});
			bdemarc = '; ';
		});

	return cleanRepeatedSymbols(output);
}

/**
 * Standardizes a reference string by fixing spacing and underscores.
 * E.g., "2Kg 2:14" -> "2 Kg 2:14" and "1_Corinthians 1:1" -> "1 Corinthians 1:1".
 */
export function standardizeBibleRef(refString: string): string {
	if (!refString) return '';
	return refString.trim().replace(/^([0-9])([A-Za-z])/g, '$1 $2').replace(/_/g, ' ').replace(/ +/g, ' ');
}

/** Backward-compatible alias for typo in legacy code */
export const standaradizeBibleRef = standardizeBibleRef;

/**
 * Filters out invalid book references from a string, keeping only valid ones.
 */
export function filterOutInvalidBooks(refString: string, booksDict: any = null): string {
	return combineRefs(
		expandRefs(refString).filter((ref) => matchBookName(getBookChapVerseFromRef(ref)?.book || '', booksDict)),
		booksDict
	);
}

/**
 * Returns true if includedRef is contained in containingRef.
 * E.g., refIncludes("Matt 1:1,3-10", "Matt 1:4") -> true
 */
export function refIncludes(containingRef: string, includedRef: string): boolean {
	let passed = true;
	const containingObj = getBookChapVerseFromRef(containingRef.trim().replaceAll(/\s+/g, ' '));
	const includedObj = getBookChapVerseFromRef(includedRef.trim().replaceAll(/\s+/g, ' '));
	if (containingObj.book !== includedObj.book) {
		passed = false;
	}

	if (containingObj.chap?.includes('-')) {
		if (containingObj.v?.includes('-')) {
			// bad input
		} else {
			const allowedChaps = createNumArrayFromStringListRange(containingObj.chap);
			const includedChap = parseInt(includedObj.chap || '', 10);
			if (includedChap && !allowedChaps.includes(includedChap)) {
				passed = false;
			}
		}
	} else if (containingObj.v?.includes('-')) {
		if (containingObj.chap !== includedObj.chap) {
			passed = false;
		} else {
			const allowedVerses = createNumArrayFromStringListRange(containingObj.v);
			const includedV = includedObj.v ? parseInt(includedObj.v.replaceAll(/[^0-9]/g, ''), 10) : 0;
			if (includedV && !allowedVerses.includes(includedV)) {
				passed = false;
			}
		}
	} else {
		if (containingObj.chap && containingObj.chap !== includedObj.chap) {
			passed = false;
		} else if (containingObj.v && containingObj.v !== includedObj.v) {
			passed = false;
		}
	}
	return passed;
}
