<script lang="ts">
	import type { Snippet } from 'svelte';
	import LayoutOptions, { type ViewMode } from '../controls/LayoutOptions.svelte';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';
	import VersionPill from '@polyglot/theme/VersionPill.svelte';
	import type {TextVersionConfig} from "@polyglot/ancient-languages/corpora-types";
	import { SvelteSet } from 'svelte/reactivity';
	//import {TextVersionConfig} from 

	export interface Props {
		// Branding & Navigation
		title?: string;
		titleShort?: string;
		version?: string;
		repoHref?: string;
		suiteHref?: string;
		homeHref?: string;
		enableFontSizeSlider?:boolean;
		// Work Selector
		workTitle: string;
		workAbbrev?: string;
		workPickerTitle?: string;
		onOpenWorkPicker: () => void;

		// Section / Book Navigator
		locationLabel: string;
		locationShort: string;
		isMultiBook?: boolean;
		canPrevBook?: boolean;
		canNextBook?: boolean;
		onPrevBook?: () => void;
		onNextBook?: () => void;
		onOpenSectionPicker: () => void;
		locationBadge?: Snippet;

		// Controls Configuration
		viewMode?: ViewMode;
		onViewModeChange?: (mode: ViewMode) => void;
		showLayoutOptions?: boolean;

		showThemeSlider?: boolean;
		themeStorageKey?: string;
		themeWarmthStorageKey?: string;

		showCitation?: boolean;
		onOpenCitation?: () => void;

		showSearch?: boolean;
		onOpenSearch?: () => void;

		showBookmarks?: boolean;
		onOpenBookmarks?: () => void;

		showHelp?: boolean;
		onOpenHelp?: () => void;
		
		// Extensibility Slots
		afterTitle?: Snippet;
		extraDesktopControls?: Snippet;
		extraMobileControls?: Snippet;
		columnToggleButtons?:Snippet;
		class?: string;
		textVersions?: TextVersionConfig[];
		textVersionsVisible?:SvelteSet<string>;
		layoutIsOpen:boolean;
	}

	let {
		title = 'Polyglot Reader',
		titleShort,
		version,
		repoHref,
		suiteHref = '/',
		homeHref,
		workTitle,
		workAbbrev,
		workPickerTitle = "Choose treatise (Hot key: 'b')",
		onOpenWorkPicker,
		locationLabel,
		locationShort,
		isMultiBook = true,
		canPrevBook = true,
		canNextBook = true,
		onPrevBook,
		onNextBook,
		onOpenSectionPicker,
		locationBadge,
		viewMode = $bindable('parallel'),
		onViewModeChange,
		showLayoutOptions = true,
		showThemeSlider = $bindable(false),
		themeStorageKey = 'polyglot_reader_theme',
		themeWarmthStorageKey = 'polyglot_reader_warmth',
		showCitation = true,
		onOpenCitation,
		showSearch = true,
		onOpenSearch,
		showBookmarks = false,
		onOpenBookmarks,
		showHelp = true,
		onOpenHelp,
		afterTitle,
		enableFontSizeSlider=true,
		extraDesktopControls,
		extraMobileControls,
		columnToggleButtons,
		class: className = '',
		textVersions,
		textVersionsVisible=$bindable(),
		layoutIsOpen=$bindable(false)
	}: Props = $props();

	let isMobileMenuOpen = $state(false);
</script>

