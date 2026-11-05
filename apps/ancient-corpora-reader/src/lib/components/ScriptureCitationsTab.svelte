<script lang="ts">
	import {
		fetchScriptureSummaries,
		searchScriptureCitations,
		type ScriptureCitation,
		type ScriptureBookSummary
	} from '../services/dbClient.js';
	import { readerState } from '../stores/readerState.svelte.js';
	import { Loading } from '@polyglot/ui';

	interface Props {
		onNavigateToRef?: (ref: { work_code: string; chapter?: number; section?: number }) => void;
	}

	let { onNavigateToRef }: Props = $props();

	let summaries = $state<ScriptureBookSummary[]>([]);
	let isSummariesLoading = $state<boolean>(false);
	let summariesLoaded = $state<boolean>(false);

	let selectedBookCode = $state<string>('');
	let filterChapter = $state<string>('');
	let filterVerse = $state<string>('');

	let citationResults = $state<ScriptureCitation[]>([]);
	let isCitationsLoading = $state<boolean>(false);
	let citationsLoaded = $state<boolean>(false);

	let totalCitationsCount = $derived(
		summaries.reduce((sum, b) => sum + b.total_count, 0)
	);

	let selectedBookSummary = $derived(
		summaries.find((b) => b.book_code === selectedBookCode)
	);

	const TORAH_CODES = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'];
	const NT_CODES = [
		'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
		'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
		'1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
	];

	// Load summaries whenever corpus changes
	$effect(() => {
		const corpus = readerState.currentCorpus;
		if (corpus) {
			loadSummaries(corpus);
		}
	});

	// Handle in-text citation badge clicks (auto-populate and search)
	$effect(() => {
		const sel = readerState.selectedScriptureCitation;
		if (sel?.bookCode) {
			selectedBookCode = sel.bookCode;
			filterChapter = sel.chapter ? String(sel.chapter) : '';
			filterVerse = sel.verse ? String(sel.verse) : '';
			executeCitationSearch();
			readerState.selectedScriptureCitation = null;
		}
	});

	async function loadSummaries(corpusId: string) {
		isSummariesLoading = true;
		summariesLoaded = false;
		summaries = [];
		selectedBookCode = '';
		filterChapter = '';
		filterVerse = '';
		citationResults = [];
		try {
			summaries = await fetchScriptureSummaries(corpusId as any);
			summariesLoaded = true;
		} catch (err) {
			console.error('Failed to load scripture summaries:', err);
		} finally {
			isSummariesLoading = false;
		}
	}

	async function executeCitationSearch() {
		if (!selectedBookCode) {
			citationResults = [];
			citationsLoaded = false;
			return;
		}
		isCitationsLoading = true;
		try {
			const ch = filterChapter !== '' ? parseInt(filterChapter, 10) : undefined;
			const v = filterVerse !== '' ? parseInt(filterVerse, 10) : undefined;
			citationResults = await searchScriptureCitations(readerState.currentCorpus, {
				bookCode: selectedBookCode,
				chapter: isNaN(ch as number) ? undefined : ch,
				verse: isNaN(v as number) ? undefined : v,
				limit: 250
			});
			citationsLoaded = true;
		} catch (err) {
			console.error('Failed to search scripture citations:', err);
		} finally {
			isCitationsLoading = false;
		}
	}

	function selectBook(code: string) {
		selectedBookCode = code;
		filterChapter = '';
		filterVerse = '';
		executeCitationSearch();
	}

	function resetCitationFilter() {
		selectedBookCode = '';
		filterChapter = '';
		filterVerse = '';
		citationResults = [];
		citationsLoaded = false;
	}

	function navigateToCitation(c: ScriptureCitation) {
		onNavigateToRef?.({
			work_code: c.work_code,
			chapter: c.chapter,
			section: c.section
		});
	}
</script>

