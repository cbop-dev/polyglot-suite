<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';
	import { searchLemmas, type LemmaSearchResult } from '$lib/services/dbClient';
	import { latinToGreek } from '@polyglot/ancient-languages';

	let searchQuery = $state<string>('');
	let results = $state<LemmaSearchResult[]>([]);
	let loading = $state<boolean>(false);

	let convertedQuery = $derived(latinToGreek(searchQuery.trim()));

	$effect(() => {
		const target = convertedQuery || searchQuery.trim();
		if (target.length >= 2) {
			const timer = setTimeout(() => {
				runSearch(target);
			}, 150);
			return () => clearTimeout(timer);
		} else {
			results = [];
		}
	});

	async function runSearch(q: string) {
		loading = true;
		try {
			results = await searchLemmas(q, 40);
		} catch (e) {
			console.error('Search error', e);
		} finally {
			loading = false;
		}
	}

	function selectLemma(res: LemmaSearchResult) {
		readerState.openLemma(
			{
				w: res.lemma,
				l: res.lemma,
				m: '',
				p: '',
				lang: 'grc'
			},
			''
		);
		readerState.isSearchOpen = false;
	}
</script>

{#if readerState.isSearchOpen}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 sm:pt-20">
		<!-- Backdrop click -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={() => readerState.isSearchOpen = false}
			aria-label="Close search"
		></button>

		<!-- Search Container -->
		<div class="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[75vh]">
			<!-- Search Bar -->
			<div class="flex items-center gap-3 border-b border-slate-200 p-3.5 dark:border-slate-800">
				<svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search lemma in Greek or Latin (e.g. 'logos', 'qeos', 'pistis')..."
					class="w-full bg-transparent text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden dark:text-slate-100"
				/>
				<button
					type="button"
					onclick={() => readerState.isSearchOpen = false}
					class="rounded-md p-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					ESC
				</button>
			</div>

			<!-- Live Converted Script Preview -->
			{#if convertedQuery && convertedQuery !== searchQuery.trim()}
				<div class="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900 text-xs">
					<span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Greek:</span>
					<span class="greek-font text-base font-bold text-blue-600 dark:text-blue-400">
						{convertedQuery}
					</span>
				</div>
			{/if}

			<!-- Search Results List -->
			<div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
				{#if loading}
					<div class="py-8 text-center text-xs text-slate-400">Searching corpus...</div>
				{:else if results.length > 0}
					{#each results as res}
						<button
							type="button"
							onclick={() => selectLemma(res)}
							class="flex w-full items-center justify-between p-2.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
						>
							<div>
								<span class="text-base font-bold text-slate-900 dark:text-slate-100 greek-font">
									{res.lemma}
								</span>
								<span class="ml-2 text-xs text-slate-400">({res.normalized_lemma})</span>
							</div>
							<span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
								{res.total_count} &times;
							</span>
						</button>
					{/each}
				{:else if (convertedQuery || searchQuery.trim()).length >= 2}
					<div class="py-8 text-center text-xs text-slate-400">No matching lemmas found.</div>
				{:else}
					<div class="py-8 text-center text-xs text-slate-400 leading-relaxed">
						Type Latin or Greek to search (e.g. <span class="font-mono">logos</span> &rarr; <span class="font-bold">λογος</span>, <span class="font-mono">qeos</span> &rarr; <span class="font-bold">θεος</span>, <span class="font-mono">pistis</span> &rarr; <span class="font-bold">πιστις</span>).
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
