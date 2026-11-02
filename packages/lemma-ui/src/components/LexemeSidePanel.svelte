<script lang="ts">
	import { FloatingSidePanel, Loading } from '@polyglot/ui';
	import HighlightColorPicker from '@polyglot/ancient-languages/HighlightColorPicker.svelte';
	import KwicSnippet from '@polyglot/ancient-languages/KwicSnippet.svelte';
	import AttestedFormsSection from '@polyglot/ancient-languages/AttestedFormsSection.svelte';
	import InflectionFilterBar from '@polyglot/ancient-languages/InflectionFilterBar.svelte';
	import {
		decodeMorph,
		latinToGreek,
		isFormFilterMatch,
		filterAttestedForms,
		extractAvailableInflections,
		isCriteriaActive,
		type InflectionFilterCriteria,
		type AttestedForm,
		type AvailableInflections
	} from '@polyglot/ancient-languages';
	import type { Snippet } from 'svelte';

	export type { AttestedForm };

	export interface TokenInfo {
		w?: string; // surface word
		l?: string; // lemma
		p?: string; // part of speech
		m?: string; // morphology code
		[key: string]: any;
	}

	export interface LexiconEntry {
		lemma?: string;
		gloss?: string;
		definition?: string;
		[key: string]: any;
	}

	export interface LemmaStat {
		total_count: number;
		works_count?: number;
		[key: string]: any;
	}

	export interface ConcordanceRef {
		work?: string;
		work_code?: string;
		workCode?: string;
		book?: number;
		chapter?: number;
		section?: number;
		display_citation?: string;
		text_content?: string;
		matched_word?: string;
		[key: string]: any;
	}

	export interface LemmaSearchResult {
		lemma: string;
		total_count?: number;
		count?: number;
		gloss?: string;
		[key: string]: any;
	}

	export interface ExtraTab {
		id: string;
		label: string;
		count?: number | string;
	}

	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
		activeTab?: string;
		onTabChange?: (tab: string) => void;
		selectedToken?: TokenInfo | null;
		corpusTitle?: string;
		top?: string;
		width?: number;
		ariaLabel?: string;
		highlightStore?: any;

		// Data fetching
		fetchLexiconEntry?: (lemma: string) => Promise<LexiconEntry | null>;
		fetchLemmaStats?: (lemma: string) => Promise<LemmaStat | null>;
		fetchConcordance?: (lemma: string) => Promise<ConcordanceRef[]>;
		fetchAttestedForms?: (lemma: string) => Promise<AttestedForm[]>;
		fetchWordMorph?: ((word: string, lemma?: string) => Promise<any>) | null;
		searchLemmas?: (query: string) => Promise<LemmaSearchResult[]>;

		// Navigation & Token selection
		onNavigateToRef?: (ref: ConcordanceRef) => void;
		formatRefLabel?: (ref: ConcordanceRef) => string;
		onSelectToken?: (token: TokenInfo) => void;

		// Custom Tabs
		extraTabs?: ExtraTab[];
		extraTabPanels?: Snippet<[string]>;
		lexiconArticleTitle?: string;
	}

	let {
		isOpen = false,
		onClose = () => {},
		activeTab = 'lexeme',
		onTabChange,
		selectedToken = null,
		corpusTitle = 'Corpus',
		top = '53px',
		width = 440,
		ariaLabel,
		highlightStore,

		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		fetchAttestedForms,
		fetchWordMorph,
		searchLemmas,

		onNavigateToRef,
		formatRefLabel,
		onSelectToken,

		extraTabs = [],
		extraTabPanels,
		lexiconArticleTitle
	}: Props = $props();

	let effectiveLexiconTitle = $derived(
		lexiconArticleTitle || (corpusTitle === 'Josephus' ? 'LSJ Lexicon Article' : 'Full Lexicon Article')
	);

	// Internal state
	let currentTab = $state<string>('lexeme');
	$effect(() => {
		if (activeTab) {
			currentTab = activeTab;
		}
	});

	function setTab(tab: string) {
		currentTab = tab;
		onTabChange?.(tab);
	}

	// Token derived
	let currentWord = $derived(selectedToken?.w || '');
	let currentLemma = $derived(selectedToken?.l || '');
	let decodedMorph = $derived(
		decodeMorph(selectedToken?.p, selectedToken?.m)
	);

	// Word morphology (if DB provides extra parse entry like Josephus)
	let wordMorph = $state<any | null>(null);

	// Section 1: Attested Forms
	let isAttestedFormsOpen = $state<boolean>(false);
	let attestedForms = $state<AttestedForm[]>([]);
	let isAttestedFormsLoading = $state<boolean>(false);
	let attestedFormsLoaded = $state<boolean>(false);
	let attestedFormsError = $state<string | null>(null);

	// Inflection Filter State
	let inflectionCriteria = $state<InflectionFilterCriteria>({});
	let isInflectionFilterOpen = $state<boolean>(false);
	let selectedFormFilter = $state<string | null>(null);

	let availableInflections = $derived(extractAvailableInflections(attestedForms));

	let filteredAttestedForms = $derived.by(() => {
		let list = attestedForms;
		if (isCriteriaActive(inflectionCriteria)) {
			list = filterAttestedForms(list, inflectionCriteria);
		}
		if (selectedFormFilter) {
			list = list.filter((f) => f.form === selectedFormFilter);
		}
		return list;
	});

	function selectForm(form: string) {
		if (selectedFormFilter === form) {
			selectedFormFilter = null;
		} else {
			selectedFormFilter = form;
		}
	}

	// Section 2: Full Lexicon Article
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

	let filteredConcordance = $derived.by(() => {
		const filter = selectedFormFilter;
		if (!filter) return concordance;
		return concordance.filter((ref) => {
			if (ref.matched_word && ref.matched_word === filter) return true;
			if (ref.text_content && ref.text_content.includes(filter)) return true;
			return false;
		});
	});

	// Reset state when active lemma changes
	let lastFetchedLemma = '';
	$effect(() => {
		const lemma = currentLemma;
		if (lemma && lemma !== lastFetchedLemma) {
			lastFetchedLemma = lemma;
			resetLemmaSections();
			autoFetchLexAndStats(lemma);
			if (fetchWordMorph && currentWord) {
				fetchWordMorph(currentWord, lemma).then((m) => (wordMorph = m)).catch(() => {});
			}
		}
	});

	function resetLemmaSections() {
		attestedForms = [];
		attestedFormsLoaded = false;
		attestedFormsError = null;
		isAttestedFormsLoading = false;
		selectedFormFilter = null;

		lexEntry = null;
		lexArticleLoaded = false;
		lexArticleError = null;
		isLexArticleLoading = false;

		concordance = [];
		concordanceLoaded = false;
		concordanceError = null;
		isConcordanceLoading = false;
		stats = null;
		wordMorph = null;
	}

	async function autoFetchLexAndStats(lemma: string) {
		if (!lemma) return;
		isLexArticleLoading = true;
		lexArticleError = null;
		try {
			const [entry, s] = await Promise.all([
				fetchLexiconEntry ? fetchLexiconEntry(lemma) : Promise.resolve(null),
				fetchLemmaStats ? fetchLemmaStats(lemma) : Promise.resolve(null)
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
		if (!lemma || !fetchAttestedForms) return;
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

	function toggleAttestedForms(open?: boolean) {
		const willBeOpen = typeof open === 'boolean' ? open : !isAttestedFormsOpen;
		isAttestedFormsOpen = willBeOpen;
		if (willBeOpen && !attestedFormsLoaded && !isAttestedFormsLoading && currentLemma) {
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
		if (!lemma || !fetchConcordance) return;
		isConcordanceLoading = true;
		concordanceError = null;
		try {
			const [c, s] = await Promise.all([
				fetchConcordance(lemma),
				stats ? Promise.resolve(stats) : (fetchLemmaStats ? fetchLemmaStats(lemma) : Promise.resolve(null))
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

	// Tab 2: Search Tab State
	let searchQuery = $state<string>('');
	let searchResults = $state<LemmaSearchResult[]>([]);
	let isSearchLoading = $state<boolean>(false);
	let searchInputEl = $state<HTMLInputElement | null>(null);

	let convertedSearchQuery = $derived.by(() => {
		const trimmed = searchQuery.trim();
		if (!trimmed) return '';
		return latinToGreek(trimmed);
	});

	$effect(() => {
		if (isOpen && currentTab === 'search') {
			setTimeout(() => {
				searchInputEl?.focus();
			}, 50);
		}
	});

	let searchTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		const q = convertedSearchQuery;
		if (searchTimer) clearTimeout(searchTimer);
		if (!q || q.length < 2 || !searchLemmas) {
			searchResults = [];
			isSearchLoading = false;
			return;
		}
		isSearchLoading = true;
		searchTimer = setTimeout(async () => {
			try {
				const res = await searchLemmas(q);
				searchResults = res;
			} catch (err) {
				console.error('Error searching lemmas:', err);
				searchResults = [];
			} finally {
				isSearchLoading = false;
			}
		}, 180);
	});

	function selectSearchResult(res: LemmaSearchResult) {
		onSelectToken?.({ w: res.lemma, l: res.lemma });
		setTab('lexeme');
	}

	// Tab 3: Highlights
	let highlightedList = $derived.by<string[]>(() => {
		if (!highlightStore?.highlights) return [];
		return Object.keys(highlightStore.highlights);
	});
</script>

<FloatingSidePanel
	{isOpen}
	{onClose}
	{top}
	{width}
	noPadding={true}
	showDefaultCloseButton={false}
	ariaLabel={ariaLabel || `${corpusTitle} Reference and Lexicon Panel`}
>
	<!-- Panel Top Navigation: Tabs and Close Button -->
	<div class="flex items-center justify-between border-b border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-2 shrink-0">
		<!-- Tabs Bar -->
		<div class="flex items-center gap-1 text-xs font-semibold">
			<button
				type="button"
				onclick={() => setTab('lexeme')}
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {currentTab === 'lexeme'
					? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold'
					: 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
			>
				<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
				<span>Lemma</span>
				{#if currentLemma}
					<span class="max-w-[80px] truncate text-[11px] font-mono text-blue-600 dark:text-blue-400">
						{currentLemma}
					</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => setTab('search')}
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {currentTab === 'search'
					? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold'
					: 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
			>
				<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<span>Search</span>
			</button>

			{#each extraTabs as extraTab (extraTab.id)}
				<button
					type="button"
					onclick={() => setTab(extraTab.id)}
					class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {currentTab === extraTab.id
						? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold'
						: 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
				>
					<span>{extraTab.label}</span>
					{#if extraTab.count !== undefined}
						<span class="rounded bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 px-1 py-0.2 text-[10px] font-mono font-bold">
							{extraTab.count}
						</span>
					{/if}
				</button>
			{/each}

			<button
				type="button"
				onclick={() => setTab('highlights')}
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer {currentTab === 'highlights'
					? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold'
					: 'text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)]'}"
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

		<!-- Close Button -->
		<button
			type="button"
			onclick={onClose}
			class="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)] cursor-pointer text-lg leading-none"
			aria-label="Close side panel"
			title="Close panel (Esc)"
		>
			&times;
		</button>
	</div>

	<!-- Panel Body Area -->
	<div class="lemma-card flex-1 overflow-y-auto p-4 flex flex-col gap-4 space-y-4" role="dialog" aria-label="Lemma & Lexicon Inspection">
		{#if currentTab === 'lexeme'}
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
								<h2 class="greek-font text-xl font-bold inline">
									<span>{currentWord || currentLemma}</span>
									{#if currentLemma && currentLemma !== currentWord}
										<span class="text-sm font-normal text-[var(--color-ink-soft)] font-sans">({currentLemma})</span>
									{/if}
								</h2>
							</div>

							<!-- Morphology tag description -->
							{#if wordMorph?.description || wordMorph?.parse_code}
								<div class="text-xs text-[var(--color-ink-soft)] font-medium mt-0.5">
									{wordMorph.description || wordMorph.parse_code}
								</div>
							{/if}

							<!-- Morphology Pills (decoded morph) -->
							{#if decodedMorph.pos || decodedMorph.details.length > 0}
								<div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
									{#if decodedMorph.pos}
										<span class="rounded bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 font-bold text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
											{decodedMorph.pos}
										</span>
									{/if}
									{#each decodedMorph.details as detail}
										<span class="rounded bg-[var(--color-page)] px-1.5 py-0.5 font-medium text-[var(--color-ink-soft)] border border-[var(--color-rule)]">
											{detail}
										</span>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Highlight Toggle Button -->
						{#if highlightStore}
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
						{/if}
					</div>

					<!-- Color Swatches Row (when highlighted) -->
					{#if highlightStore && highlightStore.isHighlighted(currentLemma)}
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

				<!-- Section: Inflection Filter Bar (if attested forms exist) -->
				{#if availableInflections.tenses.length > 0 || availableInflections.moods.length > 0 || availableInflections.cases.length > 0}
					<InflectionFilterBar
						available={availableInflections}
						bind:criteria={inflectionCriteria}
						bind:isOpen={isInflectionFilterOpen}
						totalFormsCount={attestedForms.length}
						filteredFormsCount={filteredAttestedForms.length}
						loading={isAttestedFormsLoading}
						error={attestedFormsError}
						onRetry={() => loadAttestedForms(currentLemma)}
						onToggleOpen={(open) => {
							if (open && !attestedFormsLoaded && !isAttestedFormsLoading && currentLemma) {
								loadAttestedForms(currentLemma);
							}
						}}
					/>
				{/if}

				<!-- Section 1: Attested Word Forms -->
				<AttestedFormsSection
					attestedForms={filteredAttestedForms}
					totalCount={attestedForms.length}
					selectedFormFilter={selectedFormFilter}
					lemmaDisplay={currentLemma}
					{corpusTitle}
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

				<!-- Section 2: Full Lexicon Article -->
				<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs overflow-hidden">
					<button
						type="button"
						onclick={toggleLexArticle}
						class="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 cursor-pointer text-left select-none transition-colors"
						aria-expanded={isLexArticleOpen}
					>
						<div class="flex items-center gap-2">
							<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 text-[10px] font-bold">LSJ</span>
							<span>{effectiveLexiconTitle}</span>
							{#if isLexArticleLoading}
								<Loading inline size="xs" />
							{/if}
						</div>
						<svg
							class="h-4 w-4 text-[var(--color-ink-soft)] transition-transform duration-200 {isLexArticleOpen ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if isLexArticleOpen}
						<div class="p-4 border-t border-[var(--color-rule)] text-sm leading-relaxed font-serif text-[var(--color-ink)]">
							{#if isLexArticleLoading}
								<Loading title="Loading LSJ dictionary article..." />
							{:else if lexArticleError}
								<div class="text-xs text-red-600 dark:text-red-400">{lexArticleError}</div>
							{:else if !lexEntry || (!lexEntry.definition && !lexEntry.gloss)}
								<div class="text-xs text-[var(--color-ink-soft)]">No dictionary entry found for "{currentLemma}".</div>
							{:else}
								{#if lexEntry.gloss}
									<div class="mb-3 p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
										<div class="text-[10px] uppercase font-bold text-[var(--color-ink-soft)] tracking-wider">Gloss</div>
										<div class="text-sm font-semibold text-blue-700 dark:text-blue-300 italic">{lexEntry.gloss}</div>
									</div>
								{/if}
								{#if lexEntry.definition}
									<div class="dict-def prose dark:prose-invert max-w-none text-xs leading-relaxed text-[var(--color-ink)]">
										{@html lexEntry.definition}
									</div>
								{/if}
							{/if}
						</div>
					{/if}
				</div>

				<!-- Section 3: Concordance / Corpus Occurrences -->
				<div class="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs overflow-hidden">
					<button
						type="button"
						onclick={toggleConcordance}
						class="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 cursor-pointer text-left select-none transition-colors"
						aria-expanded={isConcordanceOpen}
					>
						<div class="flex items-center gap-2">
							<span>Concordance</span>
							{#if stats}
								<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 text-[10px] font-mono font-bold">
									{stats.total_count} in {corpusTitle}
								</span>
							{/if}
							{#if isConcordanceLoading}
								<Loading inline size="xs" />
							{/if}
						</div>
						<svg
							class="h-4 w-4 text-[var(--color-ink-soft)] transition-transform duration-200 {isConcordanceOpen ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if isConcordanceOpen}
						<div class="p-3 border-t border-[var(--color-rule)] bg-[var(--color-page)]/30">
							{#if isConcordanceLoading}
								<Loading size="sm" title="Loading concordance occurrences..." />
							{:else if concordanceError}
								<div class="p-3 text-center text-xs text-red-600 dark:text-red-400 space-y-1">
									<p>{concordanceError}</p>
									<button
										type="button"
										onclick={() => loadConcordance(currentLemma)}
										class="text-blue-600 dark:text-blue-400 underline font-medium hover:opacity-80 cursor-pointer"
									>
										Retry
									</button>
								</div>
							{:else if filteredConcordance.length === 0}
								<div class="py-3 text-center text-xs text-[var(--color-ink-soft)]">
									{#if selectedFormFilter}
										No occurrences found for "{selectedFormFilter}".
									{:else}
										No concordance occurrences found in {corpusTitle}.
									{/if}
								</div>
							{:else}
								<div class="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)]">
									<span class="text-[11px] text-[var(--color-ink-soft)] font-medium">
										{filteredConcordance.length} {filteredConcordance.length === 1 ? 'occurrence' : 'occurrences'}
									</span>
									<div class="inline-flex rounded-lg bg-[var(--color-rule)] p-0.5 text-[11px] font-semibold">
										<button
											type="button"
											onclick={() => (isKwic = true)}
											class="px-2 py-0.5 rounded-md transition-colors cursor-pointer {isKwic
												? 'bg-[var(--color-card-bg)] shadow-2xs text-blue-600 dark:text-blue-400 font-bold'
												: 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}"
										>
											KWIC
										</button>
										<button
											type="button"
											onclick={() => (isKwic = false)}
											class="px-2 py-0.5 rounded-md transition-colors cursor-pointer {!isKwic
												? 'bg-[var(--color-card-bg)] shadow-2xs text-blue-600 dark:text-blue-400 font-bold'
												: 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'}"
										>
											Full Text
										</button>
									</div>
								</div>

								<div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
									{#each filteredConcordance as ref}
										{@const citation = formatRefLabel ? formatRefLabel(ref) : (ref.display_citation || `${ref.work || ''} ${ref.book ? `${ref.book}.` : ''}${ref.section || ref.chapter || ''}`)}
										<button
											type="button"
											onclick={() => onNavigateToRef?.(ref)}
											class="w-full text-left rounded-lg p-2 hover:bg-[var(--color-page)] border border-transparent hover:border-[var(--color-rule)] transition-colors cursor-pointer group"
										>
											<div class="flex items-center justify-between">
												<span class="font-bold text-blue-600 dark:text-blue-400 text-xs">
													{citation}
												</span>
												<span class="text-[10px] text-[var(--color-ink-soft)] opacity-0 group-hover:opacity-100 transition-opacity">
													Jump &rarr;
												</span>
											</div>
											{#if isKwic}
												<div class="mt-1 text-xs text-[var(--color-ink)]">
													<KwicSnippet
														text={ref.text_content || ''}
														matchWord={selectedFormFilter || ref.matched_word || currentLemma}
														lang="greek"
														radius={48}
														class="w-full"
													/>
												</div>
											{:else}
												<div class="text-[11px] text-[var(--color-ink-soft)] mt-1 leading-relaxed greek-font">
													{ref.text_content || ''}
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

		<!-- TAB 2: SEARCH -->
		{:else if currentTab === 'search'}
			<div class="space-y-4">
				<!-- Search Input -->
				<div class="relative">
					<input
						bind:this={searchInputEl}
						bind:value={searchQuery}
						id="side-search-input"
						type="text"
						placeholder="Search Greek lemma (Greek or transliteration, e.g. logos, agape)..."
						class="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-2 text-sm font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-blue-500 focus:outline-hidden"
						onkeydown={(e) => {
							if (e.key === 'Escape') {
								e.preventDefault();
								onClose();
							}
						}}
					/>
					{#if convertedSearchQuery && convertedSearchQuery !== searchQuery}
						<div class="mt-1 text-[11px] text-[var(--color-ink-soft)]">
							Transliterated query: <span class="font-bold greek-font text-[var(--color-ink)]">{convertedSearchQuery}</span>
						</div>
					{/if}
				</div>

				<!-- Search Results -->
				{#if isSearchLoading}
					<Loading size="sm" title="Searching lemmas in {corpusTitle}..." />
				{:else if searchResults.length > 0}
					<div class="space-y-1">
						{#each searchResults as res}
							{@const cnt = res.total_count ?? res.count ?? 0}
							<button
								type="button"
								onclick={() => selectSearchResult(res)}
								class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[var(--color-card-bg)] border border-transparent hover:border-[var(--color-rule)] transition-colors cursor-pointer"
							>
								<div>
									<div class="font-bold text-sm greek-font text-[var(--color-ink)]">{res.lemma}</div>
									<div class="text-[11px] text-[var(--color-ink-soft)]">
										{cnt} {cnt === 1 ? 'occurrence' : 'occurrences'} across {corpusTitle}
									</div>
									{#if res.gloss}
										<div class="text-xs text-[var(--color-ink-soft)] italic mt-0.5">{res.gloss}</div>
									{/if}
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
						<p>Supports English transliteration (e.g., "logos" &rarr; "λόγος")</p>
					</div>
				{/if}
			</div>

		<!-- TAB 3: HIGHLIGHTS -->
		{:else if currentTab === 'highlights'}
			<div class="space-y-4">
				<div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
					<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
						Active Highlights ({highlightedList.length})
					</span>
					{#if highlightedList.length > 0 && highlightStore}
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
				{:else if highlightStore}
					<div class="space-y-3">
						{#each highlightedList as lemma}
							{@const hl = highlightStore.get(lemma)}
							{@const currentIdx = highlightStore.getColorIndex(lemma) ?? 0}
							<div class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3 space-y-2 shadow-2xs">
								<div class="flex items-center justify-between">
									<button
										type="button"
										onclick={() => {
											onSelectToken?.({ w: lemma, l: lemma });
											setTab('lexeme');
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

		<!-- EXTRA CUSTOM TABS -->
		{:else if extraTabPanels}
			{@render extraTabPanels(currentTab)}
		{/if}
	</div>
</FloatingSidePanel>
