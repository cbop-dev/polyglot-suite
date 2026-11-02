import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JOSEPHUS_HOTKEYS } from '../src/lib/config/hotkeys';
import { hotkeyManager } from '../src/lib/services/hotkeyManager';
import type { ReaderState } from '../src/lib/stores/readerState.svelte';

vi.mock('$app/navigation', () => ({
	goto: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$app/paths', () => ({
	base: ''
}));

describe('Josephus Reader Hotkeys', () => {
	let mockState: Partial<ReaderState>;

	beforeEach(() => {
		vi.restoreAllMocks();
		mockState = {
			currentBook: 2,
			currentWorkCode: 'Antiquities',
			currentWork: {
				id: 'antiquities',
				code: 'Antiquities',
				titleEnglish: 'Antiquities of the Jews',
				titleGreek: 'Ἰουδαϊκὴ ἀρχαιολογία',
				abbrev: 'Ant. Iud.',
				totalBooks: 20,
				totalSections: 6682
			} as any,
			prevBook: vi.fn(),
			nextBook: vi.fn(),
			viewMode: 'parallel',
			isCommandPaletteOpen: false,
			showHotkeyHelp: false,
			openCommandPalette: vi.fn(),
			openHotkeyHelp: vi.fn(),
			openChapterModal: vi.fn(),
			openBookModal: vi.fn(),
			closeAllModals: vi.fn()
		};
	});

	function createKeyEvent(key: string, options: Partial<KeyboardEvent> = {}): KeyboardEvent {
		return {
			key,
			code: key,
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			shiftKey: false,
			repeat: false,
			target: null,
			preventDefault: vi.fn(),
			...options
		} as unknown as KeyboardEvent;
	}

	it('defines all required reader actions', () => {
		const actionIds = JOSEPHUS_HOTKEYS.map((a) => a.id);
		expect(actionIds).toContain('jump-niese');
		expect(actionIds).toContain('nav-next-book');
		expect(actionIds).toContain('nav-prev-book');
		expect(actionIds).toContain('view-greek');
		expect(actionIds).toContain('view-english');
		expect(actionIds).toContain('view-dual');
		expect(actionIds).toContain('open-bookmarks');
		expect(actionIds).toContain('open-command-palette');
		expect(actionIds).toContain('help-modal');
		expect(actionIds).toContain('close-modals');
	});

	it('handles "j" key for Niese jump', () => {
		const event = createKeyEvent('j');
		const handled = hotkeyManager.handleKeyDown(event, mockState as ReaderState);
		expect(handled).toBe(true);
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('navigates next book on "]" and "ArrowRight"', () => {
		hotkeyManager.handleKeyDown(createKeyEvent(']'), mockState as ReaderState);
		expect(mockState.nextBook).toHaveBeenCalledTimes(1);

		hotkeyManager.handleKeyDown(createKeyEvent('ArrowRight'), mockState as ReaderState);
		expect(mockState.nextBook).toHaveBeenCalledTimes(2);
	});

	it('navigates prev book on "[" and "ArrowLeft"', () => {
		hotkeyManager.handleKeyDown(createKeyEvent('['), mockState as ReaderState);
		expect(mockState.prevBook).toHaveBeenCalledTimes(1);

		hotkeyManager.handleKeyDown(createKeyEvent('ArrowLeft'), mockState as ReaderState);
		expect(mockState.prevBook).toHaveBeenCalledTimes(2);
	});

	it('triggers command palette on mod+k', () => {
		const event = createKeyEvent('k', { ctrlKey: true });
		const handled = hotkeyManager.handleKeyDown(event, mockState as ReaderState);
		expect(handled).toBe(true);
		expect(mockState.openCommandPalette).toHaveBeenCalledTimes(1);
	});

	it('triggers help modal on "?"', () => {
		const event = createKeyEvent('?');
		const handled = hotkeyManager.handleKeyDown(event, mockState as ReaderState);
		expect(handled).toBe(true);
		expect(mockState.openHotkeyHelp).toHaveBeenCalledTimes(1);
	});

	it('closes all modals on Escape', () => {
		const event = createKeyEvent('Escape');
		const handled = hotkeyManager.handleKeyDown(event, mockState as ReaderState);
		expect(handled).toBe(true);
		expect(mockState.closeAllModals).toHaveBeenCalledTimes(1);
	});

	it('does not trigger hotkeys when typing in input elements', () => {
		const mockInput = {
			matches: (sel: string) => sel.includes('input'),
			closest: () => true,
			isContentEditable: false
		};

		const event = createKeyEvent('j', { target: mockInput as any });
		const handled = hotkeyManager.handleKeyDown(event, mockState as ReaderState);

		expect(handled).toBe(false);
	});
});
