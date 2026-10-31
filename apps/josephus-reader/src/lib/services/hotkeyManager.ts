import type { ReaderState } from '../stores/readerState.svelte';
import { JOSEPHUS_HOTKEYS, type HotkeyAction } from '../config/hotkeys';
import { HotkeyManager as CoreHotkeyManager } from '@polyglot/ancient-languages/hotkeys';

export class HotkeyManager extends CoreHotkeyManager<ReaderState> {
	constructor(actions: HotkeyAction[] = JOSEPHUS_HOTKEYS) {
		super(actions);
	}
}

export const hotkeyManager = new HotkeyManager();
