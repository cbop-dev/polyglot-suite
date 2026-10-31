<script lang="ts">
	import type { TextUnit, Token } from '$lib/services/dbClient';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';

	interface Props {
		greek?: TextUnit[];
		english?: TextUnit[];
	}

	let { greek = [], english = [] }: Props = $props();

	// Match sections by section_num or index
	let sectionKeys = $derived.by(() => {
		const keys = new Set<number>();
		greek.forEach((u) => keys.add(u.section_num));
		english.forEach((u) => keys.add(u.section_num));
		return Array.from(keys).sort((a, b) => a - b);
	});

	let greekBySec = $derived(new Map(greek.map((u) => [u.section_num, u])));
	let engBySec = $derived(new Map(english.map((u) => [u.section_num, u])));

	let hasGreek = $derived(readerState.showGreek);
	let hasEng = $derived(readerState.showEnglish);

	let gridColsClass = $derived.by(() => {
		if (hasGreek && hasEng) return 'grid-cols-1 lg:grid-cols-2';
		return 'grid-cols-1';
	});

	function handleWordClick(tok: Token, citation: string) {
		readerState.openToken(tok, citation);
	}

	function handleBookmarkToggle(secStr: string, snippet: string) {
		if (typeof window === 'undefined') return;
		try {
			const saved = localStorage.getItem('josephus_bookmarks');
			let bms = saved ? JSON.parse(saved) : [];
			const id = `${readerState.currentWorkCode}-${readerState.currentBook}-${secStr}`;
			const exists = bms.some((b: any) => b.id === id);
			if (exists) {
				bms = bms.filter((b: any) => b.id !== id);
			} else {
				bms.push({
					id,
					work: readerState.currentWorkCode,
					book: readerState.currentBook,
					section: secStr,
					snippet: snippet.slice(0, 100),
					timestamp: Date.now()
				});
			}
			localStorage.setItem('josephus_bookmarks', JSON.stringify(bms));
		} catch {}
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
	<!-- Column Headers (desktop) -->
	<div class="hidden lg:grid {gridColsClass} gap-8 border-b border-[var(--color-rule)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
		{#if hasGreek}
			<div class="flex items-center justify-between">
				<span>Benedikt Niese Greek Critical Text (1885–1895)</span>
				<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">Click Greek word for LSJ & morphology</span>
			</div>
		{/if}
		{#if hasEng}
			<div class="flex items-center justify-between">
				<span>William Whiston English Translation (1856)</span>
				<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">Facing English Text</span>
			</div>
		{/if}
	</div>

	<!-- Section Rows -->
	<div class="divide-y divide-[var(--color-rule)]">
		{#each sectionKeys as secKey}
			{@const gUnit = greekBySec.get(secKey)}
			{@const eUnit = engBySec.get(secKey)}
			{@const nieseSec = gUnit?.niese_section || eUnit?.niese_section || String(secKey)}
			{@const citation = gUnit?.display_citation || eUnit?.display_citation || `${readerState.currentWork.abbrev} ${readerState.currentBook}.${nieseSec}`}

			<div
				id="niese-{secKey}"
				class="section-row group/sec grid {gridColsClass} gap-8 py-5 hover:bg-[var(--color-card-bg)]/60 rounded-xl transition-colors scroll-mt-20"
				data-niese={nieseSec}
				data-section={secKey}
			>
				<span id="niese-{nieseSec}" class="sr-only"></span>
				<span id="section-{secKey}" class="sr-only"></span>
				<!-- Greek Column -->
				{#if hasGreek}
					<div class="greek-col text-lg leading-relaxed text-[var(--color-ink)] greek-font">
						<!-- Section Badge & Action Tools -->
						<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
							<span
								class="section-badge text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5"
								title="Niese Section {nieseSec}"
							>
								§ {nieseSec}
							</span>

							<button
								type="button"
								class="sec-action-btn bm-star-btn text-xs text-[var(--color-ink-soft)] hover:text-amber-500 cursor-pointer"
								onclick={() => handleBookmarkToggle(nieseSec, gUnit?.text_content || '')}
								title="Bookmark section"
							>
								☆
							</button>

							<button
								type="button"
								class="sec-action-btn cite-trigger-btn text-xs font-medium text-[var(--color-ink-soft)] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline"
								onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentBook, nieseSec)}
								title="Cite section"
							>
								Cite
							</button>
						</div>

						<!-- Greek Word Tokens -->
						{#if gUnit?.tokens && gUnit.tokens.length > 0}
							{#each gUnit.tokens as tok, idx (idx)}
								{@const hl = tok.l ? highlightStore.get(tok.l) : undefined}
								<span
									class="greek-word cursor-pointer transition-colors hover:text-blue-600 hover:underline inline-block"
									class:hl-token={!!hl}
									style={hl && tok.l ? highlightStore.getStyle(tok.l) : ''}
									onclick={() => handleWordClick(tok, citation)}
									role="button"
									tabindex="0"
									onkeydown={(e) => { if (e.key === 'Enter') handleWordClick(tok, citation); }}
								>{tok.w}</span>{' '}
							{/each}
						{:else if gUnit}
							{#each gUnit.text_content.split(/\s+/) as rawWord, idx (idx)}
								<span
									class="greek-word cursor-pointer transition-colors hover:text-blue-600 hover:underline inline-block"
									onclick={() => handleWordClick({ w: rawWord, l: rawWord }, citation)}
									role="button"
									tabindex="0"
									onkeydown={(e) => { if (e.key === 'Enter') handleWordClick({ w: rawWord, l: rawWord }, citation); }}
								>{rawWord}</span>{' '}
							{/each}
						{/if}
					</div>
				{/if}

				<!-- English Column -->
				{#if hasEng}
					<div class="english-col text-base leading-relaxed text-[var(--color-ink-soft)] font-serif">
						{#if !hasGreek}
							<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
								<span class="section-badge text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
									§ {nieseSec}
								</span>
								<button
									type="button"
									class="sec-action-btn cite-trigger-btn text-xs font-medium text-[var(--color-ink-soft)] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline"
									onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentBook, nieseSec)}
								>
									Cite
								</button>
							</div>
						{/if}
						<span>{eUnit?.text_content || ''}</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