<header class="page-header sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-page)]/95 backdrop-blur shadow-xs select-none {className}">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2">
		<!-- Left: Suite link, Corpus Title, Work Selector, Book/Section Navigator -->
		<div class="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
			<!-- Suite link -->
			<a
				href={suiteHref}
				class="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] shrink-0"
				title="Back to Polyglot Suite"
			>
				&larr;<span class="hidden sm:inline">&nbsp;Suite</span>
			</a>
			<span class="text-slate-300 dark:text-slate-700">/</span>

			<!-- App Title & Version Pill -->
			<div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
				<a href={homeHref || suiteHref} class="text-xs sm:text-sm font-bold tracking-tight text-[var(--color-ink)] hover:underline">
					{#if titleShort}
						<span class="hidden sm:inline">{title}</span>
						<span class="sm:hidden">{titleShort}</span>
					{:else}
						<span>{title}</span>
					{/if}
				</a>
				{#if version}
					<VersionPill
						{version}
						href={repoHref}
						title="View {title} on GitHub"
					/>
				{/if}
			</div>
			{#if afterTitle}
			{@render afterTitle()}
			{/if}
			<!-- Work Selector Button -->
			<button
				type="button"
				onclick={onOpenWorkPicker}
				class="work-picker-trigger max-w-[110px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[280px] truncate rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1 shrink min-w-0"
				title={workPickerTitle}
			>
				{#if workAbbrev}
					<span class="hidden lg:inline truncate">{workTitle}</span>
					<span class="lg:hidden truncate">{workAbbrev}</span>
				{:else}
					<span class="truncate">{workTitle}</span>
				{/if}
				<span class="text-[10px] text-[var(--color-ink-soft)] shrink-0">▾</span>
			</button>

			<!-- Book & Section Navigator -->
			<div class="flex items-center gap-0.5 shrink-0">
				{#if isMultiBook && onPrevBook}
					<button
						type="button"
						onclick={onPrevBook}
						disabled={!canPrevBook}
						class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
						aria-label="Previous book"
						title="Previous Book (← / [)"
					>
						&larr;
					</button>
				{/if}

				<button
					type="button"
					onclick={onOpenSectionPicker}
					class="book-picker-trigger section-picker-trigger rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1"
					title="Jump to Book & Section (Hot key: 'c' or 'j')"
				>
					<span class="hidden sm:inline">{locationLabel}</span>
					<span class="sm:hidden">{locationShort}</span>
					<span class="text-[10px] text-[var(--color-ink-soft)]">▾</span>
				</button>

				{#if isMultiBook && onNextBook}
					<button
						type="button"
						onclick={onNextBook}
						disabled={!canNextBook}
						class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
						aria-label="Next book"
						title="Next Book (→ / ])"
					>
						&rarr;
					</button>
				{/if}

				{#if locationBadge}
					{@render locationBadge()}
				{/if}
			</div>
		</div>

		<!-- Right: Desktop controls & Mobile hamburger menu button -->
		<div class="flex items-center gap-1 sm:gap-2 shrink-0">
			<!-- Desktop Right Controls (hidden on small screens) -->
			<div class="hidden sm:flex items-center gap-1.5 sm:gap-2">
				{#if showLayoutOptions}
					<LayoutOptions bind:viewMode onchange={onViewModeChange}
					bind:isOpen={layoutIsOpen}
					{textVersions} bind:textVersionsVisible>
					{#if columnToggleButtons}
					{columnToggleButtons}
					{/if}
					</LayoutOptions>
				{/if}

				{#if showCitation && onOpenCitation}
					<button
						type="button"
						class="cite-trigger-btn inline-flex items-center gap-1 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={onOpenCitation}
						title="Cite treatise (SBL, Niese, Whiston, Chicago, BibTeX)"
					>
						<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
						</svg>
						<span class="hidden md:inline">Cite</span>
					</button>
				{/if}

				{#if showSearch && onOpenSearch}
					<button
						type="button"
						class="search-trigger-btn inline-flex items-center gap-1 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={onOpenSearch}
						title="Search & Lexicon (Hot key: '/')"
					>
						<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<span class="hidden md:inline">Search</span>
					</button>
				{/if}

				{#if showBookmarks && onOpenBookmarks}
					<button
						type="button"
						class="bookmarks-trigger-btn inline-flex items-center gap-1 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={onOpenBookmarks}
						title="Bookmarks (Hot key: 'b' when not in input)"
					>
						<span>🔖</span>
						<span class="hidden md:inline">Bookmarks</span>
					</button>
				{/if}
					
				
					<ThemeSlider
						storageKey={themeStorageKey}
						warmthStorageKey={themeWarmthStorageKey}
						profile="standard"
						align="right"
						{enableFontSizeSlider}
						bind:isOpen={showThemeSlider}

					/>
				

				{#if extraDesktopControls}
					{@render extraDesktopControls()}
				{/if}

				{#if showHelp && onOpenHelp}
					<button
						type="button"
						class="help-trigger-btn inline-flex items-center gap-1 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={onOpenHelp}
						title="Keyboard shortcuts (Hot key: '?')"
					>
						? Help
					</button>
				{/if}
			</div>

			<!-- Mobile Hamburger Button -->
			<button
				type="button"
				class="sm:hidden hamburger-btn inline-flex items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
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
				{#if showLayoutOptions}
					<div class="flex items-center gap-2">
						<span class="text-xs font-semibold text-[var(--color-ink-soft)]">Layout:</span>
						<LayoutOptions bind:viewMode onchange={onViewModeChange} />
					</div>
				{/if}

				
					<div class="flex items-center gap-2">
						<ThemeSlider
							storageKey={themeStorageKey}
							warmthStorageKey={themeWarmthStorageKey}
							profile="standard"
							align="right"
							{enableFontSizeSlider}
							
						/>
					</div>
				
			</div>

			<div class="mt-3 pt-2.5 border-t border-[var(--color-rule)] flex items-center justify-between gap-2 flex-wrap">
				{#if showSearch && onOpenSearch}
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={() => {
							isMobileMenuOpen = false;
							onOpenSearch?.();
						}}
					>
						<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<span>Search</span>
					</button>
				{/if}

				{#if showCitation && onOpenCitation}
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={() => {
							isMobileMenuOpen = false;
							onOpenCitation?.();
						}}
					>
						<svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
						</svg>
						<span>Cite</span>
					</button>
				{/if}

				{#if showBookmarks && onOpenBookmarks}
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={() => {
							isMobileMenuOpen = false;
							onOpenBookmarks?.();
						}}
					>
						<span>🔖</span>
						<span>Bookmarks</span>
					</button>
				{/if}

				{#if extraMobileControls}
					{@render extraMobileControls()}
				{/if}

				{#if showHelp && onOpenHelp}
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
						onclick={() => {
							isMobileMenuOpen = false;
							onOpenHelp?.();
						}}
					>
						<span>?</span>
						<span>Help</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}
</header>
