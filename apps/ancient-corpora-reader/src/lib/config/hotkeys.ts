import type { ReaderState } from '$lib/stores/readerState.svelte.js';
import type { HotkeyCategory, HotkeyAction as GenericHotkeyAction } from '@polyglot/ui/hotkeys';

export type { HotkeyCategory };
export type HotkeyAction = GenericHotkeyAction<ReaderState>;

export const ACR_HOTKEYS: HotkeyAction[] = [
	{
		id: 'next-division',
		name: 'Next Division',
		description: 'Advance to the next division or chapter',
		category: 'Navigation',
		keys: [']', 'ArrowRight'],
		preventDefault: true,
		action: (state) => {
			state.nextDivision();
		}
	},
	{
		id: 'show-theme-slider',
		name: 'Show Theme Settings',
		description: 'Open the Theme Options Panel',
		category: 'View',
		keys: ['t'],
		preventDefault: true,
		action: (state) => {
			state.toggleThemeSlider();
		}
	},
	{
		id: 'prev-division',
		name: 'Previous Division',
		description: 'Go to the previous division or chapter',
		category: 'Navigation',
		keys: ['[', 'ArrowLeft'],
		preventDefault: true,
		action: (state) => {
			state.prevDivision();
		}
	},
	{
		id: 'open-corpus-picker',
		name: 'Select Corpus',
		description: 'Open corpus selection dialog',
		category: 'Navigation',
		keys: ['b'],
		preventDefault: true,
		action: (state) => {
			state.isCorpusModalOpen = true;
		}
	},
	{
		id: 'open-work-picker',
		name: 'Select Work / Treatise',
		description: 'Open work / treatise selection dialog',
		category: 'Navigation',
		keys: ['w'],
		preventDefault: true,
		action: (state) => {
			state.isWorkModalOpen = true;
		}
	},
	{
		id: 'open-division-picker',
		name: 'Jump to Section / Division',
		description: 'Open section and division jump selector',
		category: 'Navigation',
		keys: ['j', 's', 'c'],
		preventDefault: true,
		action: (state) => {
			state.isDivisionModalOpen = true;
		}
	},
	{
		id: 'view-parallel',
		name: 'Parallel View',
		description: 'Switch layout to parallel columns view',
		category: 'View',
		keys: ['p'],
		preventDefault: true,
		action: (state) => {
			state.viewMode = 'parallel';
		}
	},
	{
		id: 'toggle-layout',
		name: 'Toggle View Layout',
		description: 'Toggle between parallel columns and stacked layout',
		category: 'View',
		keys: ['d'],
		preventDefault: true,
		action: (state) => {
			state.viewMode = state.viewMode === 'stacked' ? 'parallel' : 'stacked';
		}
	},
	{
		id: 'toggle-search-panel',
		name: 'Toggle Search Panel',
		description: 'Open or close lemma search and lexeme side panel',
		category: 'View',
		keys: ['f', '/'],
		preventDefault: true,
		action: (state) => {
			state.toggleSidePanel('search');
		}
	},
	{
		id: 'close-popups',
		name: 'Close Popups & Modals',
		description: 'Close open dialogs, modals, and side panels',
		category: 'General',
		keys: ['Escape'],
		preventDefault: true,
		action: (state) => {
			state.closeAllModals();
		}
	},
	{
		id: 'toggle-hotkey-help',
		name: 'Keyboard Shortcuts Help',
		description: 'Show keyboard shortcuts guide',
		category: 'General',
		keys: ['?'],
		preventDefault: true,
		action: (state) => {
			state.showHotkeyHelp = !state.showHotkeyHelp;
		}
	}
];
