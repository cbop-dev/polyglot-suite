<script lang="ts">
	import type { Snippet } from 'svelte';

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
		section?: number;
		section_num?: number;
		niese_section?: string | number;
		display_citation?: string;
		text_content?: string;
		tokens?: TextToken[];
		mangey_ref?: string;
		is_supplement?: number;
		[key: string]: any;
	}

	export interface Props {
		greek?: TextUnitData[];
		english?: TextUnitData[];
		latin?: TextUnitData[];
		viewMode?: 'parallel' | 'stacked' | 'greek' | 'english' | string;
		showGreek?: boolean;
		showEnglish?: boolean;
		showLatin?: boolean;
		gridBreakpoint?: 'md' | 'lg';
		highlightStore?: any;

		// Section identification
		getSectionKey?: (u: TextUnitData) => number | string;
		getNieseSection?: (u: TextUnitData) => string | undefined;
		getCitation?: (secKey: number | string, gUnit?: TextUnitData, eUnit?: TextUnitData, lUnit?: TextUnitData) => string;
		rowId?: (secKey: number | string, nieseSec?: string) => string;

		// Header labels
		greekHeaderTitle?: string;
		greekHeaderSubtitle?: string;
		latinHeaderTitle?: string;
		latinHeaderSubtitle?: string;
		englishHeaderTitle?: string;
		englishHeaderSubtitle?: string;

		// Actions
		onWordClick?: (token: TextToken, citation: string, lang: 'greek' | 'latin') => void;
		onBookmarkToggle?: (secStr: string, snippet: string) => void;
		onCitationClick?: (secKey: number | string, gUnit?: TextUnitData, eUnit?: TextUnitData, lUnit?: TextUnitData) => void;
		onBiblicalCitationClick?: (bookCode: string, chapter: number, verse: number, display: string, bookName?: string) => void;
		showBookmarkButton?: boolean;
		showCiteButton?: boolean;

		// Custom snippets
		sectionBadge?: Snippet<[{ secKey: number | string; nieseSec?: string; gUnit?: TextUnitData; eUnit?: TextUnitData; lUnit?: TextUnitData }]>;
		extraSectionTools?: Snippet<[{ secKey: number | string; nieseSec?: string; gUnit?: TextUnitData; eUnit?: TextUnitData; lUnit?: TextUnitData }]>;
		customGreekColumn?: Snippet<[{ secKey: number | string; unit?: TextUnitData; citation: string }]>;
		customEnglishColumn?: Snippet<[{ secKey: number | string; unit?: TextUnitData; citation: string }]>;
		customLatinColumn?: Snippet<[{ secKey: number | string; unit?: TextUnitData; citation: string }]>;
	}

	let {
		greek = [],
		english = [],
		latin = [],
		viewMode = 'parallel',
		showGreek = true,
		showEnglish = true,
		showLatin = false,
		gridBreakpoint = 'lg',
		highlightStore,

		getSectionKey = (u) => (u.section_num !== undefined ? u.section_num : (u.section ?? 0)),
		getNieseSection = (u) => (u.niese_section !== undefined ? String(u.niese_section) : undefined),
		getCitation,
		rowId,

		greekHeaderTitle,
		greekHeaderSubtitle,
		latinHeaderTitle,
		latinHeaderSubtitle,
		englishHeaderTitle,
		englishHeaderSubtitle,

		onWordClick,
		onBookmarkToggle,
		onCitationClick,
		onBiblicalCitationClick,
		showBookmarkButton = false,
		showCiteButton = false,

		sectionBadge,
		extraSectionTools,
		customGreekColumn,
		customEnglishColumn,
		customLatinColumn
	}: Props = $props();

	// Deduplicated ordered list of section keys
	let sectionKeys = $derived.by(() => {
		const keys = new Set<number | string>();
		greek.forEach((u) => {
			const k = getSectionKey(u);
			if (k !== undefined && k !== null) keys.add(k);
		});
		english.forEach((u) => {
			const k = getSectionKey(u);
			if (k !== undefined && k !== null) keys.add(k);
		});
		latin.forEach((u) => {
			const k = getSectionKey(u);
			if (k !== undefined && k !== null) keys.add(k);
		});
		return Array.from(keys).sort((a, b) => {
			const numA = Number(a);
			const numB = Number(b);
			if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
			return String(a).localeCompare(String(b));
		});
	});

	let greekBySec = $derived(new Map(greek.map((u) => [getSectionKey(u), u])));
	let engBySec = $derived(new Map(english.map((u) => [getSectionKey(u), u])));
	let latBySec = $derived(new Map(latin.map((u) => [getSectionKey(u), u])));

	let isStacked = $derived(viewMode === 'stacked');
	let hasLatin = $derived(latin.length > 0 && showLatin);
	let hasGreek = $derived(showGreek && viewMode !== 'english');
	let hasEng = $derived(showEnglish && viewMode !== 'greek');

	let visibleColCount = $derived.by(() => {
		let count = 0;
		if (hasGreek) count++;
		if (hasLatin) count++;
		if (hasEng) count++;
		return count;
	});

	let gridColsClass = $derived.by(() => {
		if (isStacked) return 'grid-cols-1';
		if (gridBreakpoint === 'md') {
			if (visibleColCount === 3) return 'grid-cols-1 md:grid-cols-3';
			if (visibleColCount === 2) return 'grid-cols-1 md:grid-cols-2';
		} else {
			if (visibleColCount === 3) return 'grid-cols-1 lg:grid-cols-3';
			if (visibleColCount === 2) return 'grid-cols-1 lg:grid-cols-2';
		}
		return 'grid-cols-1';
	});

	function resolveCitation(secKey: number | string, gUnit?: TextUnitData, eUnit?: TextUnitData, lUnit?: TextUnitData): string {
		if (getCitation) return getCitation(secKey, gUnit, eUnit, lUnit);
		return gUnit?.display_citation || eUnit?.display_citation || lUnit?.display_citation || `Section ${secKey}`;
	}

	const PUNCT_REGEX = /^[,.;:·)—\]]+$/;
