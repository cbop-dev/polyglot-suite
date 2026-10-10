<script lang="ts">
	import { base } from '$app/paths';
	import { CANONICAL_WORKS } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { SBL_ABBREVIATIONS } from '$lib/services/citationService';
	import ThemeSlider from '$lib/components/ThemeSlider.svelte';

	let isMobileMenuOpen = $state<boolean>(false);

	function handleWorkChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		readerState.setWork(target.value, 1);
	}

	function handleChapterChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		readerState.setChapter(parseInt(target.value, 10));
	}

	let chapterList = $derived.by(() => {
		const min = readerState.currentWork.minChapter ?? 1;
		const max = readerState.currentWork.totalChapters;
		const list: number[] = [];
		for (let i = min; i <= max; i++) {
			list.push(i);
		}
		return list;
	});

	let hasLatinInCurrentChapter = $derived(readerState.hasLatinInChapter());
</script>

<header class="sticky top-0 z-30 border-b border-[var(--color-rule)] bg-[var(--color-page)]/95 backdrop-blur shadow-xs">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-2.5 py-1.5 sm:px-4 sm:py-2">
		<!-- Left: Suite link, Work Selector, Chapter Navigator, Jump Button -->
		<div class="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
			<!-- Suite link -->
			<a
				href="{base}/"
				class="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] shrink-0"
				title="Back to Polyglot Suite"
			>
				&larr; <span class="hidden sm:inline">Suite</span>
			</a>
			<span class="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
			<h1 class="text-sm font-bold tracking-tight text-[var(--color-ink)] hidden xl:inline truncate">
				Apostolic Fathers
			</h1>

			<!-- Work Selector Button (press 'b' to open searchable modal) -->
			<button
				type="button"
				onclick={() => readerState.openBookModal()}
				class="max-w-[130px] sm:max-w-[190px] md:max-w-[220px] truncate rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1 shrink min-w-0"
				title="Choose work (Hot key: 'b')"
			>
				<span class="truncate">{readerState.currentWork.titleEnglish}</span>
				<span class="text-[10px] text-[var(--color-ink-soft)] shrink-0">▾</span>
			</button>

			<!-- Chapter Selector & Arrows (press 'c' to open searchable chapter modal) -->
			<div class="flex items-center gap-0.5 shrink-0">
				<button
					type="button"
					onclick={() => readerState.prevChapter()}
					class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
					aria-label="Previous chapter"
					title="Previous chapter (←)"
				>
					&larr;
				</button>
				<button
					type="button"
					onclick={() => readerState.openChapterModal()}
					class="rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1"
					title="Choose chapter (Hot key: 'c')"
				>
					<span>{readerState.currentChapter === 0 ? 'Sal.' : `Ch. ${readerState.currentChapter}`}</span>
					<span class="text-[10px] text-[var(--color-ink-soft)]">▾</span>
				</button>
				<button
					type="button"
					onclick={() => readerState.nextChapter()}
					class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
					aria-label="Next chapter"
					title="Next chapter (→)"
				>
					&rarr;
				</button>

				<!-- Current Chapter Latin Badge (if Latin extant in current locus) -->
				{#if readerState.hasLatinInChapter()}
					<span
						class="hidden md:inline-flex items-center gap-1 ml-1 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 select-none"
						title="Ancient Latin text supplies the lacuna in this chapter"
					>
						Latin Extant
					</span>
				{/if}
			</div>

			<!-- Quick Jump / Command Palette button (Desktop / Tablet) -->
			<button
				type="button"
				onclick={() => readerState.toggleCommandPalette()}
				class="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer shrink-0"
				title="Jump to work or passage (Cmd+K)"
			>
				<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				<span>Jump</span>
				<kbd class="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 font-mono">⌘K</kbd>
			</button>
		</div>

		<!-- Right: Column toggles, Cite button, ThemeSlider, Search, and Mobile Menu -->
		<div class="flex items-center gap-1 sm:gap-2 shrink-0">
			<!-- Column toggles (Desktop) -->
			<div class="hidden lg:flex items-center gap-2 text-xs font-medium text-[var(--color-ink-soft)]">
				<label class="inline-flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={readerState.showGreek} class="rounded text-blue-600" />
					Greek
				</label>

				<!-- Latin toggle: only rendered when Latin text is actually extant in this chapter -->
				{#if hasLatinInCurrentChapter}
					<label
						class="inline-flex items-center gap-1 cursor-pointer text-amber-800 dark:text-amber-300 font-semibold"
						title="Ancient Latin text is extant in this chapter"
					>
						<input type="checkbox" bind:checked={readerState.showLatin} class="rounded text-amber-600" />
						Latin
						<span class="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
					</label>
				{/if}

				<label class="inline-flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={readerState.showEnglish} class="rounded text-blue-600" />
					English
				</label>
			</div>

			<!-- Cite Current Chapter (hidden on very small mobile screens, available in mobile menu) -->
			<button
				type="button"
				onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter)}
				class="hidden sm:inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
				title="Cite this chapter (SBL, Chicago, MLA, APA, BibTeX)"
			>
				<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
				</svg>
				<span>Cite</span>
			</button>

			<!-- Theme and Warmth Slider (Sun/Moon icon button) -->
			<ThemeSlider />

			<!-- Keyboard shortcuts button -->
			<button
				type="button"
				onclick={() => readerState.toggleHotkeyHelp()}
				class="hidden sm:inline-flex items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
				title="Keyboard shortcuts (?)"
				aria-label="Keyboard shortcuts"
			>
				<span class="font-mono text-xs font-bold leading-none">?</span>
			</button>

			<!-- Search button -->
			<button
				type="button"
				onclick={() => readerState.toggleSearch()}
				class="inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer"
				title="Search Lemmas (/)"
				aria-label="Search Lemmas"
			>
				<svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<span class="hidden md:inline">Search</span>
				<kbd class="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 font-mono hidden lg:inline">/</kbd>
			</button>

			<!-- Mobile Overflow / Menu Button (shown below lg) -->
			<div class="relative lg:hidden">
				<button
					type="button"
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
					class="inline-flex items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-xs font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer"
					aria-label="Open view and options menu"
					aria-expanded={isMobileMenuOpen}
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
					</svg>
				</button>

				{#if isMobileMenuOpen}
					<!-- Backdrop -->
					<button
						type="button"
						class="fixed inset-0 z-40 cursor-default"
						onclick={() => (isMobileMenuOpen = false)}
						aria-label="Close menu"
					></button>

					<!-- Dropdown menu panel -->
					<div class="absolute right-0 mt-2 z-50 w-52 rounded-xl border border-[var(--color-rule)] bg-[var(--color-page)] p-3 shadow-xl space-y-3">
						<!-- Columns section -->
						<div>
							<div class="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">Visible Columns</div>
							<div class="flex flex-col gap-2 text-xs font-medium text-[var(--color-ink)]">
								<label class="inline-flex items-center gap-2 cursor-pointer">
									<input type="checkbox" bind:checked={readerState.showGreek} class="rounded text-blue-600" />
									Greek Text (1912)
								</label>
								{#if hasLatinInCurrentChapter}
									<label class="inline-flex items-center gap-2 cursor-pointer text-amber-800 dark:text-amber-300 font-semibold">
										<input type="checkbox" bind:checked={readerState.showLatin} class="rounded text-amber-600" />
										<span>Latin Text</span>
										<span class="rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1 py-0.2 text-[9px] font-bold">Extant</span>
									</label>
								{/if}
								<label class="inline-flex items-center gap-2 cursor-pointer">
									<input type="checkbox" bind:checked={readerState.showEnglish} class="rounded text-blue-600" />
									English Translation
								</label>
							</div>
						</div>

						<hr class="border-[var(--color-rule)]" />

						<!-- Mobile Actions -->
						<div class="space-y-1">
							<button
								type="button"
								onclick={() => {
									isMobileMenuOpen = false;
									readerState.toggleCommandPalette();
								}}
								class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-card-bg)] text-left cursor-pointer"
							>
								<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Jump to Passage (⌘K)
							</button>

							<button
								type="button"
								onclick={() => {
									isMobileMenuOpen = false;
									readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter);
								}}
								class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-card-bg)] text-left cursor-pointer"
							>
								<svg class="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
								</svg>
								Cite Current Chapter
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>
