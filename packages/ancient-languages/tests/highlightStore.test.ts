import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HighlightStore, HIGHLIGHT_PALETTE } from '../src/stores/highlightStore.svelte.js';

describe('HighlightStore (ancient-languages)', () => {
	let store: HighlightStore;

	beforeEach(() => {
		const storage: Record<string, string> = {};
		vi.stubGlobal('localStorage', {
			getItem: vi.fn((key: string) => storage[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				storage[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete storage[key];
			}),
			clear: vi.fn(() => {
				for (const k of Object.keys(storage)) delete storage[k];
			})
		});

		store = new HighlightStore('test_highlights');
	});

	it('initializes with empty highlights', () => {
		expect(Object.keys(store.highlights)).toHaveLength(0);
		expect(store.isHighlighted('λόγος')).toBe(false);
		expect(store.get('λόγος')).toBeNull();
	});

	it('automatically assigns the first palette color when toggled', () => {
		const added = store.toggle('λόγος');
		expect(added).toBe(true);
		expect(store.isHighlighted('λόγος')).toBe(true);
		expect(store.getColorIndex('λόγος')).toBe(0);

		const hl = store.get('λόγος');
		expect(hl).not.toBeNull();
		expect(hl?.name).toBe('Amber');
		expect(hl?.hex).toBe(HIGHLIGHT_PALETTE[0].hex);
		expect(hl?.bg).toBe(HIGHLIGHT_PALETTE[0].bgLight);
		expect(hl?.text).toBe(HIGHLIGHT_PALETTE[0].textLight);
	});

	it('cycles palette colors when adding multiple distinct lemmas', () => {
		store.toggle('λόγος'); // index 0 (Amber)
		store.toggle('θεός');  // index 1 (Sky Blue)
		store.toggle('ἀγάπη'); // index 2 (Emerald)

		expect(store.getColorIndex('λόγος')).toBe(0);
		expect(store.getColorIndex('θεός')).toBe(1);
		expect(store.getColorIndex('ἀγάπη')).toBe(2);

		expect(store.get('θεός')?.name).toBe('Sky Blue');
		expect(store.get('ἀγάπη')?.name).toBe('Emerald');
	});

	it('allows the user to switch the assigned color of a lemma', () => {
		store.toggle('λόγος');
		expect(store.getColorIndex('λόγος')).toBe(0);

		// Switch to index 4 (Violet)
		store.setColor('λόγος', 4);
		expect(store.getColorIndex('λόγος')).toBe(4);
		expect(store.get('λόγος')?.name).toBe('Violet');
		expect(store.get('λόγος')?.hex).toBe(HIGHLIGHT_PALETTE[4].hex);

		// Switch to index 7 (Fuchsia)
		store.setColor('λόγος', 7);
		expect(store.getColorIndex('λόγος')).toBe(7);
		expect(store.get('λόγος')?.name).toBe('Fuchsia');
	});

	it('toggles lemma off when called again', () => {
		store.toggle('λόγος');
		expect(store.isHighlighted('λόγος')).toBe(true);

		const off = store.toggle('λόγος');
		expect(off).toBe(false);
		expect(store.isHighlighted('λόγος')).toBe(false);
		expect(store.get('λόγος')).toBeNull();
	});

	it('supports remove and clear operations', () => {
		store.toggle('λόγος');
		store.toggle('θεός');
		expect(Object.keys(store.highlights)).toHaveLength(2);

		store.remove('λόγος');
		expect(store.isHighlighted('λόγος')).toBe(false);
		expect(store.isHighlighted('θεός')).toBe(true);

		store.clear();
		expect(Object.keys(store.highlights)).toHaveLength(0);
	});

	it('matches lemmas with polytonic/plain Greek variations', () => {
		store.toggle('λόγος');
		// Checking with plain Greek form or identical lemma
		expect(store.isHighlighted('λογος')).toBe(true);
		expect(store.getColorIndex('λογος')).toBe(0);
		expect(store.get('λογος')?.name).toBe('Amber');
	});

	it('generates inline styles for light and dark themes', () => {
		store.toggle('λόγος');
		const lightStyle = store.getStyle('λόγος', false);
		expect(lightStyle).toContain(HIGHLIGHT_PALETTE[0].bgLight);
		expect(lightStyle).toContain(HIGHLIGHT_PALETTE[0].textLight);

		const darkStyle = store.getStyle('λόγος', true);
		expect(darkStyle).toContain(HIGHLIGHT_PALETTE[0].bgDark);
		expect(darkStyle).toContain(HIGHLIGHT_PALETTE[0].textDark);
	});

	it('maintains fast plainMap lookup and dynamic updates across mutations', () => {
		// Initially empty
		expect(store.plainMap.size).toBe(0);
		expect(store.isHighlighted('θεός')).toBe(false);

		// Add item
		store.toggle('θεός');
		expect(store.plainMap.size).toBe(1);
		expect(store.isHighlighted('θεος')).toBe(true);
		expect(store.getColorIndex('θεος')).toBe(0);

		// Add second item with diacritics
		store.toggle('Ἰησοῦς');
		expect(store.plainMap.size).toBe(2);
		expect(store.isHighlighted('ιησους')).toBe(true);

		// Remove first item
		store.remove('θεός');
		expect(store.plainMap.size).toBe(1);
		expect(store.isHighlighted('θεος')).toBe(false);
		expect(store.isHighlighted('ιησους')).toBe(true);

		// Clear all
		store.clear();
		expect(store.plainMap.size).toBe(0);
		expect(store.isHighlighted('ιησους')).toBe(false);
	});
});
