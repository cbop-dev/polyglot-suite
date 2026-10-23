<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import HighlightColorPicker from '$lib/components/HighlightColorPicker.svelte';
	import { WORKS_BY_CODE } from '$lib/config/canonicalWorks.generated';
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
		fetchAttestedForms,
		searchLemmas,
		searchFts,
		type LexiconEntry,
		type LemmaStat,
		type ConcordanceRef,
		type AttestedForm,
		type LemmaSearchResult,
		type FtsSearchResult
	} from '$lib/services/dbClient';

	// Panel resize / width state
	let panelWidth = $state<number>(440);
	let isDragging = false;

	function startDrag(e: MouseEvent) {
		isDragging = true;
		document.body.style.cursor = 'ew-resize';
		document.body.style.userSelect = 'none';
	}

	function doDrag(e: MouseEvent) {
		if (!isDragging) return;
		const newWidth = window.innerWidth - e.clientX;
		if (newWidth > 320 && newWidth < window.innerWidth - 120) {
			panelWidth = newWidth;
		}
	}

	function stopDrag() {
		if (isDragging) {
			isDragging = false;
			document.body.style.cursor = 'default';
			document.body.style.userSelect = 'auto';
		}
	}

	// Tab 1: Lexeme Data
	let currentLemma = $derived(readerState.selectedToken?.l || '');
	let decodedMorph = $derived(
		decodeMorph(readerState.selectedToken?.p, readerState.selectedToken?.m)
	);

	// Section 1: Attested Forms (On-demand)
	let isAttestedFormsOpen = $state<boolean>(false);
	let attestedForms = $state<AttestedForm[]>([]);
	let isAttestedFormsLoading = $state<boolean>(false);
	let attestedFormsLoaded = $state<boolean>(false);
	let attestedFormsError = $state<string | null>(null);

	// Section 2: Full Lexicon Article (Auto-fetched in background, collapsed by default)
	let isLexArticleOpen = $state<boolean>(false);
	let lexEntry = $state<LexiconEntry | null>(null);
	let isLexArticleLoading = $state<boolean>(false);
	let lexArticleLoaded = $state<boolean>(false);
	let lexArticleError = $state<string | null>(null);

	// Section 3: Concordance (Stats auto-fetched in background; occurrences on-demand)
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
			isAttestedFormsLoading = false;

			lexEntry = null;
			lexArticleLoaded = false;
			lexArticleError = null;
			isLexArticleLoading = false;

			concordance = [];
			stats = null;
			concordanceLoaded = false;
			concordanceError = null;
			isConcordanceLoading = false;

			if (currentLemma) {
				autoFetchLexAndStats(currentLemma);
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
			const forms = await fetchAttestedForms(lemma);
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

	function toggleLexArticle() {
		isLexArticleOpen = !isLexArticleOpen;
		if (isLexArticleOpen && !lexArticleLoaded && !isLexArticleLoading && currentLemma) {
			autoFetchLexAndStats(currentLemma);
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

	function selectForm(form: string) {
		const isSame = selectedFormFilter === form;
		selectedFormFilter = isSame ? null : form;
		if (!isSame) {
			isConcordanceOpen = true;
			if (!concordanceLoaded && !isConcordanceLoading && currentLemma) {
				loadConcordance(currentLemma);
			}
		}
	}

	let activeInflectionMatchingForms = $derived.by(() => {
		if (!isCriteriaActive(inflectionCriteria)) return null;
		return new Set(filterAttestedForms(attestedForms, inflectionCriteria).map((f) => f.form.toLowerCase()));
	});

	let filteredConcordance = $derived.by(() => {
		let list = concordance;
		if (activeInflectionMatchingForms) {
			list = list.filter((c) => {
				if (c.matched_words && c.matched_words.length > 0) {
					return c.matched_words.some((w) => {
						const clean = w.replace(/[,\.·;:\?!()\[\]—]/g, '').trim().toLowerCase();
						return activeInflectionMatchingForms.has(clean) || Array.from(activeInflectionMatchingForms).some((f) => isFormFilterMatch(w, f));
					});
				}
				const clean = (c.matched_word || '').replace(/[,\.·;:\?!()\[\]—]/g, '').trim().toLowerCase();
				return activeInflectionMatchingForms.has(clean) || Array.from(activeInflectionMatchingForms).some((f) => isFormFilterMatch(c.matched_word || '', f));
			});
		}

		if (selectedFormFilter) {
			const filter = selectedFormFilter;
			list = list.filter((c) => {
				if (c.matched_words && c.matched_words.length > 0) {
					return c.matched_words.some((w) => isFormFilterMatch(w, filter));
				}
				return isFormFilterMatch(c.matched_word || '', filter) || c.text_content.toLowerCase().includes(filter.toLowerCase());
			});
		}

		return list;
	});

	// Tab 2: Search Data
	let searchMode = $state<'lemma' | 'fts'>('lemma');
	let searchQuery = $state<string>('');
	let searchResults = $state<LemmaSearchResult[]>([]);
	let ftsResults = $state<FtsSearchResult[]>([]);
	let isSearchLoading = $state<boolean>(false);
	let searchInputEl = $state<HTMLInputElement | null>(null);

	let convertedSearchQuery = $derived(latinToGreek(searchQuery.trim()));

	$effect(() => {
		if (readerState.isSidePanelOpen && readerState.activeSidePanelTab === 'search') {
			setTimeout(() => {
				searchInputEl?.focus();
			}, 50);
		}
	});

	$effect(() => {
		const raw = searchQuery.trim();
		if (!raw || raw.length < 2) {
			searchResults = [];
			ftsResults = [];
			return;
		}

		const timer = setTimeout(() => {
			executeSearch();
		}, 180);

		return () => clearTimeout(timer);
	});

	async function executeSearch() {
		const raw = searchQuery.trim();
		if (raw.length < 2) return;
		isSearchLoading = true;
		try {
			if (searchMode === 'lemma') {
				const target = convertedSearchQuery || raw;
				searchResults = await searchLemmas(target, 40);
			} else {
				// FTS search in Greek or English
				ftsResults = await searchFts(raw, undefined, 40);
			}
		} catch (e) {
			console.error('Search error:', e);
		} finally {
			isSearchLoading = false;
		}
	}

	function selectLemmaResult(res: LemmaSearchResult) {
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
	}

	function selectFtsResult(res: FtsSearchResult) {
		readerState.setWork(res.work_code, res.chapter, res.section);
		setTimeout(() => {
			const el = document.getElementById(`section-${res.section}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}

	function navigateToRef(item: ConcordanceRef) {
		readerState.setWork(item.work_code, item.chapter, item.section);
		setTimeout(() => {
			const el = document.getElementById(`section-${item.section}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}

	let highlightedList = $derived(highlightStore.items);
</script>

<svelte:window onmousemove={doDrag} onmouseup={stopDrag} />

{#if readerState.isSidePanelOpen}
	<!-- Side Panel Container -->
	<aside
		class="fixed top-[53px] bottom-0 right-0 z-40 flex flex-col border-l border-[var(--color-rule)] bg-[var(--color-page)] shadow-2xl transition-all"
		style="width: {panelWidth}px; max-width: 95vw;"
		aria-label="Philo Reference and Lexicon Panel"
	>
		<!-- Left Drag Handle for resizing -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onmousedown={startDrag}
			class="absolute top-0 bottom-0 left-0 w-1.5 cursor-ew-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-50"
			title="Drag to resize panel"
		></div>

		<!-- Panel Top Navigation / Tabs Bar -->
		<div class="flex items-center justify-between border-b border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-2 shrink-0">
			<!-- Tab Buttons -->
			<div class="flex items-center gap-1 text-xs font-semibold">
				<button
					type="button"
					onclick={() => (readerState.activeSidePanelTab = 'lexeme')}
					class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'lexeme' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
				>
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					<span>Lexeme</span>
					{#if currentLemma}
						<span class="max-w-[80px] truncate text-[11px] font-mono text-blue-600 dark:text-blue-400">
							{currentLemma}
						</span>
					{/if}
				</button>

				<button
					type="button"
					onclick={() => (readerState.activeSidePanelTab = 'search')}
					class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'search' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
				>
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<span>Search</span>
				</button>

				<button
					type="button"
					onclick={() => (readerState.activeSidePanelTab = 'highlights')}
					class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'highlights' ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
				>
					<span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
					<span>Highlights</span>
					{#if highlightedList.length > 0}
						<span class="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 text-[10px] font-mono">
							{highlightedList.length}
						</span>
					{/if}
				</button>
			</div>

			<!-- Close panel button -->
			<button
				type="button"
				onclick={() => (readerState.isSidePanelOpen = false)}
				class="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)] cursor-pointer text-lg leading-none"
				aria-label="Close side panel"
				title="Close panel (Esc)"
			>
				&times;
			</button>
		</div>

		<!-- Panel Tab Content -->
		<div class="flex-1 overflow-y-auto p-4 space-y-4">
			<!-- TAB 1: LEXEME INFO -->
			{#if readerState.activeSidePanelTab === 'lexeme'}
				{#if !currentLemma}
					<div class="py-16 text-center text-xs text-[var(--color-ink-soft)] space-y-2">
						<svg class="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
						</svg>
						<p class="font-semibold text-sm">No word selected</p>
						<p class="max-w-xs mx-auto">Click any Greek word in the text to inspect its morphology, LSJ definition, attested forms, and concordance occurrences.</p>
					</div>
				{:else}
					<!-- Word Header Card -->
					<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-4 shadow-2xs">
						<div class="flex items-start justify-between">
							<div>
								<div class="flex items-center gap-2">
									<h2 class="text-2xl font-bold tracking-tight text-[var(--color-ink)] greek-font">
										{readerState.selectedToken?.l}
									</h2>
									{#if lexEntry?.transliteration}
										<span class="text-xs italic text-[var(--color-ink-soft)]">
											({lexEntry.transliteration})
										</span>
									{/if}
									{#if lexEntry?.strongs_id}
										<span class="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-soft)]">
											{lexEntry.strongs_id}
										</span>
									{/if}
								</div>

								<div class="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
									<span class="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
										{decodedMorph.pos}
									</span>
									{#each decodedMorph.details as detail}
										<span class="rounded bg-[var(--color-page)] px-1.5 py-0.5 font-medium text-[var(--color-ink-soft)] border border-[var(--color-rule)]">
											{detail}
										</span>
									{/each}
									<span class="text-[var(--color-ink-soft)]">&bull;</span>
									<span class="text-[var(--color-ink-soft)]">
										Surface: <strong class="text-[var(--color-ink)]">{readerState.selectedToken?.w}</strong>
									</span>
								</div>
							</div>

							<!-- Highlight Toggle Button -->
							<button
								type="button"
								onclick={() => highlightStore.toggle(currentLemma)}
								class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-page)] px-2.5 py-1 text-xs font-semibold shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer"
								title={highlightStore.isHighlighted(currentLemma) ? "Remove highlight" : "Highlight this lemma across text"}
							>
								{#if highlightStore.isHighlighted(currentLemma)}
									{@const hl = highlightStore.get(currentLemma)}
									<span class="h-2.5 w-2.5 rounded-full" style="background-color: {hl?.hex}; border: 1px solid {hl?.borderLight}"></span>
									<span>Highlighted</span>
								{:else}
									<span class="h-2.5 w-2.5 rounded-full border border-dashed border-slate-400"></span>
									<span>Highlight</span>
								{/if}
							</button>
						</div>

						<!-- Color Swatches Row (when highlighted) -->
						{#if highlightStore.isHighlighted(currentLemma)}
							{@const currentIdx = highlightStore.getColorIndex(currentLemma) ?? 0}
							{@const hl = highlightStore.get(currentLemma)}
							<div class="mt-3 p-2.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-page)] space-y-2">
								<div class="flex items-center justify-between text-[11px]">
									<span class="font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
										Color: <span class="text-[var(--color-ink)] capitalize">{hl?.name}</span>
									</span>
									<span class="text-[10px] text-[var(--color-ink-soft)]">Click to switch color</span>
								</div>
								<HighlightColorPicker
									selectedColorIndex={currentIdx}
									onselect={(idx) => highlightStore.setColor(currentLemma, idx)}
								/>
							</div>
						{/if}
					</div>

					<!-- Sibling Section: Attested Forms (Collapsed by default, loads on click) -->
					<AttestedFormsSection
						attestedForms={filteredAttestedForms}
						totalCount={attestedForms.length}
						selectedFormFilter={selectedFormFilter}
						lemmaDisplay={currentLemma}
						corpusTitle="Philo of Alexandria"
						loading={isAttestedFormsLoading}
						bind:isOpen={isAttestedFormsOpen}
						error={attestedFormsError}
						onRetry={() => loadAttestedForms(currentLemma)}
						onToggleOpen={(open) => {
							if (open && !attestedFormsLoaded && !isAttestedFormsLoading && currentLemma) {
								loadAttestedForms(currentLemma);
							}
						}}
						onToggleFilter={selectForm}
						onResetFilter={() => (selectedFormFilter = null)}
					/>

					<!-- SECTION 2: Full LSJ Lexicon Article Accordion -->
					<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] overflow-hidden shadow-2xs">
						<button
							type="button"
							onclick={toggleLexArticle}
							class="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)] transition-colors cursor-pointer"
						>
							<div class="flex items-center gap-2">
								<svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
								</svg>
								<span>LSJ Greek Lexicon Entry</span>
							</div>
							<span class="text-xs text-[var(--color-ink-soft)]">{isLexArticleOpen ? '▲' : '▼'}</span>
						</button>

						{#if isLexArticleOpen}
							<div class="border-t border-[var(--color-rule)] p-3.5 space-y-3">
								{#if isLexArticleLoading}
									<div class="py-6 text-center text-xs text-[var(--color-ink-soft)]">
										Loading dictionary entry...
									</div>
								{:else if lexArticleError}
									<div class="p-3 text-center text-xs text-red-500">
										{lexArticleError}
									</div>
								{:else if lexEntry}
									<div class="space-y-2">
										{#if lexEntry.gloss}
											<div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
												{lexEntry.gloss}
											</div>
										{/if}
										<div class="text-xs leading-relaxed text-[var(--color-ink)] prose dark:prose-invert max-w-none">
											{@html lexEntry.definition}
										</div>
										<div class="pt-2 text-[10px] text-[var(--color-ink-soft)] border-t border-[var(--color-rule)]">
											Dictionary: {lexEntry.dictionary}
										</div>
									</div>
								{:else}
									<div class="py-4 text-center text-xs text-[var(--color-ink-soft)]">
										No dictionary entry found for this lemma.
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- SECTION 3: Concordance Occurrences Accordion -->
					<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] overflow-hidden shadow-2xs">
						<button
							type="button"
							onclick={toggleConcordance}
							class="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)] transition-colors cursor-pointer"
						>
							<div class="flex items-center gap-2">
								<svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								<span>Concordance</span>
								{#if stats}
									<span class="rounded bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 text-[10px] font-mono text-blue-800 dark:text-blue-200">
										{stats.total_count} occurrences
									</span>
								{/if}
							</div>
							<span class="text-xs text-[var(--color-ink-soft)]">{isConcordanceOpen ? '▲' : '▼'}</span>
						</button>

						{#if isConcordanceOpen}
							<div class="border-t border-[var(--color-rule)] p-3.5 space-y-3">
								{#if isConcordanceLoading}
									<div class="py-6 text-center text-xs text-[var(--color-ink-soft)]">
										Loading concordance occurrences...
									</div>
								{:else if concordanceError}
									<div class="p-3 text-center text-xs text-red-500">
										{concordanceError}
									</div>
								{:else if filteredConcordance.length > 0}
									<div class="flex items-center justify-between text-xs text-[var(--color-ink-soft)] pb-2 border-b border-[var(--color-rule)]">
										<span>Showing {filteredConcordance.length} of {stats?.total_count || concordance.length}</span>
										<button
											type="button"
											onclick={() => (isKwic = !isKwic)}
											class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
										>
											{isKwic ? 'Show full verse' : 'Show KWIC'}
										</button>
									</div>

									<div class="space-y-2 max-h-96 overflow-y-auto">
										{#each filteredConcordance as item}
											<button
												type="button"
												onclick={() => navigateToRef(item)}
												class="w-full rounded-xl border border-[var(--color-rule)] p-2.5 text-left hover:bg-[var(--color-page)] transition-colors cursor-pointer group"
											>
												<div class="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
													<span>{item.display_citation}</span>
													<span class="text-[10px] text-[var(--color-ink-soft)] group-hover:text-blue-500">Jump &rarr;</span>
												</div>
												{#if isKwic}
													<div class="mt-1 text-xs text-[var(--color-ink)]">
														<KwicSnippet
															text={item.text_content}
															matchWord={selectedFormFilter || item.matched_word || currentLemma}
															lang="greek"
															radius={48}
															class="w-full"
														/>
													</div>
												{:else}
													<div class="text-xs greek-font leading-relaxed text-[var(--color-ink)]">
														{item.text_content}
													</div>
												{/if}
											</button>
										{/each}
									</div>
								{:else}
									<div class="py-4 text-center text-xs text-[var(--color-ink-soft)]">
										No concordance occurrences found.
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

			<!-- TAB 2: SEARCH -->
			{:else if readerState.activeSidePanelTab === 'search'}
				<div class="space-y-3">
					<!-- Search Mode Toggle -->
					<div class="flex rounded-lg bg-[var(--color-card-bg)] border border-[var(--color-rule)] p-0.5 text-xs font-semibold">
						<button
							type="button"
							onclick={() => { searchMode = 'lemma'; executeSearch(); }}
							class="flex-1 rounded-md py-1.5 transition-colors cursor-pointer {searchMode === 'lemma' ? 'bg-blue-600 text-white shadow-2xs' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}"
						>
							Lexicon Headwords
						</button>
						<button
							type="button"
							onclick={() => { searchMode = 'fts'; executeSearch(); }}
							class="flex-1 rounded-md py-1.5 transition-colors cursor-pointer {searchMode === 'fts' ? 'bg-blue-600 text-white shadow-2xs' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}"
						>
							Full-Text Search (FTS)
						</button>
					</div>

					<!-- Search Input -->
					<div class="relative">
						<input
							bind:this={searchInputEl}
							bind:value={searchQuery}
							type="text"
							placeholder={searchMode === 'lemma' ? "Type Greek or Latin (e.g. 'logos', 'qeos', 'nomos')..." : "Search text (Greek or English translation)..."}
							class="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3.5 py-2.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
						/>
						{#if searchQuery}
							<button
								type="button"
								onclick={() => (searchQuery = '')}
								class="absolute right-3 top-2.5 text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer"
							>
								&times;
							</button>
						{/if}
					</div>

					<!-- Transliteration Preview (Lemma mode) -->
					{#if searchMode === 'lemma' && convertedSearchQuery && convertedSearchQuery !== searchQuery.trim()}
						<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs">
							<span class="text-[var(--color-ink-soft)] font-mono text-[10px]">Greek Translit:</span>
							<span class="greek-font text-sm font-bold text-blue-600 dark:text-blue-400">
								{convertedSearchQuery}
							</span>
						</div>
					{/if}

					<!-- Search Results -->
					{#if isSearchLoading}
						<div class="py-8 text-center text-xs text-[var(--color-ink-soft)]">
							Searching corpus database...
						</div>
					{:else if searchMode === 'lemma'}
						{#if searchResults.length > 0}
							<div class="space-y-1 max-h-[65vh] overflow-y-auto">
								{#each searchResults as res}
									<button
										type="button"
										onclick={() => selectLemmaResult(res)}
										class="w-full flex items-center justify-between rounded-xl p-2.5 text-left border border-[var(--color-rule)] bg-[var(--color-card-bg)] hover:bg-[var(--color-page)] transition-colors cursor-pointer"
									>
										<div>
											<span class="text-sm font-bold text-[var(--color-ink)] greek-font">
												{res.lemma}
											</span>
											<span class="ml-1.5 text-xs text-[var(--color-ink-soft)]">
												({res.normalized_lemma})
											</span>
										</div>
										<span class="rounded bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 text-xs font-mono font-semibold text-blue-800 dark:text-blue-200">
											{res.total_count} &times;
										</span>
									</button>
								{/each}
							</div>
						{:else if searchQuery.trim().length >= 2}
							<div class="py-8 text-center text-xs text-[var(--color-ink-soft)]">
								No matching lemmas found.
							</div>
						{:else}
							<div class="py-8 text-center text-xs text-[var(--color-ink-soft)] leading-relaxed">
								Type Latin or Greek to search Philo's 39,000+ vocabulary headwords (e.g. <span class="font-mono">logos</span> &rarr; <span class="font-bold">λογος</span>, <span class="font-mono">nomos</span> &rarr; <span class="font-bold">νομος</span>).
							</div>
						{/if}
					{:else}
						<!-- FTS mode results -->
						{#if ftsResults.length > 0}
							<div class="space-y-2 max-h-[65vh] overflow-y-auto">
								{#each ftsResults as res}
									<button
										type="button"
										onclick={() => selectFtsResult(res)}
										class="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3 text-left hover:bg-[var(--color-page)] transition-colors cursor-pointer group"
									>
										<div class="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
											<span>{res.display_citation} ({res.corpus_id === 'grc' ? 'Greek' : 'English'})</span>
											<span class="text-[10px] text-[var(--color-ink-soft)] group-hover:text-blue-500">Jump &rarr;</span>
										</div>
										<div class="text-xs leading-relaxed text-[var(--color-ink)] line-clamp-3 {res.corpus_id === 'grc' ? 'greek-font' : ''}">
											{res.text_content}
										</div>
									</button>
								{/each}
							</div>
						{:else if searchQuery.trim().length >= 2}
							<div class="py-8 text-center text-xs text-[var(--color-ink-soft)]">
								No full-text search matches found.
							</div>
						{:else}
							<div class="py-8 text-center text-xs text-[var(--color-ink-soft)] leading-relaxed">
								Search full text across all 31 treatises in Cohn-Wendland Greek or Yonge's English translation.
							</div>
						{/if}
					{/if}
				</div>

			<!-- TAB 3: HIGHLIGHTS -->
			{:else if readerState.activeSidePanelTab === 'highlights'}
				<div class="space-y-3">
					<div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
						<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
							Active Highlights ({highlightedList.length})
						</span>
						{#if highlightedList.length > 0}
							<button
								type="button"
								onclick={() => highlightStore.clear()}
								class="text-xs text-red-500 hover:underline cursor-pointer"
							>
								Clear All
							</button>
						{/if}
					</div>

					{#if highlightedList.length === 0}
						<div class="py-12 text-center text-xs text-[var(--color-ink-soft)] space-y-2">
							<span class="inline-block h-6 w-6 rounded-full border border-dashed border-slate-400"></span>
							<p class="font-semibold text-sm">No highlights yet</p>
							<p>Click any Greek word in the text and choose "Highlight" to highlight that lemma everywhere in the corpus.</p>
						</div>
					{:else}
						<div class="space-y-2 max-h-[65vh] overflow-y-auto">
							{#each highlightedList as item}
								<div class="flex items-center justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-2.5">
									<button
										type="button"
										onclick={() => {
											readerState.openLemma(
												{ w: item.lemma, l: item.lemma, m: '', p: '', lang: 'grc' },
												''
											);
										}}
										class="flex items-center gap-2 text-left hover:underline cursor-pointer"
									>
										<span class="h-3 w-3 rounded-full shrink-0" style="background-color: {item.color.hex}"></span>
										<span class="text-sm font-bold text-[var(--color-ink)] greek-font">
											{item.lemma}
										</span>
									</button>

									<div class="flex items-center gap-2">
										<HighlightColorPicker
											selectedColorIndex={item.colorIndex}
											onselect={(idx) => highlightStore.setColor(item.lemma, idx)}
										/>
										<button
											type="button"
											onclick={() => highlightStore.remove(item.lemma)}
											class="text-xs text-[var(--color-ink-soft)] hover:text-red-500 p-1 cursor-pointer"
											title="Remove highlight"
										>
											&times;
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</aside>
{/if}
