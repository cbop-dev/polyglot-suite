import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HotkeyManager } from './hotkeyManager';
import { AF_HOTKEYS, type HotkeyAction } from '../config/hotkeys';

function createKeyboardEvent(
	key: string,
	options: {
		ctrlKey?: boolean;
		metaKey?: boolean;
		altKey?: boolean;
		shiftKey?: boolean;
		repeat?: boolean;
		target?: any;
	} = {}
): KeyboardEvent {
	return {
		key,
		code: key,
		ctrlKey: options.ctrlKey ?? false,
		metaKey: options.metaKey ?? false,
		altKey: options.altKey ?? false,
		shiftKey: options.shiftKey ?? false,
		repeat: options.repeat ?? false,
		target: options.target ?? null,
		preventDefault: vi.fn()
	} as unknown as KeyboardEvent;
}

describe('HotkeyManager for Apostolic Fathers', () => {
	let manager: HotkeyManager;
	let mockState: any;

	beforeEach(() => {
		manager = new HotkeyManager(AF_HOTKEYS);
		mockState = {
			isBookModalOpen: false,
			isChapterModalOpen: false,
			showHotkeyHelp: false,
			isCommandPaletteOpen: false,
			isSidePanelOpen: false,
			selectedToken: null,
			citationTarget: null,
			hotkeysEnabled: true,
			showGreek: true,
			showEnglish: true,
			showLatin: true,
			openBookModal: vi.fn(function (this: any) { this.isBookModalOpen = true; }),
			openChapterModal: vi.fn(function (this: any) { this.isChapterModalOpen = true; }),
			toggleHotkeyHelp: vi.fn(function (this: any) { this.showHotkeyHelp = !this.showHotkeyHelp; }),
			toggleCommandPalette: vi.fn(function (this: any) { this.isCommandPaletteOpen = !this.isCommandPaletteOpen; }),
			toggleSidePanel: vi.fn(function (this: any) { this.isSidePanelOpen = !this.isSidePanelOpen; }),
			toggleSearch: vi.fn(),
			openHighlightsTab: vi.fn(),
			nextChapter: vi.fn(),
			prevChapter: vi.fn(),
			hasLatinInChapter: vi.fn(() => true),
			closeAllPopups: vi.fn(function (this: any) {
				if (this.isBookModalOpen) {
					this.isBookModalOpen = false;
					return true;
				}
				if (this.isChapterModalOpen) {
					this.isChapterModalOpen = false;
					return true;
				}
				if (this.showHotkeyHelp) {
					this.showHotkeyHelp = false;
					return true;
				}
				if (this.isCommandPaletteOpen) {
					this.isCommandPaletteOpen = false;
					return true;
				}
				if (this.isSidePanelOpen) {
					this.isSidePanelOpen = false;
					return true;
				}
				return false;
			})
		};
	});

	it('triggers book modal on "b" key', () => {
		const event = createKeyboardEvent('b');
		const handled = manager.handleKeyDown(event, mockState);
		expect(handled).toBe(true);
		expect(mockState.openBookModal).toHaveBeenCalled();
		expect(mockState.isBookModalOpen).toBe(true);
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('triggers chapter modal on "c" key', () => {
		const event = createKeyboardEvent('c');
		const handled = manager.handleKeyDown(event, mockState);
		expect(handled).toBe(true);
		expect(mockState.openChapterModal).toHaveBeenCalled();
		expect(mockState.isChapterModalOpen).toBe(true);
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('triggers hotkey help modal on "?" key', () => {
		const event = createKeyboardEvent('?');
		const handled = manager.handleKeyDown(event, mockState);
		expect(handled).toBe(true);
		expect(mockState.toggleHotkeyHelp).toHaveBeenCalled();
		expect(mockState.showHotkeyHelp).toBe(true);
	});

	it('triggers command palette on "mod+k"', () => {
		// Mock Linux/Windows Ctrl+k
		const event = createKeyboardEvent('k', { ctrlKey: true });
		const handled = manager.handleKeyDown(event, mockState);
		expect(handled).toBe(true);
		expect(mockState.toggleCommandPalette).toHaveBeenCalled();
		expect(mockState.isCommandPaletteOpen).toBe(true);
	});

	it('toggles column visibility on "g" and "e"', () => {
		const initialGreek = mockState.showGreek;
		const eventG = createKeyboardEvent('g');
		manager.handleKeyDown(eventG, mockState);
		expect(mockState.showGreek).toBe(!initialGreek);

		const initialEng = mockState.showEnglish;
		const eventE = createKeyboardEvent('e');
		manager.handleKeyDown(eventE, mockState);
		expect(mockState.showEnglish).toBe(!initialEng);
	});

	it('does not trigger hotkeys when typing in an input element', () => {
		const inputEl = {
			matches: (sel: string) => sel.includes('input')
		};
		const event = createKeyboardEvent('b', { target: inputEl });
		const handled = manager.handleKeyDown(event, mockState);
		expect(handled).toBe(false);
		expect(mockState.openBookModal).not.toHaveBeenCalled();
	});

	it('blurs input and closes popups on Escape from input element', () => {
		mockState.isBookModalOpen = true;
		const blurSpy = vi.fn();
		const inputEl = {
			matches: (sel: string) => sel.includes('input'),
			blur: blurSpy
		};
		const event = createKeyboardEvent('Escape', { target: inputEl });
		const handled = manager.handleKeyDown(event, mockState);

		expect(handled).toBe(true);
		expect(blurSpy).toHaveBeenCalled();
		expect(mockState.closeAllPopups).toHaveBeenCalled();
		expect(mockState.isBookModalOpen).toBe(false);
	});

	it('closes side panel on Escape when no modal is open', () => {
		mockState.isSidePanelOpen = true;
		const event = createKeyboardEvent('Escape');
		const handled = manager.handleKeyDown(event, mockState);

		expect(handled).toBe(true);
		expect(mockState.closeAllPopups).toHaveBeenCalled();
		expect(mockState.isSidePanelOpen).toBe(false);
	});

	it('closes modals before side panel on Escape', () => {
		mockState.isSidePanelOpen = true;
		mockState.isChapterModalOpen = true;

		// First Escape closes Chapter Modal
		const event1 = createKeyboardEvent('Escape');
		manager.handleKeyDown(event1, mockState);
		expect(mockState.isChapterModalOpen).toBe(false);
		expect(mockState.isSidePanelOpen).toBe(true);

		// Second Escape closes Side Panel
		const event2 = createKeyboardEvent('Escape');
		manager.handleKeyDown(event2, mockState);
		expect(mockState.isSidePanelOpen).toBe(false);
	});

	it('ignores hotkeys if hotkeysEnabled is false', () => {
		mockState.hotkeysEnabled = false;
		const event = createKeyboardEvent('b');
		const handled = manager.handleKeyDown(event, mockState);
		expect(handled).toBe(false);
		expect(mockState.openBookModal).not.toHaveBeenCalled();
	});

	it('does not fire single-key hotkey if Ctrl or Meta or Alt is pressed', () => {
		const event = createKeyboardEvent('b', { ctrlKey: true });
		const handled = manager.handleKeyDown(event, mockState);
		expect(handled).toBe(false);
		expect(mockState.openBookModal).not.toHaveBeenCalled();
	});
});
