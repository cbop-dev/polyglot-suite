<script lang="ts">
	import { tick } from 'svelte';
	import {resolve} from '$app/paths';
	import CorpusHeader from './CorpusHeader.svelte';
	import Footer from './Footer.svelte';
	import CorpusColumnView from './CorpusColumnView.svelte';
	import CorpusSidePanel from './CorpusSidePanel.svelte';
	import CorpusPickerModalWrapper from './CorpusPickerModalWrapper.svelte';
	import WorkPickerModalWrapper from './WorkPickerModalWrapper.svelte';
	import DivisionPickerModalWrapper from './DivisionPickerModalWrapper.svelte';
	import AcademicCitationModalWrapper from './AcademicCitationModalWrapper.svelte';
	import HotkeyHelpModal from './HotkeyHelpModal.svelte';
	import { hotkeyManager } from '../services/hotkeyManager.js';

	import { readerState } from '../stores/readerState.svelte.js';
	import { formatPageLabel, getAdjacentPage } from '../config/corpora.data.js';
	import {
		fetchDivisionSections,
		fetchDivisionTokens,
		type TextVersion
	} from '../services/dbClient.js';
	import type { AncientCorpusId } from '@polyglot/ancient-languages';
	import { Loading, Modal2 } from '@polyglot/ui';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';
	
	interface Props {
		initialCorpus?: AncientCorpusId;
		initialWork?: string;
		initialDivision?: string | number;
		initialSection?: string | number | null;
	}

	let {
		initialCorpus = 'af',
		initialWork,
		initialDivision,
		initialSection
	}: Props = $props();

	let textVersions = $state<TextVersion[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Initialize props
	$effect.pre(() => {
		if (initialCorpus) {
			readerState.setCorpus(initialCorpus, initialWork, initialDivision, initialSection);
		}
	});

	// Sync section from URL hash if provided
	$effect(() => {
		if (typeof window !== 'undefined') {
			const updateFromHash = () => {
				const hash = window.location.hash;
				if (hash) {
					const m = hash.match(/#(?:section-|sec-|niese-)?(\d+)/i);
					if (m && m[1]) {
						readerState.currentSection = parseInt(m[1], 10);
					}
				}
			};
			updateFromHash();
			window.addEventListener('hashchange', updateFromHash);
			return () => window.removeEventListener('hashchange', updateFromHash);
		}
	});

	let prefetchTimer: any = null;

	function cancelPrefetch() {
		if (prefetchTimer !== null && typeof window !== 'undefined') {
			if ('cancelIdleCallback' in window && typeof prefetchTimer === 'number') {
				(window as any).cancelIdleCallback(prefetchTimer);
			} else {
				clearTimeout(prefetchTimer);
			}
			prefetchTimer = null;
		}
	}

	function schedulePrefetchNextDivision(corpus: AncientCorpusId, work: string, currentDiv: string) {
		if (typeof window === 'undefined') return;
		cancelPrefetch();

		const currentWork = readerState.currentWork;
		const nextDiv = getAdjacentPage(currentWork, currentDiv, 1);
		if (!nextDiv) return;

		const runPrefetch = () => {
			fetchDivisionSections(corpus, work, nextDiv).catch(() => {});
		};

		if ('requestIdleCallback' in window) {
			prefetchTimer = (window as any).requestIdleCallback(runPrefetch, { timeout: 10000 });
		} else {
			prefetchTimer = setTimeout(runPrefetch, 6000);
		}
	}

	// Load sections when corpus, work, or division changes
	$effect(() => {
		const corpus = readerState.currentCorpus;
		const work = readerState.currentWorkCode;
		const div = readerState.currentDivision;
		loadData(corpus, work, div);
		return () => {
			cancelPrefetch();
		};
	});

	async function loadData(corpus: AncientCorpusId, work: string, division: string) {
		loading = true;
		error = null;
		textVersions = [];

		try {
			// Phase 1: Rapid First Paint (only text_units, completes in <150ms)
			const res = await fetchDivisionSections(corpus, work, division);
			textVersions = res.textVersions;
			wasJustLoaded = true;
			loading = false;

			// Phase 2: Progressive Token Hydration in background
			const unitIdsToHydrate: number[] = [];
			for (const v of textVersions) {
				for (const u of v.textUnits) {
					if (!u.tokens || u.tokens.length === 0) {
						unitIdsToHydrate.push(u.id);
					}
				}
			}

			if (unitIdsToHydrate.length > 0) {
				fetchDivisionTokens(corpus, unitIdsToHydrate, (batchMap) => {
					if (
						readerState.currentCorpus !== corpus ||
						readerState.currentWorkCode !== work ||
						readerState.currentDivision !== division
					) {
						return;
					}

					let updated = false;
					for (const v of textVersions) {
						for (const u of v.textUnits) {
							const tok = batchMap.get(u.id);
							if (tok) {
								u.tokens = tok;
								updated = true;
							}
						}
					}

					if (updated) {
						textVersions = [...textVersions];
					}
				}).catch((err) => {
					console.warn('Background token hydration error:', err);
				});
			}

			// Pre-fetch subsequent division in idle time so next-division navigation is instantaneous
			schedulePrefetchNextDivision(corpus, work, division);
		} catch (err: any) {
			console.error('Failed to load text units:', err);
			error = err?.message || 'Error loading texts from database';
		} finally {
			loading = false;
		}
	}

	let wasJustLoaded = false;
	let isNavigatingToSection = false;

	async function scrollToTargetSection(target: string | number | null, isInitialLoad: boolean = false) {
		if (target === null || target === undefined || typeof window === 'undefined') return;
		if (isNavigatingToSection && !isInitialLoad) return;
		isNavigatingToSection = true;

		try {
			// Wait for Svelte reactivity to propagate targetSection to ParallelColumnView
			// and mount the target batch
			await tick();

			const findElement = () =>
				document.getElementById(`section-${target}`) ||
				document.getElementById(`milestone-${target}`) ||
				document.getElementById(`sec-${target}`);

			let el = findElement();

			// If element is not yet in DOM, give batch rendering a frame to mount
			if (!el) {
				await new Promise((resolve) => requestAnimationFrame(resolve));
				await tick();
				el = findElement();
			}

			if (!el) return;

			// Layer 1: Target Normalization - ensure we target the container section row,
			// not an inner invisible 1px <span class="sr-only"> milestone
			const row = (el.closest('.section-row') as HTMLElement) || el;

			// Layer 3: Dynamic Header Measurement
			const headerEl = document.querySelector('header.page-header');
			const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 60;
			const targetOffset = headerBottom + 20; // 20px comfortable clearance below bottom of header

			// Distance-aware scroll:
			const rect = row.getBoundingClientRect();
			const dist = Math.abs(rect.top - targetOffset);
			const isNearby = !isInitialLoad && dist <= 1800;

			if (isNearby) {
				row.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} else {
				// Instant jump prevents content-visibility under-scrolling on large distances
				row.scrollIntoView({ behavior: 'auto', block: 'start' });

				// Fine-tune offset in next frame after browser computes exact layout
				requestAnimationFrame(() => {
					const r = row.getBoundingClientRect();
					if (Math.abs(r.top - targetOffset) > 10) {
						window.scrollBy({ top: r.top - targetOffset, behavior: 'auto' });
					}
				});
			}

			// Arrival feedback highlight
			row.classList.add('arrival-highlight');
			setTimeout(() => {
				row?.classList.remove('arrival-highlight');
			}, 1200);
		} finally {
			isNavigatingToSection = false;
		}
	}

	// Scroll to target section when selected or when data loads with target section
	$effect(() => {
		const s = readerState.currentSection;
		if (s !== null && !loading) {
			const isInitial = wasJustLoaded;
			wasJustLoaded = false;
			scrollToTargetSection(s, isInitial);
		}
	});

	let maxSectionCount = $derived(
		textVersions.length > 0 ? Math.max(0, ...textVersions.map((v) => v.textUnits.length)) : 0
	);
</script>

<svelte:window onkeydown={(e) => hotkeyManager.handleKeyDown(e, readerState)} />

<div class="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)] flex flex-col">
	<CorpusHeader />

	<main class="flex-1">
		{#if loading}
			<div class="py-24 text-center">
				<Loading
					size="lg"
					title="Loading {readerState.currentCorpusConfig.name}..."
					message={[`Opening ${readerState.currentWork.titleEnglish} (${formatPageLabel(readerState.currentWork, readerState.currentDivision)})`]}
				/>
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
			<CorpusColumnView {textVersions} isLoading={loading} />
		{/if}
	</main>

	<!-- Dockable Side Panel -->
	<CorpusSidePanel />

	<!-- Footer -->
	<Footer />

	<!-- Modals -->
	<CorpusPickerModalWrapper />
	<WorkPickerModalWrapper />
	<DivisionPickerModalWrapper sectionsCount={maxSectionCount} />
	<AcademicCitationModalWrapper />
	<HotkeyHelpModal />
	<Modal2
		bind:showModal={readerState.showThemeSlider}
		title="Reading Comfort"
		maxWidth="!max-w-[340px] !p-5 sm:!p-6"
		showMaximize={false}
		onclose={() => (readerState.showThemeSlider = false)}
	>
		<ThemeSlider
			variant="panel"
			storageKey="ne-reading-theme"
			warmthStorageKey="ne-reading-warmth"
			enableFontSizeSlider={true}
			profile="standard"
		/>
	</Modal2>
</div>

<style>
	:global(.section-row.arrival-highlight) {
		animation: section-arrival-pulse 1.2s ease-out;
	}
	@keyframes section-arrival-pulse {
		0% {
			background-color: rgba(59, 130, 246, 0.22);
		}
		100% {
			background-color: transparent;
		}
	}
</style>
