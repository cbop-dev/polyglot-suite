<script lang="ts">
	import { base } from '$app/paths';
	import { CANONICAL_WORKS } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { APP_VERSION, APP_REPO } from '$lib/config/version';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';
	import VersionPill from '@polyglot/theme/VersionPill.svelte';

	let isMobileMenuOpen = $state<boolean>(false);

	let currentWork = $derived(readerState.currentWork);
	let isMultiBook = $derived(currentWork.totalBooks > 1);

	let maxSectionInBook = $derived.by(() => {
		if (currentWork.sectionsByBook && currentWork.sectionsByBook[readerState.currentChapter]) {
			return currentWork.sectionsByBook[readerState.currentChapter];
		}
		return currentWork.totalSections;
	});
</script>

<header class="sticky top-0 z-30 border-b border-[var(--color-rule)] bg-[var(--color-page)]/95 backdrop-blur shadow-xs">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2">
		<!-- Left: Suite link, Title & Version, Treatise Selector, Book Navigator, Jump Button -->
		<div class="flex items-center gap-1 sm:gap-2.5 min-w-0">
			<!-- Suite link -->
			<a
				href="{base}/"
				class="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] shrink-0"
				title="Back to Polyglot Suite"
			>
				&larr;<span class="hidden sm:inline">&nbsp;Suite</span>
			</a>
			<span class="text-slate-300 dark:text-slate-700">/</span>

			<!-- App Title & Version Pill -->
			<div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
				<h1 class="text-xs sm:text-sm font-bold tracking-tight text-[var(--color-ink)]">
					<span class="hidden sm:inline">Philo Reader</span>
					<span class="sm:hidden">Philo</span>
				</h1>
				<div class="block md:block">
				<VersionPill
					version={APP_VERSION}
					href={APP_REPO}
					title="View Philo Reader on GitHub"
				/>
				</div>
			</div>

			<!-- Treatise Selector Button (press 'b') -->
			<button
				type="button"
				onclick={() => readerState.openBookModal()}
				class="max-w-[85px] min-[400px]:max-w-[120px] sm:max-w-[210px] md:max-w-[260px] truncate rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-1.5 py-1 sm:px-2 text-xs sm:text-sm font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1 shrink min-w-0"
				title="Choose treatise (Hot key: 'b')"
			>
				<span class="hidden lg:inline truncate">{currentWork.titleEnglish}</span>
				<span class="lg:hidden truncate">{currentWork.abbrev}</span>
				<span class="text-[10px] text-[var(--color-ink-soft)] shrink-0">▾</span>
			</button>

			<!-- Book / Section Navigator (press 'c') -->
			<div class="flex items-center gap-0.5 shrink-0">
				<button
					type="button"
					onclick={() => readerState.prevChapter()}
					class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
					aria-label="Previous book or treatise"
					title="Previous (← / [)"
				>
					&larr;
				</button>
				<button
					type="button"
					onclick={() => readerState.openChapterModal()}
					class="rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1"
					title="Choose book or section (Hot key: 'c')"
				>
					<span>{isMultiBook ? `Bk. ${readerState.currentChapter}` : `${maxSectionInBook} §`}</span>
					<span class="text-[10px] text-[var(--color-ink-soft)]">▾</span>
				</button>
				<button
					type="button"
					onclick={() => readerState.nextChapter()}
					class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
					aria-label="Next book or treatise"
					title="Next (→ / ])"
				>
					&rarr;
				</button>
			</div>

			<!-- Quick Jump / Command Palette button -->
			<button
				type="button"
				onclick={() => readerState.toggleCommandPalette()}
				class="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer shrink-0"
				title="Jump to treatise or section (Cmd+K)"
			>
				<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				<span class="hidden md:inline-block">Jump</span>
				<kbd class="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 font-mono">⌘K</kbd>
			</button>
		</div>

		<!-- Right: Column toggles, Cite button, ThemeSlider, Search, and Mobile Menu -->
		<div class="flex items-center gap-1 sm:gap-2 shrink-0">
			<!-- Column toggles (Desktop) -->
			<div class="hidden lg:flex items-center gap-2 text-xs font-medium text-[var(--color-ink-soft)]">
				<label class="inline-flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={readerState.showGreek} class="rounded text-blue-600 cursor-pointer" />
					Greek
				</label>
				<label class="inline-flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={readerState.showEnglish} class="rounded text-blue-600 cursor-pointer" />
					English
				</label>
			</div>

			<!-- Cite Current Treatise / Book -->
			<button
				type="button"
				onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter)}
				class="hidden sm:inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
				title="Cite treatise (SBL, Cohn-Wendland, Mangey, Chicago, BibTeX)"
			>
				<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
				</svg>
				<span class="hidden lg:block">Cite</span>
			</button>

			<!-- Theme and Warmth Slider -->
			<ThemeSlider
				storageKey="philo_reading_theme"
				warmthStorageKey="philo_reading_warmth"
				profile="standard"
				align="right"
			/>

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

			<!-- Scripture Index / Biblical Citation Explorer Toggle -->
			 <!-- let's remove this ...
			<button
				type="button"
				onclick={() => {
					if (readerState.isSidePanelOpen && readerState.activeSidePanelTab === 'citations') {
						readerState.isSidePanelOpen = false;
					} else {
						readerState.openCitationsTab();
					}
				}}
				class="hidden md:inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer"
				title="Biblical Citation Explorer"
				aria-label="Biblical Citation Explorer"
			>
				<svg class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
					<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
				</svg>
				<span>Scripture</span>
			</button>
			-->
			<!-- Search & Reference Panel Toggle -->
			<button
				type="button"
				onclick={() => readerState.toggleSearch()}
				class="inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer"
				title="Search Lexicon & Full Text (/)"
				aria-label="Search Lexicon & Full Text"
			>
				<svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<!--<span class="hidden sm:inline">Search</span>-->
			</button>

			<!-- Mobile menu toggle -->
			<button
				type="button"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				class="inline-flex lg:hidden rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
				aria-label="Open menu"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile dropdown menu -->
	{#if isMobileMenuOpen}
		<div class="lg:hidden border-t border-[var(--color-rule)] bg-[var(--color-page)] p-3 space-y-3">
			<div class="flex items-center justify-between text-xs font-semibold text-[var(--color-ink-soft)]">
				<span>Columns:</span>
				<div class="flex items-center gap-3">
					<label class="inline-flex items-center gap-1">
						<input type="checkbox" bind:checked={readerState.showGreek} class="rounded text-blue-600" />
						Greek
					</label>
					<label class="inline-flex items-center gap-1">
						<input type="checkbox" bind:checked={readerState.showEnglish} class="rounded text-blue-600" />
						English
					</label>
				</div>
			</div>
			<div class="flex items-center justify-between pt-2 border-t border-[var(--color-rule)] text-xs">
				<button
					type="button"
					onclick={() => { isMobileMenuOpen = false; readerState.openCitationsTab(); }}
					class="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
				>
					<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
					</svg>
					<span>Scripture Index</span>
				</button>
				<button
					type="button"
					onclick={() => { isMobileMenuOpen = false; readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter); }}
					class="font-semibold text-blue-600 hover:underline cursor-pointer"
				>
					Cite Treatise
				</button>
				<button
					type="button"
					onclick={() => { isMobileMenuOpen = false; readerState.toggleHotkeyHelp(); }}
					class="text-[var(--color-ink-soft)] hover:underline cursor-pointer"
				>
					Shortcuts Help (?)
				</button>
			</div>
		</div>
	{/if}
</header>
