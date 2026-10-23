<script lang="ts">
	import type { TextUnit, Token } from '$lib/services/dbClient';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';

	interface Props {
		greek?: TextUnit[];
		english?: TextUnit[];
	}

	let { greek = [], english = [] }: Props = $props();

	// Group sections by section number
	let sectionNumbers = $derived.by(() => {
		const nums = new Set<number>();
		greek.forEach((u) => nums.add(u.section));
		english.forEach((u) => nums.add(u.section));
		return Array.from(nums).sort((a, b) => a - b);
	});

	let greekBySec = $derived(new Map(greek.map((u) => [u.section, u])));
	let engBySec = $derived(new Map(english.map((u) => [u.section, u])));

	let hasGreek = $derived(readerState.showGreek);
	let hasEng = $derived(readerState.showEnglish);

	let gridColsClass = $derived.by(() => {
		if (hasGreek && hasEng) return 'grid-cols-1 lg:grid-cols-2';
		return 'grid-cols-1';
	});
</script>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
	<!-- Column Headers (desktop) -->
	<div class="hidden lg:grid {gridColsClass} gap-8 border-b border-[var(--color-rule)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
		{#if hasGreek}
			<div class="flex items-center justify-between">
				<span>Cohn-Wendland Greek Critical Text</span>
				<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">Click word for LSJ & morphology</span>
			</div>
		{/if}
		{#if hasEng}
			<div class="flex items-center justify-between">
				<span>English Translation (C. D. Yonge / Supplements)</span>
				<span class="text-[10px] font-normal normal-case text-[var(--color-ink-soft)]">Aligned to Cohn-Wendland</span>
			</div>
		{/if}
	</div>

	<!-- Section Rows -->
	<div class="divide-y divide-[var(--color-rule)]">
		{#each sectionNumbers as sec}
			{@const gUnit = greekBySec.get(sec)}
			{@const eUnit = engBySec.get(sec)}
			{@const mangeyRef = gUnit?.mangey_ref || eUnit?.mangey_ref}
			{@const isSupplement = eUnit?.is_supplement === 1}
			{@const displayCitation = gUnit?.display_citation || eUnit?.display_citation || `Section ${sec}`}

			<div
				id="section-{sec}"
				class="group/sec grid {gridColsClass} gap-8 py-5 hover:bg-[var(--color-card-bg)]/60 rounded-xl transition-colors scroll-mt-20"
			>
				<!-- Greek Column -->
				{#if hasGreek}
					<div class="text-lg leading-relaxed text-[var(--color-ink)] greek-font">
						<!-- Section citation & Mangey Milestone Badge -->
						<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
							<button
								type="button"
								onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter, sec, mangeyRef, isSupplement)}
								class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5"
								title="Cite section {readerState.currentWork.abbrev} {readerState.currentWork.totalBooks > 1 ? `${readerState.currentChapter}.` : ''}{sec}"
							>
								§ {sec}
							</button>

							{#if mangeyRef}
								<span
									class="rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1 py-0.5"
									title="Mangey 1742 Milestone: Volume {mangeyRef.replace('M. ', '')}"
								>
									{mangeyRef}
								</span>
							{/if}
						</div>

						<!-- Word Tokens -->
						{#if gUnit && gUnit.tokens}
							{#each gUnit.tokens as tok, idx}
								{@const nextTok = gUnit.tokens[idx + 1]}
								{@const isPunct = [',', '.', '·', ';', ':', ')', ']', '—'].includes(tok.w)}
								{@const nextIsPunct = nextTok && [',', '.', '·', ';', ':', ')', ']'].includes(nextTok.w)}
								{#if tok.type === 'citation'}
									<button
										type="button"
										onclick={() => readerState.openBiblicalCitation(tok.book_code, tok.bible_chapter, tok.bible_verse, tok.display, tok.book_name)}
										class="inline-flex items-center gap-1 text-xs font-sans font-semibold rounded-md px-1.5 py-0.5 mx-1 bg-amber-100/80 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 cursor-pointer select-none align-middle transition-colors shadow-xs"
										title="Click to explore Philo's citations of {tok.book_name || tok.display}"
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
									{@const hl = tok.l ? highlightStore.get(tok.l) : undefined}
									<button
										type="button"
										onclick={() => readerState.openLemma(tok, displayCitation)}
										class="inline cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden transition-colors {hl ? 'hl-token' : ''}"
										style={hl ? `--hl-bg: ${hl.bgLight}; --hl-text: ${hl.textLight}; --hl-border: ${hl.borderLight}; --hl-bg-dark: ${hl.bgDark}; --hl-text-dark: ${hl.textDark}; --hl-border-dark: ${hl.borderDark};` : undefined}
										title="{tok.l} ({tok.p} {tok.m})"
									>
										{tok.w}
									</button>{#if !nextIsPunct}{' '}{/if}
								{/if}
							{/each}
						{:else if gUnit}
							<span>{gUnit.text_content}</span>
						{:else}
							<span class="italic text-[var(--color-ink-soft)] text-sm">(Greek text lacuna / not extant)</span>
						{/if}
					</div>
				{/if}

				<!-- English Column -->
				{#if hasEng}
					<div class="text-base leading-relaxed text-[var(--color-ink)]">
						<!-- Section citation & Supplement Badge -->
						<div class="inline-flex items-center gap-1.5 mr-2 align-baseline select-none">
							<button
								type="button"
								onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter, sec, mangeyRef, isSupplement)}
								class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5"
								title="Cite section {readerState.currentWork.abbrev} {readerState.currentWork.totalBooks > 1 ? `${readerState.currentChapter}.` : ''}{sec}"
							>
								§ {sec}
							</button>

							{#if mangeyRef}
								<span
									class="rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1 py-0.5"
									title="Mangey 1742 Milestone: Volume {mangeyRef.replace('M. ', '')}"
								>
									{mangeyRef}
								</span>
							{/if}

							{#if isSupplement}
								<span
									class="rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 cursor-help"
									title="This section was omitted by C. D. Yonge (1854) due to Mangey's manuscript lacunae. Translated here directly from Cohn-Wendland Greek."
								>
									[AI Translation — Missing from Yonge 1854]
								</span>
							{/if}
						</div>

						<!-- English text -->
						{#if eUnit}
							<span>{eUnit.text_content}</span>
						{:else}
							<span class="italic text-[var(--color-ink-soft)] text-sm">(No English translation recorded)</span>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
