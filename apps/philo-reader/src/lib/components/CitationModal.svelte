<script lang="ts">
	import {
		generateAcademicCitations,
		formatLocus,
		type AcademicCitationStyle
	} from '$lib/services/citationService';
	import { WORKS_BY_CODE } from '$lib/config/canonicalWorks.generated';

	interface Props {
		workCode: string;
		chapter: number;
		section?: number | null;
		mangeyRef?: string | null;
		isSupplement?: boolean;
		onClose: () => void;
	}

	let { workCode, chapter, section = null, mangeyRef = null, isSupplement = false, onClose }: Props = $props();

	let activeEdition = $state<'grc' | 'eng'>('grc');
	let copiedId = $state<string | null>(null);

	let work = $derived(WORKS_BY_CODE[workCode]);
	let locus = $derived(formatLocus(workCode, chapter, section, mangeyRef));
	let citations = $derived(generateAcademicCitations(workCode, chapter, section, activeEdition, mangeyRef, isSupplement));

	async function copyCitation(style: AcademicCitationStyle) {
		try {
			await navigator.clipboard.writeText(style.citationText);
			copiedId = style.id;
			setTimeout(() => {
				if (copiedId === style.id) copiedId = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy citation:', err);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
	<!-- Backdrop click -->
	<button
		type="button"
		class="absolute inset-0 cursor-default"
		onclick={onClose}
		aria-label="Close citation modal"
	></button>

	<!-- Card -->
	<div class="relative z-10 w-full max-w-xl max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
			<div>
				<h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
					<span>Academic Citation</span>
					<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 text-xs font-semibold">
						{locus}
					</span>
				</h2>
				<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
					{work?.titleEnglish || workCode} &bull; {work?.titleLatin}
				</p>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
				aria-label="Close"
			>
				&times;
			</button>
		</div>

		<!-- Edition Selector Tabs -->
		<div class="flex border-b border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
			<button
				type="button"
				onclick={() => (activeEdition = 'grc')}
				class="border-b-2 px-3 py-2.5 cursor-pointer {activeEdition === 'grc' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'}"
			>
				Greek Critical Edition (Cohn-Wendland)
			</button>
			<button
				type="button"
				onclick={() => (activeEdition = 'eng')}
				class="border-b-2 px-3 py-2.5 cursor-pointer {activeEdition === 'eng' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent hover:text-slate-900 dark:hover:text-slate-200'}"
			>
				English Translation {isSupplement ? '(Supplement)' : '(Yonge 1854)'}
			</button>
		</div>

		<!-- List of Citations -->
		<div class="flex-1 overflow-y-auto p-4 space-y-3">
			{#each citations as style}
				<div class="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
					<div class="flex items-center justify-between mb-1.5">
						<div>
							<span class="text-xs font-bold text-slate-800 dark:text-slate-200">{style.name}</span>
							<p class="text-[11px] text-slate-500 dark:text-slate-400">{style.description}</p>
						</div>
						<button
							type="button"
							onclick={() => copyCitation(style)}
							class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all cursor-pointer {copiedId === style.id ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}"
						>
							{#if copiedId === style.id}
								<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Copied!
							{:else}
								<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
								</svg>
								Copy
							{/if}
						</button>
					</div>

					{#if style.id.startsWith('bibtex')}
						<pre class="mt-2 rounded-lg bg-slate-900 text-slate-100 p-2.5 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto selection:bg-blue-600 selection:text-white">{style.citationText}</pre>
					{:else}
						<div class="mt-1 text-xs font-serif text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 select-all">
							{style.citationText}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
