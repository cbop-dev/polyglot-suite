<script lang="ts">
	import { FloatingSidePanel, Loading } from '@polyglot/ui';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import HighlightColorPicker from '@polyglot/ancient-languages/HighlightColorPicker.svelte';
	import { getWork } from '$lib/config/canonicalWorks.generated';
	import {
		decodeMorph,
		latinToGreek,
		isFormFilterMatch,
		filterAttestedForms,
		extractAvailableInflections,
		isCriteriaActive,
		type InflectionFilterCriteria
	} from '@polyglot/ancient-languages';
	import KwicSnippet from '@polyglot/ancient-languages/KwicSnippet.svelte';
	import AttestedFormsSection from '@polyglot/ancient-languages/AttestedFormsSection.svelte';
	import InflectionFilterBar from '@polyglot/ancient-languages/InflectionFilterBar.svelte';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		fetchAttestedFormsForLemma,
		fetchWordMorph,
		searchLemmata,
		type LexiconEntry,
		type LemmaStat,
		type ConcordanceRef,
		type AttestedForm,
		type LemmaSearchResult,
		type MorphEntry
	} from '$lib/services/dbClient';

	// Tab 1: Lexeme Data
	let currentWord = $derived(readerState.selectedToken?.w || '');
	let currentLemma = $derived(readerState.selectedToken?.l || '');

	let wordMorph = $state<MorphEntry | null>(null);

	// Section 1: Attested Forms (On-demand)
	let isAttestedFormsOpen = $state<boolean>(false);
	let attestedForms = $state<AttestedForm[]>([]);
	let isAttestedFormsLoading = $state<boolean>(false);
	let attestedFormsLoaded = $state<boolean>(false);
	let attestedFormsError = $state<string | null>(null);

	// Section 2: Full Lexicon Article (Auto-fetched in background)
	let isLexArticleOpen = $state<boolean>(false);
	let lexEntry = $state<LexiconEntry | null>(null);
	let isLexArticleLoading = $state<boolean>(false);
	let lexArticleLoaded = $state<boolean>(false);
	let lexArticleError = $state<string | null>(null);

	// Section 3: Concordance
	let isConcordanceOpen = $state<boolean>(false);
	let isKwic = $state<boolean>(true);
	let concordance = $state<ConcordanceRef[]>([]);
	let stats = $state<LemmaStat | null>(null);
	let isConcordanceLoading = $state<boolean>(false);
	let concordanceLoaded = $state<boolean>(false);
	let concordanceError = $state<string | null>(null);

	let selectedFormFilter = $state<string | null>(null);
	let inflectionCriteria = $state<InflectionFilterCriteria>({});
	let isInflectionFilterOpen = $state<boolean>(false);
	let prevLemma = $state<string>('');

	let availableInflections = $derived(extractAvailableInflections(attestedForms));
	let filteredAttestedForms = $derived(
		isCriteriaActive(inflectionCriteria)
			? filterAttestedForms(attestedForms, inflectionCriteria)
			: attestedForms
	);

	$effect(() => {
		if (currentLemma !== prevLemma) {
			prevLemma = currentLemma;
			selectedFormFilter = null;
			inflectionCriteria = {};
			isInflectionFilterOpen = false;

			isAttestedFormsOpen = false;
			isLexArticleOpen = false;
			isConcordanceOpen = false;

			attestedForms = [];
			attestedFormsLoaded = false;
			attestedFormsError = null;

			lexEntry = null;
			lexArticleLoaded = false;
			lexArticleError = null;

			concordance = [];
			stats = null;
			concordanceLoaded = false;
			concordanceError = null;

			if (currentLemma) {
				autoFetchLexAndStats(currentLemma);
			}
			if (currentWord) {
				fetchWordMorph(currentWord).then((m) => {
					wordMorph = m;
				}).catch(() => {
					wordMorph = null;
				});
			}
		}
	});

	async function autoFetchLexAndStats(lemma: string) {
		if (!lemma) return;
		isLexArticleLoading = true;
		lexArticleError = null;
		try {
			const [entry, s] = await Promise.all([
				fetchLexiconEntry(lemma),
				fetchLemmaStats(lemma)
			]);
			if (currentLemma !== lemma) return;
			lexEntry = entry;
			stats = s;
			lexArticleLoaded = true;
		} catch (err: any) {
			if (currentLemma !== lemma) return;
			console.error('Error auto-fetching lexicon entry and stats:', err);
			lexArticleError = err?.message || 'Failed to load lexicon article';
		} finally {
			if (currentLemma === lemma) {
				isLexArticleLoading = false;
			}
		}
	}

	async function loadAttestedForms(lemma: string) {
		if (!lemma) return;
		isAttestedFormsLoading = true;
		attestedFormsError = null;
		try {
			const forms = await fetchAttestedFormsForLemma(lemma);
			if (currentLemma !== lemma) return;
			attestedForms = forms;
			attestedFormsLoaded = true;
		} catch (err: any) {
			if (currentLemma !== lemma) return;
			console.error('Error loading attested forms:', err);
			attestedFormsError = err?.message || 'Failed to load attested forms';
		} finally {
			if (currentLemma === lemma) {
				isAttestedFormsLoading = false;
			}
		}
	}

	function toggleAttestedForms() {
		isAttestedFormsOpen = !isAttestedFormsOpen;
		if (isAttestedFormsOpen && !attestedFormsLoaded && !isAttestedFormsLoading && currentLemma) {
			loadAttestedForms(currentLemma);
		}
	}

	async function loadConcordance(lemma: string) {
		if (!lemma) return;
		isConcordanceLoading = true;
		concordanceError = null;
		try {
			const [c, s] = await Promise.all([
				fetchConcordance(lemma),
				stats ? Promise.resolve(stats) : fetchLemmaStats(lemma)
			]);
			if (currentLemma !== lemma) return;
			concordance = c;
			if (!stats) stats = s;
			concordanceLoaded = true;
		} catch (err: any) {
			if (currentLemma !== lemma) return;
			console.error('Error loading concordance:', err);
			concordanceError = err?.message || 'Failed to load concordance';
		} finally {
			if (currentLemma === lemma) {
				isConcordanceLoading = false;
			}
		}
	}

	function toggleConcordance() {
		isConcordanceOpen = !isConcordanceOpen;
		if (isConcordanceOpen && !concordanceLoaded && !isConcordanceLoading && currentLemma) {
			loadConcordance(currentLemma);
		}
	}

	// Tab 2: Search Lexicon
	let searchQuery = $state<string>('');
	let searchResults = $state<LemmaSearchResult[]>([]);
	let isSearching = $state<boolean>(false);
	let searchInputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (readerState.isSidePanelOpen && readerState.activeSidePanelTab === 'search') {
			setTimeout(() => {
				searchInputEl?.focus();
			}, 50);
		}
	});

	async function handleSearch(q: string) {
		searchQuery = q;
		if (!q.trim()) {
			searchResults = [];
			return;
		}
		isSearching = true;
		try {
			searchResults = await searchLemmata(q.trim());
		} catch (e) {
			console.error(e);
		} finally {
			isSearching = false;
		}
	}

	let isCurrentHighlighted = $derived(
		currentLemma ? highlightStore.isHighlighted(currentLemma) : false
	);
	let currentHighlightColor = $derived(
		currentLemma ? highlightStore.get(currentLemma) : undefined
	);

	function toggleHighlight() {
		if (!currentLemma) return;
		highlightStore.toggle(currentLemma);
	}

	let highlightedList = $derived(Object.keys(highlightStore.highlights));
