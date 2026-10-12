<script lang="ts">
	import { untrack } from 'svelte';

	let {
		sedraId = '',
		lemma = '',
		word = '',
		root = '',
		calLemma = '',
		autoOpen = false
	}: {
		sedraId?: string;
		lemma?: string;
		word?: string;
		root?: string;
		calLemma?: string;
		autoOpen?: boolean;
	} = $props();

	interface SedraEntryItem {
		syriac?: string;
		western?: string;
		category?: string;
		lexemeId?: number | string;
		root?: string;
		glosses?: string[];
	}

	// Browser in-memory cache for SEDRA responses (persists across word navigations in the session)
	const memoryCache = new Map<string, { entries: SedraEntryItem[]; resolvedLexemeId: number | string | null }>();

	let isOpen = $state(autoOpen);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let entries = $state<SedraEntryItem[]>([]);
	let resolvedLexemeId = $state<number | string | null>(null);
	let hasFetched = $state(false);
	let prevTarget = $state('');

	// Mapping from Syriac Unicode (U+0710-U+072C) to CAL 3-letter initial ASCII
	const SYRIAC_TO_CAL_MAP: Record<string, string> = {
		'\u0710': ')', // Alaph
		'\u0712': 'b', // Beth
		'\u0713': 'g', // Gamal
		'\u0715': 'd', // Dalath
		'\u0717': 'h', // He
		'\u0718': 'w', // Waw
		'\u0719': 'z', // Zayn
		'\u071a': 'x', // Heth
		'\u071b': 't', // Teth
		'\u071d': 'y', // Yudh
		'\u071f': 'k', // Kaph
		'\u0720': 'l', // Lamadh
		'\u0721': 'm', // Mim
		'\u0722': 'n', // Nun
		'\u0723': 's', // Semkath
		'\u0725': '(', // E / Ayin
		'\u0726': 'p', // Pe
		'\u0728': 'c', // Sadhe
		'\u0729': 'q', // Qoph
		'\u072a': 'r', // Resh
		'\u072b': '$', // Shin
		'\u072c': 't'  // Taw
	};

	function getCalInitial3(text: string): string {
		const res: string[] = [];
		for (const ch of text) {
			if (SYRIAC_TO_CAL_MAP[ch]) {
				res.push(SYRIAC_TO_CAL_MAP[ch]);
				if (res.length === 3) break;
			}
		}
		return res.join('');
	}

	// Active Syriac target for lookup
	const targetSyriac = $derived(lemma || word || '');
	const calInitial3 = $derived(getCalInitial3(calLemma || targetSyriac));

	// Outbound Links
	const activeSedraId = $derived(resolvedLexemeId || sedraId);
	const sedraWebUrl = $derived(
		activeSedraId
			? `https://sedra.bethmardutho.org/lexeme/get/${encodeURIComponent(String(activeSedraId))}`
			: targetSyriac
				? `https://sedra.bethmardutho.org/api/word/${encodeURIComponent(targetSyriac)}.json`
				: 'https://sedra.bethmardutho.org/'
	);

	const calWebUrl = $derived(
		calInitial3
			? `https://cal.huc.edu/browseSKEYheaders.php?first3=${encodeURIComponent(calInitial3)}`
			: 'https://cal.huc.edu/searching/fullbrowser.html'
	);

	async function fetchSedraWord(queryWord: string) {
		if (!queryWord) return;

		// 1. Check in-memory session cache first
		if (memoryCache.has(queryWord)) {
			const cached = memoryCache.get(queryWord)!;
			entries = cached.entries;
			resolvedLexemeId = cached.resolvedLexemeId;
			hasFetched = true;
			return;
		}

		// 2. Check localStorage persistent cache
		const storageKey = `sedra_word_v2_${queryWord}`;
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				const parsed = JSON.parse(stored);
				entries = parsed.entries || [];
				resolvedLexemeId = parsed.resolvedLexemeId || null;
				memoryCache.set(queryWord, { entries, resolvedLexemeId });
				hasFetched = true;
				return;
			}
		} catch (e) {
			// Ignore localStorage failures
		}

		loading = true;
		error = null;

		try {
			// Direct client-side fetch per SEDRA IV OpenAPI specification
			const res = await fetch(`https://sedra.bethmardutho.org/api/word/${encodeURIComponent(queryWord)}.json`, {
				headers: { Accept: 'application/json' }
			});

			if (!res.ok) {
				throw new Error(`SEDRA API returned status ${res.status}`);
			}

			const json = await res.json();
			if (Array.isArray(json) && json.length > 0) {
				const parsedEntries: SedraEntryItem[] = [];
				for (const item of json) {
					const englishGlosses: string[] = Array.isArray(item.glosses?.eng)
						? item.glosses.eng
						: Array.isArray(item.glosses?.English)
							? item.glosses.English
							: [];

					// Clean any HTML formatting tags from SEDRA glosses
					const cleanedGlosses = englishGlosses.map((g) => g.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

					parsedEntries.push({
						syriac: item.syriac || item.stem || queryWord,
						western: item.western || '',
						category: item.category || '',
						lexemeId: item.lexeme?.id || item.word?.id,
						root: item.root?.root || item.root || '',
						glosses: cleanedGlosses
					});
				}

				entries = parsedEntries;
				if (parsedEntries[0]?.lexemeId) {
					resolvedLexemeId = parsedEntries[0].lexemeId;
				}

				// Cache in both memory and localStorage
				const cachePayload = { entries: parsedEntries, resolvedLexemeId };
				memoryCache.set(queryWord, cachePayload);
				try {
					localStorage.setItem(storageKey, JSON.stringify(cachePayload));
				} catch (e) {
					// Ignore storage quota limits
				}
			} else {
				entries = [];
			}
			hasFetched = true;
		} catch (err: any) {
			error = err?.message || 'Failed to fetch live SEDRA entry.';
		} finally {
			loading = false;
		}
	}

	// Reset state when active target changes
	function resetState() {
		const cur = targetSyriac;
		if (cur !== prevTarget) {
			prevTarget = cur;
			hasFetched = false;
			entries = [];
			resolvedLexemeId = null;
			error = null;
			if (isOpen && cur) {
				fetchSedraWord(cur);
			}
		}
	}

	$effect(() => {
		const cur = targetSyriac;
		untrack(() => {
			resetState();
		});
	});

	function handleToggle(e: Event) {
		const target = e.currentTarget as HTMLDetailsElement | null;
		if (target) {
			isOpen = target.open;
			if (isOpen && !hasFetched && !loading && targetSyriac) {
				fetchSedraWord(targetSyriac);
			}
		}
	}
