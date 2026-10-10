import { describe, it, expect, beforeEach, vi } from 'vitest';
import { highlightStore, HIGHLIGHT_PALETTE } from './highlightStore.svelte';

describe('Apostolic Fathers highlightStore', () => {
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

		highlightStore.clear();
	});

	it('initializes with empty highlights', () => {
		expect(Object.keys(highlightStore.highlights)).toHaveLength(0);
		expect(highlightStore.isHighlighted('λόγος')).toBe(false);
		expect(highlightStore.get('λόγος')).toBeNull();
	});

	it('automatically assigns the first palette color when toggled', () => {
		const added = highlightStore.toggle('λόγος');
		expect(added).toBe(true);
		expect(highlightStore.isHighlighted('λόγος')).toBe(true);
		expect(highlightStore.getColorIndex('λόγος')).toBe(0);

		const hl = highlightStore.get('λόγος');
		expect(hl).not.toBeNull();
		expect(hl?.name).toBe('Amber');
		expect(hl?.hex).toBe(HIGHLIGHT_PALETTE[0].hex);
		expect(hl?.bg).toBe(HIGHLIGHT_PALETTE[0].bgLight);
		expect(hl?.text).toBe(HIGHLIGHT_PALETTE[0].textLight);
	});

	it('cycles palette colors when adding multiple distinct lemmas', () => {
		highlightStore.toggle('λόγος'); // index 0 (Amber)
		highlightStore.toggle('θεός');  // index 1 (Sky Blue)
		highlightStore.toggle('ἀγάπη'); // index 2 (Emerald)

		expect(highlightStore.getColorIndex('λόγος')).toBe(0);
		expect(highlightStore.getColorIndex('θεός')).toBe(1);
		expect(highlightStore.getColorIndex('ἀγάπη')).toBe(2);

		expect(highlightStore.get('θεός')?.name).toBe('Sky Blue');
		expect(highlightStore.get('ἀγάπη')?.name).toBe('Emerald');
	});

	it('allows the user to switch the assigned color of a lemma', () => {
		highlightStore.toggle('λόγος');
		expect(highlightStore.getColorIndex('λόγος')).toBe(0);

		// Switch to index 4 (Violet)
		highlightStore.setColor('λόγος', 4);
		expect(highlightStore.getColorIndex('λόγος')).toBe(4);
		expect(highlightStore.get('λόγος')?.name).toBe('Violet');
		expect(highlightStore.get('λόγος')?.hex).toBe(HIGHLIGHT_PALETTE[4].hex);

		// Switch to index 7 (Fuchsia)
		highlightStore.setColor('λόγος', 7);
		expect(highlightStore.getColorIndex('λόγος')).toBe(7);
		expect(highlightStore.get('λόγος')?.name).toBe('Fuchsia');
	});

	it('toggles lemma off when called again', () => {
		highlightStore.toggle('λόγος');
		expect(highlightStore.isHighlighted('λόγος')).toBe(true);

		const off = highlightStore.toggle('λόγος');
		expect(off).toBe(false);
		expect(highlightStore.isHighlighted('λόγος')).toBe(false);
		expect(highlightStore.get('λόγος')).toBeNull();
	});

	it('supports remove and clear operations', () => {
		highlightStore.toggle('λόγος');
		highlightStore.toggle('θεός');
		expect(Object.keys(highlightStore.highlights)).toHaveLength(2);

		highlightStore.remove('λόγος');
		expect(highlightStore.isHighlighted('λόγος')).toBe(false);
		expect(highlightStore.isHighlighted('θεός')).toBe(true);

		highlightStore.clear();
		expect(Object.keys(highlightStore.highlights)).toHaveLength(0);
	});

	it('matches lemmas with polytonic/plain Greek variations', () => {
		highlightStore.toggle('λόγος');
		// Checking with plain Greek form or identical lemma
		expect(highlightStore.isHighlighted('λογος')).toBe(true);
		expect(highlightStore.getColorIndex('λογος')).toBe(0);
		expect(highlightStore.get('λογος')?.name).toBe('Amber');
	});

	it('generates inline styles for light and dark themes', () => {
		highlightStore.toggle('λόγος');
		const lightStyle = highlightStore.getStyle('λόγος', false);
		expect(lightStyle).toContain(HIGHLIGHT_PALETTE[0].bgLight);
		expect(lightStyle).toContain(HIGHLIGHT_PALETTE[0].textLight);

		const darkStyle = highlightStore.getStyle('λόγος', true);
		expect(darkStyle).toContain(HIGHLIGHT_PALETTE[0].bgDark);
		expect(darkStyle).toContain(HIGHLIGHT_PALETTE[0].textDark);
	});
});
