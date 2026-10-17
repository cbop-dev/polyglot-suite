<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import HighlightColorPicker from '$lib/components/HighlightColorPicker.svelte';
	import { WORKS_BY_CODE } from '$lib/config/canonicalWorks.generated';
	import { decodeMorph } from '@polyglot/ancient-languages';
	import KwicSnippet from '@polyglot/ancient-languages/KwicSnippet.svelte';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		type LexiconEntry,
		type LemmaStat,
		type ConcordanceRef
	} from '$lib/services/dbClient';

	let activeTab = $state<'definition' | 'concordance' | 'distribution'>('definition');
	let isKwic = $state<boolean>(true);

	let lexEntry = $state<LexiconEntry | null>(null);
	let stats = $state<LemmaStat | null>(null);
	let concordance = $state<ConcordanceRef[]>([]);
	let loading = $state<boolean>(false);

	let currentLemma = $derived(readerState.selectedToken?.l || '');
	let decoded = $derived(
		decodeMorph(readerState.selectedToken?.p, readerState.selectedToken?.m)
	);

	$effect(() => {
		if (currentLemma) {
			loadData(currentLemma);
		}
	});

	async function loadData(lemma: string) {
		loading = true;
		try {
			const [l, s, c] = await Promise.all([
				fetchLexiconEntry(lemma),
				fetchLemmaStats(lemma),
				fetchConcordance(lemma)
			]);
			lexEntry = l;
			stats = s;
			concordance = c;
		} catch (e) {
			console.error('Failed to load lemma details', e);
		} finally {
			loading = false;
		}
	}

	function navigateToRef(item: ConcordanceRef) {
		readerState.setWork(item.work_code, item.chapter);
		readerState.closeLemma();
	}
</script>

