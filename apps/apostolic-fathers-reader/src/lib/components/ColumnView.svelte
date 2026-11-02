<script lang="ts">
	import type { TextUnit, Token } from '$lib/services/dbClient';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import { ParallelColumnView } from '@polyglot/ui';

	interface Props {
		greek?: TextUnit[];
		english?: TextUnit[];
		latin?: TextUnit[];
	}

	let { greek = [], english = [], latin = [] }: Props = $props();
</script>

<ParallelColumnView
	{greek}
	{english}
	{latin}
	showGreek={readerState.showGreek}
	showEnglish={readerState.showEnglish}
	showLatin={readerState.showLatin}
	gridBreakpoint="md"
	{highlightStore}
	greekHeaderTitle="Kirsopp Lake Greek (1912)"
	latinHeaderTitle="Latin Text (Where Extant)"
	englishHeaderTitle="Kirsopp Lake English Translation"
	onWordClick={(tok, citation) => readerState.openLemma(tok as Token, citation)}
>
	{#snippet sectionBadge({ secKey })}
		<button
			type="button"
			onclick={() =>
				readerState.openCitation(
					readerState.currentWorkCode,
					readerState.currentChapter,
					Number(secKey)
				)}
			class="mr-2 text-xs font-semibold text-[var(--color-ink-soft)] select-none hover:text-blue-600 hover:underline cursor-pointer"
			title="Cite section {readerState.currentChapter}:{secKey}"
		>
			{readerState.currentChapter}:{secKey}
		</button>
	{/snippet}

	{#snippet customLatinColumn({ secKey, unit, citation })}
		<div class="latin-col text-base leading-relaxed text-[var(--color-ink)] latin-font">
			<button
				type="button"
				onclick={() =>
					readerState.openCitation(
						readerState.currentWorkCode,
						readerState.currentChapter,
						Number(secKey)
					)}
				class="mr-2 text-xs font-semibold text-[var(--color-ink-soft)] select-none hover:text-blue-600 hover:underline cursor-pointer"
				title="Cite section {readerState.currentChapter}:{secKey}"
			>
				{readerState.currentChapter}:{secKey}
			</button>
			{#if unit?.tokens && unit.tokens.length > 0}
				{#each unit.tokens as tok, idx (idx)}
					{@const hl = tok.l && highlightStore ? highlightStore.get(tok.l) : undefined}
					<button
						type="button"
						class="latin-word inline cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden transition-colors {hl ? 'hl-token' : ''}"
						style={hl && tok.l && highlightStore?.getStyle ? highlightStore.getStyle(tok.l) : (hl ? `--hl-bg: ${hl.bgLight}; --hl-text: ${hl.textLight}; --hl-border: ${hl.borderLight}; --hl-bg-dark: ${hl.bgDark}; --hl-text-dark: ${hl.textDark}; --hl-border-dark: ${hl.borderDark};` : '')}
						onclick={() => readerState.openLemma(tok as Token, citation)}
						title={tok.l ? `${tok.l}${tok.p || tok.m ? ` (${tok.p ?? ''} ${tok.m ?? ''})` : ''}` : undefined}
					>{tok.w}</button>{' '}
				{/each}
			{:else if unit?.text_content}
				<span>{unit.text_content}</span>
			{:else}
				<span class="italic text-[var(--color-ink-soft)] text-sm">—</span>
			{/if}
		</div>
	{/snippet}

	{#snippet customEnglishColumn({ secKey, unit })}
		<div class="english-col text-base leading-relaxed text-[var(--color-ink)]">
			<button
				type="button"
				onclick={() =>
					readerState.openCitation(
						readerState.currentWorkCode,
						readerState.currentChapter,
						Number(secKey)
					)}
				class="mr-2 text-xs font-semibold text-[var(--color-ink-soft)] select-none hover:text-blue-600 hover:underline cursor-pointer"
				title="Cite section {readerState.currentChapter}:{secKey}"
			>
				{readerState.currentChapter}:{secKey}
			</button>
			{#if unit?.text_content}
				<span>{unit.text_content}</span>
			{:else}
				<span class="italic text-[var(--color-ink-soft)] text-sm">(No English translation recorded)</span>
			{/if}
		</div>
	{/snippet}
</ParallelColumnView>
