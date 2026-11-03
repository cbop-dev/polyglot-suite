<script lang="ts" generics="T extends WorkPickerItem">
	import type { Snippet } from 'svelte';
	import type { WorkPickerItem, WorkCategory } from '../../types.js';
	import ItemPickerModal from './ItemPickerModal.svelte';

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
		placeholder = 'Filter works...',
		categories = [],
		selectedCategory = $bindable('all'),
		searchQuery = $bindable(''),
		works = [],
		currentWorkCode = '',
		onSelectWork,
		onClose,
		itemContent
	}: Props = $props();
</script>

<ItemPickerModal
	bind:open
	bind:searchQuery
	{placeholder}
	emptyMessage="No works match &ldquo;{searchQuery}&rdquo;"
	items={works}
	onSelect={onSelectWork}
	{onClose}
	maxWidth="max-w-xl"
	class="work-picker-modal"
>
	{#snippet headerExtra()}
		{#if categories.length > 0}
			<div class="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--color-rule)] bg-[var(--color-page)] overflow-x-auto">
				{#each categories as cat}
					<button
						type="button"
						onclick={() => { selectedCategory = cat.id; }}
						class="rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer {selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-2xs' : 'bg-[var(--color-card-bg)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]'}"
					>
						{cat.label}
					</button>
				{/each}
			</div>
		{/if}
	{/snippet}

	{#snippet item({ item: work, isHighlighted })}
		{@const isSelected = work.code === currentWorkCode}
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
	{/snippet}
</ItemPickerModal>