{#if readerState.selectedToken}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
		<!-- Backdrop click to dismiss -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={() => readerState.closeLemma()}
			aria-label="Close dialog"
		></button>

		<!-- Modal Container -->
		<div class="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col">
			<!-- Modal Header -->
			<div class="flex items-start justify-between border-b border-slate-200 p-4 dark:border-slate-800">
				<div>
					<div class="flex items-center gap-3">
						<h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 greek-font">
							{readerState.selectedToken.l}
						</h2>
						{#if lexEntry?.transliteration}
							<span class="text-sm italic text-slate-500 dark:text-slate-400">
								({lexEntry.transliteration})
							</span>
						{/if}
						{#if lexEntry?.strongs_id}
							<span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
								{lexEntry.strongs_id}
							</span>
						{/if}
					</div>
					<div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
						<span class="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
							{decoded.pos}
						</span>
						{#each decoded.details as detail}
							<span class="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
								{detail}
							</span>
						{/each}
						<span class="text-slate-400">&bull;</span>
						<span class="text-slate-500 dark:text-slate-400">
							Surface: <strong class="text-slate-800 dark:text-slate-200">{readerState.selectedToken.w}</strong>
						</span>
						{#if stats}
							<span class="text-slate-400">&bull;</span>
							<span class="font-semibold text-emerald-600 dark:text-emerald-400">
								{stats.total_count} in AF corpus
							</span>
						{/if}
					</div>
				</div>

				<!-- Actions: Highlight toggle & Close -->
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => highlightStore.toggle(currentLemma)}
						class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
						title={highlightStore.isHighlighted(currentLemma) ? "Remove highlight" : "Highlight lemma across text"}
					>
						{#if highlightStore.isHighlighted(currentLemma)}
							{@const hl = highlightStore.get(currentLemma)}
							<span class="h-2.5 w-2.5 rounded-full" style="background-color: {hl?.hex}; border: 1px solid {hl?.borderLight}"></span>
							Highlighted
						{:else}
							<span class="h-2.5 w-2.5 rounded-full border border-dashed border-slate-400"></span>
							Highlight
						{/if}
					</button>

					<button
						type="button"
						onclick={() => readerState.closeLemma()}
						class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
						aria-label="Close"
					>
						&times;
					</button>
				</div>
			</div>

			<!-- Color Swatches Row (when highlighted) -->
			{#if highlightStore.isHighlighted(currentLemma)}
				{@const currentIdx = highlightStore.getColorIndex(currentLemma) ?? 0}
				{@const hl = highlightStore.get(currentLemma)}
				<div class="px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-3 flex-wrap">
					<div class="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
						Highlight Color: <span class="capitalize text-slate-900 dark:text-slate-100 font-bold">{hl?.name}</span>
					</div>
					<HighlightColorPicker
						selectedColorIndex={currentIdx}
						onselect={(idx) => highlightStore.setColor(currentLemma, idx)}
					/>
				</div>
			{/if}

			<!-- Navigation Tabs -->
			<div class="flex border-b border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
				<button
					type="button"
					onclick={() => activeTab = 'definition'}
					class="border-b-2 px-3 py-2.5 {activeTab === 'definition' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'}"
				>
					LSJ Definition
				</button>
				<button
					type="button"
					onclick={() => activeTab = 'concordance'}
					class="border-b-2 px-3 py-2.5 {activeTab === 'concordance' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'}"
				>
					Concordance ({concordance.length})
				</button>
				<button
					type="button"
					onclick={() => activeTab = 'distribution'}
					class="border-b-2 px-3 py-2.5 {activeTab === 'distribution' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'}"
				>
					Corpus Distribution
				</button>
			</div>

			<!-- Tab Content Body -->
			<div class="flex-1 overflow-y-auto p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
				{#if loading}
					<div class="flex items-center justify-center py-12 text-slate-400">
						Loading lexical data...
					</div>
				{:else if activeTab === 'definition'}
					{#if lexEntry}
						<div class="mb-4 p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
							<div class="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Brief Gloss</div>
							<div class="text-base font-semibold text-blue-700 dark:text-blue-300 italic">{lexEntry.gloss}</div>
						</div>

						<details class="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
							<summary class="flex items-center justify-between px-4 py-3 cursor-pointer select-none font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
								<div class="flex items-center gap-2">
									<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 text-[10px] font-bold">
										LSJ
									</span>
									<span>Full Lexicon Definition</span>
								</div>
								<span class="text-slate-400 group-open:rotate-180 transition-transform">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</span>
							</summary>
							<div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 prose dark:prose-invert max-w-none text-xs leading-normal max-h-96 overflow-y-auto">
								{@html lexEntry.definition}
							</div>
						</details>
					{:else}
						<div class="py-8 text-center text-slate-400 space-y-2">
							<div class="text-base font-semibold text-slate-500">No LSJ Entry Found</div>
							<div class="text-xs max-w-sm mx-auto">
								No direct LSJ lexicon article was matched for <em>{currentLemma}</em>.
								{#if concordance.length > 0}
									You can inspect occurrences in the <strong>Concordance</strong> tab ({concordance.length} occurrences).
								{/if}
							</div>
						</div>
					{/if}
				{:else if activeTab === 'concordance'}
					<div class="space-y-3">
						<div class="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
							<span class="text-xs text-slate-500 font-medium">
								{concordance.length} {concordance.length === 1 ? 'occurrence' : 'occurrences'} found
							</span>
							<div class="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-semibold">
								<button
									type="button"
									onclick={() => (isKwic = true)}
									class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {isKwic
										? 'bg-white shadow-2xs text-blue-600 dark:bg-slate-700 dark:text-blue-400 font-bold'
										: 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}"
								>
									KWIC
								</button>
								<button
									type="button"
									onclick={() => (isKwic = false)}
									class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {!isKwic
										? 'bg-white shadow-2xs text-blue-600 dark:bg-slate-700 dark:text-blue-400 font-bold'
										: 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}"
								>
									Full Text
								</button>
							</div>
						</div>

						{#if concordance.length === 0}
							<div class="py-8 text-center text-xs text-slate-400">
								No concordance occurrences found for this lemma.
							</div>
						{:else}
							<div class="space-y-2">
								{#each concordance as ref}
									<button
										type="button"
										onclick={() => navigateToRef(ref)}
										class="block w-full text-left rounded-lg p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group cursor-pointer"
									>
										<div class="flex items-center justify-between">
											<span class="font-semibold text-blue-600 dark:text-blue-400 text-xs">
												{ref.display_citation}
											</span>
											<span class="text-[11px] text-slate-400 group-hover:text-blue-500 transition-colors">
												Jump &rarr;
											</span>
										</div>

										{#if isKwic}
											<div class="mt-1 text-xs text-slate-700 dark:text-slate-300">
												<KwicSnippet
													text={ref.text_content}
													matchWord={ref.matched_word || currentLemma}
													lang="greek"
													radius={48}
													class="w-full"
												/>
											</div>
										{:else}
											<div class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
												{ref.text_content}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else if activeTab === 'distribution'}
					{#if stats && Object.keys(stats.work_counts).length > 0}
						<div class="space-y-3">
							<div class="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-800">
								<span>Work</span>
								<span>Occurrences ({stats.total_count} total)</span>
							</div>
							{#each Object.entries(stats.work_counts).sort((a, b) => b[1] - a[1]) as [workCode, count]}
								{@const work = WORKS_BY_CODE[workCode]}
								{@const pct = Math.max(1, Math.round((count / stats.total_count) * 100))}
								<div class="space-y-1">
									<div class="flex items-center justify-between text-xs">
										<span class="font-medium text-slate-800 dark:text-slate-200">
											{work?.titleEnglish || workCode}
										</span>
										<span class="font-bold text-slate-900 dark:text-slate-100">
											{count} <span class="text-slate-400 font-normal">({pct}%)</span>
										</span>
									</div>
									<div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
										<div class="h-full bg-blue-500 rounded-full transition-all" style="width: {pct}%"></div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-8 text-center text-slate-400 text-xs">
							No corpus distribution data found for this lemma.
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
