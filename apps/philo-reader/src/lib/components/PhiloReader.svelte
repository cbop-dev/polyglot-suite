<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import ColumnView from '$lib/components/ColumnView.svelte';
	import DockableSidePanel from '$lib/components/DockableSidePanel.svelte';
	import BookModal from '$lib/components/BookModal.svelte';
	import ChapterModal from '$lib/components/ChapterModal.svelte';
	import HotkeyHelpModal from '$lib/components/HotkeyHelpModal.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import CitationModal from '$lib/components/CitationModal.svelte';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { hotkeyManager } from '$lib/services/hotkeyManager';
	import { fetchChapterSections, type TextUnit } from '$lib/services/dbClient';

	interface Props {
		workCode?: string;
		chapter?: number;
		section?: number;
	}

	let { workCode, chapter, section }: Props = $props();

	let greekSections = $state<TextUnit[]>([]);
	let englishSections = $state<TextUnit[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Sync workCode and chapter if props change dynamically
	$effect(() => {
		if (workCode && (workCode !== readerState.currentWorkCode || (chapter !== undefined && chapter !== readerState.currentChapter))) {
			readerState.setWork(workCode, chapter ?? readerState.currentChapter, section ?? null);
		} else if (chapter !== undefined && chapter !== readerState.currentChapter) {
			readerState.setChapter(chapter, section ?? null);
		}
	});

	// Load sections whenever work or chapter changes
	$effect(() => {
		const w = readerState.currentWorkCode;
		const ch = readerState.currentChapter;
		loadSections(w, ch);
	});

	async function loadSections(workCode: string, chapter: number) {
		loading = true;
		error = null;
		try {
			const res = await fetchChapterSections(workCode, chapter);
			greekSections = res.greek;
			englishSections = res.english;

			if (readerState.currentSection) {
				const targetSec = readerState.currentSection;
				setTimeout(() => {
					const el = document.getElementById(`section-${targetSec}`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 120);
			}
		} catch (err: any) {
			console.error('Failed to load Philo sections:', err);
			error = err.message || 'Error loading texts from database';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:window onkeydown={(e) => hotkeyManager.handleKeyDown(e, readerState)} />

<div class="min-h-screen flex flex-col bg-[var(--color-page)] text-[var(--color-ink)] transition-colors duration-150">
	<Header />

	<main class="flex-1 {readerState.isSidePanelOpen ? 'mr-0 lg:mr-[440px]' : ''} transition-all duration-200">
		{#if loading}
			<div class="flex items-center justify-center py-24 text-[var(--color-ink-soft)]">
				<div class="text-center space-y-2">
					<div class="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent"></div>
					<div class="text-base font-semibold">Loading Philo Treatise...</div>
					<div class="text-xs text-[var(--color-ink-soft)]">Reading via sql.js-httpvfs range requests</div>
				</div>
			</div>
		{:else if error}
			<div class="mx-auto max-w-lg p-8 text-center text-red-600 dark:text-red-400">
				<div class="font-bold text-base">Error loading text</div>
				<div class="text-sm mt-1">{error}</div>
			</div>
		{:else}
			<ColumnView
				greek={greekSections}
				english={englishSections}
			/>
		{/if}
	</main>

	<!-- Unified Dockable Side Panel (Lexeme, Search, Highlights) -->
	<DockableSidePanel />

	<!-- Treatise Selection Modal (press 'b') -->
	<BookModal
		open={readerState.isBookModalOpen}
		onClose={() => (readerState.isBookModalOpen = false)}
	/>

	<!-- Book / Section Selection Modal (press 'c') -->
	<ChapterModal
		open={readerState.isChapterModalOpen}
		onClose={() => (readerState.isChapterModalOpen = false)}
	/>

	<!-- Keyboard Shortcuts Help Modal (press '?') -->
	<HotkeyHelpModal />

	<!-- Fast Command Palette / Passage Jumper (Cmd+K) -->
	<CommandPalette
		open={readerState.isCommandPaletteOpen}
		onClose={() => (readerState.isCommandPaletteOpen = false)}
	/>

	<!-- Academic Citation Generator Modal -->
	{#if readerState.citationTarget}
		<CitationModal
			workCode={readerState.citationTarget.workCode}
			chapter={readerState.citationTarget.chapter}
			section={readerState.citationTarget.section}
			mangeyRef={readerState.citationTarget.mangeyRef}
			isSupplement={readerState.citationTarget.isSupplement}
			onClose={() => readerState.closeCitation()}
		/>
	{/if}
</div>
