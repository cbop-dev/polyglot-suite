<script lang="ts">
	import { base } from '$app/paths';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { ReaderHeader, type ViewMode } from '@polyglot/ui';

	let currentWork = $derived(readerState.currentWork);
	let hasLatinInCurrentChapter = $derived(readerState.hasLatinInChapter());

	let viewMode = $derived.by<ViewMode>(() => {
		if (readerState.showGreek && readerState.showEnglish) return 'parallel';
		if (readerState.showGreek && !readerState.showEnglish) return 'greek';
		if (!readerState.showGreek && readerState.showEnglish) return 'english';
		return 'parallel';
	});

	function handleViewModeChange(mode: ViewMode) {
		if (mode === 'parallel' || mode === 'stacked') {
			readerState.showGreek = true;
			readerState.showEnglish = true;
		} else if (mode === 'greek') {
			readerState.showGreek = true;
			readerState.showEnglish = false;
		} else if (mode === 'english') {
			readerState.showGreek = false;
			readerState.showEnglish = true;
		}
	}
</script>

<ReaderHeader
	title="Apostolic Fathers"
	titleShort="AF"
	suiteHref="{base}/"
	homeHref="{base}/"
	workTitle={currentWork.titleEnglish}
	workAbbrev={currentWork.code}
	onOpenWorkPicker={() => readerState.openBookModal()}
	locationLabel={readerState.currentChapter === 0 ? 'Sal.' : `Ch. ${readerState.currentChapter}`}
	locationShort={readerState.currentChapter === 0 ? 'Sal.' : `${readerState.currentChapter}`}
	isMultiBook={false}
	onPrevBook={() => readerState.prevChapter()}
	onNextBook={() => readerState.nextChapter()}
	onOpenSectionPicker={() => readerState.openChapterModal()}
	{viewMode}
	onViewModeChange={handleViewModeChange}
	themeStorageKey="af_reading_theme"
	themeWarmthStorageKey="af_reading_warmth"
	onOpenCitation={() =>
		readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter)}
	onOpenSearch={() => readerState.openSearchTab()}
	onOpenHelp={() => readerState.toggleHotkeyHelp()}
>
	{#snippet locationBadge()}
		{#if hasLatinInCurrentChapter}
			<span
				class="hidden md:inline-flex items-center gap-1 ml-1 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 select-none"
				title="Ancient Latin text supplies the lacuna in this chapter"
			>
				Latin Extant
			</span>
		{/if}
	{/snippet}

	{#snippet extraDesktopControls()}
		{#if hasLatinInCurrentChapter}
			<label
				class="inline-flex items-center gap-1 cursor-pointer text-xs font-semibold text-amber-800 dark:text-amber-300"
				title="Ancient Latin text is extant in this chapter"
			>
				<input type="checkbox" bind:checked={readerState.showLatin} class="rounded text-amber-600" />
				Latin
				<span class="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
			</label>
		{/if}
	{/snippet}

	{#snippet extraMobileControls()}
		{#if hasLatinInCurrentChapter}
			<label
				class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 cursor-pointer"
			>
				<input type="checkbox" bind:checked={readerState.showLatin} class="rounded text-amber-600" />
				<span>Latin</span>
			</label>
		{/if}
	{/snippet}
</ReaderHeader>
