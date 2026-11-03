<script lang="ts" generics="T extends Record<string, any>">
	import type { Snippet } from 'svelte';

	interface Props {
		items: T[];
		searchQuery?: string;
		placeholder?: string;
		emptyMessage?: string;
		selectedIndex?: number;
		active?: boolean;
		autoFocus?: boolean;
		showSearchIcon?: boolean;
		showEscBadge?: boolean;
		maxHeightClass?: string;
		class?: string;
		onSelect: (item: T) => void;
		onClose?: () => void;
		headerExtra?: Snippet;
		item?: Snippet<[{ item: T; index: number; isHighlighted: boolean }]>;
		footer?: Snippet;
	}

	let {
		items = [],
		searchQuery = $bindable(''),
		placeholder = 'Type to filter...',
		emptyMessage = 'No matching items found.',
		selectedIndex = $bindable(0),
		active = true,
		autoFocus = true,
		showSearchIcon = true,
		showEscBadge = true,
		maxHeightClass = 'max-h-80',
		class: className = '',
		onSelect,
		onClose,
		headerExtra,
		item: itemSnippet,
		footer: footerSnippet
	}: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLDivElement | null>(null);

	// Focus input and reset selected index when active
	$effect(() => {
		if (active) {
			selectedIndex = 0;
			if (autoFocus) {
				setTimeout(() => {
					inputEl?.focus();
					inputEl?.select();
				}, 50);
			}
		}
	});

	// Keep selectedIndex in bounds when items list changes
	$effect(() => {
		if (items.length === 0) {
			selectedIndex = 0;
		} else if (selectedIndex >= items.length) {
			selectedIndex = items.length - 1;
		}
	});

	// Scroll active item into view
	$effect(() => {
		if (selectedIndex >= 0 && listEl && listEl.children[selectedIndex]) {
			const itemEl = listEl.children[selectedIndex] as HTMLElement;
			itemEl?.scrollIntoView({ block: 'nearest' });
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!active) return;

		if (e.key === 'Escape') {
			if (onClose) {
				e.preventDefault();
				onClose();
			}
		} else if (e.key === 'ArrowDown') {
			if (items.length > 0) {
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % items.length;
			}
		} else if (e.key === 'ArrowUp') {
			if (items.length > 0) {
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + items.length) % items.length;
			}
		} else if (e.key === 'Enter') {
			if (items.length > 0 && items[selectedIndex]) {
				e.preventDefault();
				onSelect(items[selectedIndex]);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="item-picker flex flex-col text-[var(--color-ink)] {className}">
	<!-- Header / Filter Input -->
	<div class="flex items-center gap-3 border-b border-[var(--color-rule)] px-4 py-3 bg-[var(--color-card-bg)]">
		{#if showSearchIcon}
			<svg class="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		{/if}
		<input
			bind:this={inputEl}
			bind:value={searchQuery}
			type="text"
			{placeholder}
			class="w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft)] focus:outline-hidden"
		/>
		{#if showEscBadge && onClose}
			<button type="button" onclick={onClose} aria-label="Close" class="cursor-pointer">
				<kbd class="rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-soft)]">
					Esc
				</kbd>
			</button>
		{/if}
	</div>

	<!-- Extra Header Area (e.g. category pills) -->
	{#if headerExtra}
		{@render headerExtra()}
	{/if}

	<!-- Items List -->
	<div bind:this={listEl} class="{maxHeightClass} overflow-y-auto p-2">
		{#if items.length === 0}
			<div class="p-8 text-center text-xs text-[var(--color-ink-soft)]">
				{emptyMessage}
			</div>
		{:else}
			{#each items as it, idx}
				{@const isHighlighted = idx === selectedIndex}
				<button
					type="button"
					onclick={() => onSelect(it)}
					onmouseenter={() => (selectedIndex = idx)}
					class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer {isHighlighted ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-[var(--color-card-bg)] text-[var(--color-ink)]'}"
				>
					{#if itemSnippet}
						{@render itemSnippet({ item: it, index: idx, isHighlighted })}
					{:else}
						<div class="min-w-0 pr-3">
							<div class="text-sm font-semibold truncate">
								{it.label || it.title || it.titleEnglish || String(it)}
							</div>
							{#if it.subLabel || it.subtitle || it.description}
								<div class="text-xs text-[var(--color-ink-soft)] truncate mt-0.5">
									{it.subLabel || it.subtitle || it.description}
								</div>
							{/if}
						</div>
						{#if it.badge}
							<div class="text-right shrink-0">
								<span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
									{it.badge}
								</span>
							</div>
						{/if}
					{/if}
				</button>
			{/each}
		{/if}
	</div>

	<!-- Footer -->
	{#if footerSnippet}
		{@render footerSnippet()}
	{:else}
		<div class="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-2 text-[11px] text-[var(--color-ink-soft)]">
			<span>Press <kbd class="font-bold">Enter</kbd> to select</span>
			<span>Navigate with <kbd class="font-bold">&uarr;</kbd> <kbd class="font-bold">&darr;</kbd></span>
		</div>
	{/if}
</div>
