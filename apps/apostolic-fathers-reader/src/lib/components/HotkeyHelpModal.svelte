<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';
	import { AF_HOTKEYS, type HotkeyAction } from '$lib/config/hotkeys';

	const categories = ['Navigation', 'View', 'General'] as const;

	function getCategoryActions(cat: string): HotkeyAction[] {
		return AF_HOTKEYS.filter((action) => action.category === cat);
	}

	function formatKey(key: string): string {
		const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
		if (key.includes('mod+')) {
			return isMac ? key.replace('mod+', '⌘').toUpperCase() : key.replace('mod+', 'Ctrl+').toUpperCase();
		}
		switch (key) {
			case 'ArrowLeft':
				return '←';
			case 'ArrowRight':
				return '→';
			case 'ArrowUp':
				return '↑';
			case 'ArrowDown':
				return '↓';
			case 'Escape':
				return 'Esc';
			default:
				return key;
		}
	}
</script>

{#if readerState.showHotkeyHelp}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={() => (readerState.showHotkeyHelp = false)}
			aria-label="Close shortcuts dialog"
		></button>

		<!-- Card -->
		<div class="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-page)] shadow-2xl flex flex-col text-[var(--color-ink)]">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-[var(--color-rule)] px-5 py-4">
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
					</svg>
					<h2 class="text-base font-bold">Keyboard Shortcuts</h2>
				</div>
				<button
					type="button"
					onclick={() => (readerState.showHotkeyHelp = false)}
					class="rounded-lg p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] text-lg leading-none cursor-pointer"
					aria-label="Close"
				>
					&times;
				</button>
			</div>

			<!-- Body -->
			<div class="flex-1 overflow-y-auto p-5 space-y-5">
				{#each categories as category}
					{@const actions = getCategoryActions(category)}
					{#if actions.length > 0}
						<div>
							<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
								{category}
							</h3>
							<div class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] divide-y divide-[var(--color-rule)]">
								{#each actions as action}
									<div class="flex items-center justify-between px-3 py-2 text-xs">
										<div>
											<span class="font-semibold">{action.name}</span>
											<p class="text-[11px] text-[var(--color-ink-soft)]">{action.description}</p>
										</div>
										<div class="flex items-center gap-1 shrink-0 ml-3">
											{#each action.keys as key}
												<kbd class="rounded border border-[var(--color-rule)] bg-[var(--color-page)] px-1.5 py-0.5 text-xs font-mono font-bold shadow-2xs">
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
			</div>

			<!-- Footer -->
			<div class="border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-5 py-2.5 text-right text-xs text-[var(--color-ink-soft)]">
				Press <kbd class="font-bold">Esc</kbd> to close
			</div>
		</div>
	</div>
{/if}
