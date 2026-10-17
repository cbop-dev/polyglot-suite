import type { ReaderState } from '../stores/readerState.svelte';
import type { HotkeyCategory, HotkeyAction as GenericHotkeyAction } from '@polyglot/ancient-languages/hotkeys';

export type { HotkeyCategory };
export type HotkeyAction = GenericHotkeyAction<ReaderState>;

export const AF_HOTKEYS: HotkeyAction[] = [
	{
		id: 'nav-book',
		name: 'Choose Work / Book',
		description: 'Open work selector with auto-focused filter',
		category: 'Navigation',
		keys: ['b'],
		preventDefault: true,
		action: (state) => {
			state.openBookModal();
		}
	},
	{
		id: 'nav-chapter',
		name: 'Choose Chapter',
		description: 'Open chapter selector with auto-focused filter',
		category: 'Navigation',
		keys: ['c'],
		preventDefault: true,
		action: (state) => {
			state.openChapterModal();
		}
	},
	{
		id: 'nav-prev-ch',
		name: 'Previous Chapter',
		description: 'Navigate to previous chapter in corpus',
		category: 'Navigation',
		keys: ['ArrowLeft', '['],
		preventDefault: true,
		action: (state) => {
			state.prevChapter();
		}
	},
	{
		id: 'nav-next-ch',
		name: 'Next Chapter',
		description: 'Navigate to next chapter in corpus',
		category: 'Navigation',
		keys: ['ArrowRight', ']'],
		preventDefault: true,
		action: (state) => {
			state.nextChapter();
		}
	},
	{
		id: 'search-lemma',
		name: 'Search Lemmas',
		description: 'Open Search tab in dockable side panel',
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
		description: 'Open Command Palette (e.g. 1 Clem 5)',
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
		description: 'Open or close dockable lexicon panel',
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
		description: 'Open Highlights tab in side panel',
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
		description: 'Show or hide Greek column',
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
		description: 'Show or hide English column',
		category: 'View',
		keys: ['e'],
		preventDefault: true,
		action: (state) => {
			state.showEnglish = !state.showEnglish;
		}
	},
	{
		id: 'toggle-latin',
		name: 'Toggle Latin Column',
		description: 'Show or hide Latin column (where extant)',
		category: 'View',
		keys: ['l'],
		preventDefault: true,
		action: (state) => {
			if (state.hasLatinInChapter()) {
				state.showLatin = !state.showLatin;
			}
		}
	},
	{
		id: 'general-help',
		name: 'Keyboard Shortcuts Help',
		description: 'Display keyboard shortcuts help dialog',
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
		description: 'Dismiss open dialog, modal, command palette, or side panel',
		category: 'General',
		keys: ['Escape'],
		preventDefault: true,
		action: (state) => {
			state.closeAllPopups();
		}
	}
];
