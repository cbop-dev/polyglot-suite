<script lang="ts">
	import { WorkPickerModal } from '@polyglot/ui';
	import { CANONICAL_WORKS, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
	import { SBL_ABBREVIATIONS } from '$lib/services/citationService';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	let searchQuery = $state<string>('');

	let filteredWorks = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return CANONICAL_WORKS;

		return CANONICAL_WORKS.filter((w) => {
			const sbl = (SBL_ABBREVIATIONS[w.code] || '').toLowerCase();
			return (
				w.titleEnglish.toLowerCase().includes(q) ||
				w.code.toLowerCase().includes(q) ||
				sbl.includes(q) ||
				w.titleGreek.toLowerCase().includes(q) ||
				(w.titleLatin && w.titleLatin.toLowerCase().includes(q))
			);
		});
	});

	function selectWork(work: CanonicalWork) {
		readerState.setWork(work.code, 1);
		onClose();
	}
</script>

<WorkPickerModal
	bind:open
	placeholder="Filter works (e.g. 'Clement', 'Didache', 'Ignatius', 'Hermas')..."
	bind:searchQuery
	works={filteredWorks}
	currentWorkCode={readerState.currentWorkCode}
	onSelectWork={selectWork}
	{onClose}
>
	{#snippet itemContent({ work, isSelected })}
		{@const hasLat = (readerState.constructor as any).LATIN_EXTANT_CHAPTERS[work.code]}
		<div class="min-w-0 pr-3">
			<div class="text-sm font-semibold flex items-center gap-2">
				<span>{work.titleEnglish}</span>
				{#if isSelected}
					<span class="rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
						Current
					</span>
				{/if}
				{#if hasLat}
					<span class="rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
						Latin
					</span>
				{/if}
			</div>
			<div class="text-xs text-[var(--color-ink-soft)] truncate mt-0.5 greek-font">
				{work.titleGreek} &bull; {work.totalChapters} chapters
			</div>
		</div>
		<span class="font-mono text-xs text-[var(--color-ink-soft)] shrink-0">
			{SBL_ABBREVIATIONS[work.code] || work.code}
		</span>
	{/snippet}
</WorkPickerModal>
