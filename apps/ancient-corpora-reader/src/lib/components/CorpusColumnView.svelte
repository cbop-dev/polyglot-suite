<script lang="ts">
	import type { TextUnit, Token } from '../services/dbClient.js';
	import { readerState } from '../stores/readerState.svelte.js';
	import { highlightStore } from '../stores/highlightStore.svelte.js';
	import { ParallelColumnView } from '@polyglot/ui';

	interface Props {
		greek?: TextUnit[];
		english?: TextUnit[];
		latin?: TextUnit[];
	}

	let { greek = [], english = [], latin = [] }: Props = $props();

	let greekHeader = $derived.by(() => {
		if (readerState.currentCorpus === 'af') return 'Kirsopp Lake Greek (1912)';
		if (readerState.currentCorpus === 'philo') return 'Cohn-Wendland Greek Text';
		return 'Niese Greek Text';
	});

	let englishHeader = $derived.by(() => {
		if (readerState.currentCorpus === 'af') return 'Kirsopp Lake English Translation';
		if (readerState.currentCorpus === 'philo') return 'C. D. Yonge English Translation';
		return 'H. St. J. Thackeray English Translation';
	});

	let latinHeader = 'Latin Text (Where Extant)';
</script>

<ParallelColumnView
	{greek}
	{english}
	{latin}
	viewMode={readerState.viewMode}
	showGreek={readerState.showGreek}
	showEnglish={readerState.showEnglish}
	showLatin={readerState.showLatin}
	gridBreakpoint="md"
	{highlightStore}
	greekHeaderTitle={greekHeader}
	englishHeaderTitle={englishHeader}
	latinHeaderTitle={latinHeader}
	onWordClick={(tok, citation) => readerState.openToken(tok as Token, citation)}
	onBiblicalCitationClick={(bookCode, ch, v, disp, name) =>
		readerState.openScriptureCitation(bookCode, ch, v, disp, name)}
>
	{#snippet sectionBadge({ secKey, gUnit, nieseSec })}
		<div class="inline-flex items-center gap-1.5 mr-2 mb-1 select-none">
			<button
				type="button"
				class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
				title="Section {secKey}"
			>
				{secKey}
			</button>
			{#if (gUnit as any)?.mangey_ref}
				<span class="rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-1 py-0.2 text-[10px] font-mono" title="Mangey milestone">
					M. {(gUnit as any).mangey_ref}
				</span>
			{/if}
			{#if nieseSec || (gUnit as any)?.niese_section}
				<span class="rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-1 py-0.2 text-[10px] font-mono" title="Niese section {nieseSec || (gUnit as any)?.niese_section}">
					§{nieseSec || (gUnit as any)?.niese_section}
				</span>
			{/if}
		</div>
	{/snippet}
</ParallelColumnView>
