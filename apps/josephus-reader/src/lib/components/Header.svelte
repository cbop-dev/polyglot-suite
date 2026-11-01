<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { APP_VERSION, APP_REPO } from '$lib/config/version';
	import { ReaderHeader } from '@polyglot/ui';

	let currentWork = $derived(readerState.currentWork);
	let isMultiBook = $derived(currentWork.totalBooks > 1);

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

<ReaderHeader
	title="Josephus Reader"
	titleShort="Josephus"
	version={APP_VERSION}
	repoHref={APP_REPO}
	suiteHref="{base}/"
	homeHref="{base}/"
	workTitle={currentWork.titleEnglish}
	workAbbrev={currentWork.abbrev}
	onOpenWorkPicker={() => readerState.openBookModal()}
	locationLabel={isMultiBook
		? `Book ${readerState.currentBook}, §${readerState.currentSection || 1}`
		: `§ ${readerState.currentSection || 1}`}
	locationShort={isMultiBook
		? `${readerState.currentBook}.${readerState.currentSection || 1}`
		: `§${readerState.currentSection || 1}`}
	{isMultiBook}
	canPrevBook={readerState.currentBook > 1}
	canNextBook={readerState.currentBook < currentWork.totalBooks}
	onPrevBook={prevBook}
	onNextBook={nextBook}
	onOpenSectionPicker={() => readerState.openChapterModal()}
	bind:viewMode={readerState.viewMode}
	themeStorageKey="josephus_reading_theme"
	themeWarmthStorageKey="josephus_reading_warmth"
	onOpenCitation={() =>
		readerState.openCitation(
			readerState.currentWorkCode,
			readerState.currentBook,
			readerState.currentSection || '1'
		)}
	onOpenSearch={() => readerState.toggleSearch('search')}
	onOpenHelp={() => readerState.openHotkeyHelp()}
/>
