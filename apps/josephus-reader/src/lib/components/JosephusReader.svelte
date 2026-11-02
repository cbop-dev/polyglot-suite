<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import ColumnView from '$lib/components/ColumnView.svelte';
	import DockableSidePanel from '$lib/components/DockableSidePanel.svelte';
	import BookModal from '$lib/components/BookModal.svelte';
	import ChapterModal from '$lib/components/ChapterModal.svelte';
	import HotkeyHelpModal from '$lib/components/HotkeyHelpModal.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import CitationModal from '$lib/components/CitationModal.svelte';
	import BookmarksModal from '$lib/components/BookmarksModal.svelte';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { hotkeyManager } from '$lib/services/hotkeyManager';
	import { fetchBookSections, type TextUnit } from '$lib/services/dbClient';

	interface Props {
		workCode?: string;
		book?: number;
		section?: string | number | null;
	}

	let { workCode, book, section }: Props = $props();

	let greekSections = $state<TextUnit[]>([]);
	let englishSections = $state<TextUnit[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Sync props to readerState
	$effect(() => {
		if (workCode && (workCode !== readerState.currentWorkCode || (book !== undefined && book !== readerState.currentBook))) {
			readerState.setWork(workCode, book ?? readerState.currentBook, section ?? null);
		} else if (book !== undefined && book !== readerState.currentBook) {
			readerState.setBook(book, section ?? null);
		} else if (section !== undefined && section !== readerState.currentSection) {
			readerState.currentSection = section;
		}
	});

	// Load sections whenever work or book changes
	$effect(() => {
		const w = readerState.currentWorkCode;
		const b = readerState.currentBook;
		loadSections(w, b);
	});

	async function loadSections(workCode: string, bookNum: number) {
		loading = true;
		error = null;
		try {
			const res = await fetchBookSections(workCode, bookNum);
			greekSections = res.greek;
			englishSections = res.english;

			if (readerState.currentSection) {
				const s = readerState.currentSection;
				setTimeout(() => {
					const el = document.getElementById(`niese-${s}`) || document.getElementById(`section-${s}`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 120);
			}
		} catch (err: any) {
			console.error('Failed to load Josephus sections:', err);
			error = err.message || 'Error loading texts from database';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:window onkeydown={(e) => hotkeyManager.handleKeyDown(e, readerState)} />

<svelte:head>
	<title>{readerState.currentWork.titleEnglish} — Book {readerState.currentBook} | Josephus Reader</title>
	<meta name="description" content="Parallel Greek & English Reader for Flavius Josephus ({readerState.currentWork.titleEnglish}) with morphological analysis and LSJ lexicon." />
</svelte:head>

<div class="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)] flex flex-col">
	<Header />

	<main class="flex-1">
		{#if loading && greekSections.length === 0}
			<div class="py-24 text-center">
				<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
				<p class="mt-4 text-xs font-semibold text-[var(--color-ink-soft)]">
					Loading {readerState.currentWork.titleEnglish} Book {readerState.currentBook}...
				</p>
			</div>
		{:else if error}
			<div class="mx-auto max-w-xl p-8 text-center text-red-600 bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-200 dark:border-red-900 mt-12">
				<h2 class="text-sm font-bold mb-2">Error Loading Text</h2>
				<p class="text-xs">{error}</p>
			</div>
		{:else}
			<ColumnView greek={greekSections} english={englishSections} />
		{/if}
	</main>

	<!-- Dockable Side Panel -->
	<DockableSidePanel />

	<!-- Modals -->
	<BookModal bind:open={readerState.isBookModalOpen} onClose={() => (readerState.isBookModalOpen = false)} />
	<ChapterModal bind:open={readerState.isChapterModalOpen} onClose={() => (readerState.isChapterModalOpen = false)} />
	<CommandPalette open={readerState.isCommandPaletteOpen} onClose={() => (readerState.isCommandPaletteOpen = false)} />
	<HotkeyHelpModal open={readerState.showHotkeyHelp} onClose={() => (readerState.showHotkeyHelp = false)} />
	<BookmarksModal open={readerState.showBookmarksModal} onClose={() => (readerState.showBookmarksModal = false)} />

	{#if readerState.citationTarget}
		<CitationModal
			workCode={readerState.citationTarget.workCode}
			book={readerState.citationTarget.book}
			section={readerState.citationTarget.section}
			onClose={() => (readerState.citationTarget = null)}
		/>
	{/if}
</div>
