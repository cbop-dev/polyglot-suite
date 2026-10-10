import { toPlainGreek, toPlainHebrew } from '$lib/utils/transliteration';
import {
	type PaletteColor,
	HIGHLIGHT_PALETTE,
	getNextPaletteColorIndex,
	normalizeStrongsId,
	getPaletteColor
} from '@polyglot/ancient-languages';

export type { PaletteColor };
export { HIGHLIGHT_PALETTE };

export interface HighlightedLemma {
	id: string; // e.g. 'greek:λογος' or 'hebrew:ברα'
	lemma: string; // Display lemma (e.g. 'λόγος', 'בָּרָא')
	plain: string; // Normalized plain form (e.g. 'λογοσ', 'ברא')
	strongs?: string; // Normalized Strong's ID (e.g. 'G3056', 'H1254')
	lang: 'greek' | 'hebrew';
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
				const sCode = normalizeStrongsId(item.strongs);
				if (sCode) {
					m.set(`${item.lang}:${sCode}`, item);
					// Also store raw digits if prefixed with G/H
					const numOnly = sCode.replace(/^[GH]/, '');
					if (numOnly) m.set(`${item.lang}:${numOnly}`, item);
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

	makeId(plain: string, lang: 'greek' | 'hebrew'): string {
		return `${lang}:${plain}`;
	}

	/**
	 * Detects language from lemma string or corpus code.
	 */
	detectLanguage(lemma: string, langHint?: string): 'greek' | 'hebrew' {
		if (langHint === 'hebrew' || langHint === 'bhs' || langHint === 'wlc') return 'hebrew';
		if (langHint === 'greek' || langHint === 'ognt' || langHint === 'swete_lxx' || langHint === 'lxx') return 'greek';
		// Check for Hebrew Unicode block (\u0590 - \u05FF)
		if (/[\u0590-\u05FF]/.test(lemma)) return 'hebrew';
		return 'greek';
	}

	addLemma(lemma: string, strongs?: string, langHint?: string, colorIndex?: number): HighlightedLemma {
		if (!lemma && !strongs) throw new Error('Lemma or Strongs is required');
		const lang = this.detectLanguage(lemma || '', langHint);
		const plain = lang === 'hebrew' ? toPlainHebrew(lemma) : toPlainGreek(lemma);
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
			strongs: strongs ? normalizeStrongsId(strongs) : undefined,
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
		const plain = lang === 'hebrew' ? toPlainHebrew(lemma) : toPlainGreek(lemma);
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
		const plain = lang === 'hebrew' ? toPlainHebrew(lemma) : toPlainGreek(lemma);
		const id = this.makeId(plain || strongs || '', lang);
		return this.items.some((i) => i.id === id);
	}

	getHighlight(lemma: string, strongs?: string, langHint?: string): HighlightedLemma | null {
		const lang = this.detectLanguage(lemma || '', langHint);
		const plain = lang === 'hebrew' ? toPlainHebrew(lemma) : toPlainGreek(lemma);
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
	getHighlightForToken(token: any, lang: 'greek' | 'hebrew'): HighlightedLemma | null {
		if (!token || this.items.length === 0) return null;

		// 1. Check by Strong's number
		const sRaw = token.strongs || token.strongs_number;
		if (sRaw) {
			const sCode = normalizeStrongsId(String(sRaw));
			const match = this.strongsMap.get(`${lang}:${sCode}`);
			if (match) return match;
		}

		// 2. Check by token lemma
		if (token.lemma) {
			const p = lang === 'hebrew' ? toPlainHebrew(token.lemma) : toPlainGreek(token.lemma);
			const match = this.plainMap.get(`${lang}:${p}`);
			if (match) return match;
		}

		// 3. Check by normalized surface word
		if (token.normalized) {
			const p = lang === 'hebrew' ? toPlainHebrew(token.normalized) : toPlainGreek(token.normalized);
			const match = this.plainMap.get(`${lang}:${p}`);
			if (match) return match;
		}

		// 4. Check by surface word
		if (token.word) {
			const p = lang === 'hebrew' ? toPlainHebrew(token.word) : toPlainGreek(token.word);
			const match = this.plainMap.get(`${lang}:${p}`);
			if (match) return match;
		}

		return null;
	}

	/**
	 * Generates CSS inline style string for a highlighted token.
	 */
	getInlineStyle(hl: HighlightedLemma, themeMode: string = 'light'): string {
		const pal = HIGHLIGHT_PALETTE[hl.colorIndex] || HIGHLIGHT_PALETTE[0];
		const isDark = themeMode === 'dark';
		const bg = isDark ? pal.bgDark : pal.bgLight;
		const color = isDark ? pal.textDark : pal.textLight;
		const border = isDark ? pal.borderDark : pal.borderLight;
		return `background-color: ${bg}; color: ${color}; border-bottom: 2px solid ${border}; border-radius: 4px; padding: 1px 3px; font-weight: 600;`;
	}
}

export const highlightStore = new HighlightStore();
