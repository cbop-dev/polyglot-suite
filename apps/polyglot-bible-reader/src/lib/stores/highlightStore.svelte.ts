import { toPlainGreek, toPlainHebrew, toPlainSyriac } from '$lib/utils/transliteration';
import {
	type PaletteColor,
	HIGHLIGHT_PALETTE,
	getNextPaletteColorIndex,
	normalizeStrongsId,
	getPaletteColor
} from '@polyglot/ancient-languages';
import { getLexemeById } from '$lib/services/dbClient';

export type { PaletteColor };
export { HIGHLIGHT_PALETTE };

export interface HighlightedLemma {
	id: string; // e.g. 'greek:λογος', 'hebrew:ברא', or 'syriac:ܒܪܐ'
	lemma: string; // Display lemma (e.g. 'λόγος', 'בָּרָא', 'ܒܪܐ')
	plain: string; // Normalized plain form (e.g. 'λογοσ', 'ברא', 'ܒܪܐ')
	strongs?: string; // Normalized Strong's ID / lemma_key
	lang: 'greek' | 'hebrew' | 'syriac';
	colorIndex: number;
	color: string; // Hex color
	createdAt: number;
}

const STORAGE_KEY = 'pbr_highlighted_lemmas';

export class HighlightStore {
	items = $state<HighlightedLemma[]>([]);

	// Fast O(1) lookup maps derived reactively
	plainMap = $derived.by(() => {
		const m = new Map<string, HighlightedLemma>();
		for (const item of this.items) {
			m.set(`${item.lang}:${item.plain}`, item);
		}
		return m;
	});

	strongsMap = $derived.by(() => {
		const m = new Map<string, HighlightedLemma>();
		for (const item of this.items) {
			if (item.strongs) {
				if (item.lang === 'syriac') {
					m.set(`${item.lang}:${item.strongs}`, item);
				} else {
					const sCode = normalizeStrongsId(item.strongs);
					if (sCode) {
						m.set(`${item.lang}:${sCode}`, item);
						// Also store raw digits if prefixed with G/H
						const numOnly = sCode.replace(/^[GH]/, '');
						if (numOnly) m.set(`${item.lang}:${numOnly}`, item);
					}
				}
			}
		}
		return m;
	});

	constructor() {
		this.loadFromStorage();
	}

