import {
	type PaletteColor,
	HIGHLIGHT_PALETTE,
	getNextPaletteColorIndex,
	getPaletteColor,
	getHighlightInlineStyle,
	toPlainGreek
} from '@polyglot/ancient-languages';

export type { PaletteColor };
export { HIGHLIGHT_PALETTE };

export interface HighlightEntry {
	lemma: string;
	colorIndex: number;
	color: PaletteColor;
}

export type AugmentedPaletteColor = PaletteColor & {
	bg: string;
	text: string;
	darkBg: string;
	darkText: string;
};

const STORAGE_KEY = 'af_highlighted_lemmas';

class HighlightStore {
	// Map of lemma -> colorIndex (0..15)
	highlights = $state<Record<string, number>>({});

	// Derived list of all highlighted items sorted by lemma
	items = $derived.by<HighlightEntry[]>(() => {
		return Object.entries(this.highlights).map(([lemma, colorIndex]) => ({
			lemma,
			colorIndex,
			color: getPaletteColor(colorIndex)
		}));
	});

	constructor() {
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					const parsed = JSON.parse(saved);
					if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
						this.highlights = parsed;
					}
				}
			} catch (e) {
				console.warn('[HighlightStore] Failed to load highlights from localStorage', e);
			}
		}
	}

	private save() {
		if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.highlights));
			} catch (e) {
				console.warn('[HighlightStore] Failed to save highlights to localStorage', e);
			}
		}
	}

	/**
	 * Computes the next available palette color index.
	 */
	getNextColorIndex(): number {
		return getNextPaletteColorIndex(Object.values(this.highlights));
	}

	/**
	 * Resolves the matching key in highlights, supporting polytonic/plain Greek variations.
	 */
	private resolveKey(lemma: string): string | null {
		if (!lemma) return null;
		if (lemma in this.highlights) return lemma;

		const targetPlain = toPlainGreek(lemma);
		for (const key of Object.keys(this.highlights)) {
			if (toPlainGreek(key) === targetPlain) {
				return key;
			}
		}
		return null;
	}

	/**
	 * Checks if a lemma is highlighted.
	 */
	isHighlighted(lemma: string): boolean {
		return Boolean(lemma && this.resolveKey(lemma) !== null);
	}

	/**
	 * Returns the color index for a lemma, or null if not highlighted.
	 */
	getColorIndex(lemma: string): number | null {
		const key = this.resolveKey(lemma);
		if (!key) return null;
		return this.highlights[key] ?? 0;
	}

	/**
	 * Toggles highlight for a lemma. If not highlighted, automatically assigns the next palette color.
	 */
	toggle(lemma: string, preferredColorIndex?: number): boolean {
		if (!lemma) return false;
		const key = this.resolveKey(lemma);
		if (key !== null) {
			const next = { ...this.highlights };
			delete next[key];
			this.highlights = next;
			this.save();
			return false;
		} else {
			const cIdx = typeof preferredColorIndex === 'number'
				? Math.max(0, Math.min(preferredColorIndex, HIGHLIGHT_PALETTE.length - 1))
				: this.getNextColorIndex();
			this.highlights = {
				...this.highlights,
				[lemma]: cIdx
			};
			this.save();
			return true;
		}
	}

	/**
	 * Adds a lemma with auto-assigned or explicit color index.
	 */
	add(lemma: string, colorIndex?: number) {
		if (!lemma) return;
		const key = this.resolveKey(lemma) || lemma;
		const cIdx = typeof colorIndex === 'number'
			? Math.max(0, Math.min(colorIndex, HIGHLIGHT_PALETTE.length - 1))
			: this.getNextColorIndex();
		this.highlights = {
			...this.highlights,
			[key]: cIdx
		};
		this.save();
	}

	/**
	 * Updates the palette color index for a highlighted lemma.
	 */
	setColor(lemma: string, colorIndex: number) {
		if (!lemma) return;
		const key = this.resolveKey(lemma) || lemma;
		const safeIdx = Math.max(0, Math.min(colorIndex, HIGHLIGHT_PALETTE.length - 1));
		this.highlights = {
			...this.highlights,
			[key]: safeIdx
		};
		this.save();
	}

	/**
	 * Removes a highlight.
	 */
	remove(lemma: string) {
		if (!lemma) return;
		const key = this.resolveKey(lemma);
		if (key !== null) {
			const next = { ...this.highlights };
			delete next[key];
			this.highlights = next;
			this.save();
		}
	}

	/**
	 * Clears all active highlights.
	 */
	clear() {
		this.highlights = {};
		this.save();
	}

	/**
	 * Gets the palette color information for a lemma.
	 */
	get(lemma: string): AugmentedPaletteColor | null {
		const key = this.resolveKey(lemma);
		if (!key) return null;
		const cIdx = this.highlights[key] ?? 0;
		const pal = getPaletteColor(cIdx);
		return {
			...pal,
			bg: pal.bgLight,
			text: pal.textLight,
			darkBg: pal.bgDark,
			darkText: pal.textDark
		};
	}

	/**
	 * Generates CSS inline style string for a lemma.
	 */
	getStyle(lemma: string, isDark: boolean = false): string {
		const key = this.resolveKey(lemma);
		if (!key) return '';
		const cIdx = this.highlights[key] ?? 0;
		return getHighlightInlineStyle(cIdx, isDark);
	}
}

export const highlightStore = new HighlightStore();