<div class="space-y-3">
	{#if isSummariesLoading}
		<div class="py-12 text-center">
			<Loading size="sm" title="Loading scripture citation apparatus..." />
		</div>
	{:else if summaries.length === 0}
		<div class="py-12 text-center text-xs text-[var(--color-ink-soft)] space-y-1">
			<p class="font-semibold text-sm">No Scripture Citations Indexed</p>
			<p>No in-text scripture citations are registered for this corpus edition.</p>
		</div>
	{:else}
		<!-- Header Filter Controls -->
		<div class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-3 space-y-2.5">
			<div class="flex items-center justify-between">
				<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
					Scripture Filter
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
					<label for="scripture-book-select" class="block text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase mb-0.5">Book</label>
					<select
						id="scripture-book-select"
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
						class="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-page)] px-2 py-1.5 text-xs text-[var(--color-ink)] cursor-pointer focus:outline-hidden focus:border-blue-500"
					>
						<option value="">-- All Books ({totalCitationsCount}) --</option>
						{#each summaries as b}
							<option value={b.book_code}>
								{b.book_name} ({b.total_count})
							</option>
						{/each}
					</select>
				</div>

				<!-- Chapter Input (3 cols) -->
				<div class="col-span-3">
					<label for="scripture-chapter-input" class="block text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase mb-0.5">Chapter</label>
					<input
						id="scripture-chapter-input"
						type="number"
						min="1"
						placeholder="All"
						bind:value={filterChapter}
						oninput={() => {
							if (selectedBookCode) executeCitationSearch();
						}}
						class="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-page)] px-2 py-1.5 text-xs text-[var(--color-ink)] text-center focus:outline-hidden focus:border-blue-500"
					/>
				</div>

				<!-- Verse Input (3 cols) -->
				<div class="col-span-3">
					<label for="scripture-verse-input" class="block text-[10px] font-semibold text-[var(--color-ink-soft)] uppercase mb-0.5">Verse</label>
					<input
						id="scripture-verse-input"
						type="number"
						min="1"
						placeholder="All"
						bind:value={filterVerse}
						oninput={() => {
							if (selectedBookCode) executeCitationSearch();
						}}
						class="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-page)] px-2 py-1.5 text-xs text-[var(--color-ink)] text-center focus:outline-hidden focus:border-blue-500"
					/>
				</div>
			</div>
		</div>

		<!-- VIEW A: OVERVIEW GRID (when no book is selected) -->
		{#if !selectedBookCode}
			<div class="space-y-3">
				<!-- Category: Pentateuch (Torah) -->
				{#if summaries.some((b) => TORAH_CODES.includes(b.book_code))}
					{@const torahSummaries = summaries.filter((b) => TORAH_CODES.includes(b.book_code))}
					{@const torahTotal = torahSummaries.reduce((sum, b) => sum + b.total_count, 0)}
					<div class="space-y-1.5">
						<div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
							<span>Torah / Pentateuch</span>
							<span class="text-[10px] font-normal text-amber-700 dark:text-amber-400 font-mono">
								{torahTotal} Citations
							</span>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{#each torahSummaries as b}
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
				{/if}

				<!-- Category: Historical, Poetic & Prophetic Books -->
				{#if summaries.some((b) => !TORAH_CODES.includes(b.book_code) && !NT_CODES.includes(b.book_code))}
					{@const otherSummaries = summaries.filter((b) => !TORAH_CODES.includes(b.book_code) && !NT_CODES.includes(b.book_code))}
					{@const otherTotal = otherSummaries.reduce((sum, b) => sum + b.total_count, 0)}
					<div class="space-y-1.5 pt-2">
						<div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
							<span>Historical, Poetry & Prophets</span>
							<span class="text-[10px] font-normal text-[var(--color-ink-soft)] font-mono">
								{otherTotal} Citations
							</span>
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
							{#each otherSummaries as b}
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

				<!-- Category: New Testament (if any in future corpora) -->
				{#if summaries.some((b) => NT_CODES.includes(b.book_code))}
					{@const ntSummaries = summaries.filter((b) => NT_CODES.includes(b.book_code))}
					{@const ntTotal = ntSummaries.reduce((sum, b) => sum + b.total_count, 0)}
					<div class="space-y-1.5 pt-2">
						<div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
							<span>New Testament</span>
							<span class="text-[10px] font-normal text-blue-700 dark:text-blue-400 font-mono">
								{ntTotal} Citations
							</span>
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
							{#each ntSummaries as b}
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
					<div class="py-8 text-center">
						<Loading size="sm" title="Loading citations..." />
					</div>
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

										<span class="text-blue-600 dark:text-blue-400 font-mono">
											{c.work_code} {c.chapter}.{c.section}
										</span>
									</div>

									<span class="text-[10px] text-[var(--color-ink-soft)] group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0">
										Jump &rarr;
									</span>
								</div>

								{#if c.text_snippet}
									<div class="text-xs leading-relaxed text-[var(--color-ink)] line-clamp-3 font-greek pt-1">
										{c.text_snippet}
									</div>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
