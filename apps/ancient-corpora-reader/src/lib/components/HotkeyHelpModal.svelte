<script lang="ts">
	import { Modal2 } from '@polyglot/ui';
	import { formatKey } from '@polyglot/ui/hotkeys';
	import { readerState } from '../stores/readerState.svelte.js';
	import { ACR_HOTKEYS, type HotkeyAction } from '../config/hotkeys.js';

	const categories = ['Navigation', 'View', 'General'] as const;

	function getCategoryActions(cat: string): HotkeyAction[] {
		return ACR_HOTKEYS.filter((action) => action.category === cat);
	}
</script>

<Modal2
	bind:showModal={readerState.showHotkeyHelp}
	title="Keyboard Shortcuts"
	maxWidth="max-w-lg"
	onclose={() => (readerState.showHotkeyHelp = false)}
>
	<div class="space-y-5 py-2 text-[var(--color-ink)]">
		{#each categories as category}
			{@const actions = getCategoryActions(category)}
			{#if actions.length > 0}
				<div>
					<h3 class="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
						{category}
					</h3>
					<div class="rounded-lg border border-[var(--color-rule)] divide-y divide-[var(--color-rule)] bg-[var(--color-card-bg)]/50">
						{#each actions as action}
							<div class="flex items-center justify-between px-3 py-2 text-xs">
								<div>
									<span class="font-medium text-[var(--color-ink)]">{action.name}</span>
									<p class="text-[11px] text-[var(--color-ink-soft)]">{action.description}</p>
								</div>
								<div class="flex items-center gap-1.5 ml-4 shrink-0">
									{#each action.keys as key}
										<kbd
											class="inline-flex items-center justify-center min-w-5 px-1.5 py-0.5 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-[var(--color-page)] border border-[var(--color-rule)] rounded shadow-2xs"
										>
											{formatKey(key)}
										</kbd>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}

		<div class="pt-2 border-t border-[var(--color-rule)] text-[11px] text-[var(--color-ink-soft)] text-center">
			Press <kbd class="px-1 py-0.5 font-mono text-[10px] bg-[var(--color-page)] border border-[var(--color-rule)] rounded">Esc</kbd> to close dialogs & side panels.
		</div>
	</div>
</Modal2>
