import type { ReaderState } from '../stores/readerState.svelte.js';
import { READER_HOTKEYS, type HotkeyAction } from '../config/hotkeys.js';
import { HotkeyManager as CoreHotkeyManager } from '@polyglot/ui/hotkeys';

export class HotkeyManager extends CoreHotkeyManager<ReaderState> {
	constructor(actions: HotkeyAction[] = READER_HOTKEYS) {
		super(actions);
	}
}

export const hotkeyManager = new HotkeyManager();
