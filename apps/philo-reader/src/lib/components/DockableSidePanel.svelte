<script lang="ts">
	import { LexemeSidePanel } from '@polyglot/lemma-ui';
	import { Loading } from '@polyglot/ui';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		fetchAttestedForms,
		searchLemmas,
		fetchBiblicalBookSummaries,
		searchBiblicalCitations,
		type BiblicalCitation,
		type BiblicalBookSummary
	} from '$lib/services/dbClient';

	function handleNavigateToRef(ref: any) {
		if (ref.work_code && ref.chapter !== undefined) {
			readerState.setWork(ref.work_code, ref.chapter, ref.section);
			if (ref.section) {
				setTimeout(() => {
					const el = document.getElementById(`section-${ref.section}`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 100);
			}
		}
	}

	// Scripture Citations Tab State
	let biblicalSummaries = $state<BiblicalBookSummary[]>([]);
	let isSummariesLoading = $state<boolean>(false);
	let summariesLoaded = $state<boolean>(false);

	let selectedBookCode = $state<string>('');
	let filterChapter = $state<number | ''>('');
	let filterVerse = $state<number | ''>('');
	let citationResults = $state<BiblicalCitation[]>([]);
	let isCitationsLoading = $state<boolean>(false);
	let citationsLoaded = $state<boolean>(false);

	let totalCitationsCount = $derived(
		biblicalSummaries.reduce((sum, b) => sum + b.total_count, 0)
	);

	let selectedBookSummary = $derived(
		biblicalSummaries.find((b) => b.book_code === selectedBookCode)
	);

	async function loadSummaries() {
		if (summariesLoaded || isSummariesLoading) return;
		isSummariesLoading = true;
		try {
			biblicalSummaries = await fetchBiblicalBookSummaries();
			summariesLoaded = true;
		} catch (err) {
			console.error('Error fetching biblical summaries:', err);
		} finally {
			isSummariesLoading = false;
		}
	}

	async function executeCitationSearch(book?: string, ch?: number | '', vs?: number | '') {
		const targetBook = book !== undefined ? book : selectedBookCode;
		const targetCh = ch !== undefined ? ch : filterChapter;
		const targetVs = vs !== undefined ? vs : filterVerse;

		if (!targetBook) {
			citationResults = [];
			citationsLoaded = false;
			return;
		}

		isCitationsLoading = true;
		try {
			citationResults = await searchBiblicalCitations(
				targetBook,
				targetCh !== '' ? Number(targetCh) : undefined,
				targetVs !== '' ? Number(targetVs) : undefined,
				200
			);
			citationsLoaded = true;
		} catch (err) {
			console.error('Error searching biblical citations:', err);
		} finally {
			isCitationsLoading = false;
		}
	}

	// Auto-load summaries when citations tab becomes active
	$effect(() => {
		if (readerState.isSidePanelOpen && readerState.activeSidePanelTab === 'citations') {
			if (!summariesLoaded && !isSummariesLoading) {
				loadSummaries();
			}
		}
	});

	// Reactively sync when user clicks an inline citation pill in the reader text
	$effect(() => {
		const sel = readerState.selectedBiblicalCitation;
		if (sel) {
			selectedBookCode = sel.bookCode || '';
			filterChapter = sel.chapter !== undefined ? sel.chapter : '';
			filterVerse = sel.verse !== undefined ? sel.verse : '';
			if (selectedBookCode) {
				executeCitationSearch(selectedBookCode, filterChapter, filterVerse);
			}
		}
	});

	function selectBook(code: string) {
		selectedBookCode = code;
		filterChapter = '';
		filterVerse = '';
		executeCitationSearch(code, '', '');
	}

	function resetCitationFilter() {
		selectedBookCode = '';
		filterChapter = '';
		filterVerse = '';
		citationResults = [];
		citationsLoaded = false;
		readerState.selectedBiblicalCitation = null;
	}

	function navigateToCitation(c: BiblicalCitation) {
		readerState.setWork(c.work_code, c.chapter, c.section);
		setTimeout(() => {
			const el = document.getElementById(`section-${c.section}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}
</script>

<LexemeSidePanel
	isOpen={readerState.isSidePanelOpen}
	onClose={() => (readerState.isSidePanelOpen = false)}
	activeTab={readerState.activeSidePanelTab}
	onTabChange={(tab) => (readerState.activeSidePanelTab = tab as any)}
	selectedToken={readerState.selectedToken}
	corpusTitle="Philo"
	top="53px"
	ariaLabel="Philo Reference and Lexicon Panel"
	{highlightStore}
	{fetchLexiconEntry}
	{fetchLemmaStats}
	{fetchConcordance}
	{fetchAttestedForms}
	{searchLemmas}
	onSelectToken={(t) =>
		readerState.openLemma({ w: t.w || '', l: t.l || '', m: '', p: '', lang: 'grc' }, '')}
	onNavigateToRef={handleNavigateToRef}
	extraTabs={[
		{
			id: 'citations',
			label: 'Scripture',
			count: selectedBookCode || undefined
		}
	]}
>
	{#snippet extraTabPanels(tabId)}
		{#if tabId === 'citations'}
			<!-- CITATIONS APPARATUS -->
			<div class="space-y-3">
				<!-- Header Filter Controls -->
				<div class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3 space-y-2.5">
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
							Biblical Book Filter
						</span>
						{#if selectedBookCode || filterChapter !== '' || filterVerse !== ''}
							<button
								type="button"
								onclick={resetCitationFilter}
								class="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
							>
								<span>Clear filter</span>
								<span>&times;</span>
							</button>
						{/if}
					</div>

					<div class="grid grid-cols-12 gap-2">
						<!-- Book Select (6 cols) -->
						<div class="col-span-6">
							<label for="biblical-book-select" class="block text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase mb-0.5">Book</label>
							<select
								id="biblical-book-select"
								bind:value={selectedBookCode}
								onchange={() => {
									filterChapter = '';
									filterVerse = '';
									if (selectedBookCode) {
										executeCitationSearch();
									} else {
										citationResults = [];
										citationsLoaded = false;
									}
								}}
								class="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-page)] px-2 py-1.5 text-xs text-[var(--color-ink)] cursor-pointer focus:outline-hidden focus:border-amber-500"
							>
								<option value="">-- All Books ({totalCitationsCount || '1,595'}) --</option>
								{#each biblicalSummaries as b}
									<option value={b.book_code}>
										{b.book_name} ({b.total_count})
									</option>
								{/each}
							</select>
						</div>

						<!-- Chapter Input (3 cols) -->
						<div class="col-span-3">
							<label for="biblical-chapter-input" class="block text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase mb-0.5">Chapter</label>
							<input
								id="biblical-chapter-input"
								type="number"
								min="1"
								placeholder="All"
								bind:value={filterChapter}
								oninput={() => {
									if (selectedBookCode) executeCitationSearch();
								}}
								class="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-page)] px-2 py-1.5 text-xs text-[var(--color-ink)] text-center focus:outline-hidden focus:border-amber-500"
							/>
						</div>

						<!-- Verse Input (3 cols) -->
						<div class="col-span-3">
							<label for="biblical-verse-input" class="block text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase mb-0.5">Verse</label>
							<input
								id="biblical-verse-input"
								type="number"
								min="1"
								placeholder="All"
								bind:value={filterVerse}
								oninput={() => {
									if (selectedBookCode) executeCitationSearch();
								}}
								class="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-page)] px-2 py-1.5 text-xs text-[var(--color-ink)] text-center focus:outline-hidden focus:border-amber-500"
							/>
						</div>
					</div>
				</div>

				<!-- VIEW A: OVERVIEW GRID (when no book selected) -->
				{#if !selectedBookCode}
					<div class="space-y-3">
						<div class="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
							<p class="font-semibold text-sm mb-1 flex items-center gap-1.5">
								<span>Septuagint (LXX) Citations in Philo</span>
							</p>
							<p class="text-[11px] text-[var(--color-ink-soft)] leading-normal">
								Philo cites the Torah and other biblical scriptures across his treatises. Click any biblical book below to explore every citation and jump directly into the text.
							</p>
						</div>

						<!-- Category: Pentateuch (The Torah) -->
						<div class="space-y-1.5">
							<div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
								<span>Torah / Pentateuch</span>
								<span class="text-[10px] font-normal text-amber-700 dark:text-amber-400 font-mono">1,549 Citations</span>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{#each biblicalSummaries.filter((b) => ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'].includes(b.book_code)) as b}
									<button
										type="button"
										onclick={() => selectBook(b.book_code)}
										class="flex items-center justify-between p-2.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all text-left cursor-pointer group"
									>
										<span class="font-semibold text-xs text-[var(--color-ink)] group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate">
											{b.book_name}
										</span>
										<span class="rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 text-[11px] font-mono font-bold shrink-0">
											{b.total_count}
										</span>
									</button>
								{/each}
							</div>
						</div>

						<!-- Category: Other Historical, Poetic & Prophetic Books -->
						{#if biblicalSummaries.some((b) => !['GEN', 'EXO', 'LEV', 'NUM', 'DEU'].includes(b.book_code))}
							<div class="space-y-1.5 pt-2">
								<div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
									<span>Historical, Poetry & Prophets</span>
									<span class="text-[10px] font-normal text-[var(--color-ink-soft)] font-mono">46 Citations</span>
								</div>
								<div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
									{#each biblicalSummaries.filter((b) => !['GEN', 'EXO', 'LEV', 'NUM', 'DEU'].includes(b.book_code)) as b}
										<button
											type="button"
											onclick={() => selectBook(b.book_code)}
											class="flex items-center justify-between p-2 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left cursor-pointer group"
										>
											<span class="text-xs text-[var(--color-ink)] group-hover:text-blue-600 dark:group-hover:text-blue-300 truncate">
												{b.book_name}
											</span>
											<span class="text-[10px] font-mono text-[var(--color-ink-soft)] shrink-0 ml-1">
												{b.total_count}
											</span>
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>

				<!-- VIEW B: CITATION SEARCH RESULTS -->
				{:else}
					<div class="space-y-2.5">
						<!-- Results Header -->
						<div class="flex items-center justify-between text-xs pb-1 border-b border-[var(--color-rule)]">
							<div class="flex items-center gap-1.5">
								<span class="font-bold text-[var(--color-ink)]">
									{selectedBookSummary?.book_name || selectedBookCode}
									{#if filterChapter !== ''}
										<span>{filterChapter}</span>{#if filterVerse !== ''}<span>:{filterVerse}</span>{/if}
									{/if}
								</span>
								{#if !isCitationsLoading}
									<span class="text-[11px] text-[var(--color-ink-soft)]">
										({citationResults.length} {citationResults.length === 1 ? 'citation' : 'citations'})
									</span>
								{/if}
							</div>

							<button
								type="button"
								onclick={resetCitationFilter}
								class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
							>
								&larr; All Books
							</button>
						</div>

						{#if isCitationsLoading}
							<Loading size="sm" title="Loading citations..." />
						{:else if citationResults.length === 0}
							<div class="py-12 text-center text-xs text-[var(--color-ink-soft)] space-y-1">
								<p class="font-semibold text-sm">No citations found</p>
								<p>Try clearing chapter or verse filters to see other citations from {selectedBookSummary?.book_name || selectedBookCode}.</p>
							</div>
						{:else}
							<div class="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
								{#each citationResults as c}
									<button
										type="button"
										onclick={() => navigateToCitation(c)}
										class="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3 text-left hover:border-amber-400 hover:bg-[var(--color-page)] transition-all cursor-pointer group shadow-2xs"
									>
										<div class="flex items-center justify-between text-xs font-semibold mb-1">
											<div class="flex items-center gap-1.5 flex-wrap">
												<span class="inline-flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 text-[11px] font-mono font-bold">
													<svg class="size-3 text-amber-700 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
														<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
													</svg>
													<span>{c.display_citation}</span>
												</span>

												<span class="text-blue-600 dark:text-blue-400">
													{c.work_abbrev} {c.chapter}.{c.section}
												</span>
												<span class="text-[10px] text-[var(--color-ink-soft)] truncate max-w-[150px]">
													({c.work_title})
												</span>
											</div>

											<span class="text-[10px] text-[var(--color-ink-soft)] group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0">
												Jump &rarr;
											</span>
										</div>

										{#if c.text_snippet}
											<div class="text-xs leading-relaxed text-[var(--color-ink)] line-clamp-3 greek-font pt-1">
												{c.text_snippet}
											</div>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}
</LexemeSidePanel>
