<script lang="ts">
	import { base } from '$app/paths';
	import { CANONICAL_WORKS } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { APP_VERSION, APP_REPO } from '$lib/config/version';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';
	import VersionPill from '@polyglot/theme/VersionPill.svelte';
	import { LayoutOptions } from '@polyglot/ui';

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

<header class="sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-page)]/95 backdrop-blur shadow-xs">
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
					class="book-picker-trigger section-picker-trigger rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1"
					title="Choose book or section (Hot key: 'c')"
				>
					{#if isMultiBook}
						<span class="hidden sm:inline">Book {readerState.currentChapter}, §{readerState.currentSection || 1}</span>
						<span class="sm:hidden">{readerState.currentChapter}.{readerState.currentSection || 1}</span>
					{:else}
						<span>§ {readerState.currentSection || 1}</span>
					{/if}
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
		</div>

		<!-- Right: Layout Options, Cite button, ThemeSlider, Search, and Mobile Menu -->
		<div class="flex items-center gap-1 sm:gap-2 shrink-0">
			<!-- Desktop Right Controls (hidden on small screens) -->
			<div class="hidden sm:flex items-center gap-1.5 sm:gap-2">
				<!-- Layout Options Dropdown -->
				<LayoutOptions bind:viewMode={readerState.viewMode} />

				<!-- Cite Current Treatise / Book -->
				<button
					type="button"
					onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter)}
					class="cite-trigger-btn inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					title="Cite treatise (SBL, Cohn-Wendland, Mangey, Chicago, BibTeX)"
				>
					<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
					</svg>
					<span class="hidden md:inline">Cite</span>
				</button>

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
					class="help-trigger inline-flex items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					title="Keyboard shortcuts (?)"
					aria-label="Keyboard shortcuts"
				>
					<span class="font-mono text-xs font-bold leading-none">?</span>
				</button>
			</div>

			<!-- Mobile menu toggle -->
			<button
				type="button"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				class="mobile-menu-btn inline-flex sm:hidden rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
				aria-label="Open menu"
				aria-expanded={isMobileMenuOpen}
			>
				{#if isMobileMenuOpen}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile dropdown menu -->
	{#if isMobileMenuOpen}
		<div class="sm:hidden border-t border-[var(--color-rule)] bg-[var(--color-page)]/98 backdrop-blur px-4 py-3 shadow-md animate-in slide-in-from-top-2 duration-150">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold text-[var(--color-ink-soft)]">Layout:</span>
					<LayoutOptions bind:viewMode={readerState.viewMode} />
				</div>
				<div class="flex items-center gap-2">
					<ThemeSlider
						storageKey="philo_reading_theme"
						warmthStorageKey="philo_reading_warmth"
						profile="standard"
						align="right"
					/>
				</div>
			</div>

			<div class="mt-3 pt-2.5 border-t border-[var(--color-rule)] flex items-center justify-between gap-2">
				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => {
						isMobileMenuOpen = false;
						readerState.toggleSearch();
					}}
				>
					<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<span>Search</span>
				</button>

				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => {
						isMobileMenuOpen = false;
						readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter);
					}}
				>
					<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
					</svg>
					<span>Cite</span>
				</button>

				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => {
						isMobileMenuOpen = false;
						readerState.toggleHotkeyHelp();
					}}
				>
					<span>?</span>
					<span>Help</span>
				</button>
			</div>
		</div>
	{/if}
</header>
