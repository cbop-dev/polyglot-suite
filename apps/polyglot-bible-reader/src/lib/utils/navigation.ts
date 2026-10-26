import { normalizeBookName } from '$lib/config/bookMapping.js';

export interface LexemeExplorerLinkOptions {
	corpusId?: string;
	version?: string;
	book?: string;
	chapter?: string | number;
	verse?: string | number;
	lemma?: string;
	id?: number | string;
	lexemeId?: number | string;
	panel?: 'book' | 'lex' | 'wc';
}

/**
 * Generates a deep link URL into Biblical Lexeme Explorer.
 * @param options Link targets and context
 * @returns Relative URL to biblical-lexeme-explorer
 */
export function getLexemeExplorerUrl(options: LexemeExplorerLinkOptions): string {
	let db = 'lxx';
	const rawCorpus = (options.corpusId || options.version || '').toLowerCase();

	if (rawCorpus === 'bhs' || rawCorpus === 'wlc') {
		db = 'bhs';
	} else if (rawCorpus === 'opengnt' || rawCorpus === 'sblgnt') {
		db = 'sblgnt';
	} else if (rawCorpus === 'lxx' || rawCorpus === 'brenton') {
		db = 'lxx';
	} else if (options.book) {
		const canonical = normalizeBookName(options.book);
		if (canonical) {
			if (canonical.testament === 'nt') {
				db = 'sblgnt';
			} else if (canonical.testament === 'ot') {
				db = 'bhs';
			} else {
				db = 'lxx';
			}
		}
	}

	const params = new URLSearchParams();
	const targetId = options.id ?? options.lexemeId;
	if (targetId !== undefined && targetId !== null && targetId !== '') {
		params.set('id', String(targetId));
	}
	if (options.panel) {
		params.set('panel', options.panel);
	}
	if (options.lemma) {
		params.set('lemma', options.lemma);
	}
	if (options.book) {
		const chap = options.chapter ? ` ${options.chapter}` : '';
		const v = options.verse ? `:${options.verse}` : '';
		params.set('refs', `${options.book}${chap}${v}`);
	}

	const qs = params.toString();
	const rawBase =
		(import.meta.env.PUBLIC_LEXEMES_APP_URL as string | undefined) ||
		(import.meta.env.DEV ? 'http://localhost:5174' : '/polyglot-suite/lexemes');
	const cleanBase = rawBase.replace(/\/+$/, '');

	return `${cleanBase}/${db}/${qs ? '?' + qs : ''}`;
}
