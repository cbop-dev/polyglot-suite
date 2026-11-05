<script lang="ts">
	import type { TextVersion, TextUnit, Token } from '../services/dbClient.js';
	import { readerState } from '../stores/readerState.svelte.js';
	import { highlightStore } from '../stores/highlightStore.svelte.js';
	import { ParallelColumnView } from '@polyglot/ui';

	interface Props {
		textVersions?: TextVersion[];
		// Backward-compatibility
		greek?: TextUnit[];
		english?: TextUnit[];
		latin?: TextUnit[];
	}

	let { textVersions = [], greek, english, latin }: Props = $props();
	let cfg = $derived(readerState.currentCorpusConfig);
</script>

<ParallelColumnView
	{textVersions}
	{greek}
	{english}
	{latin}
	visibleLanguages={readerState.visibleLanguages}
	viewMode={readerState.viewMode}
	targetSection={readerState.currentSection}
	gridBreakpoint="md"
	{highlightStore}
	onWordClick={(tok, citation) => readerState.openToken(tok as Token, citation)}
	onBiblicalCitationClick={(bookCode, ch, v, disp, name) =>
		readerState.openScriptureCitation(bookCode, ch, v, disp, name)}
>
	{#snippet sectionBadge({ secKey, units })}
		{@const milestone = cfg.milestoneScheme}
		{@const primaryUnit = Object.values(units)[0]}
		{@const milestoneVal = primaryUnit?.milestone_ref}

		<div class="inline-flex items-center gap-1.5 mr-2 mb-1 select-none">
			<button
				type="button"
				class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
				title="Section {secKey}"
			>
				{secKey}
			</button>
			{#if milestone && milestoneVal}
				<span
					class="rounded px-1 py-0.2 text-[10px] font-mono {milestone.badgeColorClass}"
					title="{milestone.label} {milestoneVal}"
				>
					{milestone.badgePrefix} {milestoneVal}
				</span>
			{/if}
		</div>
	{/snippet}
</ParallelColumnView>
