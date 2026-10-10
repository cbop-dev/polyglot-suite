<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import { WORKS_BY_CODE } from '$lib/config/canonicalWorks.generated';
	import { decodeMorph } from '$lib/utils/morphUtils';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		type LexiconEntry,
		type LemmaStat,
		type ConcordanceRef
	} from '$lib/services/dbClient';

	let activeTab = $state<'definition' | 'concordance' | 'distribution'>('definition');

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
						<span class="text-[11px] text-slate-400 font-mono" title="Raw morphology tag">
							({decoded.rawCode})
						</span>
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
						class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
						title="Cycle highlight color"
					>
						{#if highlightStore.get(currentLemma)}
							{@const hl = highlightStore.get(currentLemma)}
							<span class="h-3 w-3 rounded-full" style="background-color: {hl?.bg}; border: 1px solid {hl?.text}"></span>
							Highlighted
						{:else}
							<span class="h-3 w-3 rounded-full border border-dashed border-slate-400"></span>
							Highlight
						{/if}
					</button>

					<button
						type="button"
						onclick={() => readerState.closeLemma()}
						class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
						aria-label="Close"
					>
						&times;
					</button>
				</div>
			</div>

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
						<div class="mb-3 font-semibold text-slate-900 dark:text-slate-100">
							Gloss: <span class="italic text-blue-600 dark:text-blue-400">{lexEntry.gloss}</span>
						</div>
						<div class="prose dark:prose-invert max-w-none text-xs leading-normal">
							{@html lexEntry.definition}
						</div>
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
					<div class="space-y-2">
						{#each concordance as ref}
							<button
								type="button"
								onclick={() => navigateToRef(ref)}
								class="block w-full text-left rounded-lg p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
							>
								<div class="font-semibold text-blue-600 dark:text-blue-400 text-xs">
									{ref.display_citation}
								</div>
								<div class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
									{ref.text_content}
								</div>
							</button>
						{/each}
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
