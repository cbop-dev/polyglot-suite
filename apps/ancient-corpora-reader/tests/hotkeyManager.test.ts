import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HotkeyManager, hotkeyManager } from '../src/lib/services/hotkeyManager.js';
import { ACR_HOTKEYS, type HotkeyAction } from '../src/lib/config/hotkeys.js';

describe('ACR HotkeyManager', () => {
	let manager: HotkeyManager;
	let mockState: any;

	beforeEach(() => {
		mockState = {
			nextDivision: vi.fn(),
			prevDivision: vi.fn(),
			closeAllModals: vi.fn(),
			toggleSidePanel: vi.fn(),
			isCorpusModalOpen: false,
			isWorkModalOpen: false,
			isDivisionModalOpen: false,
			viewMode: 'stacked',
			showHotkeyHelp: false,
			hotkeysEnabled: true
		};
		manager = new HotkeyManager(ACR_HOTKEYS);
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

	it('exports ACR_HOTKEYS single source of truth with expected categories', () => {
		expect(ACR_HOTKEYS.length).toBeGreaterThan(0);
		const categories = new Set(ACR_HOTKEYS.map((a) => a.category));
		expect(categories.has('Navigation')).toBe(true);
		expect(categories.has('View')).toBe(true);
		expect(categories.has('General')).toBe(true);
	});

	it('dispatches nextDivision on "]" and "ArrowRight"', () => {
		manager.handleKeyDown(createKeyEvent(']'), mockState);
		expect(mockState.nextDivision).toHaveBeenCalledTimes(1);

		manager.handleKeyDown(createKeyEvent('ArrowRight'), mockState);
		expect(mockState.nextDivision).toHaveBeenCalledTimes(2);
	});

	it('dispatches prevDivision on "[" and "ArrowLeft"', () => {
		manager.handleKeyDown(createKeyEvent('['), mockState);
		expect(mockState.prevDivision).toHaveBeenCalledTimes(1);

		manager.handleKeyDown(createKeyEvent('ArrowLeft'), mockState);
		expect(mockState.prevDivision).toHaveBeenCalledTimes(2);
	});

	it('opens work picker on "w" (case-insensitive)', () => {
		manager.handleKeyDown(createKeyEvent('w'), mockState);
		expect(mockState.isWorkModalOpen).toBe(true);
	});

	it('opens corpus picker on "b"', () => {
		manager.handleKeyDown(createKeyEvent('b'), mockState);
		expect(mockState.isCorpusModalOpen).toBe(true);
	});

	it('opens division picker on "j", "s", or "c"', () => {
		manager.handleKeyDown(createKeyEvent('j'), mockState);
		expect(mockState.isDivisionModalOpen).toBe(true);

		mockState.isDivisionModalOpen = false;
		manager.handleKeyDown(createKeyEvent('s'), mockState);
		expect(mockState.isDivisionModalOpen).toBe(true);

		mockState.isDivisionModalOpen = false;
		manager.handleKeyDown(createKeyEvent('c'), mockState);
		expect(mockState.isDivisionModalOpen).toBe(true);
	});

	it('toggles hotkey help on "?"', () => {
		manager.handleKeyDown(createKeyEvent('?'), mockState);
		expect(mockState.showHotkeyHelp).toBe(true);
	});

	it('closes all modals on "Escape"', () => {
		manager.handleKeyDown(createKeyEvent('Escape'), mockState);
		expect(mockState.closeAllModals).toHaveBeenCalled();
	});

	it('toggles search panel on "f" or "/"', () => {
		manager.handleKeyDown(createKeyEvent('f'), mockState);
		expect(mockState.toggleSidePanel).toHaveBeenCalledWith('search');

		manager.handleKeyDown(createKeyEvent('/'), mockState);
		expect(mockState.toggleSidePanel).toHaveBeenCalledWith('search');
	});

	it('suppresses hotkey when focused in an input', () => {
		const mockInput = {
			matches: (sel: string) => sel.includes('input'),
			closest: () => true,
			isContentEditable: false
		};
		const handled = manager.handleKeyDown(createKeyEvent('w', { target: mockInput as any }), mockState);
		expect(handled).toBe(false);
		expect(mockState.isWorkModalOpen).toBe(false);
	});
});