	loadFromStorage() {
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					this.items = parsed;
				}
			}
		} catch (e) {
			console.warn('[HighlightStore] Failed to load from localStorage:', e);
		}
	}

	private saveToStorage() {
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
		} catch (e) {
			console.warn('[HighlightStore] Failed to save to localStorage:', e);
		}
	}

	private getNextColorIndex(): number {
		return getNextPaletteColorIndex(this.items.map((i) => i.colorIndex));
	}

	makeId(plain: string, lang: 'greek' | 'hebrew' | 'syriac'): string {
		return `${lang}:${plain}`;
	}

	/**
	 * Detects language from lemma string or corpus code.
	 */
	detectLanguage(lemma: string, langHint?: string): 'greek' | 'hebrew' | 'syriac' {
		if (langHint === 'syriac' || langHint === 'peshitta' || langHint === 'syc') return 'syriac';
		if (langHint === 'hebrew' || langHint === 'bhs' || langHint === 'wlc') return 'hebrew';
		if (langHint === 'greek' || langHint === 'ognt' || langHint === 'swete_lxx' || langHint === 'lxx') return 'greek';
		// Check for Syriac Unicode block (\u0700 - \u074F)
		if (/[\u0700-\u074F]/.test(lemma)) return 'syriac';
		// Check for Hebrew Unicode block (\u0590 - \u05FF)
		if (/[\u0590-\u05FF]/.test(lemma)) return 'hebrew';
		return 'greek';
	}

	normalizePlain(lemma: string, lang: 'greek' | 'hebrew' | 'syriac'): string {
		if (lang === 'syriac') return toPlainSyriac(lemma);
		if (lang === 'hebrew') return toPlainHebrew(lemma);
		return toPlainGreek(lemma);
	}

	addLemma(lemma: string, strongs?: string, langHint?: string, colorIndex?: number): HighlightedLemma {
		if (!lemma && !strongs) throw new Error('Lemma or Strongs is required');
		const lang = this.detectLanguage(lemma || '', langHint);
		const plain = this.normalizePlain(lemma, lang);
		const id = this.makeId(plain || strongs || '', lang);

		// Check if already present
		const existingIdx = this.items.findIndex((i) => i.id === id);
		if (existingIdx >= 0) {
			return this.items[existingIdx];
		}

		const cIdx = typeof colorIndex === 'number' && colorIndex >= 0 && colorIndex < HIGHLIGHT_PALETTE.length
			? colorIndex
			: this.getNextColorIndex();
		const paletteColor = HIGHLIGHT_PALETTE[cIdx];

		const item: HighlightedLemma = {
			id,
			lemma: lemma || strongs || '',
			plain,
			strongs: strongs ? (lang === 'syriac' ? strongs.trim() : normalizeStrongsId(strongs)) : undefined,
			lang,
			colorIndex: cIdx,
			color: paletteColor.hex,
			createdAt: Date.now()
		};

		this.items = [...this.items, item];
		this.saveToStorage();
		return item;
	}

	removeLemma(id: string) {
		this.items = this.items.filter((i) => i.id !== id);
		this.saveToStorage();
	}

	toggleLemma(lemma: string, strongs?: string, langHint?: string): boolean {
		const lang = this.detectLanguage(lemma || '', langHint);
		const plain = this.normalizePlain(lemma, lang);
		const id = this.makeId(plain || strongs || '', lang);

		const exists = this.items.some((i) => i.id === id);
		if (exists) {
			this.removeLemma(id);
			return false;
		} else {
			this.addLemma(lemma, strongs, lang);
			return true;
		}
	}

	isHighlighted(lemma: string, strongs?: string, langHint?: string): boolean {
		const lang = this.detectLanguage(lemma || '', langHint);
		const plain = this.normalizePlain(lemma, lang);
		const id = this.makeId(plain || strongs || '', lang);
		return this.items.some((i) => i.id === id);
	}

	getHighlight(lemma: string, strongs?: string, langHint?: string): HighlightedLemma | null {
		const lang = this.detectLanguage(lemma || '', langHint);
		const plain = this.normalizePlain(lemma, lang);
		const id = this.makeId(plain || strongs || '', lang);
		return this.items.find((i) => i.id === id) || null;
	}

	setColor(id: string, colorIndex: number) {
		const cIdx = Math.max(0, Math.min(colorIndex, HIGHLIGHT_PALETTE.length - 1));
		const paletteColor = HIGHLIGHT_PALETTE[cIdx];
		this.items = this.items.map((item) => {
			if (item.id === id) {
				return {
					...item,
					colorIndex: cIdx,
					color: paletteColor.hex
				};
			}
			return item;
		});
		this.saveToStorage();
	}

	clearAll() {
		this.items = [];
		this.saveToStorage();
	}

	/**
	 * Fast O(1) matching for a word token in VerseCard.
	 */
	getHighlightForToken(token: any, lang?: 'greek' | 'hebrew' | 'syriac' | null): HighlightedLemma | null {
		if (!token || !lang || this.items.length === 0) return null;

		// 1. Check by Strong's number / lemma_key
		const sRaw = token.strongs || token.strongs_number || token.lemma_key;
		if (sRaw) {
			const sCode = normalizeStrongsId(String(sRaw));
			const match = this.strongsMap.get(`${lang}:${sCode}`);
			if (match) return match;
			// Also direct key match
			const directKeyMatch = this.strongsMap.get(`${lang}:${sRaw}`);
			if (directKeyMatch) return directKeyMatch;
		}

		// 2. Check by token lemma
		if (token.lemma) {
			const p = this.normalizePlain(token.lemma, lang);
			const match = this.plainMap.get(`${lang}:${p}`);
			if (match) return match;
		}

		// 3. Check by normalized surface word
		if (token.normalized) {
			const p = this.normalizePlain(token.normalized, lang);
			const match = this.plainMap.get(`${lang}:${p}`);
			if (match) return match;
		}

		// 4. Check by surface word
		if (token.word) {
			const p = this.normalizePlain(token.word, lang);
			const match = this.plainMap.get(`${lang}:${p}`);
			if (match) return match;
		}

		return null;
	}

	/**
	 * Generates CSS inline style string for a highlighted token.
	 */
	getInlineStyle(hl: HighlightedLemma, themeMode?: string | null): string {
		const pal = HIGHLIGHT_PALETTE[hl.colorIndex] || HIGHLIGHT_PALETTE[0];
		const isDark = themeMode === 'dark';
		const bg = isDark ? pal.bgDark : pal.bgLight;
		const color = isDark ? pal.textDark : pal.textLight;
		const border = isDark ? pal.borderDark : pal.borderLight;
		return `background-color: ${bg}; color: ${color}; border-bottom: 2px solid ${border}; border-radius: 4px; padding: 1px 3px; font-weight: 600;`;
	}

	/**
	 * Serializes active highlights into a URL parameter string.
	 * Format: "lemma:colorIndex:strongs" or "lemma:colorIndex" or "strongs:colorIndex", comma-separated.
	 * Example: "λόγος:0:G3056,בָּרָא:1:H1254"
	 */
	toUrlParam(): string {
		if (this.items.length === 0) return '';
		return this.items
			.map((item) => {
				const parts = [item.lemma || item.strongs || ''];
				if (typeof item.colorIndex === 'number') {
					parts.push(String(item.colorIndex));
				}
				if (item.strongs && item.strongs !== item.lemma) {
					parts.push(item.strongs);
				}
				return parts.join(':');
			})
			.join(',');
	}

	/**
	 * Parses and loads highlights from a URL parameter string.
	 * Replaces active highlights to ensure the shared passage view matches the sender's view.
	 * Supports:
	 * - Lemma + color + Strong's: "λόγος:0:G3056"
	 * - Lemma + color: "λόγος:0"
	 * - Simple lemma list: "λόγος,θεός"
	 * - Strong's ID: "G3056:0"
	 * - Master numeric lexeme ID: "14680:0"
	 */
	async fromUrlParam(param: string): Promise<void> {
		if (!param || !param.trim()) return;
		const entries = param.split(',').map((s) => s.trim()).filter(Boolean);
		const loaded: HighlightedLemma[] = [];

		for (const entry of entries) {
			const parts = entry.split(':').map((p) => p.trim());
			const rawTarget = parts[0];
			if (!rawTarget) continue;

			const colorIndex =
				parts[1] !== undefined && parts[1] !== '' && !isNaN(Number(parts[1]))
					? parseInt(parts[1], 10)
					: undefined;

			// Check if rawTarget is a purely numerical lexeme ID (e.g. "14680")
			if (/^\d+$/.test(rawTarget)) {
				const numId = parseInt(rawTarget, 10);
				try {
					const lex = await getLexemeById(numId);
					if (lex && lex.lemma) {
						const lang = this.detectLanguage(lex.lemma, lex.corpus);
						const plain = this.normalizePlain(lex.lemma, lang);
						const id = this.makeId(plain || lex.strongs || '', lang);
						const cIdx =
							typeof colorIndex === 'number' && colorIndex >= 0 && colorIndex < HIGHLIGHT_PALETTE.length
								? colorIndex
								: getNextPaletteColorIndex(loaded.map((i) => i.colorIndex));
						const paletteColor = HIGHLIGHT_PALETTE[cIdx];
						loaded.push({
							id,
							lemma: lex.lemma,
							plain,
							strongs: lex.strongs
								? lang === 'syriac'
									? lex.strongs.trim()
									: normalizeStrongsId(lex.strongs)
								: undefined,
							lang,
							colorIndex: cIdx,
							color: paletteColor.hex,
							createdAt: Date.now()
						});
						continue;
					}
				} catch (err) {
					console.warn('[HighlightStore] Failed to resolve numeric lexeme ID:', numId, err);
				}
			}

			const isStrongsOnly = /^[GH]\d+[a-z]?$/i.test(rawTarget);
			const strongs = parts[2] || (isStrongsOnly ? rawTarget : undefined);
			const lemma = isStrongsOnly ? (parts[2] || rawTarget) : rawTarget;

			const lang = this.detectLanguage(
				lemma || rawTarget,
				isStrongsOnly ? (rawTarget.toUpperCase().startsWith('H') ? 'hebrew' : 'greek') : undefined
			);
			const plain = this.normalizePlain(lemma, lang);
			const id = this.makeId(plain || strongs || '', lang);

			const cIdx =
				typeof colorIndex === 'number' && colorIndex >= 0 && colorIndex < HIGHLIGHT_PALETTE.length
					? colorIndex
					: getNextPaletteColorIndex(loaded.map((i) => i.colorIndex));
			const paletteColor = HIGHLIGHT_PALETTE[cIdx];

			loaded.push({
				id,
				lemma,
				plain,
				strongs: strongs
					? lang === 'syriac'
						? strongs.trim()
						: normalizeStrongsId(strongs)
					: undefined,
				lang,
				colorIndex: cIdx,
				color: paletteColor.hex,
				createdAt: Date.now()
			});
		}

		if (loaded.length > 0) {
			this.items = loaded;
			this.saveToStorage();
		}
	}
}

export const highlightStore = new HighlightStore();