</script>

<FloatingSidePanel
	isOpen={readerState.isSidePanelOpen}
	onClose={() => readerState.closeAllModals()}
	top="53px"
	noPadding={true}
	showDefaultCloseButton={false}
	ariaLabel="Josephus Reference and Lexicon Panel"
>
	<!-- Panel Top Navigation / Tabs Bar -->
	<div class="flex items-center justify-between border-b border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-2 shrink-0">
		<div class="flex items-center gap-1 text-xs font-semibold">
			<button
				type="button"
				onclick={() => (readerState.activeSidePanelTab = 'lexeme')}
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'lexeme' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
			>
				Lemma
			</button>
			<button
				type="button"
				onclick={() => (readerState.activeSidePanelTab = 'search')}
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'search' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
			>
				Search
			</button>
			<button
				type="button"
				onclick={() => (readerState.activeSidePanelTab = 'highlights')}
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'highlights' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
			>
				Highlights ({highlightedList.length})
			</button>
		</div>
		<button
			type="button"
			onclick={() => readerState.closeAllModals()}
			class="text-sm font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer px-2 py-1"
		>
			✕
		</button>
	</div>
	<div class="lemma-card flex-1 overflow-y-auto p-4 space-y-4" role="dialog" aria-label="Lemma & Lexicon Inspection">
		{#if readerState.activeSidePanelTab === 'lexeme'}
			{#if !currentLemma}
				<div class="py-16 text-center text-xs text-[var(--color-ink-soft)]">
					Click any Greek word in the text to inspect its lexical definition, morphology, and corpus occurrences.
				</div>
			{:else}
				<!-- Header Box: Surface Word & Lemma Headword -->
				<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-4 shadow-xs space-y-3">
					<div class="flex items-start justify-between">
						<div>
							<div class="text-xl font-bold greek-font text-[var(--color-ink)] flex items-baseline gap-2">
								<span>{currentWord}</span>
								{#if currentLemma && currentLemma !== currentWord}
									<span class="text-sm font-normal text-[var(--color-ink-soft)]">({currentLemma})</span>
								{/if}
							</div>
							{#if wordMorph?.parse_code || wordMorph?.description}
								<div class="text-xs text-[var(--color-ink-soft)] font-medium mt-0.5">
									{wordMorph.description || wordMorph.parse_code}
								</div>
							{/if}
							{#if lexEntry?.gloss}
								<div class="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
									{lexEntry.gloss}
								</div>
							{/if}
						</div>

						<!-- Highlight Toggle Button -->
						<button
							type="button"
							onclick={toggleHighlight}
							class="rounded-lg border border-[var(--color-rule)] px-2.5 py-1 text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
							style={isCurrentHighlighted && currentLemma ? highlightStore.getStyle(currentLemma) : ''}
						>
							<span>{isCurrentHighlighted ? '✓ Highlighted' : '+ Highlight'}</span>
						</button>
					</div>

					{#if isCurrentHighlighted && currentLemma}
						<div class="pt-2 border-t border-[var(--color-rule)]/50">
							<HighlightColorPicker
								selectedColorIndex={highlightStore.getColorIndex(currentLemma) ?? 0}
								onselect={(idx) => highlightStore.setColor(currentLemma, idx)}
							/>
						</div>
					{/if}
				</div>

				<!-- Section 1: Full Lexicon Article (Auto-fetched) -->
				<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs overflow-hidden">
					<button
						type="button"
						onclick={() => (isLexArticleOpen = !isLexArticleOpen)}
						class="w-full flex items-center justify-between p-3.5 text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 cursor-pointer text-left"
					>
						<span>LSJ Full Definition</span>
						<span>{isLexArticleOpen ? '▲' : '▼'}</span>
					</button>

					{#if isLexArticleOpen}
						<div class="p-4 border-t border-[var(--color-rule)] text-sm leading-relaxed font-serif text-[var(--color-ink)]">
							{#if isLexArticleLoading}
								<Loading title="Loading LSJ dictionary article..." />
							{:else if lexEntry?.definition}
								<div class="dict-def whitespace-pre-wrap">{lexEntry.definition}</div>
							{:else}
								<div class="text-xs text-[var(--color-ink-soft)]">No dictionary entry found for "{currentLemma}".</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Section 2: Attested Forms (On-demand) -->
				<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs overflow-hidden">
					<button
						type="button"
						onclick={toggleAttestedForms}
						class="w-full flex items-center justify-between p-3.5 text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 cursor-pointer text-left"
					>
						<span>Attested Word Forms {attestedForms.length > 0 ? `(${attestedForms.length})` : ''}</span>
						<span>{isAttestedFormsOpen ? '▲' : '▼'}</span>
					</button>

					{#if isAttestedFormsOpen}
						<div class="p-4 border-t border-[var(--color-rule)] space-y-3">
							{#if isAttestedFormsLoading}
								<Loading title="Loading inflections..." />
							{:else if attestedForms.length > 0}
								<div class="flex flex-wrap gap-1.5">
									{#each filteredAttestedForms as formItem (formItem.form)}
										<span class="rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs greek-font text-[var(--color-ink)] border border-[var(--color-rule)]">
											{formItem.form} {#if formItem.analyses?.[0]}<span class="text-[10px] text-[var(--color-ink-soft)] font-sans">({formItem.analyses[0].pos || formItem.analyses[0].summary})</span>{/if}
										</span>
									{/each}
								</div>
							{:else}
								<div class="text-xs text-[var(--color-ink-soft)]">No morphological forms recorded.</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Section 3: Corpus Occurrences (On-demand) -->
				<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs overflow-hidden">
					<button
						type="button"
						onclick={toggleConcordance}
						class="w-full flex items-center justify-between p-3.5 text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 cursor-pointer text-left"
					>
						<span>Corpus Concordance {stats ? `(${stats.total_count})` : ''}</span>
						<span>{isConcordanceOpen ? '▲' : '▼'}</span>
					</button>

					{#if isConcordanceOpen}
						<div class="p-4 border-t border-[var(--color-rule)] space-y-3">
							{#if isConcordanceLoading}
								<Loading title="Loading occurrences across Josephus corpus..." />
							{:else if concordance.length > 0}
								<div class="max-h-72 overflow-y-auto space-y-2">
									{#each concordance as occ (occ.work_unit_id)}
										<div class="rounded-lg border border-[var(--color-rule)] p-2.5 text-xs">
											<div class="font-bold text-blue-600 dark:text-blue-400 mb-1">
												{occ.display_citation}
											</div>
											<div class="greek-font text-[var(--color-ink)] text-sm">
												{occ.text_content.slice(0, 140)}...
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-xs text-[var(--color-ink-soft)]">No occurrences recorded.</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{:else if readerState.activeSidePanelTab === 'search'}
			<!-- Search Tab -->
			<div class="space-y-3">
				<input
					bind:this={searchInputEl}
					id="side-search-input"
					type="text"
					class="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-2 text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Search Greek dictionary (e.g. 'poieo', 'ἱστορία')..."
					bind:value={searchQuery}
					oninput={(e) => handleSearch((e.target as HTMLInputElement).value)}
					onkeydown={(e) => {
						if (e.key === 'Escape') {
							e.preventDefault();
							readerState.closeAllModals();
						}
					}}
				/>

				{#if isSearching}
					<Loading title="Searching corpus lemmata..." />
				{:else if searchResults.length > 0}
					<div class="max-h-96 overflow-y-auto divide-y divide-[var(--color-rule)]">
						{#each searchResults as item (item.lemma)}
							<button
								type="button"
								onclick={() => {
									readerState.openToken({ w: item.lemma, l: item.lemma }, '');
								}}
								class="w-full text-left py-2 px-1 hover:bg-[var(--color-rule)]/30 rounded flex items-center justify-between cursor-pointer"
							>
								<div>
									<div class="text-sm font-bold greek-font text-[var(--color-ink)]">{item.lemma}</div>
									<div class="text-xs text-[var(--color-ink-soft)]">{item.normalized_lemma}</div>
								</div>
								<div class="text-xs font-semibold text-blue-600 dark:text-blue-400">
									{item.total_count} occ.
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{:else if readerState.activeSidePanelTab === 'highlights'}
			<!-- Active Highlights Tab -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">Active Lemmas ({highlightedList.length})</h3>
					{#if highlightedList.length > 0}
						<button
							type="button"
							onclick={() => highlightStore.clear()}
							class="text-xs text-red-600 hover:underline cursor-pointer"
						>
							Clear All
						</button>
					{/if}
				</div>

				{#if highlightedList.length === 0}
					<div class="py-16 text-center text-xs text-[var(--color-ink-soft)]">
						No active highlights. Click any word in the reader and select "+ Highlight".
					</div>
				{:else}
					<div class="space-y-2">
						{#each highlightedList as lemma (lemma)}
							{@const hl = highlightStore.get(lemma)}
							{@const currentIdx = highlightStore.getColorIndex(lemma) ?? 0}
							<div class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3 space-y-2">
								<div class="flex items-center justify-between">
									<button
										type="button"
										onclick={() => readerState.openToken({ w: lemma, l: lemma }, '')}
										class="flex items-center gap-2 cursor-pointer"
									>
										<span class="h-3 w-3 rounded-full" style="background-color: {hl?.hex}; border: 1px solid {hl?.borderLight}"></span>
										<span class="font-bold text-sm greek-font text-[var(--color-ink)]">{lemma}</span>
									</button>
									<button
										type="button"
										onclick={() => highlightStore.remove(lemma)}
										class="text-xs text-red-500 hover:text-red-700 cursor-pointer"
									>
										✕
									</button>
								</div>
								<div class="pt-1 border-t border-[var(--color-rule)]/50">
									<HighlightColorPicker
										selectedColorIndex={currentIdx}
										onselect={(idx) => highlightStore.setColor(lemma, idx)}
									/>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</FloatingSidePanel>
