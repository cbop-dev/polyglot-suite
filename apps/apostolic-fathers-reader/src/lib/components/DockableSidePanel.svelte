<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import HighlightColorPicker from '$lib/components/HighlightColorPicker.svelte';
	import { WORKS_BY_CODE } from '$lib/config/canonicalWorks.generated';
	import { decodeMorph, latinToGreek } from '@polyglot/ancient-languages';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		fetchAttestedForms,
		searchLemmas,
		type LexiconEntry,
		type LemmaStat,
		type ConcordanceRef,
		type AttestedForm,
		type LemmaSearchResult
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

	let lexEntry = $state<LexiconEntry | null>(null);
	let stats = $state<LemmaStat | null>(null);
	let concordance = $state<ConcordanceRef[]>([]);
	let attestedForms = $state<AttestedForm[]>([]);
	let selectedFormFilter = $state<string | null>(null);
	let isLexLoading = $state<boolean>(false);

	$effect(() => {
		if (currentLemma) {
			selectedFormFilter = null;
			loadLexemeDetails(currentLemma);
		}
	});

	async function loadLexemeDetails(lemma: string) {
		isLexLoading = true;
		try {
			const [l, s, c, f] = await Promise.all([
				fetchLexiconEntry(lemma),
				fetchLemmaStats(lemma),
				fetchConcordance(lemma),
				fetchAttestedForms(lemma)
			]);
			lexEntry = l;
			stats = s;
			concordance = c;
			attestedForms = f;
		} catch (err) {
			console.error('Error loading lexeme details:', err);
		} finally {
			isLexLoading = false;
		}
	}

	let filteredConcordance = $derived.by(() => {
		if (!selectedFormFilter) return concordance;
		const target = selectedFormFilter.toLowerCase();
		return concordance.filter((c) => c.text_content.toLowerCase().includes(target));
	});

	// Tab 2: Search Data
	let searchQuery = $state<string>('');
	let searchResults = $state<LemmaSearchResult[]>([]);
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
		const target = convertedSearchQuery || searchQuery.trim();
		if (target.length >= 2) {
			const timer = setTimeout(() => {
				runSearch(target);
			}, 150);
			return () => clearTimeout(timer);
		} else {
			searchResults = [];
		}
	});

	async function runSearch(q: string) {
		isSearchLoading = true;
		try {
			searchResults = await searchLemmas(q, 40);
		} catch (e) {
			console.error('Search error', e);
		} finally {
			isSearchLoading = false;
		}
	}

	function selectSearchResult(res: LemmaSearchResult) {
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

	// Tab 3: Highlights Data
	let highlightedList = $derived(Object.keys(highlightStore.highlights));

	function navigateToRef(item: ConcordanceRef) {
		readerState.setWork(item.work_code, item.chapter);
	}
</script>

<svelte:window onmousemove={doDrag} onmouseup={stopDrag} />

{#if readerState.isSidePanelOpen}
	<!-- Side Panel Container -->
	<aside
		class="fixed top-0 right-0 h-full bg-[var(--color-page)] shadow-2xl border-l border-[var(--color-rule)] z-40 flex flex-col text-[var(--color-ink)] transition-transform duration-200"
		style="width: min(100vw, {panelWidth}px);"
		aria-label="Lexicon & Study Panel"
	>
		<!-- Drag handle on desktop left edge -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			role="separator"
			aria-orientation="vertical"
			tabindex="0"
			onmousedown={startDrag}
			class="hidden md:block absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-blue-500/30 transition-colors z-50"
			title="Drag to resize panel"
		></div>

		<!-- Panel Top Navigation: Tabs and Close -->
		<div class="flex items-center justify-between border-b border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 pt-2">
			<!-- 3 Tabs: Search, Lexeme, Highlights -->
			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={() => (readerState.activeSidePanelTab = 'search')}
					class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'search' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}"
				>
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<span>Search</span>
				</button>

				<button
					type="button"
					onclick={() => (readerState.activeSidePanelTab = 'lexeme')}
					class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'lexeme' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}"
				>
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					<span>Lexeme</span>
					{#if currentLemma}
						<span class="max-w-[70px] truncate text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1 rounded greek-font">
							{currentLemma}
						</span>
					{/if}
				</button>

				<button
					type="button"
					onclick={() => (readerState.activeSidePanelTab = 'highlights')}
					class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer {readerState.activeSidePanelTab === 'highlights' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}"
				>
					<span class="h-2 w-2 rounded-full bg-amber-500"></span>
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
						<p class="max-w-xs mx-auto">Click any Greek or Latin word in the text to inspect its morphology, definition, and attested forms.</p>
					</div>
				{:else if isLexLoading}
					<div class="py-16 text-center text-xs text-[var(--color-ink-soft)] space-y-2">
						<div class="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
						<p>Loading lexical and morphological data...</p>
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

						<!-- Brief Gloss -->
						{#if lexEntry?.gloss}
							<div class="mt-3 p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
								<div class="text-[10px] uppercase font-bold text-[var(--color-ink-soft)] tracking-wider">Gloss</div>
								<div class="text-sm font-semibold text-blue-700 dark:text-blue-300 italic">{lexEntry.gloss}</div>
							</div>
						{/if}
					</div>

					<!-- Attested Inflected Forms Grid -->
					{#if attestedForms.length > 0}
						<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3">
							<div class="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)]">
								<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
									Attested Forms ({attestedForms.length})
								</span>
								{#if selectedFormFilter}
									<button
										type="button"
										onclick={() => (selectedFormFilter = null)}
										class="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
									>
										Reset filter
									</button>
								{/if}
							</div>

							<div class="flex flex-wrap gap-1.5">
								{#each attestedForms as f}
									{@const isActive = selectedFormFilter === f.form}
									<button
										type="button"
										onclick={() => (selectedFormFilter = isActive ? null : f.form)}
										class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors cursor-pointer {isActive ? 'bg-blue-600 text-white font-bold' : 'bg-[var(--color-page)] hover:bg-[var(--color-rule)] border border-[var(--color-rule)] text-[var(--color-ink)]'}"
										title="Filter concordance by {f.form}"
									>
										<span class="greek-font font-medium">{f.form}</span>
										<span class="text-[10px] font-mono opacity-70">({f.count})</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- LSJ Lexicon Definition -->
					{#if lexEntry}
						<details open class="group rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] overflow-hidden">
							<summary class="flex items-center justify-between px-4 py-2.5 cursor-pointer font-bold text-xs uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)] transition-colors select-none">
								<div class="flex items-center gap-2">
									<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 text-[10px] font-bold">LSJ</span>
									<span>Full Lexicon Article</span>
								</div>
								<span class="text-slate-400 group-open:rotate-180 transition-transform">
									&darr;
								</span>
							</summary>
							<div class="p-4 border-t border-[var(--color-rule)] bg-[var(--color-page)]/50 prose dark:prose-invert max-w-none text-xs leading-normal max-h-60 overflow-y-auto">
								{@html lexEntry.definition}
							</div>
						</details>
					{/if}

					<!-- Concordance List -->
					<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3">
						<div class="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)]">
							<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
								Concordance ({filteredConcordance.length}{selectedFormFilter ? ` for "${selectedFormFilter}"` : ''})
							</span>
							{#if stats}
								<span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
									{stats.total_count} in AF corpus
								</span>
							{/if}
						</div>

						<div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
							{#each filteredConcordance as ref}
								<button
									type="button"
									onclick={() => navigateToRef(ref)}
									class="w-full text-left rounded-lg p-2 hover:bg-[var(--color-page)] border border-transparent hover:border-[var(--color-rule)] transition-colors cursor-pointer"
								>
									<div class="font-bold text-blue-600 dark:text-blue-400 text-xs">
										{ref.display_citation}
									</div>
									<div class="text-[11px] text-[var(--color-ink-soft)] line-clamp-2 mt-0.5 greek-font">
										{ref.text_content}
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

			<!-- TAB 2: SEARCH -->
			{:else if readerState.activeSidePanelTab === 'search'}
				<div class="space-y-4">
					<!-- Search Input -->
					<div class="relative">
						<input
							bind:this={searchInputEl}
							bind:value={searchQuery}
							type="text"
							placeholder="Search Greek lemma (Greek or beta-code, e.g. agape, pistis)..."
							class="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-blue-500 focus:outline-hidden"
						/>
						{#if convertedSearchQuery && convertedSearchQuery !== searchQuery}
							<div class="mt-1 text-[11px] text-[var(--color-ink-soft)]">
								Transliterated query: <span class="font-bold greek-font text-[var(--color-ink)]">{convertedSearchQuery}</span>
							</div>
						{/if}
					</div>

					<!-- Search Results -->
					{#if isSearchLoading}
						<div class="py-12 text-center text-xs text-[var(--color-ink-soft)]">
							Searching lemmas in Apostolic Fathers...
						</div>
					{:else if searchResults.length > 0}
						<div class="space-y-1">
							{#each searchResults as res}
								<button
									type="button"
									onclick={() => selectSearchResult(res)}
									class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[var(--color-card-bg)] border border-transparent hover:border-[var(--color-rule)] transition-colors cursor-pointer"
								>
									<div>
										<div class="font-bold text-sm greek-font text-[var(--color-ink)]">{res.lemma}</div>
										<div class="text-[11px] text-[var(--color-ink-soft)]">
											{res.total_count} occurrences across AF
										</div>
									</div>
									<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 text-xs font-mono font-bold">
										Inspect &rarr;
									</span>
								</button>
							{/each}
						</div>
					{:else if searchQuery.trim().length >= 2}
						<div class="py-12 text-center text-xs text-[var(--color-ink-soft)]">
							No lemmas matched "{searchQuery}"
						</div>
					{:else}
						<div class="py-12 text-center text-xs text-[var(--color-ink-soft)] space-y-1">
							<p class="font-semibold">Type at least 2 characters to search</p>
							<p>Supports English transliteration (e.g., "agape" &rarr; "ἀγάπη")</p>
						</div>
					{/if}
				</div>

			<!-- TAB 3: HIGHLIGHTS -->
			{:else if readerState.activeSidePanelTab === 'highlights'}
				<div class="space-y-4">
					<div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
						<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
							Active Highlights ({highlightedList.length})
						</span>
						{#if highlightedList.length > 0}
							<button
								type="button"
								onclick={() => highlightStore.clear()}
								class="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
							>
								Clear All
							</button>
						{/if}
					</div>

					{#if highlightedList.length === 0}
						<div class="py-16 text-center text-xs text-[var(--color-ink-soft)] space-y-2">
							<p class="font-semibold text-sm">No active highlights</p>
							<p class="max-w-xs mx-auto">Click any word in the text or search for a lemma, then click "Highlight" to color-code occurrences across the entire corpus.</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each highlightedList as lemma}
								{@const hl = highlightStore.get(lemma)}
								{@const currentIdx = highlightStore.getColorIndex(lemma) ?? 0}
								<div class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3 space-y-2 shadow-2xs">
									<div class="flex items-center justify-between">
										<button
											type="button"
											onclick={() => {
												readerState.openLemma({ w: lemma, l: lemma, m: '', p: '', lang: 'grc' }, '');
											}}
											class="flex items-center gap-2 cursor-pointer text-left hover:underline"
										>
											<span class="h-3 w-3 rounded-full shrink-0" style="background-color: {hl?.hex}; border: 1px solid {hl?.borderLight}"></span>
											<span class="font-bold text-sm greek-font text-[var(--color-ink)]">{lemma}</span>
											<span class="text-[11px] font-medium text-[var(--color-ink-soft)] capitalize">({hl?.name})</span>
										</button>
										<button
											type="button"
											onclick={() => highlightStore.remove(lemma)}
											class="rounded p-1 text-[var(--color-ink-soft)] hover:text-red-600 hover:bg-[var(--color-rule)] cursor-pointer text-sm"
											title="Remove highlight"
											aria-label="Remove highlight"
										>
											&times;
										</button>
									</div>

									<!-- 16-Color Palette Picker Swatches -->
									<div class="pt-2 border-t border-[var(--color-rule)]/50">
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
	</aside>
{/if}
