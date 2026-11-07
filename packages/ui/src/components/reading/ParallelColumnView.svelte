<script lang="ts">
	import { untrack, type Snippet } from 'svelte';

	export interface TextToken {
		w: string;
		l?: string;
		p?: string;
		m?: string;
		type?: string;
		book_code?: string;
		bible_chapter?: number;
		bible_verse?: number;
		display?: string;
		book_name?: string;
		[key: string]: any;
	}

	export interface TextUnitData {
		id?: number;
		corpus_id?: string;
		version_id?: string;
		work_code?: string;
		chapter?: number;
		book?: number;
		section?: number;
		section_label?: string;
		section_num?: number;
		niese_section?: string | number;
		display_citation?: string;
		milestone_ref?: string;
		mangey_ref?: string;
		is_supplement?: number;
		text_content?: string;
		tokens?: TextToken[];
		[key: string]: any;
	}

	export interface TextVersionData {
		versionId: string;
		language: string;
		label: string;
		shortLabel?: string;
		direction?: 'ltr' | 'rtl';
		fontClass?: string;
		textUnits: TextUnitData[];
	}

	export interface Props {
		textVersions?: TextVersionData[];
		visibleLanguages?: Set<string> | any;
		viewMode?: 'parallel' | 'stacked' | 'single' | 'greek' | 'english' | 'latin' | string;
		targetSection?: number | string | null;
		gridBreakpoint?: 'md' | 'lg' | 'xl';
		highlightStore?: any;
		isLoading?: boolean;
		loadingMessage?: string;

		// Section identification
		getSectionKey?: (u: TextUnitData) => number | string;
		getMilestoneRef?: (u: TextUnitData) => string | undefined;
		getCitation?: (secKey: number | string, unitsByVersion: Record<string, TextUnitData>) => string;
		rowId?: (secKey: number | string, milestone?: string) => string;

		// Actions
		onWordClick?: (token: TextToken, citation: string, version: TextVersionData) => void;
		onBookmarkToggle?: (secKey: string, snippet: string) => void;
		onCitationClick?: (secKey: number | string, unitsByVersion: Record<string, TextUnitData>) => void;
		onBiblicalCitationClick?: (bookCode: string, chapter: number, verse: number, display: string, bookName?: string) => void;
		showBookmarkButton?: boolean;
		showCiteButton?: boolean;

		// Custom snippets
		sectionBadge?: Snippet<[{ secKey: number | string; units: Record<string, TextUnitData>; milestone?: string }]>;
		extraSectionTools?: Snippet<[{ secKey: number | string; units: Record<string, TextUnitData> }]>;

		// Backward-compatibility props for legacy callers:
		greek?: TextUnitData[];
		english?: TextUnitData[];
		latin?: TextUnitData[];
		showGreek?: boolean;
		showEnglish?: boolean;
		showLatin?: boolean;
		greekHeaderTitle?: string;
		greekHeaderSubtitle?: string;
		latinHeaderTitle?: string;
		latinHeaderSubtitle?: string;
		englishHeaderTitle?: string;
		englishHeaderSubtitle?: string;
		customGreekColumn?: Snippet<[{ secKey: number | string; unit?: TextUnitData; citation: string }]>;
		customEnglishColumn?: Snippet<[{ secKey: number | string; unit?: TextUnitData; citation: string }]>;
		customLatinColumn?: Snippet<[{ secKey: number | string; unit?: TextUnitData; citation: string }]>;
	}

	let {
		textVersions = [],
		visibleLanguages,
		viewMode = 'parallel',
		targetSection,
		gridBreakpoint = 'lg',
		highlightStore,
		isLoading = false,
		loadingMessage = 'Loading text...',

		getSectionKey = (u) => (u.section_num !== undefined ? u.section_num : (u.section ?? 0)),
		getMilestoneRef = (u) => u.milestone_ref || (u.niese_section !== undefined ? String(u.niese_section) : undefined),
		getCitation,
		rowId,

		onWordClick,
		onBookmarkToggle,
		onCitationClick,
		onBiblicalCitationClick,
		showBookmarkButton = false,
		showCiteButton = false,

		sectionBadge,
		extraSectionTools,

		// Backward-compatibility
		greek,
		english,
		latin,
		showGreek,
		showEnglish,
		showLatin,
		greekHeaderTitle,
		latinHeaderTitle,
		englishHeaderTitle,
		customGreekColumn,
		customEnglishColumn,
		customLatinColumn
	}: Props = $props();

	// Resolve versions: use textVersions or synthesize from legacy props
	let resolvedTextVersions = $derived.by(() => {
		if (textVersions && textVersions.length > 0) {
			return textVersions;
		}
		const legacy: TextVersionData[] = [];
		if (greek && greek.length > 0) {
			legacy.push({
				versionId: 'grc',
				language: 'grc',
				label: greekHeaderTitle || 'Greek Critical Text',
				shortLabel: 'Greek',
				direction: 'ltr',
				fontClass: 'font-greek greek',
				textUnits: greek
			});
		}
		if (latin && latin.length > 0) {
			legacy.push({
				versionId: 'lat',
				language: 'lat',
				label: latinHeaderTitle || 'Latin Witness',
				shortLabel: 'Latin',
				direction: 'ltr',
				fontClass: 'font-latin latin',
				textUnits: latin
			});
		}
		if (english && english.length > 0) {
			legacy.push({
				versionId: 'eng',
				language: 'eng',
				label: englishHeaderTitle || 'English Translation',
				shortLabel: 'English',
				direction: 'ltr',
				fontClass: 'font-serif',
				textUnits: english
			});
		}
		return legacy;
	});

	// Filter active versions based on visibleLanguages or legacy viewMode flags
	let activeVersions = $derived.by(() => {
		if (!visibleLanguages) {
			if (showGreek !== undefined || showEnglish !== undefined || showLatin !== undefined) {
				return resolvedTextVersions.filter((v) => {
					if (v.language === 'grc' && showGreek === false) return false;
					if (v.language === 'eng' && showEnglish === false) return false;
					if (v.language === 'lat' && showLatin === false) return false;
					return true;
				});
			}
			return resolvedTextVersions;
		}
		return resolvedTextVersions.filter((v) => {
			if (typeof visibleLanguages.has === 'function') {
				return visibleLanguages.has(v.language) || visibleLanguages.has(v.versionId);
			}
			if (Array.isArray(visibleLanguages)) {
				return visibleLanguages.includes(v.language) || visibleLanguages.includes(v.versionId);
			}
			return true;
		});
	});

	// Map of versionId -> Map(secKey -> TextUnitData)
	let unitsByVersionAndSec = $derived.by(() => {
		const map = new Map<string, Map<number | string, TextUnitData>>();
		for (const ver of resolvedTextVersions) {
			const secMap = new Map<number | string, TextUnitData>();
			for (const u of ver.textUnits || []) {
				const k = getSectionKey(u);
				if (k !== undefined && k !== null) {
					secMap.set(k, u);
				}
			}
			map.set(ver.versionId, secMap);
		}
		return map;
	});

	// Deduplicated ordered list of all section keys across all versions
	let sectionKeys = $derived.by(() => {
		const keys = new Set<number | string>();
		for (const ver of resolvedTextVersions) {
			for (const u of ver.textUnits || []) {
				const k = getSectionKey(u);
				if (k !== undefined && k !== null) {
					keys.add(k);
				}
			}
		}
		return Array.from(keys).sort((a, b) => {
			const numA = Number(a);
			const numB = Number(b);
			if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
			return String(a).localeCompare(String(b));
		});
	});

	let isStacked = $derived(viewMode === 'stacked');

	let gridColsClass = $derived.by(() => {
		if (isStacked || activeVersions.length <= 1) return 'grid-cols-1';
		const count = activeVersions.length;
		if (gridBreakpoint === 'md') {
			if (count >= 3) return 'grid-cols-1 md:grid-cols-3';
			if (count === 2) return 'grid-cols-1 md:grid-cols-2';
		} else {
			if (count >= 3) return 'grid-cols-1 lg:grid-cols-3';
			if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
		}
		return 'grid-cols-1';
	});

	// --- Progressive Batch Rendering Engine ---
	const INITIAL_BATCH_SIZE = 30;
	const BATCH_STEP_SIZE = 25;

	let renderedCount = $state<number>(INITIAL_BATCH_SIZE);
	let renderedKeys = $derived(sectionKeys.slice(0, renderedCount));
	let isFullyRendered = $derived(renderedCount >= sectionKeys.length);

	let idleHandle: any = null;
	let sentinelEl = $state<HTMLElement | null>(null);

	function scheduleNextBatch() {
		if (typeof window === 'undefined') return;

		const run = () => {
			if (renderedCount >= sectionKeys.length) return;
			renderedCount = Math.min(sectionKeys.length, renderedCount + BATCH_STEP_SIZE);
			if (renderedCount < sectionKeys.length) {
				scheduleNextBatch();
			}
		};

		if ('requestIdleCallback' in window) {
			idleHandle = (window as any).requestIdleCallback(run, { timeout: 150 });
		} else {
			idleHandle = setTimeout(run, 50);
		}
	}

	$effect(() => {
		const keys = sectionKeys;
		const target = targetSection;

		if (keys.length > 0) {
			untrack(() => {
				if (target) {
					const idx = keys.findIndex((k) => String(k) === String(target));
					renderedCount = idx >= 0
						? Math.min(keys.length, Math.max(INITIAL_BATCH_SIZE, idx + 15))
						: INITIAL_BATCH_SIZE;
				} else {
					renderedCount = Math.min(keys.length, INITIAL_BATCH_SIZE);
				}
				if (renderedCount < keys.length) {
					scheduleNextBatch();
				}
			});
		}

		return () => {
			if (idleHandle && typeof window !== 'undefined') {
				if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(idleHandle);
				else clearTimeout(idleHandle);
			}
		};
	});

	// Fast-scroll Sentinel IntersectionObserver
	$effect(() => {
		if (!sentinelEl || typeof window === 'undefined') return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					untrack(() => {
						if (renderedCount < sectionKeys.length) {
							renderedCount = Math.min(sectionKeys.length, renderedCount + BATCH_STEP_SIZE * 2);
							scheduleNextBatch();
						}
					});
				}
			},
			{ rootMargin: '800px' }
		);
		observer.observe(sentinelEl);
		return () => observer.disconnect();
	});

	function getUnitsForSection(secKey: number | string): Record<string, TextUnitData> {
		const res: Record<string, TextUnitData> = {};
		for (const ver of resolvedTextVersions) {
			const u = unitsByVersionAndSec.get(ver.versionId)?.get(secKey);
			if (u) {
				res[ver.versionId] = u;
			}
		}
		return res;
	}

	function resolveCitationForUnits(secKey: number | string, units: Record<string, TextUnitData>): string {
		if (getCitation) return getCitation(secKey, units);
		for (const u of Object.values(units)) {
			if (u.display_citation) return u.display_citation;
		}
		return `Section ${secKey}`;
	}

	function handleColumnClick(
		e: MouseEvent,
		unit: TextUnitData | undefined,
		ver: TextVersionData,
		citation: string
	) {
		if (!unit?.tokens || unit.tokens.length === 0) return;
		const target = (e.target as HTMLElement).closest('[data-tok-idx]');
		if (!target) return;

		const idxStr = target.getAttribute('data-tok-idx');
		if (idxStr === null) return;
		const idx = Number(idxStr);
		const tok = unit.tokens[idx];
		if (!tok) return;

		if (tok.type === 'citation') {
			onBiblicalCitationClick?.(
				tok.book_code || '',
				tok.bible_chapter || 0,
				tok.bible_verse || 0,
				tok.display || '',
				tok.book_name
			);
		} else if (!PUNCT_REGEX.test(tok.w) && tok.type !== 'apparatus') {
			onWordClick?.(tok, citation, ver);
		}
	}

	function shouldOmitSpaceAfter(tokens: any[], idx: number): boolean {
		const next = tokens[idx + 1];
		return Boolean(next && PUNCT_REGEX.test(next.w));
	}

	const PUNCT_REGEX = /^[,.;:·)—\]]+$/;
