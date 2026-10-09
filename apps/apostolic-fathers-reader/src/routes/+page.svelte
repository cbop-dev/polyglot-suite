<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import ColumnView from '$lib/components/ColumnView.svelte';
	import LemmaModal from '$lib/components/LemmaModal.svelte';
	import LemmaSearchPanel from '$lib/components/LemmaSearchPanel.svelte';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { fetchChapterSections, type TextUnit } from '$lib/services/dbClient';

	let greekSections = $state<TextUnit[]>([]);
	let englishSections = $state<TextUnit[]>([]);
	let latinSections = $state<TextUnit[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

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
			latinSections = res.latin;
		} catch (err: any) {
			console.error('Failed to load sections:', err);
			error = err.message || 'Error loading texts from database';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
			return;
		}
		if (e.key === 'ArrowRight') {
			readerState.nextChapter();
		} else if (e.key === 'ArrowLeft') {
			readerState.prevChapter();
		} else if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
			e.preventDefault();
			readerState.toggleSearch();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
	<Header />

	<main class="flex-1">
		{#if loading}
			<div class="flex items-center justify-center py-20 text-slate-400">
				<div class="text-center">
					<div class="text-base font-semibold">Loading chapter...</div>
					<div class="text-xs text-slate-500 mt-1">Connecting to sql.js-httpvfs database</div>
				</div>
			</div>
		{:else if error}
			<div class="mx-auto max-w-lg p-6 text-center text-red-600 dark:text-red-400">
				<div class="font-bold">Error loading text</div>
				<div class="text-sm mt-1">{error}</div>
			</div>
		{:else}
			<ColumnView
				greek={greekSections}
				english={englishSections}
				latin={latinSections}
			/>
		{/if}
	</main>

	<!-- Lemma inspection modal -->
	<LemmaModal />

	<!-- Fast Lemma search panel -->
	<LemmaSearchPanel />
</div>
