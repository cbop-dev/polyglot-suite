import {
	HighlightStore,
	type PaletteColor,
	type HighlightEntry,
	type AugmentedPaletteColor,
	HIGHLIGHT_PALETTE
} from '@polyglot/ancient-languages';

export type { PaletteColor, HighlightEntry, AugmentedPaletteColor };
export { HIGHLIGHT_PALETTE, HighlightStore };

export const highlightStore = new HighlightStore('josephus_highlighted_lemmas');
