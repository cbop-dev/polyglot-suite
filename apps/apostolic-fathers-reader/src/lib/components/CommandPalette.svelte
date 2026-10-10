<script lang="ts">
	import { CANONICAL_WORKS, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
	import { SBL_ABBREVIATIONS } from '$lib/services/citationService';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let query = $state<string>('');
	let selectedIndex = $state<number>(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	interface JumpTarget {
		work: CanonicalWork;
		targetChapter: number;
		label: string;
		subLabel: string;
		badge: string;
	}

	// Parse query like "1 Clem 5", "Did 8", "Herm 12", "Ign Rom 3"
	let parsedResults = $derived.by(() => {
		const raw = query.trim().toLowerCase();
		if (!raw) {
			return CANONICAL_WORKS.map((w) => ({
				work: w,
				targetChapter: w.minChapter ?? 1,
				label: w.titleEnglish,
				subLabel: `${w.titleGreek} (${w.totalChapters} chapters)`,
				badge: SBL_ABBREVIATIONS[w.code] || w.code
			}));
		}

		// Check if user typed work + chapter e.g. "1 clem 5" or "didache 3" or "ign eph 2"
		const match = raw.match(/^(.*?)(?:\s+(\d+))?$/);
		const textPart = match ? match[1].trim() : raw;
		const chapterPart = match && match[2] ? parseInt(match[2], 10) : null;

		const matchingWorks = CANONICAL_WORKS.filter((w) => {
			const sbl = (SBL_ABBREVIATIONS[w.code] || '').toLowerCase();
			return (
				w.titleEnglish.toLowerCase().includes(textPart) ||
				w.code.toLowerCase().includes(textPart) ||
				sbl.includes(textPart) ||
				w.titleGreek.toLowerCase().includes(textPart) ||
				(w.titleLatin && w.titleLatin.toLowerCase().includes(textPart))
			);
		});

		const targets: JumpTarget[] = [];
		for (const w of matchingWorks) {
			if (chapterPart !== null) {
				const clampedCh = Math.min(Math.max(w.minChapter ?? 1, chapterPart), w.totalChapters);
				const isLat = readerState.hasLatinInChapter(w.code, clampedCh);
				targets.push({
					work: w,
					targetChapter: clampedCh,
					label: `${w.titleEnglish} — Chapter ${clampedCh}${isLat ? ' [Latin Extant]' : ''}`,
					subLabel: `${SBL_ABBREVIATIONS[w.code] || w.code} ${clampedCh}${isLat ? ' (Preserves Ancient Latin text)' : ''}`,
					badge: isLat ? 'Latin' : 'Jump to Ch'
				});
			} else {
				const hasAnyLat = readerState.hasLatinInWork(w.code);
				targets.push({
					work: w,
					targetChapter: w.minChapter ?? 1,
					label: w.titleEnglish,
					subLabel: `${w.titleGreek} (${w.totalChapters} ch)${hasAnyLat ? ' • Latin in Ch. 10–14' : ''}`,
					badge: SBL_ABBREVIATIONS[w.code] || w.code
				});
			}
		}

		return targets;
	});

	$effect(() => {
		if (open) {
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
			}, 50);
		} else {
			query = '';
		}
	});

	function selectTarget(target: JumpTarget) {
		readerState.setWork(target.work.code, target.targetChapter);
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (parsedResults.length > 0) {
				selectedIndex = (selectedIndex + 1) % parsedResults.length;
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (parsedResults.length > 0) {
				selectedIndex = (selectedIndex - 1 + parsedResults.length) % parsedResults.length;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (parsedResults[selectedIndex]) {
				selectTarget(parsedResults[selectedIndex]);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 sm:pt-20">
		<!-- Backdrop click -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={onClose}
			aria-label="Close command palette"
		></button>

		<!-- Card -->
		<div class="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col">
			<!-- Input Header -->
			<div class="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
				<svg class="h-5 w-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Type a work or reference (e.g., '1 Clem 5', 'Didache 8', 'Ign Rom 3')..."
					class="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden dark:text-slate-100"
				/>
				<kbd class="hidden sm:inline-block rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700">
					ESC
				</kbd>
			</div>

			<!-- Results list -->
			<div class="max-h-80 overflow-y-auto p-2">
				{#if parsedResults.length === 0}
					<div class="p-6 text-center text-xs text-slate-400">
						No matching Apostolic Fathers works or references found.
					</div>
				{:else}
					{#each parsedResults as item, idx}
						<button
							type="button"
							onclick={() => selectTarget(item)}
							onmouseenter={() => (selectedIndex = idx)}
							class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer {idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'}"
						>
							<div class="min-w-0 pr-3">
								<div class="text-sm font-semibold truncate">{item.label}</div>
								<div class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.subLabel}</div>
							</div>
							<span class="rounded px-2 py-0.5 text-xs font-mono font-medium shrink-0 {idx === selectedIndex ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
								{item.badge}
							</span>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer tips -->
			<div class="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
				<span>Navigate with <kbd class="font-bold">&uarr;</kbd> <kbd class="font-bold">&darr;</kbd></span>
				<span>Press <kbd class="font-bold">&crarr;</kbd> to jump</span>
			</div>
		</div>
	</div>
{/if}
