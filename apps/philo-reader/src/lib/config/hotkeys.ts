import type { ReaderState } from '../stores/readerState.svelte';
import type { HotkeyCategory, HotkeyAction as GenericHotkeyAction } from '@polyglot/ancient-languages/hotkeys';

export type { HotkeyCategory };
export type HotkeyAction = GenericHotkeyAction<ReaderState>;

export const PHILO_HOTKEYS: HotkeyAction[] = [
	{
		id: 'nav-book',
		name: 'Choose Work / Treatise',
		description: 'Open treatise selector with category filter (b)',
		category: 'Navigation',
		keys: ['b'],
		preventDefault: true,
		action: (state) => {
			state.openBookModal();
		}
	},
	{
		id: 'nav-chapter',
		name: 'Choose Book / Section',
		description: 'Open book/section selector (c)',
		category: 'Navigation',
		keys: ['c'],
		preventDefault: true,
		action: (state) => {
			state.openChapterModal();
		}
	},
	{
		id: 'nav-prev-ch',
		name: 'Previous Book / Work',
		description: 'Navigate to previous book or treatise in corpus',
		category: 'Navigation',
		keys: ['ArrowLeft', '['],
		preventDefault: true,
		action: (state) => {
			state.prevChapter();
		}
	},
	{
		id: 'nav-next-ch',
		name: 'Next Book / Work',
		description: 'Navigate to next book or treatise in corpus',
		category: 'Navigation',
		keys: ['ArrowRight', ']'],
		preventDefault: true,
		action: (state) => {
			state.nextChapter();
		}
	},
	{
		id: 'search-lemma',
		name: 'Search Lexicon & Text',
		description: 'Open Search tab in dockable side panel (/)',
		category: 'General',
		keys: ['/', 'mod+f'],
		preventDefault: true,
		action: (state) => {
			state.toggleSearch();
		}
	},
	{
		id: 'cmd-palette',
		name: 'Jump to Reference',
		description: 'Open Command Palette (e.g. Opif 10, Leg 2.14, M. 1.52)',
		category: 'General',
		keys: ['mod+k'],
		preventDefault: true,
		action: (state) => {
			state.toggleCommandPalette();
		}
	},
	{
		id: 'view-panel',
		name: 'Toggle Side Panel',
		description: 'Open or close dockable lexicon panel (p)',
		category: 'View',
		keys: ['p'],
		preventDefault: true,
		action: (state) => {
			state.toggleSidePanel();
		}
	},
	{
		id: 'view-highlights',
		name: 'View Highlights',
		description: 'Open Highlights tab in side panel (h)',
		category: 'View',
		keys: ['h'],
		preventDefault: true,
		action: (state) => {
			state.openHighlightsTab();
		}
	},
	{
		id: 'toggle-greek',
		name: 'Toggle Greek Column',
		description: 'Show or hide Greek column (g)',
		category: 'View',
		keys: ['g'],
		preventDefault: true,
		action: (state) => {
			state.showGreek = !state.showGreek;
		}
	},
	{
		id: 'toggle-english',
		name: 'Toggle English Column',
		description: 'Show or hide English column (e)',
		category: 'View',
		keys: ['e'],
		preventDefault: true,
		action: (state) => {
			state.showEnglish = !state.showEnglish;
		}
	},
	{
		id: 'general-help',
		name: 'Keyboard Shortcuts Help',
		description: 'Display keyboard shortcuts help dialog (?)',
		category: 'General',
		keys: ['?'],
		preventDefault: true,
		action: (state) => {
			state.toggleHotkeyHelp();
		}
	},
	{
		id: 'general-close',
		name: 'Close Popups & Side Panel',
		description: 'Dismiss open dialog, modal, command palette, or side panel (Esc)',
		category: 'General',
		keys: ['Escape'],
		preventDefault: true,
		action: (state) => {
			state.closeAllPopups();
		}
	}
];
