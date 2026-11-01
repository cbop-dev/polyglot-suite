import type { ReaderState } from '../stores/readerState.svelte';
import type { HotkeyCategory, HotkeyAction as GenericHotkeyAction } from '@polyglot/ancient-languages/hotkeys';
import { base } from '$app/paths';
import { goto } from '$app/navigation';

export type { HotkeyCategory };
export type HotkeyAction = GenericHotkeyAction<ReaderState>;

export const JOSEPHUS_HOTKEYS: HotkeyAction[] = [
	{
		id: 'jump-niese',
		name: 'Jump to Section',
		description: 'Open section jump modal (j)',
		category: 'Navigation',
		keys: ['j'],
		preventDefault: true,
		action: (state) => {
			state.openChapterModal();
		}
	},
	{
		id: 'nav-prev-book',
		name: 'Previous Book',
		description: 'Navigate to previous book in work',
		category: 'Navigation',
		keys: ['ArrowLeft', '['],
		preventDefault: true,
		action: (state) => {
			if (state.currentBook > 1) {
				state.prevBook();
				const targetUrl = `${base}/${state.currentWorkCode}/book/${state.currentBook}/`;
				goto(targetUrl).catch(() => {
					window.location.href = targetUrl;
				});
			}
		}
	},
	{
		id: 'nav-next-book',
		name: 'Next Book',
		description: 'Navigate to next book in work',
		category: 'Navigation',
		keys: ['ArrowRight', ']'],
		preventDefault: true,
		action: (state) => {
			if (state.currentBook < state.currentWork.totalBooks) {
				state.nextBook();
				const targetUrl = `${base}/${state.currentWorkCode}/book/${state.currentBook}/`;
				goto(targetUrl).catch(() => {
					window.location.href = targetUrl;
				});
			}
		}
	},
	{
		id: 'view-greek',
		name: 'Greek Only View',
		description: 'Show Greek critical text only (g)',
		category: 'View',
		keys: ['g'],
		preventDefault: true,
		action: (state) => {
			state.viewMode = 'greek';
		}
	},
	{
		id: 'view-english',
		name: 'English Only View',
		description: 'Show Whiston English translation only (e)',
		category: 'View',
		keys: ['e'],
		preventDefault: true,
		action: (state) => {
			state.viewMode = 'english';
		}
	},
	{
		id: 'view-dual',
		name: 'Dual Column View',
		description: 'Show facing Greek and English columns (d)',
		category: 'View',
		keys: ['d'],
		preventDefault: true,
		action: (state) => {
			state.viewMode = 'parallel';
		}
	},
	{
		id: 'open-bookmarks',
		name: 'Bookmarks',
		description: 'Open bookmarks manager (b)',
		category: 'General',
		keys: ['b'],
		preventDefault: true,
		action: (state) => {
			state.openBookmarksModal();
		}
	},
	{
		id: 'open-command-palette',
		name: 'Search & Command Palette',
		description: 'Open fuzzy navigation and search (Cmd+K / Ctrl+K)',
		category: 'General',
		keys: ['mod+k'],
		preventDefault: true,
		action: (state) => {
			state.openCommandPalette();
		}
	},
	{
		id: 'search-lemma',
		name: 'Search Lexicon & Text',
		description: 'Open Lemma & Search panel (/)',
		category: 'General',
		keys: ['/', 'mod+f'],
		preventDefault: true,
		action: (state) => {
			state.toggleSearch('search');
		}
	},
	{
		id: 'help-modal',
		name: 'Keyboard Shortcuts',
		description: 'Toggle keyboard shortcuts reference (?)',
		category: 'General',
		keys: ['?'],
		preventDefault: true,
		action: (state) => {
			state.openHotkeyHelp();
		}
	},
	{
		id: 'close-modals',
		name: 'Close Active Overlays',
		description: 'Dismiss open dialogs and palettes (Escape)',
		category: 'General',
		keys: ['Escape'],
		preventDefault: true,
		action: (state) => {
			state.closeAllModals();
		}
	}
];
