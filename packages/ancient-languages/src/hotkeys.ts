export type HotkeyCategory = 'Navigation' | 'View' | 'General' | string;

export interface HotkeyAction<TState = any> {
	id: string;
	name: string;
	description: string;
	category: HotkeyCategory;
	keys: string[];
	action: (state: TState, event: KeyboardEvent) => void | Promise<void>;
	enabled?: (state: TState) => boolean;
	preventDefault?: boolean;
}

export function formatKey(key: string): string {
	const isMac =
		typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '');
	if (key.includes('mod+')) {
		return isMac ? key.replace('mod+', '⌘').toUpperCase() : key.replace('mod+', 'Ctrl+').toUpperCase();
	}
	switch (key) {
		case 'ArrowLeft':
			return '←';
		case 'ArrowRight':
			return '→';
		case 'ArrowUp':
			return '↑';
		case 'ArrowDown':
			return '↓';
		default:
			return key;
	}
}

export function groupActionsByCategory<TState = unknown>(
	actions: HotkeyAction<TState>[]
): Record<string, HotkeyAction<TState>[]> {
	const groups: Record<string, HotkeyAction<TState>[]> = {};
	for (const action of actions) {
		const cat = action.category || 'General';
		if (!groups[cat]) groups[cat] = [];
		groups[cat].push(action);
	}
	return groups;
}

export class HotkeyManager<TState = unknown> {
	private actions: HotkeyAction<TState>[];

	constructor(actions: HotkeyAction<TState>[] = []) {
		this.actions = actions;
	}

	getActions(): HotkeyAction<TState>[] {
		return this.actions;
	}

	setActions(actions: HotkeyAction<TState>[]): void {
		this.actions = actions;
	}

	isInputElement(target: EventTarget | null): boolean {
		if (!target) return false;
		const el = target as any;
		if (el.isContentEditable) return true;
		if (typeof el.matches === 'function' && el.matches('input, textarea, select, [contenteditable="true"]')) {
			return true;
		}
		if (typeof el.closest === 'function') {
			return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'));
		}
		return false;
	}

	isModifierMatch(bindingParts: string[], event: KeyboardEvent): boolean {
		const isMac =
			typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '');
		const modActive = isMac ? event.metaKey : event.ctrlKey;

		const reqMod =
			bindingParts.includes('mod') ||
			bindingParts.includes('ctrl') ||
			bindingParts.includes('meta');
		const reqAlt = bindingParts.includes('alt');
		const reqShift = bindingParts.includes('shift');

		if (reqMod !== modActive) return false;
		if (reqAlt !== event.altKey) return false;
		if (reqShift !== event.shiftKey) return false;

		return true;
	}

	matchesBinding(binding: string, event: KeyboardEvent): boolean {
		const hasCombination = binding.includes('+');

		if (hasCombination) {
			const parts = binding.toLowerCase().split('+');
			const targetKey = parts[parts.length - 1];

			if (!this.isModifierMatch(parts.slice(0, -1), event)) {
				return false;
			}

			return (
				event.key.toLowerCase() === targetKey ||
				(event.code ? event.code.toLowerCase() === targetKey.toLowerCase() : false)
			);
		}

		// Single key binding (no modifiers like Ctrl, Meta, Alt allowed)
		if (event.ctrlKey || event.metaKey || event.altKey) {
			return false;
		}

		// Exact match (e.g. '?' or '[') or case-insensitive match (e.g. 'b' / 'B' or 'ArrowLeft')
		return (
			event.key === binding ||
			event.key.toLowerCase() === binding.toLowerCase()
		);
	}

	handleKeyDown(event: KeyboardEvent, state?: TState): boolean {
		if (state && typeof state === 'object' && 'hotkeysEnabled' in (state as any)) {
			if (!(state as any).hotkeysEnabled) return false;
		}

		// Guard: Do not trigger hotkeys when typing in input, textarea, select or contenteditable
		if (this.isInputElement(event.target)) {
			if (event.key === 'Escape') {
				if (typeof (event.target as any)?.blur === 'function') {
					(event.target as any).blur();
				}
				if (state && typeof (state as any).closeAllPopups === 'function') {
					(state as any).closeAllPopups();
				} else if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('close-all-modals'));
				}
				return true;
			}
			return false;
		}

		// Ignore repeated keydown events from holding key down
		if (event.repeat) return false;

		for (const action of this.actions) {
			if (action.enabled && !action.enabled(state as TState)) {
				continue;
			}

			const matched = action.keys.some((keyBinding) => this.matchesBinding(keyBinding, event));

			if (matched) {
				if (action.preventDefault) {
					event.preventDefault();
				}
				action.action(state as TState, event);
				return true;
			}
		}

		return false;
	}
}
