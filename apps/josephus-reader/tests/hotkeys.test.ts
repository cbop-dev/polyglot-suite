import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JOSEPHUS_HOTKEYS, hotkeyManager } from '../shared/lib/hotkeys';

if (typeof globalThis.window === 'undefined') {
	globalThis.window = {
		dispatchEvent: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	} as any;
}
if (typeof globalThis.CustomEvent === 'undefined') {
	globalThis.CustomEvent = class CustomEvent {
		type: string;
		detail: any;
		constructor(type: string, params?: { detail?: any }) {
			this.type = type;
			this.detail = params?.detail;
		}
	} as any;
}

describe('Josephus Reader Hotkeys', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
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
		expect(actionIds).toContain('nav-next');
		expect(actionIds).toContain('nav-prev');
		expect(actionIds).toContain('view-theme');
		expect(actionIds).toContain('view-greek');
		expect(actionIds).toContain('view-english');
		expect(actionIds).toContain('view-dual');
		expect(actionIds).toContain('view-zen');
		expect(actionIds).toContain('font-increase');
		expect(actionIds).toContain('font-decrease');
		expect(actionIds).toContain('tools-morph');
		expect(actionIds).toContain('tools-search');
		expect(actionIds).toContain('tools-highlights');
		expect(actionIds).toContain('tools-bookmarks');
		expect(actionIds).toContain('cmd-palette');
		expect(actionIds).toContain('help-shortcuts');
		expect(actionIds).toContain('close-modals');
	});

	it('dispatches open-niese-jump on "j" key', () => {
		const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
		const event = createKeyEvent('j');

		const handled = hotkeyManager.handleKeyDown(event);
		expect(handled).toBe(true);
		expect(event.preventDefault).toHaveBeenCalled();

		const dispatchedEvent = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
		expect(dispatchedEvent?.type).toBe('open-niese-jump');
	});

	it('dispatches reader-nav-next on "n" and "ArrowRight"', () => {
		const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

		hotkeyManager.handleKeyDown(createKeyEvent('n'));
		expect(dispatchSpy.mock.calls[0]?.[0]?.type).toBe('reader-nav-next');

		hotkeyManager.handleKeyDown(createKeyEvent('ArrowRight'));
		expect(dispatchSpy.mock.calls[1]?.[0]?.type).toBe('reader-nav-next');
	});

	it('dispatches reader-nav-prev on "p" and "ArrowLeft"', () => {
		const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

		hotkeyManager.handleKeyDown(createKeyEvent('p'));
		expect(dispatchSpy.mock.calls[0]?.[0]?.type).toBe('reader-nav-prev');

		hotkeyManager.handleKeyDown(createKeyEvent('ArrowLeft'));
		expect(dispatchSpy.mock.calls[1]?.[0]?.type).toBe('reader-nav-prev');
	});

	it('dispatches toggle-command-palette on mod+k', () => {
		const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
		const event = createKeyEvent('k', { ctrlKey: true });

		const handled = hotkeyManager.handleKeyDown(event);
		expect(handled).toBe(true);

		const dispatchedEvent = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
		expect(dispatchedEvent?.type).toBe('toggle-command-palette');
	});

	it('dispatches toggle-help-modal on "?"', () => {
		const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
		const event = createKeyEvent('?');

		const handled = hotkeyManager.handleKeyDown(event);
		expect(handled).toBe(true);

		const dispatchedEvent = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
		expect(dispatchedEvent?.type).toBe('toggle-help-modal');
	});

	it('dispatches close-all-modals on Escape', () => {
		const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
		const event = createKeyEvent('Escape');

		const handled = hotkeyManager.handleKeyDown(event);
		expect(handled).toBe(true);

		const dispatchedEvent = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
		expect(dispatchedEvent?.type).toBe('close-all-modals');
	});

	it('does not trigger hotkeys when typing in input elements', () => {
		const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
		const mockInput = {
			matches: (sel: string) => sel.includes('input'),
			closest: () => true,
			isContentEditable: false
		};

		const event = createKeyEvent('j', { target: mockInput as any });
		const handled = hotkeyManager.handleKeyDown(event);

		expect(handled).toBe(false);
		expect(dispatchSpy).not.toHaveBeenCalled();
	});
});
