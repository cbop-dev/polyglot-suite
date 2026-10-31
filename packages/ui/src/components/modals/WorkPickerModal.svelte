<script lang="ts" generics="T extends WorkPickerItem">
	import Modal2 from '../controls/Modal2.svelte';
	import type { Snippet } from 'svelte';

	export interface WorkPickerItem {
		code: string;
		titleEnglish: string;
		titleGreek?: string;
		titleLatin?: string;
		abbrev?: string;
		category?: string;
		totalChapters?: number;
		totalSections?: number;
		totalBooks?: number;
		tlgId?: string;
		[key: string]: any;
	}

	export interface WorkCategory {
		id: string;
		label: string;
	}

	interface Props {
		open: boolean;
		placeholder?: string;
		categories?: WorkCategory[];
		selectedCategory?: string;
		searchQuery?: string;
		works: T[];
		currentWorkCode?: string;
		onSelectWork: (work: T) => void;
		onClose: () => void;
		itemContent?: Snippet<[{ work: T; isSelected: boolean; isHighlighted: boolean }]>;
	}

	let {
		open = $bindable(false),
		placeholder = "Filter works...",
		categories = [],
		selectedCategory = $bindable('all'),
		searchQuery = $bindable(''),
		works = [],
		currentWorkCode = '',
		onSelectWork,
		onClose,
		itemContent
	}: Props = $props();

	let selectedIndex = $state<number>(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open) {
			searchQuery = '';
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
				inputEl?.select();
			}, 50);
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (works.length > 0) {
				selectedIndex = (selectedIndex + 1) % works.length;
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (works.length > 0) {
				selectedIndex = (selectedIndex - 1 + works.length) % works.length;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (works[selectedIndex]) {
				onSelectWork(works[selectedIndex]);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Modal2
	bind:showModal={open}
	onclose={onClose}
	showFooter={false}
	showMaximize={false}
	showClose={false}
	maxWidth="max-w-xl"
>
	<div class="flex flex-col text-[var(--color-ink)]">
		<!-- Header / Filter Input -->
		<div class="flex items-center gap-3 border-b border-[var(--color-rule)] px-4 py-3 bg-[var(--color-card-bg)]">
			<svg class="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				bind:this={inputEl}
				bind:value={searchQuery}
				type="text"
				{placeholder}
				class="w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft)] focus:outline-hidden"
			/>
			<button type="button" onclick={onClose} aria-label="Close" class="cursor-pointer">
				<kbd class="rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-soft)]">
					Esc
				</kbd>
			</button>
		</div>

		<!-- Category Filter Pills (if provided) -->
		{#if categories.length > 0}
			<div class="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--color-rule)] bg-[var(--color-page)] overflow-x-auto">
				{#each categories as cat}
					<button
						type="button"
						onclick={() => { selectedCategory = cat.id; selectedIndex = 0; }}
						class="rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer {selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-2xs' : 'bg-[var(--color-card-bg)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]'}"
					>
						{cat.label}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Work List -->
		<div class="max-h-80 overflow-y-auto p-2">
			{#if works.length === 0}
				<div class="p-8 text-center text-xs text-[var(--color-ink-soft)]">
					No works match "{searchQuery}"
				</div>
			{:else}
				{#each works as work, idx}
					{@const isSelected = work.code === currentWorkCode}
					{@const isHighlighted = idx === selectedIndex}
					<button
						type="button"
						onclick={() => onSelectWork(work)}
						onmouseenter={() => (selectedIndex = idx)}
						class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer {isHighlighted ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-[var(--color-card-bg)] text-[var(--color-ink)]'}"
					>
						{#if itemContent}
							{@render itemContent({ work, isSelected, isHighlighted })}
						{:else}
							<div class="min-w-0 pr-3">
								<div class="text-sm font-semibold flex items-center gap-2 flex-wrap">
									<span>{work.titleEnglish}</span>
									{#if isSelected}
										<span class="rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
											Current
										</span>
									{/if}
									{#if work.totalBooks && work.totalBooks > 1}
										<span class="rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
											{work.totalBooks} Books
										</span>
									{/if}
								</div>
								<div class="text-xs text-[var(--color-ink-soft)] truncate mt-0.5">
									{#if work.titleLatin}<span class="italic">{work.titleLatin}</span> &bull; {/if}
									{#if work.titleGreek}<span class="greek-font">{work.titleGreek}</span> &bull; {/if}
									{#if work.totalChapters}{work.totalChapters} chapters{/if}
									{#if work.totalSections && !work.totalChapters}{work.totalSections} sections{/if}
								</div>
							</div>
							<div class="text-right shrink-0">
								<span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
									{work.abbrev || work.code}
								</span>
								{#if work.tlgId}
									<div class="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase">
										{work.tlgId}
									</div>
								{/if}
							</div>
						{/if}
					</button>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-2 text-[11px] text-[var(--color-ink-soft)]">
			<span>Press <kbd class="font-bold">Enter</kbd> to select</span>
			<span>Navigate with <kbd class="font-bold">&uarr;</kbd> <kbd class="font-bold">&darr;</kbd></span>
		</div>
	</div>
</Modal2>
