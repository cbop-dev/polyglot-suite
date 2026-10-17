import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	HotkeyManager,
	formatKey,
	groupActionsByCategory,
	type HotkeyAction
} from '../src/hotkeys.js';

describe('Shared HotkeyManager & Utilities', () => {
	let manager: HotkeyManager;
	let mockState: any;

	beforeEach(() => {
		mockState = {
			hotkeysEnabled: true,
			counter: 0,
			closeAllPopups: vi.fn()
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

	describe('formatKey', () => {
		it('formats arrow keys to symbol icons', () => {
			expect(formatKey('ArrowLeft')).toBe('←');
			expect(formatKey('ArrowRight')).toBe('→');
			expect(formatKey('ArrowUp')).toBe('↑');
			expect(formatKey('ArrowDown')).toBe('↓');
		});

		it('formats single characters and other keys as-is', () => {
			expect(formatKey('a')).toBe('a');
			expect(formatKey('Escape')).toBe('Escape');
		});

		it('formats modifier key mod+ to platform symbol or Ctrl+', () => {
			const formatted = formatKey('mod+k');
			expect(formatted).toMatch(/^(⌘K|CTRL\+K)$/);
		});
	});

	describe('groupActionsByCategory', () => {
		it('groups hotkey actions by their category', () => {
			const actions: HotkeyAction[] = [
				{ id: '1', name: 'Nav 1', description: 'desc', category: 'Navigation', keys: ['n'], action: vi.fn() },
				{ id: '2', name: 'Nav 2', description: 'desc', category: 'Navigation', keys: ['p'], action: vi.fn() },
				{ id: '3', name: 'View 1', description: 'desc', category: 'View', keys: ['v'], action: vi.fn() }
			];

			const groups = groupActionsByCategory(actions);
			expect(Object.keys(groups)).toEqual(['Navigation', 'View']);
			expect(groups['Navigation']).toHaveLength(2);
			expect(groups['View']).toHaveLength(1);
		});
	});

	describe('HotkeyManager execution', () => {
		it('matches single letter keys case-insensitively', () => {
			const actionFn = vi.fn();
			const actions: HotkeyAction[] = [
				{ id: 'jump', name: 'Jump', description: 'desc', category: 'Navigation', keys: ['j'], action: actionFn }
			];
			manager = new HotkeyManager(actions);

			expect(manager.handleKeyDown(createKeyEvent('j'), mockState)).toBe(true);
			expect(actionFn).toHaveBeenCalledTimes(1);

			expect(manager.handleKeyDown(createKeyEvent('J'), mockState)).toBe(true);
			expect(actionFn).toHaveBeenCalledTimes(2);
		});

		it('supports alias keys for the same action', () => {
			const nextFn = vi.fn();
			const actions: HotkeyAction[] = [
				{ id: 'next', name: 'Next', description: 'desc', category: 'Navigation', keys: ['n', 'ArrowRight'], action: nextFn }
			];
			manager = new HotkeyManager(actions);

			manager.handleKeyDown(createKeyEvent('n'), mockState);
			expect(nextFn).toHaveBeenCalledTimes(1);

			manager.handleKeyDown(createKeyEvent('ArrowRight'), mockState);
			expect(nextFn).toHaveBeenCalledTimes(2);
		});

		it('does not trigger single key action when Ctrl/Meta/Alt modifiers are held', () => {
			const actionFn = vi.fn();
			manager = new HotkeyManager([
				{ id: 'test', name: 'Test', description: 'desc', category: 'General', keys: ['m'], action: actionFn }
			]);

			expect(manager.handleKeyDown(createKeyEvent('m', { ctrlKey: true }), mockState)).toBe(false);
			expect(manager.handleKeyDown(createKeyEvent('m', { metaKey: true }), mockState)).toBe(false);
			expect(manager.handleKeyDown(createKeyEvent('m', { altKey: true }), mockState)).toBe(false);
			expect(actionFn).not.toHaveBeenCalled();
		});

		it('matches modifier combination mod+k', () => {
			const paletteFn = vi.fn();
			manager = new HotkeyManager([
				{ id: 'palette', name: 'Palette', description: 'desc', category: 'General', keys: ['mod+k'], action: paletteFn }
			]);

			// Simulate Ctrl+k
			const ctrlK = createKeyEvent('k', { ctrlKey: true });
			const handled = manager.handleKeyDown(ctrlK, mockState);
			expect(handled).toBe(true);
			expect(paletteFn).toHaveBeenCalledTimes(1);

			// Key without modifier should not match
			expect(manager.handleKeyDown(createKeyEvent('k'), mockState)).toBe(false);
		});

		it('respects preventDefault on action', () => {
			const actions: HotkeyAction[] = [
				{ id: 'test', name: 'Test', description: 'desc', category: 'General', keys: ['d'], preventDefault: true, action: vi.fn() }
			];
			manager = new HotkeyManager(actions);

			const event = createKeyEvent('d');
			manager.handleKeyDown(event, mockState);
			expect(event.preventDefault).toHaveBeenCalled();
		});

		it('ignores repeated keydown events', () => {
			const actionFn = vi.fn();
			manager = new HotkeyManager([
				{ id: 'test', name: 'Test', description: 'desc', category: 'General', keys: ['t'], action: actionFn }
			]);

			const repeatEvent = createKeyEvent('t', { repeat: true });
			expect(manager.handleKeyDown(repeatEvent, mockState)).toBe(false);
			expect(actionFn).not.toHaveBeenCalled();
		});

		it('respects action enabled predicate', () => {
			const actionFn = vi.fn();
			let isEnabled = false;
			manager = new HotkeyManager([
				{
					id: 'test',
					name: 'Test',
					description: 'desc',
					category: 'General',
					keys: ['x'],
					enabled: () => isEnabled,
					action: actionFn
				}
			]);

			expect(manager.handleKeyDown(createKeyEvent('x'), mockState)).toBe(false);
			expect(actionFn).not.toHaveBeenCalled();

			isEnabled = true;
			expect(manager.handleKeyDown(createKeyEvent('x'), mockState)).toBe(true);
			expect(actionFn).toHaveBeenCalledTimes(1);
		});

		it('suppresses hotkeys if state.hotkeysEnabled is false', () => {
			const actionFn = vi.fn();
			manager = new HotkeyManager([
				{ id: 'test', name: 'Test', description: 'desc', category: 'General', keys: ['x'], action: actionFn }
			]);
			mockState.hotkeysEnabled = false;

			expect(manager.handleKeyDown(createKeyEvent('x'), mockState)).toBe(false);
			expect(actionFn).not.toHaveBeenCalled();
		});

		it('suppresses hotkeys when typing in input/textarea/select/contenteditable', () => {
			const actionFn = vi.fn();
			manager = new HotkeyManager([
				{ id: 'test', name: 'Test', description: 'desc', category: 'General', keys: ['j'], action: actionFn }
			]);

			const mockInput = {
				matches: (sel: string) => sel.includes('input'),
				closest: () => true,
				isContentEditable: false
			};

			const event = createKeyEvent('j', { target: mockInput as any });
			expect(manager.handleKeyDown(event, mockState)).toBe(false);
			expect(actionFn).not.toHaveBeenCalled();
		});

		it('handles Escape inside an input by blurring and closing popups', () => {
			manager = new HotkeyManager();
			const blurFn = vi.fn();
			const mockInput = {
				matches: (sel: string) => sel.includes('input'),
				closest: () => true,
				isContentEditable: false,
				blur: blurFn
			};

			const event = createKeyEvent('Escape', { target: mockInput as any });
			expect(manager.handleKeyDown(event, mockState)).toBe(true);
			expect(blurFn).toHaveBeenCalled();
			expect(mockState.closeAllPopups).toHaveBeenCalled();
		});

		it('allows dynamically updating actions via setActions() and getActions()', () => {
			manager = new HotkeyManager();
			expect(manager.getActions()).toHaveLength(0);

			const newActions: HotkeyAction[] = [
				{ id: 'dynamic', name: 'Dynamic', description: 'desc', category: 'General', keys: ['z'], action: vi.fn() }
			];
			manager.setActions(newActions);
			expect(manager.getActions()).toHaveLength(1);
			expect(manager.getActions()[0].id).toBe('dynamic');
		});
	});
});