</script>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
	{#if isLoading}
		<div class="py-16 flex flex-col items-center justify-center text-center">
			<span class="inline-block w-9 h-9 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></span>
			<div class="text-sm font-semibold text-[var(--color-ink,#0f172a)]">{loadingMessage}</div>
			<div class="text-xs text-[var(--color-ink-soft,#64748b)] mt-1">Fetching section records and morphological data...</div>
		</div>
	{:else}
		<!-- Column Headers (desktop) -->
	<!-- Tailwind scan anchor: md:grid lg:grid md:grid-cols-2 lg:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 -->
	{#if !isStacked}
		<div class="column-headers hidden {gridBreakpoint === 'md' ? 'md:grid' : 'lg:grid'} {gridColsClass} gap-6 sm:gap-8 border-b border-[var(--color-rule)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
			{#each activeVersions as ver (ver.versionId)}
				<div class="flex items-center justify-between">
					<span>{ver.label}</span>
					{#if ver.shortLabel && ver.shortLabel !== ver.label}
						<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">{ver.shortLabel}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Section Rows -->
	<div class="divide-y divide-[var(--color-rule)]">
		{#each renderedKeys as secKey (secKey)}
			{@const unitsByVer = getUnitsForSection(secKey)}
			{@const primaryUnit = Object.values(unitsByVer)[0]}
			{@const milestone = primaryUnit ? getMilestoneRef(primaryUnit) : undefined}
			{@const citation = resolveCitationForUnits(secKey, unitsByVer)}
			{@const primaryId = rowId ? rowId(secKey, milestone) : `section-${secKey}`}

			<div
				id={primaryId}
				class="section-row group/sec {isStacked ? 'flex flex-col gap-4' : `grid ${gridColsClass} gap-6 sm:gap-8`} py-5 hover:bg-[var(--color-card-bg)]/60 rounded-xl transition-colors scroll-mt-20"
				data-section={secKey}
				data-milestone={milestone}
			>
				{#if primaryId !== `section-${secKey}`}
					<span id="section-{secKey}" class="sr-only"></span>
				{/if}
				{#if milestone && primaryId !== `milestone-${milestone}`}
					<span id="milestone-{milestone}" class="sr-only"></span>
				{/if}

				{#each activeVersions as ver, verIdx (ver.versionId)}
					{@const unit = unitsByVer[ver.versionId]}
					{@const isPrimary = verIdx === 0}

					<!-- Legacy custom column snippets compatibility -->
					{#if ver.language === 'grc' && customGreekColumn}
						{@render customGreekColumn({ secKey, unit, citation })}
					{:else if ver.language === 'lat' && customLatinColumn}
						{@render customLatinColumn({ secKey, unit, citation })}
					{:else if ver.language === 'eng' && customEnglishColumn}
						{@render customEnglishColumn({ secKey, unit, citation })}
					{:else}
						<div
							class="column-version text-base leading-relaxed text-[var(--color-ink)] {ver.fontClass || ''}"
							dir={ver.direction || 'ltr'}
							onclick={(e) => handleColumnClick(e, unit, ver, citation)}
						>
							<!-- Section Badge & Actions in primary leading column -->
							{#if isPrimary}
								{#if sectionBadge}
									{@render sectionBadge({ secKey, units: unitsByVer, milestone })}
								{:else}
									<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
										<span
											class="section-badge text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5"
											title="Section {milestone || secKey}"
										>
											§ {milestone || secKey}
										</span>

										{#if showBookmarkButton}
											<button
												type="button"
												class="sec-action-btn bm-star-btn text-xs text-[var(--color-ink-soft)] hover:text-amber-500 cursor-pointer"
												onclick={() => onBookmarkToggle?.(String(milestone || secKey), unit?.text_content || '')}
												title="Bookmark section"
											>
												☆
											</button>
										{/if}

										{#if showCiteButton}
											<button
												type="button"
												class="sec-action-btn cite-trigger-btn text-xs font-medium text-[var(--color-ink-soft)] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline"
												onclick={() => onCitationClick?.(secKey, unitsByVer)}
												title="Cite section"
											>
												Cite
											</button>
										{/if}

										{#if extraSectionTools}
											{@render extraSectionTools({ secKey, units: unitsByVer })}
										{/if}
									</div>
								{/if}
							{/if}

							<!-- Token Word Rendering -->
							{#if unit?.tokens && unit.tokens.length > 0}
								{#each unit.tokens as tok, idx (idx)}
									{#if tok.type === 'citation'}
										<button
											type="button"
											data-tok-idx={idx}
											class="inline-flex items-center gap-1 text-xs font-sans font-semibold rounded-md px-1.5 py-0.5 mx-1 bg-amber-100/80 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 cursor-pointer select-none align-middle transition-colors shadow-xs"
											title="Click to explore citation of {tok.book_name || tok.display}"
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="size-3 text-amber-700 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
												<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
											</svg>
											<span>{tok.display}</span>
										</button>
									{:else if tok.type === 'apparatus'}
										<span
											class="text-xs text-slate-400 dark:text-slate-500 italic font-sans select-none"
											title="Textual apparatus note"
										>
											{tok.w}
										</span>
									{:else if PUNCT_REGEX.test(tok.w)}
										<span class="select-none">{tok.w}</span>
									{:else}
										{@const hl = tok.l && highlightStore ? highlightStore.get(tok.l) : undefined}
										<button
											type="button"
											data-tok-idx={idx}
											class="token-word inline cursor-pointer transition-colors hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-hidden {hl ? 'hl-token' : ''}"
											style={hl ? `--hl-bg: ${hl.bgLight}; --hl-text: ${hl.textLight}; --hl-border: ${hl.borderLight}; --hl-bg-dark: ${hl.bgDark}; --hl-text-dark: ${hl.textDark}; --hl-border-dark: ${hl.borderDark};` : undefined}
											title={tok.l ? `${tok.l}${tok.p || tok.m ? ` (${tok.p ?? ''} ${tok.m ?? ''})` : ''}` : undefined}
										>{tok.w}</button>
									{/if}{#if !shouldOmitSpaceAfter(unit.tokens, idx)}{' '}{/if}
								{/each}
							{:else if unit?.text_content}
								<span>{unit.text_content}</span>
							{:else}
								<span class="italic text-[var(--color-ink-soft)] text-sm">—</span>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		{/each}
	</div>

		<!-- Progressive Sentinel -->
		{#if !isFullyRendered}
			{@const percent = sectionKeys.length > 0 ? Math.round((renderedCount / sectionKeys.length) * 100) : 0}
			<div
				bind:this={sentinelEl}
				class="py-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 text-xs text-[var(--color-ink-soft,#64748b)] select-none border-t border-[var(--color-rule,#e2e8f0)] mt-4 bg-[var(--color-page-soft,#f1f5f9)]/50 rounded-lg p-3"
				aria-live="polite"
			>
				<span class="inline-block w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"></span>
				<span class="font-medium">Loading and rendering sections...</span>
				<span class="text-[11px] opacity-80">(Rendered {renderedCount} of {sectionKeys.length} sections &middot; {percent}%)</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.section-row {
		content-visibility: auto;
		contain-intrinsic-size: auto 120px;
	}
	.column-version {
  /* Scale font-size and line-height proportionally based on the CSS variable */
  font-size: calc(1rem * var(--reading-font-scale, 1));
/*  line-height: calc(1.65 * var(--reading-font-scale, 1));*/
}

/* Optional per-language base proportion adjustments if needed */
:global(.column-version.font-hebrew) {
  font-size: calc(1.2rem * var(--reading-font-scale, 1));
}

:global(.column-version.font-syriac) {
  font-size: calc(1.25rem * var(--reading-font-scale, 1));
}

button.token-word.hl-token{

	background-color: var(--hl-bg,white);
}
</style>
