<script lang="ts" generics="T extends CorpusPickerItem">
	import type { Snippet } from 'svelte';
	import type { CorpusPickerItem } from '../../types.js';
	import ItemPickerModal from './ItemPickerModal.svelte';

	interface Props {
		open: boolean;
		placeholder?: string;
		searchQuery?: string;
		corpora: T[];
		currentCorpusId?: string;
		onSelectCorpus: (corpus: T) => void;
		onClose: () => void;
		itemContent?: Snippet<[{ corpus: T; isSelected: boolean; isHighlighted: boolean }]>;
	}

	let {
		open = $bindable(false),
		placeholder = 'Filter corpora by title, era, or code...',
		searchQuery = $bindable(''),
		corpora = [],
		currentCorpusId = '',
		onSelectCorpus,
		onClose,
		itemContent
	}: Props = $props();
</script>

<ItemPickerModal
	bind:open
	bind:searchQuery
	{placeholder}
	emptyMessage="No corpora match &ldquo;{searchQuery}&rdquo;"
	items={corpora}
	onSelect={onSelectCorpus}
	{onClose}
	maxWidth="max-w-xl"
	class="corpus-picker-modal"
>
	{#snippet item({ item: corpus, isHighlighted })}
		{@const isSelected = corpus.id === currentCorpusId}
		{#if itemContent}
			{@render itemContent({ corpus, isSelected, isHighlighted })}
		{:else}
			<div class="min-w-0 pr-3">
				<div class="text-sm font-semibold flex items-center gap-2 flex-wrap">
					<span>{corpus.title}</span>
					{#if isSelected}
						<span class="rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
							Current
						</span>
					{/if}
					{#if corpus.totalWorks}
						<span class="rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
							{corpus.totalWorks} {corpus.totalWorks === 1 ? 'Work' : 'Works'}
						</span>
					{/if}
				</div>
				<div class="text-xs text-[var(--color-ink-soft)] truncate mt-0.5">
					{#if corpus.era}<span>{corpus.era}</span>{/if}
					{#if corpus.era && (corpus.subtitle || corpus.authors)} &bull; {/if}
					{#if corpus.authors}<span>{corpus.authors}</span>{/if}
					{#if corpus.authors && corpus.subtitle} &bull; {/if}
					{#if corpus.subtitle}<span>{corpus.subtitle}</span>{/if}
				</div>
			</div>
			<div class="text-right shrink-0">
				<span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
					{corpus.badge || corpus.id}
				</span>
			</div>
		{/if}
	{/snippet}
</ItemPickerModal>