</script>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
	<!-- Column Headers (desktop) -->
	<!-- Tailwind scan anchor: md:grid lg:grid md:grid-cols-2 lg:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 -->
	{#if !isStacked}
		<div class="column-headers hidden {gridBreakpoint === 'md' ? 'md:grid' : 'lg:grid'} {gridColsClass} gap-6 sm:gap-8 border-b border-[var(--color-rule)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
			{#if hasGreek}
				<div class="flex items-center justify-between">
					<span>{greekHeaderTitle || 'Greek Critical Text'}</span>
					{#if greekHeaderSubtitle}
						<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">{greekHeaderSubtitle}</span>
					{/if}
				</div>
			{/if}
			{#if hasLatin}
				<div class="flex items-center justify-between">
					<span>{latinHeaderTitle || 'Latin Text'}</span>
					{#if latinHeaderSubtitle}
						<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">{latinHeaderSubtitle}</span>
					{/if}
				</div>
			{/if}
			{#if hasEng}
				<div class="flex items-center justify-between">
					<span>{englishHeaderTitle || 'English Translation'}</span>
					{#if englishHeaderSubtitle}
						<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">{englishHeaderSubtitle}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Section Rows -->
	<div class="divide-y divide-[var(--color-rule)]">
		{#each sectionKeys as secKey (secKey)}
			{@const gUnit = greekBySec.get(secKey)}
			{@const eUnit = engBySec.get(secKey)}
			{@const lUnit = latBySec.get(secKey)}
			{@const nieseSec = (gUnit && getNieseSection(gUnit)) || (eUnit && getNieseSection(eUnit)) || (lUnit && getNieseSection(lUnit)) || String(secKey)}
			{@const citation = resolveCitation(secKey, gUnit, eUnit, lUnit)}

			{@const primaryId = rowId ? rowId(secKey, nieseSec) : `section-${secKey}`}

			<div
				id={primaryId}
				class="section-row group/sec {isStacked ? 'flex flex-col gap-4' : `grid ${gridColsClass} gap-6 sm:gap-8`} py-5 hover:bg-[var(--color-card-bg)]/60 rounded-xl transition-colors scroll-mt-20"
				data-section={secKey}
				data-niese={nieseSec}
			>
				{#if primaryId !== `niese-${secKey}`}
					<span id="niese-{secKey}" class="sr-only"></span>
				{/if}
				{#if primaryId !== `section-${secKey}`}
					<span id="section-{secKey}" class="sr-only"></span>
				{/if}
				{#if nieseSec && nieseSec !== String(secKey) && primaryId !== `niese-${nieseSec}`}
					<span id="niese-{nieseSec}" class="sr-only"></span>
				{/if}
				{#if primaryId !== `sec-${secKey}`}
					<span id="sec-{secKey}" class="sr-only"></span>
				{/if}

				<!-- Greek Column -->
				{#if hasGreek}
					{#if customGreekColumn}
						{@render customGreekColumn({ secKey, unit: gUnit, citation })}
					{:else}
						<div class="greek-col text-lg leading-relaxed text-[var(--color-ink)] greek-font">
							<!-- Section Badge & Tools -->
							{#if sectionBadge}
								{@render sectionBadge({ secKey, nieseSec, gUnit, eUnit, lUnit })}
							{:else}
								<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
									<span
										class="section-badge text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5"
										title="Section {nieseSec || secKey}"
									>
										§ {nieseSec || secKey}
									</span>

									{#if showBookmarkButton}
										<button
											type="button"
											class="sec-action-btn bm-star-btn text-xs text-[var(--color-ink-soft)] hover:text-amber-500 cursor-pointer"
											onclick={() => onBookmarkToggle?.(nieseSec || String(secKey), gUnit?.text_content || '')}
											title="Bookmark section"
										>
											☆
										</button>
									{/if}

									{#if showCiteButton}
										<button
											type="button"
											class="sec-action-btn cite-trigger-btn text-xs font-medium text-[var(--color-ink-soft)] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline"
											onclick={() => onCitationClick?.(secKey, gUnit, eUnit, lUnit)}
											title="Cite section"
										>
											Cite
										</button>
									{/if}

									{#if extraSectionTools}
										{@render extraSectionTools({ secKey, nieseSec, gUnit, eUnit, lUnit })}
									{/if}
								</div>
							{/if}

							<!-- Greek Word Tokens -->
							{#if gUnit?.tokens && gUnit.tokens.length > 0}
								{#each gUnit.tokens as tok, idx (idx)}
									{@const nextTok = gUnit.tokens[idx + 1]}
									{@const isPunct = PUNCT_REGEX.test(tok.w)}
									{@const nextIsPunct = nextTok && PUNCT_REGEX.test(nextTok.w)}
									{#if tok.type === 'citation'}
										<button
											type="button"
											onclick={() => onBiblicalCitationClick?.(tok.book_code || '', tok.bible_chapter || 0, tok.bible_verse || 0, tok.display || '', tok.book_name)}
											class="inline-flex items-center gap-1 text-xs font-sans font-semibold rounded-md px-1.5 py-0.5 mx-1 bg-amber-100/80 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 cursor-pointer select-none align-middle transition-colors shadow-xs"
											title="Click to explore citation of {tok.book_name || tok.display}"
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="size-3 text-amber-700 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
												<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
											</svg>
											<span>{tok.display}</span>
										</button>{#if !nextIsPunct}{' '}{/if}
									{:else if tok.type === 'apparatus'}
										<span
											class="text-xs text-slate-400 dark:text-slate-500 italic font-sans select-none"
											title="Textual apparatus note"
										>
											{tok.w}
										</span>{#if !nextIsPunct}{' '}{/if}
									{:else if isPunct}
										<span class="select-none">{tok.w}</span>{#if !nextIsPunct}{' '}{/if}
									{:else}
										{@const hl = tok.l && highlightStore ? highlightStore.get(tok.l) : undefined}
										<button
											type="button"
											class="greek-word inline cursor-pointer transition-colors hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-hidden {hl ? 'hl-token' : ''}"
											style={hl ? `--hl-bg: ${hl.bgLight}; --hl-text: ${hl.textLight}; --hl-border: ${hl.borderLight}; --hl-bg-dark: ${hl.bgDark}; --hl-text-dark: ${hl.textDark}; --hl-border-dark: ${hl.borderDark};` : undefined}
											onclick={() => onWordClick?.(tok, citation, 'greek')}
											title={tok.l ? `${tok.l}${tok.p || tok.m ? ` (${tok.p ?? ''} ${tok.m ?? ''})` : ''}` : undefined}
										>{tok.w}</button>{#if !nextIsPunct}{' '}{/if}
									{/if}
								{/each}
							{:else if gUnit?.text_content}
								{#each gUnit.text_content.split(/\s+/) as rawWord, idx (idx)}
									<button
										type="button"
										class="greek-word inline cursor-pointer transition-colors hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-hidden"
										onclick={() => onWordClick?.({ w: rawWord, l: rawWord }, citation, 'greek')}
									>{rawWord}</button>{' '}
								{/each}
							{:else}
								<span class="italic text-[var(--color-ink-soft)] text-sm">(Greek text lacuna / not extant)</span>
							{/if}
						</div>
					{/if}
				{/if}

				<!-- Latin Column -->
				{#if hasLatin}
					{#if customLatinColumn}
						{@render customLatinColumn({ secKey, unit: lUnit, citation })}
					{:else}
						<div class="latin-col text-base leading-relaxed text-[var(--color-ink)] latin-font">
							{#if !hasGreek}
								{#if sectionBadge}
									{@render sectionBadge({ secKey, nieseSec, gUnit, eUnit, lUnit })}
								{:else}
									<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
										<span class="section-badge text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
											§ {nieseSec || secKey}
										</span>
									</div>
								{/if}
							{/if}

							{#if lUnit?.tokens && lUnit.tokens.length > 0}
								{#each lUnit.tokens as tok, idx (idx)}
									{@const hl = tok.l && highlightStore ? highlightStore.get(tok.l) : undefined}
									<button
										type="button"
										class="latin-word inline cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden transition-colors {hl ? 'hl-token' : ''}"
										style={hl ? `--hl-bg: ${hl.bgLight}; --hl-text: ${hl.textLight}; --hl-border: ${hl.borderLight}; --hl-bg-dark: ${hl.bgDark}; --hl-text-dark: ${hl.textDark}; --hl-border-dark: ${hl.borderDark};` : undefined}
										onclick={() => onWordClick?.(tok, citation, 'latin')}
										title={tok.l ? `${tok.l}${tok.p || tok.m ? ` (${tok.p ?? ''} ${tok.m ?? ''})` : ''}` : undefined}
									>{tok.w}</button>{' '}
								{/each}
							{:else if lUnit?.text_content}
								<span>{lUnit.text_content}</span>
							{:else}
								<span class="italic text-[var(--color-ink-soft)] text-sm">—</span>
							{/if}
						</div>
					{/if}
				{/if}

				<!-- English Column -->
				{#if hasEng}
					{#if customEnglishColumn}
						{@render customEnglishColumn({ secKey, unit: eUnit, citation })}
					{:else}
						<div class="english-col text-base leading-relaxed text-[var(--color-ink-soft)] font-serif">
							{#if !hasGreek && !hasLatin}
								{#if sectionBadge}
									{@render sectionBadge({ secKey, nieseSec, gUnit, eUnit, lUnit })}
								{:else}
									<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
										<span class="section-badge text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
											§ {nieseSec || secKey}
										</span>
										{#if showCiteButton}
											<button
												type="button"
												class="sec-action-btn cite-trigger-btn text-xs font-medium text-[var(--color-ink-soft)] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline"
												onclick={() => onCitationClick?.(secKey, gUnit, eUnit, lUnit)}
											>
												Cite
											</button>
										{/if}
									</div>
								{/if}
							{/if}

							{#if eUnit?.text_content}
								<span>{eUnit.text_content}</span>
							{:else}
								<span class="italic text-[var(--color-ink-soft)] text-sm">(No English translation recorded)</span>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>
