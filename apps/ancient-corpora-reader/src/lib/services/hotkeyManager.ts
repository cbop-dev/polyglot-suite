import type { ReaderState } from '../stores/readerState.svelte.js';
import { ACR_HOTKEYS, type HotkeyAction } from '../config/hotkeys.js';
import { HotkeyManager as CoreHotkeyManager } from '@polyglot/ui/hotkeys';

export class HotkeyManager extends CoreHotkeyManager<ReaderState> {
	constructor(actions: HotkeyAction[] = ACR_HOTKEYS) {
		super(actions);
	}
}

export const hotkeyManager = new HotkeyManager();
