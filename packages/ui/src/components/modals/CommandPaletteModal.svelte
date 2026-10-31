<script lang="ts" generics="T extends CommandPaletteItem">
	export interface CommandPaletteItem {
		id?: string | number;
		label: string;
		subLabel?: string;
		badge?: string;
		[key: string]: any;
	}

	interface Props {
		open: boolean;
		placeholder?: string;
		emptyMessage?: string;
		query?: string;
		items: T[];
		selectedIndex?: number;
		onQueryChange?: (q: string) => void;
		onSelect: (item: T) => void;
		onClose: () => void;
	}

	let {
		open,
		placeholder = "Type a search or reference...",
		emptyMessage = "No matching items found.",
		query = $bindable(''),
		items = [],
		selectedIndex = $bindable(0),
		onQueryChange = () => {},
		onSelect,
		onClose
	}: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open) {
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
			}, 50);
		} else {
			query = '';
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (items.length > 0) {
				selectedIndex = (selectedIndex + 1) % items.length;
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (items.length > 0) {
				selectedIndex = (selectedIndex - 1 + items.length) % items.length;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (items[selectedIndex]) {
				onSelect(items[selectedIndex]);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 sm:pt-20">
		<!-- Backdrop click -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={onClose}
			aria-label="Close command palette"
		></button>

		<!-- Card -->
		<div class="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-rule,theme(colors.slate.200))] bg-[var(--color-page,theme(colors.white))] shadow-2xl dark:border-[var(--color-rule,theme(colors.slate.800))] dark:bg-[var(--color-page,theme(colors.slate.900))] flex flex-col text-[var(--color-ink,theme(colors.slate.900))] dark:text-[var(--color-ink,theme(colors.slate.100))]">
			<!-- Input Header -->
			<div class="flex items-center gap-3 border-b border-[var(--color-rule,theme(colors.slate.200))] px-4 py-3 bg-[var(--color-card-bg,transparent)] dark:border-[var(--color-rule,theme(colors.slate.800))]">
				<svg class="h-5 w-5 text-[var(--color-ink-soft,theme(colors.slate.400))] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={(e) => onQueryChange((e.currentTarget as HTMLInputElement).value)}
					type="text"
					{placeholder}
					class="w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft,theme(colors.slate.400))] focus:outline-hidden"
				/>
				<kbd class="hidden sm:inline-block rounded border border-[var(--color-rule,theme(colors.slate.200))] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-ink-soft,theme(colors.slate.400))] dark:border-[var(--color-rule,theme(colors.slate.700))]">
					ESC
				</kbd>
			</div>

			<!-- Results list -->
			<div class="max-h-80 overflow-y-auto p-2">
				{#if items.length === 0}
					<div class="p-6 text-center text-xs text-[var(--color-ink-soft,theme(colors.slate.400))]">
						{emptyMessage}
					</div>
				{:else}
					{#each items as item, idx}
						<button
							type="button"
							onclick={() => onSelect(item)}
							onmouseenter={() => (selectedIndex = idx)}
							class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer {idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-[var(--color-card-bg,theme(colors.slate.50))] dark:hover:bg-[var(--color-card-bg,theme(colors.slate.800/60))] text-[var(--color-ink,theme(colors.slate.800))] dark:text-[var(--color-ink,theme(colors.slate.200))]'}"
						>
							<div class="min-w-0 pr-3">
								<div class="text-sm font-semibold truncate">{item.label}</div>
								{#if item.subLabel}
									<div class="text-xs text-[var(--color-ink-soft,theme(colors.slate.500))] dark:text-[var(--color-ink-soft,theme(colors.slate.400))] truncate mt-0.5">{item.subLabel}</div>
								{/if}
							</div>
							{#if item.badge}
								<span class="rounded px-2 py-0.5 text-xs font-mono font-medium shrink-0 {idx === selectedIndex ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200' : 'bg-[var(--color-card-bg,theme(colors.slate.100))] border border-[var(--color-rule,theme(colors.slate.200))] dark:border-[var(--color-rule,theme(colors.slate.800))] text-[var(--color-ink-soft,theme(colors.slate.600))] dark:text-[var(--color-ink-soft,theme(colors.slate.400))]'}">
									{item.badge}
								</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer tips -->
			<div class="flex items-center justify-between border-t border-[var(--color-rule,theme(colors.slate.100))] bg-[var(--color-card-bg,theme(colors.slate.50/70))] px-4 py-2 text-[11px] text-[var(--color-ink-soft,theme(colors.slate.500))] dark:border-[var(--color-rule,theme(colors.slate.800))] dark:bg-[var(--color-card-bg,theme(colors.slate.900/70))] dark:text-[var(--color-ink-soft,theme(colors.slate.400))]">
				<span>Navigate with <kbd class="font-bold">&uarr;</kbd> <kbd class="font-bold">&darr;</kbd></span>
				<span>Press <kbd class="font-bold">&crarr;</kbd> to jump</span>
			</div>
		</div>
	</div>
{/if}
