<script lang="ts">
	import { base } from '$app/paths';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { APP_VERSION, APP_REPO } from '$lib/config/version';
	import { ReaderHeader } from '@polyglot/ui';

	let currentWork = $derived(readerState.currentWork);
	let isMultiBook = $derived(currentWork.totalBooks > 1);
</script>

<ReaderHeader
	title="Philo Reader"
	titleShort="Philo"
	version={APP_VERSION}
	repoHref={APP_REPO}
	suiteHref="{base}/"
	homeHref="{base}/"
	workTitle={currentWork.titleEnglish}
	workAbbrev={currentWork.abbrev}
	onOpenWorkPicker={() => readerState.openBookModal()}
	locationLabel={isMultiBook
		? `Book ${readerState.currentChapter}, §${readerState.currentSection || 1}`
		: `§ ${readerState.currentSection || 1}`}
	locationShort={isMultiBook
		? `${readerState.currentChapter}.${readerState.currentSection || 1}`
		: `§${readerState.currentSection || 1}`}
	{isMultiBook}
	onPrevBook={() => readerState.prevChapter()}
	onNextBook={() => readerState.nextChapter()}
	onOpenSectionPicker={() => readerState.openChapterModal()}
	bind:viewMode={readerState.viewMode}
	themeStorageKey="philo_reading_theme"
	themeWarmthStorageKey="philo_reading_warmth"
	onOpenCitation={() =>
		readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter)}
	onOpenSearch={() => readerState.toggleSearch()}
	onOpenHelp={() => readerState.toggleHotkeyHelp()}
/>
