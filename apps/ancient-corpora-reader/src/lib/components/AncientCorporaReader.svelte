<script lang="ts">
	import CorpusHeader from './CorpusHeader.svelte';
	import CorpusColumnView from './CorpusColumnView.svelte';
	import CorpusSidePanel from './CorpusSidePanel.svelte';
	import WorkPickerModalWrapper from './WorkPickerModalWrapper.svelte';
	import DivisionPickerModalWrapper from './DivisionPickerModalWrapper.svelte';
	import AcademicCitationModalWrapper from './AcademicCitationModalWrapper.svelte';
	import HotkeyHelpModal from './HotkeyHelpModal.svelte';

	import { readerState } from '../stores/readerState.svelte.js';
	import {
		fetchDivisionSections,
		type TextUnit
	} from '../services/dbClient.js';
	import type { AncientCorpusId } from '@polyglot/ancient-languages';
	import { Loading } from '@polyglot/ui';

	interface Props {
		initialCorpus?: AncientCorpusId;
		initialWork?: string;
		initialDivision?: number;
		initialSection?: string | number | null;
	}

	let {
		initialCorpus = 'af',
		initialWork,
		initialDivision,
		initialSection
	}: Props = $props();

	let greekSections = $state<TextUnit[]>([]);
	let englishSections = $state<TextUnit[]>([]);
	let latinSections = $state<TextUnit[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Initialize props
	$effect.pre(() => {
		if (initialCorpus) {
			readerState.setCorpus(initialCorpus, initialWork, initialDivision, initialSection);
		}
	});

	// Load sections when corpus, work, or division changes
	$effect(() => {
		const corpus = readerState.currentCorpus;
		const work = readerState.currentWorkCode;
		const div = readerState.currentDivision;
		loadData(corpus, work, div);
	});

	async function loadData(corpus: AncientCorpusId, work: string, division: number) {
		loading = true;
		error = null;
		try {
			const res = await fetchDivisionSections(corpus, work, division);
			greekSections = res.greek;
			englishSections = res.english;
			latinSections = res.latin || [];

			if (readerState.currentSection) {
				const s = readerState.currentSection;
				setTimeout(() => {
					const el = document.getElementById(`section-${s}`) || document.getElementById(`niese-${s}`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 120);
			}
		} catch (err: any) {
			console.error('Failed to load text units:', err);
			error = err?.message || 'Error loading texts from database';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
			return;
		}

		if (e.key === 'Escape') {
			readerState.isSidePanelOpen = false;
			readerState.isWorkModalOpen = false;
			readerState.isDivisionModalOpen = false;
			readerState.showCitationModal = false;
			readerState.showHotkeyHelp = false;
			return;
		}

		if (e.key === '?' || (e.shiftKey && e.key === '/')) {
			e.preventDefault();
			readerState.showHotkeyHelp = !readerState.showHotkeyHelp;
		} else if (e.key === 'w' || e.key === 'W' || e.key === 'b' || e.key === 'B') {
			e.preventDefault();
			readerState.isWorkModalOpen = true;
		} else if (e.key === 'c' || e.key === 'C' || e.key === 's' || e.key === 'S') {
			e.preventDefault();
			readerState.isDivisionModalOpen = true;
		} else if (e.key === 'j' || e.key === 'ArrowRight') {
			e.preventDefault();
			readerState.nextDivision();
		} else if (e.key === 'k' || e.key === 'ArrowLeft') {
			e.preventDefault();
			readerState.prevDivision();
		} else if (e.key === 'p' || e.key === 'P') {
			e.preventDefault();
			readerState.viewMode = 'parallel';
		} else if (e.key === 'g' || e.key === 'G') {
			e.preventDefault();
			readerState.viewMode = 'greek';
		} else if (e.key === 'e' || e.key === 'E') {
			e.preventDefault();
			readerState.viewMode = 'english';
		} else if (e.key === 'f' || e.key === '/') {
			e.preventDefault();
			readerState.toggleSidePanel('search');
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)] flex flex-col">
	<CorpusHeader />

	<main class="flex-1">
		{#if loading && greekSections.length === 0}
			<div class="py-24 text-center">
				<Loading size="lg" title="Loading {readerState.currentWork.titleEnglish}..." />
			</div>
		{:else if error}
			<div class="mx-auto max-w-xl p-8 text-center text-red-600 bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-200 dark:border-red-900 mt-12">
				<h2 class="text-sm font-bold mb-2">Error Loading Text</h2>
				<p class="text-xs">{error}</p>
				<button
					type="button"
					onclick={() => loadData(readerState.currentCorpus, readerState.currentWorkCode, readerState.currentDivision)}
					class="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
				>
					Retry
				</button>
			</div>
		{:else}
			<CorpusColumnView
				greek={greekSections}
				english={englishSections}
				latin={latinSections}
			/>
		{/if}
	</main>

	<!-- Dockable Side Panel -->
	<CorpusSidePanel />

	<!-- Modals -->
	<WorkPickerModalWrapper />
	<DivisionPickerModalWrapper />
	<AcademicCitationModalWrapper />
	<HotkeyHelpModal />
</div>
