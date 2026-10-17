import type { ReaderState } from '../stores/readerState.svelte';
import { AF_HOTKEYS, type HotkeyAction } from '../config/hotkeys';
import { HotkeyManager as CoreHotkeyManager } from '@polyglot/ancient-languages/hotkeys';

export class HotkeyManager extends CoreHotkeyManager<ReaderState> {
	constructor(actions: HotkeyAction[] = AF_HOTKEYS) {
		super(actions);
	}
}

export const hotkeyManager = new HotkeyManager();
