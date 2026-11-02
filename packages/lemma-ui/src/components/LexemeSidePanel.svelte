<script lang="ts">
	import { FloatingSidePanel, Modal2, Loading } from '@polyglot/ui';
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

	export interface PaginatedConcordance {
		refs: ConcordanceRef[];
		totalCount: number;
		hasMore: boolean;
		nextOffset: number;
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
		displayMode?: 'sidepanel' | 'modal';
		onDisplayModeChange?: (mode: 'sidepanel' | 'modal') => void;

		// Data fetching
		fetchLexiconEntry?: (lemma: string) => Promise<LexiconEntry | null>;
		fetchLemmaStats?: (lemma: string) => Promise<LemmaStat | null>;
		fetchConcordance?: (lemma: string) => Promise<ConcordanceRef[]>;
		fetchConcordancePage?: (lemma: string, offset: number, pageSize: number) => Promise<PaginatedConcordance>;
		concordancePageSize?: number;
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
		displayMode: externalDisplayMode,
		onDisplayModeChange,

		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		fetchConcordancePage,
		concordancePageSize = 50,
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

	// Display mode (dual-mode: sidepanel vs centered floating modal)
	const STORAGE_KEY = 'polyglot_lemma_display_mode';

	function getInitialDisplayMode(): 'sidepanel' | 'modal' {
		if (externalDisplayMode) return externalDisplayMode;
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved === 'modal' || saved === 'sidepanel') {
					return saved;
				}
			} catch (e) {
				// Ignore
			}
		}
		return 'sidepanel';
	}

	let displayMode = $state<'sidepanel' | 'modal'>(getInitialDisplayMode());
	let isModalMaximized = $state<boolean>(false);

	$effect(() => {
		if (externalDisplayMode && externalDisplayMode !== displayMode) {
			displayMode = externalDisplayMode;
		}
	});

	function toggleDisplayMode() {
		displayMode = displayMode === 'sidepanel' ? 'modal' : 'sidepanel';
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				localStorage.setItem(STORAGE_KEY, displayMode);
			} catch (e) {
				console.warn('Failed to save lemma display mode preference', e);
			}
		}
		onDisplayModeChange?.(displayMode);
	}

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
	let concordanceTotalCount = $state<number>(0);
	let concordancePage = $state<number>(1);
	let isPageNavigating = $state<boolean>(false);
	let concordancePageCache = new Map<number, ConcordanceRef[]>();
	let concordanceScrollContainer = $state<HTMLElement | null>(null);
	let stats = $state<LemmaStat | null>(null);
	let isConcordanceLoading = $state<boolean>(false);
	let concordanceLoaded = $state<boolean>(false);
	let concordanceError = $state<string | null>(null);
	let concordanceQueryId = 0;

	let concordanceTotalPages = $derived(
		Math.max(1, Math.ceil(concordanceTotalCount / concordancePageSize))
	);
	let concordanceStartIdx = $derived(
		concordanceTotalCount === 0 ? 0 : (concordancePage - 1) * concordancePageSize + 1
	);
	let concordanceEndIdx = $derived(
		Math.min(concordancePage * concordancePageSize, concordanceTotalCount)
	);

	let paginationPills = $derived.by(() => {
		const total = concordanceTotalPages;
		const current = concordancePage;
		if (total <= 1) return [];

		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		const pages = new Set<number>();
		pages.add(1);
		pages.add(total);

		for (let offset = -2; offset <= 2; offset++) {
			const p = current + offset;
			if (p >= 1 && p <= total) {
				pages.add(p);
			}
		}

		const sorted = Array.from(pages).sort((a, b) => a - b);
		const items: (number | 'ellipsis')[] = [];

		for (let i = 0; i < sorted.length; i++) {
			if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
				items.push('ellipsis');
			}
			items.push(sorted[i]);
		}

		return items;
	});

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
		concordancePageCache.clear();
		concordanceTotalCount = 0;
		concordancePage = 1;
		isPageNavigating = false;
		concordanceLoaded = false;
		concordanceError = null;
		isConcordanceLoading = false;
		concordanceQueryId++;
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

	function prefetchNextPage(page: number, lemma: string, queryId: number) {
		if (!fetchConcordancePage || !lemma) return;
		const nextPage = page + 1;
		if (concordanceTotalCount > 0 && nextPage > concordanceTotalPages) return;
		if (concordancePageCache.has(nextPage)) return;

		const offset = (nextPage - 1) * concordancePageSize;
		fetchConcordancePage(lemma, offset, concordancePageSize)
			.then((pageData) => {
				if (queryId === concordanceQueryId && currentLemma === lemma && pageData?.refs) {
					concordancePageCache.set(nextPage, pageData.refs);
				}
			})
			.catch((err) => {
				// Silent non-blocking prefetch failure
				console.debug('Concordance prefetch failed for page', nextPage, err);
			});
	}

	async function goToConcordancePage(page: number) {
		if (!currentLemma || page < 1 || (concordanceTotalCount > 0 && page > concordanceTotalPages)) return;
		if (page === concordancePage && concordanceLoaded) return;

		const queryId = concordanceQueryId;
		const lemma = currentLemma;

		// 1. In-memory cache hit
		if (concordancePageCache.has(page)) {
			concordance = concordancePageCache.get(page) || [];
			concordancePage = page;
			concordanceScrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
			prefetchNextPage(page, lemma, queryId);
			return;
		}

		if (!fetchConcordancePage) return;

		isPageNavigating = true;
		concordanceError = null;

		try {
			const offset = (page - 1) * concordancePageSize;
			const pageData = await fetchConcordancePage(lemma, offset, concordancePageSize);
			if (queryId !== concordanceQueryId || currentLemma !== lemma) return;

			const refs = pageData.refs || [];
			concordancePageCache.set(page, refs);
			concordance = refs;
			concordanceTotalCount = pageData.totalCount ?? concordanceTotalCount;
			concordancePage = page;
			concordanceScrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
			prefetchNextPage(page, lemma, queryId);
		} catch (err: any) {
			if (queryId !== concordanceQueryId) return;
			console.error(`Error loading concordance page ${page}:`, err);
			concordanceError = err?.message || `Failed to load page ${page}`;
		} finally {
			if (queryId === concordanceQueryId) {
				isPageNavigating = false;
			}
		}
	}

	async function loadConcordance(lemma: string) {
		if (!lemma || (!fetchConcordance && !fetchConcordancePage)) return;
		const queryId = ++concordanceQueryId;
		isConcordanceLoading = true;
		concordanceError = null;
		concordancePageCache.clear();
		concordancePage = 1;

		try {
			if (fetchConcordancePage) {
				const [pageData, s] = await Promise.all([
					fetchConcordancePage(lemma, 0, concordancePageSize),
					stats ? Promise.resolve(stats) : (fetchLemmaStats ? fetchLemmaStats(lemma) : Promise.resolve(null))
				]);
				if (queryId !== concordanceQueryId || currentLemma !== lemma) return;
				const refs = pageData.refs || [];
				concordancePageCache.set(1, refs);
				concordance = refs;
				concordanceTotalCount = pageData.totalCount ?? (refs.length || 0);
				concordancePage = 1;
				if (!stats) stats = s;
				concordanceLoaded = true;
				prefetchNextPage(1, lemma, queryId);
			} else if (fetchConcordance) {
				const [c, s] = await Promise.all([
					fetchConcordance(lemma),
					stats ? Promise.resolve(stats) : (fetchLemmaStats ? fetchLemmaStats(lemma) : Promise.resolve(null))
				]);
				if (queryId !== concordanceQueryId || currentLemma !== lemma) return;
				const allRefs = c || [];
				concordanceTotalCount = allRefs.length;
				for (let i = 0; i < allRefs.length; i += concordancePageSize) {
					const p = Math.floor(i / concordancePageSize) + 1;
					concordancePageCache.set(p, allRefs.slice(i, i + concordancePageSize));
				}
				concordance = concordancePageCache.get(1) || [];
				concordancePage = 1;
				if (!stats) stats = s;
				concordanceLoaded = true;
			}
		} catch (err: any) {
			if (queryId !== concordanceQueryId || currentLemma !== lemma) return;
			console.error('Error loading concordance:', err);
			concordanceError = err?.message || 'Failed to load concordance';
		} finally {
			if (queryId === concordanceQueryId && currentLemma === lemma) {
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

{#snippet panelContent()}
	<!-- Panel Top Navigation: Tabs and Action Buttons (Pop-out, Maximize, Close) -->
	<div class="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-2 shrink-0">
		<!-- Tabs Bar -->
		<div class="flex items-center gap-1 text-xs font-semibold overflow-x-auto pr-2">
			<button
				type="button"
				onclick={() => setTab('lexeme')}
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer shrink-0 {currentTab === 'lexeme'
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
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer shrink-0 {currentTab === 'search'
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
					class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer shrink-0 {currentTab === extraTab.id
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
				class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer shrink-0 {currentTab === 'highlights'
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

		<!-- Action Buttons: Popout/Dock Toggle, Maximize/Restore, Close -->
		<div class="flex items-center gap-1 shrink-0">
			<!-- Dual Mode Toggle Button -->
			<button
				type="button"
				onclick={toggleDisplayMode}
				class="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)] cursor-pointer transition-colors"
				aria-label={displayMode === 'sidepanel' ? 'Open as floating modal' : 'Dock to side panel'}
				title={displayMode === 'sidepanel' ? 'Open as floating modal' : 'Dock to side panel'}
			>
				{#if displayMode === 'sidepanel'}
					<!-- Pop-out to modal icon -->
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
				{:else}
					<!-- Dock to side panel icon -->
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
						<line x1="15" y1="3" x2="15" y2="21" stroke-width="2" />
					</svg>
				{/if}
			</button>

			<!-- Fullscreen Maximize / Restore Toggle (Modal Mode only) -->
			{#if displayMode === 'modal'}
				<button
					type="button"
					onclick={() => (isModalMaximized = !isModalMaximized)}
					class="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)] cursor-pointer transition-colors"
					aria-label={isModalMaximized ? 'Restore window size' : 'Expand to fullscreen'}
					title={isModalMaximized ? 'Restore window size' : 'Expand to fullscreen'}
				>
					{#if isModalMaximized}
						<!-- Inward / Restore arrows -->
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="4 14 10 14 10 20" />
							<polyline points="20 10 14 10 14 4" />
							<line x1="14" y1="10" x2="21" y2="3" />
							<line x1="10" y1="14" x2="3" y2="21" />
						</svg>
					{:else}
						<!-- Outward / Maximize arrows -->
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="15 3 21 3 21 9" />
							<polyline points="9 21 3 21 3 15" />
							<line x1="21" y1="3" x2="14" y2="10" />
							<line x1="3" y1="21" x2="10" y2="14" />
						</svg>
					{/if}
				</button>
			{/if}

			<!-- Close Button -->
			<button
				type="button"
				onclick={onClose}
				class="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)] cursor-pointer text-lg leading-none transition-colors"
				aria-label={displayMode === 'sidepanel' ? 'Close side panel' : 'Close modal'}
				title="Close (Esc)"
			>
				&times;
			</button>
		</div>
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
						class="w-full flex items-center justify-between px-4 py-3.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 cursor-pointer text-left select-none transition-colors"
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
						class="w-full flex items-center justify-between px-4 py-3.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 cursor-pointer text-left select-none transition-colors"
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
								{#snippet paginationPillsNav(pos: 'top' | 'bottom')}
									{#if concordanceTotalPages > 1}
										<div
											class="flex items-center justify-between gap-1 py-1.5 px-2 {pos === 'top' ? 'mb-2' : 'mt-2'} rounded-lg bg-[var(--color-rule)]/20 border border-[var(--color-rule)]/50 text-[11px]"
											aria-label={`Concordance navigation (${pos})`}
										>
											<button
												type="button"
												disabled={concordancePage <= 1 || isPageNavigating}
												onclick={() => goToConcordancePage(concordancePage - 1)}
												class="px-2 py-0.5 rounded-md border border-[var(--color-rule)] bg-[var(--color-card-bg)] text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors font-medium select-none"
												aria-label="Previous page"
											>
												&larr; Prev
											</button>

											<div class="flex items-center gap-1 overflow-x-auto py-0.5 {displayMode === 'modal' ? 'max-w-md' : 'max-w-[220px]'}">
												{#each paginationPills as item}
													{#if item === 'ellipsis'}
														<span class="px-0.5 text-[11px] text-[var(--color-ink-soft)] select-none">&hellip;</span>
													{:else}
														<button
															type="button"
															disabled={isPageNavigating}
															onclick={() => goToConcordancePage(item)}
															class="min-w-[22px] h-[22px] px-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center select-none {item === concordancePage
																? 'bg-blue-600 text-white shadow-2xs'
																: 'bg-[var(--color-card-bg)] border border-[var(--color-rule)] text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40'}"
															aria-current={item === concordancePage ? 'page' : undefined}
															aria-label={`Page ${item}`}
														>
															{item}
														</button>
													{/if}
												{/each}
											</div>

											<button
												type="button"
												disabled={concordancePage >= concordanceTotalPages || isPageNavigating}
												onclick={() => goToConcordancePage(concordancePage + 1)}
												class="px-2 py-0.5 rounded-md border border-[var(--color-rule)] bg-[var(--color-card-bg)] text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors font-medium select-none"
												aria-label="Next page"
											>
												Next &rarr;
											</button>
										</div>
									{/if}
								{/snippet}

								<div class="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)]">
									<span class="text-[11px] text-[var(--color-ink-soft)] font-medium">
										{#if fetchConcordancePage && concordanceTotalCount > 0}
											Showing {concordanceStartIdx}–{concordanceEndIdx} of {concordanceTotalCount} {concordanceTotalCount === 1 ? 'occurrence' : 'occurrences'}
										{:else}
											{filteredConcordance.length} {filteredConcordance.length === 1 ? 'occurrence' : 'occurrences'}
										{/if}
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

								{@render paginationPillsNav('top')}

								<div
									bind:this={concordanceScrollContainer}
									class="space-y-1.5 {displayMode === 'modal' ? (isModalMaximized ? 'max-h-[58vh]' : 'max-h-[44vh]') : 'max-h-72'} overflow-y-auto pr-1 relative"
								>
									{#if isPageNavigating}
										<div class="absolute inset-0 bg-[var(--color-card-bg)]/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-lg">
											<Loading inline size="sm" />
										</div>
									{/if}

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

								{@render paginationPillsNav('bottom')}
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
{/snippet}

{#if isOpen}
	{#if displayMode === 'modal'}
		<Modal2
			bind:showModal={isOpen}
			onclose={onClose}
			bind:max={isModalMaximized}
			showMaximize={false}
			showClose={false}
			showFooter={false}
			maxWidth="max-w-4xl lg:max-w-5xl"
		>
			<div class="flex flex-col h-full min-h-0 bg-[var(--color-page)] text-[var(--color-ink)]">
				{@render panelContent()}
			</div>
		</Modal2>
	{:else}
		<FloatingSidePanel
			{isOpen}
			{onClose}
			{top}
			{width}
			noPadding={true}
			showDefaultCloseButton={false}
			ariaLabel={ariaLabel || `${corpusTitle} Reference and Lexicon Panel`}
		>
			<div class="flex flex-col h-full min-h-0">
				{@render panelContent()}
			</div>
		</FloatingSidePanel>
	{/if}
{/if}
