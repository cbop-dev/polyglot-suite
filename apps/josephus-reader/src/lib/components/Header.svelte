<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { APP_VERSION, APP_REPO } from '$lib/config/version';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';
	import VersionPill from '@polyglot/theme/VersionPill.svelte';
	import { LayoutOptions } from '@polyglot/ui';

	let currentWork = $derived(readerState.currentWork);
	let isMultiBook = $derived(currentWork.totalBooks > 1);
	let isMobileMenuOpen = $state(false);

	function prevBook() {
		if (readerState.currentBook > 1) {
			readerState.prevBook();
			const targetUrl = `${base}/${currentWork.code}/book/${readerState.currentBook}/`;
			goto(targetUrl).catch(() => {
				window.location.href = targetUrl;
			});
		}
	}

	function nextBook() {
		if (readerState.currentBook < currentWork.totalBooks) {
			readerState.nextBook();
			const targetUrl = `${base}/${currentWork.code}/book/${readerState.currentBook}/`;
			goto(targetUrl).catch(() => {
				window.location.href = targetUrl;
			});
		}
	}
</script>

<header class="page-header sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-page)]/95 backdrop-blur shadow-xs">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2">
		<!-- Left: Suite link, Title & Version, Work Switcher, Book outline & Section -->
		<div class="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
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
				<a href="{base}/" class="text-xs sm:text-sm font-bold tracking-tight text-[var(--color-ink)] hover:underline">
					<span class="hidden sm:inline">Josephus Reader</span>
					<span class="sm:hidden">Josephus</span>
				</a>
				<VersionPill
					version={APP_VERSION}
					href={APP_REPO}
					title="View Josephus Reader on GitHub"
				/>
			</div>

			<!-- Treatise Selector Button (opens WorkPickerModal) -->
			<button
				type="button"
				onclick={() => readerState.openBookModal()}
				class="work-picker-trigger max-w-[110px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[280px] truncate rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1 shrink min-w-0"
				title="Choose work (Hot key: 'b')"
			>
				<span class="hidden lg:inline truncate">{currentWork.titleEnglish}</span>
				<span class="lg:hidden truncate">{currentWork.abbrev}</span>
				<span class="text-[10px] text-[var(--color-ink-soft)] shrink-0">▾</span>
			</button>

			<!-- Book & Section Navigator -->
			<div class="flex items-center gap-0.5 shrink-0">
				{#if isMultiBook}
					<button
						type="button"
						onclick={prevBook}
						class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
						aria-label="Previous book"
						title="Previous Book (← / [)"
					>
						&larr;
					</button>
				{/if}

				<button
					type="button"
					onclick={() => readerState.openChapterModal()}
					class="book-picker-trigger section-picker-trigger rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1"
					title="Jump to Book & Section (Hot key: 'c' or 'j')"
				>
					{#if isMultiBook}
						<span class="hidden sm:inline">Book {readerState.currentBook}, §{readerState.currentSection || 1}</span>
						<span class="sm:hidden">{readerState.currentBook}.{readerState.currentSection || 1}</span>
					{:else}
						<span>§ {readerState.currentSection || 1}</span>
					{/if}
					<span class="text-[10px] text-[var(--color-ink-soft)]">▾</span>
				</button>

				{#if isMultiBook}
					<button
						type="button"
						onclick={nextBook}
						class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
						aria-label="Next book"
						title="Next Book (→ / ])"
					>
						&rarr;
					</button>
				{/if}
			</div>
		</div>

		<!-- Right: Desktop controls & Mobile hamburger menu button -->
		<div class="flex items-center gap-1 sm:gap-2 shrink-0">
			<!-- Desktop Right Controls (hidden on small screens) -->
			<div class="hidden sm:flex items-center gap-1.5 sm:gap-2">
				<!-- Layout Options Dropdown -->
				<LayoutOptions bind:viewMode={readerState.viewMode} />

				<!-- Cite Current Work / Section -->
				<button
					type="button"
					class="cite-trigger-btn inline-flex items-center gap-1 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentBook, readerState.currentSection || '1')}
					title="Cite treatise (SBL, Niese, Whiston, Chicago, BibTeX)"
				>
					<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
					</svg>
					<span class="hidden md:inline">Cite</span>
				</button>

				<!-- Search & Lemma Side Panel Toggle -->
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => readerState.toggleSearch('search')}
					title="Search Lexicon & Text (/)"
					aria-label="Search Lexicon & Text"
				>
					<span class="hs-icon">🔍</span>
					<span class="hidden sm:inline text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500">/</span>
				</button>

				<!-- Theme Slider -->
				<div class="shrink-0">
					<ThemeSlider />
				</div>

				<!-- Shortcuts Help Button -->
				<button
					type="button"
					class="help-trigger help-trigger-btn rounded p-1 text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => readerState.openHotkeyHelp()}
					aria-label="Keyboard Shortcuts"
					title="Keyboard Shortcuts (?)"
				>
					?
				</button>
			</div>

			<!-- Mobile Hamburger Button (visible only on small screens) -->
			<button
				type="button"
				class="mobile-menu-btn sm:hidden rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				aria-label="Toggle navigation menu"
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

	<!-- Mobile Slide-down Panel -->
	{#if isMobileMenuOpen}
		<div class="sm:hidden border-t border-[var(--color-rule)] bg-[var(--color-page)]/98 backdrop-blur px-4 py-3 shadow-md animate-in slide-in-from-top-2 duration-150">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold text-[var(--color-ink-soft)]">Layout:</span>
					<LayoutOptions bind:viewMode={readerState.viewMode} />
				</div>
				<div class="flex items-center gap-2">
					<ThemeSlider />
				</div>
			</div>

			<div class="mt-3 pt-2.5 border-t border-[var(--color-rule)] flex items-center justify-between gap-2">
				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => {
						isMobileMenuOpen = false;
						readerState.toggleSearch('search');
					}}
				>
					<span>🔍</span>
					<span>Search & Lexicon</span>
				</button>

				<button
					type="button"
					class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
					onclick={() => {
						isMobileMenuOpen = false;
						readerState.openCitation(readerState.currentWorkCode, readerState.currentBook, readerState.currentSection || '1');
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
						readerState.openHotkeyHelp();
					}}
				>
					<span>?</span>
					<span>Help</span>
				</button>
			</div>
		</div>
	{/if}
</header>
