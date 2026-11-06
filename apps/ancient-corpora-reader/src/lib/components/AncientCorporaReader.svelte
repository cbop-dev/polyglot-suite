<script lang="ts">
	import CorpusHeader from './CorpusHeader.svelte';
	import CorpusColumnView from './CorpusColumnView.svelte';
	import CorpusSidePanel from './CorpusSidePanel.svelte';
	import CorpusPickerModalWrapper from './CorpusPickerModalWrapper.svelte';
	import WorkPickerModalWrapper from './WorkPickerModalWrapper.svelte';
	import DivisionPickerModalWrapper from './DivisionPickerModalWrapper.svelte';
	import AcademicCitationModalWrapper from './AcademicCitationModalWrapper.svelte';
	import HotkeyHelpModal from './HotkeyHelpModal.svelte';
	import { hotkeyManager } from '../services/hotkeyManager.js';

	import { readerState } from '../stores/readerState.svelte.js';
	import {
		fetchDivisionSections,
		fetchDivisionTokens,
		type TextVersion
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

	function schedulePrefetchNextDivision(corpus: AncientCorpusId, work: string, currentDiv: number) {
		if (typeof window === 'undefined') return;
		cancelPrefetch();

		const currentWork = readerState.currentWork;
		const nextDiv = currentDiv + 1;
		if (nextDiv > currentWork.totalDivisions) return;

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

	async function loadData(corpus: AncientCorpusId, work: string, division: number) {
		loading = true;
		error = null;
		textVersions = [];

		try {
			// Phase 1: Rapid First Paint (only text_units, completes in <150ms)
			const res = await fetchDivisionSections(corpus, work, division);
			textVersions = res.textVersions;
			loading = false;

			if (readerState.currentSection) {
				const s = readerState.currentSection;
				setTimeout(() => {
					const el = document.getElementById(`section-${s}`) ||
						document.getElementById(`milestone-${s}`) ||
						document.getElementById(`sec-${s}`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 120);
			}

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

	// Smooth scroll to target section when selected
	$effect(() => {
		const s = readerState.currentSection;
		if (s !== null && !loading) {
			setTimeout(() => {
				const el = document.getElementById(`section-${s}`) ||
					document.getElementById(`milestone-${s}`) ||
					document.getElementById(`sec-${s}`);
				el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 60);
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
					message={[`Opening ${readerState.currentWork.titleEnglish} (${readerState.currentWork.divisionLabel} ${readerState.currentDivision})`]}
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

	<!-- Modals -->
	<CorpusPickerModalWrapper />
	<WorkPickerModalWrapper />
	<DivisionPickerModalWrapper sectionsCount={maxSectionCount} />
	<AcademicCitationModalWrapper />
	<HotkeyHelpModal />
</div>