</script>

<div class="sedra-container my-3 text-left">
	<details
		class="group border border-rule bg-page rounded-xl shadow-xs overflow-hidden transition-colors"
		bind:open={isOpen}
		ontoggle={handleToggle}
	>
		<summary
			class="list-none [&::-webkit-details-marker]:hidden font-medium py-3 px-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-rule/30 transition-colors"
		>
			<div class="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
				<span
					class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-serif tracking-wider uppercase bg-link/10 text-link border border-link/25"
				>
					SEDRA / CAL
				</span>
				<span class="font-semibold text-sm text-ink">
					Syriac Lexicon (Beth Mardutho)
				</span>
				{#if loading}
					<span class="inline-block w-3.5 h-3.5 border-2 border-link border-t-transparent rounded-full animate-spin ml-1" title="Loading entry..."></span>
				{:else if hasFetched && entries.length > 0}
					<span class="font-syriac text-lg font-bold text-link ml-1" dir="rtl">
						{entries[0].western || entries[0].syriac}
					</span>
					{#if entries[0].category}
						<span class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-rule/50 text-ink-soft border border-rule">
							{entries[0].category}
						</span>
					{/if}
				{/if}
			</div>

			<div class="text-ink-soft shrink-0">
				<svg
					class="w-4 h-4 transition-transform duration-200"
					class:rotate-180={isOpen}
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		</summary>

		<div class="px-4 pb-4 pt-2 border-t border-rule/60 bg-page-soft">
			{#if !isOpen}
				<!-- Empty when collapsed -->
			{:else if loading}
				<div class="py-6 text-center text-sm text-ink-soft flex items-center justify-center gap-3">
					<span class="inline-block w-4 h-4 border-2 border-link border-t-transparent rounded-full animate-spin"></span>
					<span class="font-medium">Fetching SEDRA definition over API...</span>
				</div>
			{:else}
				<!-- Header Bar inside expanded details -->
				<div class="flex items-center justify-between border-b border-rule pb-2 mb-3 pt-1">
					<div class="flex items-center gap-2">
						{#if activeSedraId}
							<span class="text-xs text-ink-soft">SEDRA ID: <strong>{activeSedraId}</strong></span>
						{/if}
					</div>

					<div class="flex items-center gap-2">
						<a
							href={sedraWebUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-semibold text-link hover:underline inline-flex items-center gap-1"
							title="Open live entry on Beth Mardutho SEDRA"
						>
							SEDRA ↗
						</a>
						<a
							href={calWebUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs font-semibold text-link hover:underline inline-flex items-center gap-1 ml-2"
							title="Browse Comprehensive Aramaic Lexicon"
						>
							CAL ↗
						</a>
					</div>
				</div>

				{#if entries.length > 0}
					<div class="space-y-4">
						{#each entries as entry, eIdx}
							<div class="space-y-1.5 {eIdx > 0 ? 'pt-3 border-t border-rule/50' : ''}">
								<div class="flex items-baseline gap-3 flex-wrap">
									<span class="font-syriac text-2xl font-bold text-ink" dir="rtl">
										{entry.western || entry.syriac}
									</span>
									{#if entry.category}
										<span class="text-xs italic text-ink-soft">({entry.category})</span>
									{/if}
								</div>

								{#if entry.glosses && entry.glosses.length > 0}
									<div class="text-sm font-medium text-ink">
										<strong>Glosses:</strong> {entry.glosses.join('; ')}
									</div>
								{/if}

								{#if entry.root || root}
									<div class="text-xs text-ink-soft">
										Root: <span class="font-syriac font-semibold" dir="rtl">{entry.root || root}</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="space-y-2 py-2">
						<div class="flex items-baseline gap-3">
							{#if lemma || word}
								<span class="font-syriac text-2xl font-bold text-ink" dir="rtl">
									{lemma || word}
								</span>
							{/if}
						</div>

						{#if root}
							<div class="text-xs text-ink-soft">
								Root: <span class="font-syriac font-semibold" dir="rtl">{root}</span>
							</div>
						{/if}

						<div class="text-xs text-ink-soft pt-1">
							{error ? error : 'No live SEDRA entry returned.'} Explore citations on
							<a href={calWebUrl} target="_blank" rel="noopener noreferrer" class="text-link underline">
								Comprehensive Aramaic Lexicon (CAL)
							</a>
							or
							<a href={sedraWebUrl} target="_blank" rel="noopener noreferrer" class="text-link underline">
								SEDRA Beth Mardutho
							</a>.
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</details>
</div>
