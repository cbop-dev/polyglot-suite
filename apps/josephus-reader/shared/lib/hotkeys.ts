import { HotkeyManager, type HotkeyAction, formatKey } from '@polyglot/ancient-languages/hotkeys';

export type { HotkeyAction };
export { formatKey };

export const JOSEPHUS_HOTKEYS: HotkeyAction[] = [
	// Navigation
	{
		id: 'jump-niese',
		name: 'Jump to Section',
		description: 'Open and focus "Jump to §" input',
		category: 'Navigation',
		keys: ['j'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('open-niese-jump'));
			}
		}
	},
	{
		id: 'nav-next',
		name: 'Next Section',
		description: 'Jump to next section',
		category: 'Navigation',
		keys: ['ArrowRight', 'n'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-nav-next'));
			}
		}
	},
	{
		id: 'nav-prev',
		name: 'Previous Section',
		description: 'Jump to previous section',
		category: 'Navigation',
		keys: ['ArrowLeft', 'p'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-nav-prev'));
			}
		}
	},
	{
		id: 'nav-first',
		name: 'First Section',
		description: 'Jump to first section (§ 1)',
		category: 'Navigation',
		keys: ['f'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-nav-first'));
			}
		}
	},
	{
		id: 'nav-last',
		name: 'Last Section',
		description: 'Jump to last section',
		category: 'Navigation',
		keys: ['l'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-nav-last'));
			}
		}
	},
	{
		id: 'nav-lang-switch',
		name: 'Switch Language',
		description: 'Switch/scroll between Greek & English in section',
		category: 'Navigation',
		keys: ['o'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-nav-lang-switch'));
			}
		}
	},

	// View
	{
		id: 'view-theme',
		name: 'Cycle Theme',
		description: 'Cycle theme presets (Pure Light ☀️ → Midnight 🌙 → Parchment 📜)',
		category: 'View',
		keys: ['t'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('cycle-theme'));
			}
		}
	},
	{
		id: 'view-greek',
		name: 'Greek Only',
		description: 'Show Greek text only',
		category: 'View',
		keys: ['g'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-set-viewmode', { detail: 'greek' }));
			}
		}
	},
	{
		id: 'view-english',
		name: 'English Only',
		description: 'Show English text only',
		category: 'View',
		keys: ['e'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-set-viewmode', { detail: 'english' }));
			}
		}
	},
	{
		id: 'view-dual',
		name: 'Toggle Dual Mode',
		description: 'Toggle Dual language modes (Parallel ◧ ↔ Stacked ⬓)',
		category: 'View',
		keys: ['d'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-toggle-dualmode'));
			}
		}
	},
	{
		id: 'view-zen',
		name: 'Zen Mode',
		description: 'Toggle Zen Mode (full-screen focus view)',
		category: 'View',
		keys: ['z'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-toggle-zen'));
			}
		}
	},
	{
		id: 'font-increase',
		name: 'Increase Font Size',
		description: 'Increase text size',
		category: 'View',
		keys: ['+', '='],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-set-fontsize', { detail: 'inc' }));
			}
		}
	},
	{
		id: 'font-decrease',
		name: 'Decrease Font Size',
		description: 'Decrease text size',
		category: 'View',
		keys: ['-', '_'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-set-fontsize', { detail: 'dec' }));
			}
		}
	},

	// General & Tools
	{
		id: 'tools-morph',
		name: 'Word Info',
		description: 'Toggle Word Info mode (interactive word popups)',
		category: 'General',
		keys: ['w'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-toggle-morph'));
			}
		}
	},
	{
		id: 'tools-search',
		name: 'Corpus Search',
		description: 'Open Corpus Search',
		category: 'General',
		keys: ['s','/'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-toggle-search', { detail: { tab: 'lemma' } }));
			}
		}
	},
	{
		id: 'tools-highlights',
		name: 'Active Highlights',
		description: 'Open Active Highlights Tab',
		category: 'General',
		keys: ['h'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-toggle-search', { detail: { tab: 'highlights' } }));
			}
		}
	},
	{
		id: 'tools-bookmarks',
		name: 'Bookmarks',
		description: 'Toggle Bookmarks Modal',
		category: 'General',
		keys: ['b'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('reader-toggle-bookmarks'));
			}
		}
	},
	{
		id: 'cmd-palette',
		name: 'Search & Command Palette',
		description: 'Open Search & Command Palette',
		category: 'General',
		keys: ['mod+k'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('toggle-command-palette'));
			}
		}
	},
	{
		id: 'help-shortcuts',
		name: 'Keyboard Shortcuts',
		description: 'Toggle this Keyboard Shortcuts modal',
		category: 'General',
		keys: ['?'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('toggle-help-modal'));
			}
		}
	},
	{
		id: 'close-modals',
		name: 'Close Dialogs',
		description: 'Close active popups, menus, or modals',
		category: 'General',
		keys: ['Escape'],
		preventDefault: true,
		action: () => {
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('close-all-modals'));
			}
		}
	}
];

export const hotkeyManager = new HotkeyManager(JOSEPHUS_HOTKEYS);
