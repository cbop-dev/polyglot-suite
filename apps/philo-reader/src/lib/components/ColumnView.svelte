<script lang="ts">
	import type { TextUnit } from '$lib/services/dbClient';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import { ParallelColumnView } from '@polyglot/ui';

	interface Props {
		greek?: TextUnit[];
		english?: TextUnit[];
	}

	let { greek = [], english = [] }: Props = $props();
</script>

<ParallelColumnView
	{greek}
	{english}
	viewMode={readerState.viewMode}
	showGreek={readerState.showGreek}
	showEnglish={readerState.showEnglish}
	{highlightStore}
	greekHeaderTitle="Cohn-Wendland Greek Critical Text"
	greekHeaderSubtitle="Click word for LSJ & morphology"
	englishHeaderTitle="English Translation (C. D. Yonge / Supplements)"
	englishHeaderSubtitle="Aligned to Cohn-Wendland"
	onWordClick={(tok, citation) => readerState.openLemma(tok, citation)}
	onBiblicalCitationClick={(bookCode, chapter, verse, display, bookName) =>
		readerState.openBiblicalCitation(bookCode, chapter, verse, display, bookName)}
>
	{#snippet sectionBadge({ secKey, gUnit, eUnit })}
		{@const mangeyRef = gUnit?.mangey_ref || eUnit?.mangey_ref}
		{@const isSupplement = eUnit?.is_supplement === 1}
		<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
			<button
				type="button"
				onclick={() =>
					readerState.openCitation(
						readerState.currentWorkCode,
						readerState.currentChapter,
						Number(secKey),
						mangeyRef,
						isSupplement
					)}
				class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5"
				title="Cite section {readerState.currentWork.abbrev} {readerState.currentWork.totalBooks > 1 ? `${readerState.currentChapter}.` : ''}{secKey}"
			>
				§ {secKey}
			</button>

			{#if mangeyRef}
				<span
					class="rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1 py-0.5"
					title="Mangey 1742 Milestone: Volume {mangeyRef.replace('M. ', '')}"
				>
					{mangeyRef}
				</span>
			{/if}
		</div>
	{/snippet}

	{#snippet customEnglishColumn({ secKey, unit })}
		{@const mangeyRef = unit?.mangey_ref}
		{@const isSupplement = unit?.is_supplement === 1}
		<div class="english-col text-base leading-relaxed text-[var(--color-ink)]">
			<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
				<button
					type="button"
					onclick={() =>
						readerState.openCitation(
							readerState.currentWorkCode,
							readerState.currentChapter,
							Number(secKey),
							mangeyRef,
							isSupplement
						)}
					class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5"
					title="Cite section {readerState.currentWork.abbrev} {readerState.currentWork.totalBooks > 1 ? `${readerState.currentChapter}.` : ''}{secKey}"
				>
					§ {secKey}
				</button>

				{#if mangeyRef}
					<span
						class="rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1 py-0.5"
						title="Mangey 1742 Milestone: Volume {mangeyRef.replace('M. ', '')}"
					>
						{mangeyRef}
					</span>
				{/if}

				{#if isSupplement}
					<span
						class="rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 cursor-help"
						title="This section was omitted by C. D. Yonge (1854) due to Mangey's manuscript lacunae. Translated here directly from Cohn-Wendland Greek."
					>
						[AI Translation — Missing from Yonge 1854]
					</span>
				{/if}
			</div>

			{#if unit?.text_content}
				<span>{unit.text_content}</span>
			{:else}
				<span class="italic text-[var(--color-ink-soft)] text-sm">(No English translation recorded)</span>
			{/if}
		</div>
	{/snippet}
</ParallelColumnView>
