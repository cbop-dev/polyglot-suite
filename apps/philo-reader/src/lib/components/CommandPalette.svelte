<script lang="ts">
	import { CANONICAL_WORKS, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
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
		targetSection?: number;
		label: string;
		subLabel: string;
		badge: string;
	}

	let parsedResults = $derived.by(() => {
		const raw = query.trim().toLowerCase();
		if (!raw) {
			return CANONICAL_WORKS.map((w) => ({
				work: w,
				targetChapter: 1,
				targetSection: 1,
				label: w.titleEnglish,
				subLabel: `${w.titleLatin} • ${w.abbrev} (${w.totalSections} sections)`,
				badge: w.abbrev
			}));
		}

		// Check if user typed work + book.section e.g. "leg 2.14" or "spec leg 1 177" or "opif 10"
		// Pattern: "<treatise_str> <num1>[.: ]<num2>" or "<treatise_str> <num1>"
		const matchComplex = raw.match(/^(.*?)(?:\s+(\d+)(?:[.:\s]+(\d+))?)?$/);
		const textPart = matchComplex ? matchComplex[1].trim() : raw;
		const num1 = matchComplex && matchComplex[2] ? parseInt(matchComplex[2], 10) : null;
		const num2 = matchComplex && matchComplex[3] ? parseInt(matchComplex[3], 10) : null;

		const matchingWorks = CANONICAL_WORKS.filter((w) => {
			return (
				w.titleEnglish.toLowerCase().includes(textPart) ||
				w.titleLatin.toLowerCase().includes(textPart) ||
				w.abbrev.toLowerCase().includes(textPart) ||
				w.code.toLowerCase().includes(textPart) ||
				w.titleGreek.toLowerCase().includes(textPart)
			);
		});

		const targets: JumpTarget[] = [];
		for (const w of matchingWorks) {
			if (w.totalBooks > 1) {
				// Multi-book treatise
				if (num1 !== null && num2 !== null) {
					// num1 = book, num2 = section
					const b = Math.min(Math.max(1, num1), w.totalBooks);
					const maxSec = w.sectionsByBook?.[b] || w.totalSections;
					const s = Math.min(Math.max(1, num2), maxSec);
					targets.push({
						work: w,
						targetChapter: b,
						targetSection: s,
						label: `${w.titleEnglish} — Book ${b}, § ${s}`,
						subLabel: `${w.abbrev} ${b}.${s}`,
						badge: 'Jump to §'
					});
				} else if (num1 !== null) {
					// num1 might be book (if <= totalBooks) or section in book 1
					if (num1 <= w.totalBooks) {
						targets.push({
							work: w,
							targetChapter: num1,
							targetSection: 1,
							label: `${w.titleEnglish} — Book ${num1}`,
							subLabel: `${w.abbrev} ${num1}`,
							badge: 'Jump to Book'
						});
					} else {
						// treated as section in book 1
						targets.push({
							work: w,
							targetChapter: 1,
							targetSection: num1,
							label: `${w.titleEnglish} — Book 1, § ${num1}`,
							subLabel: `${w.abbrev} 1.${num1}`,
							badge: 'Jump to §'
						});
					}
				} else {
					targets.push({
						work: w,
						targetChapter: 1,
						targetSection: 1,
						label: w.titleEnglish,
						subLabel: `${w.titleLatin} (${w.totalBooks} books, ${w.totalSections} sections)`,
						badge: w.abbrev
					});
				}
			} else {
				// Single-book treatise
				if (num1 !== null) {
					const s = Math.min(Math.max(1, num1), w.totalSections);
					targets.push({
						work: w,
						targetChapter: 1,
						targetSection: s,
						label: `${w.titleEnglish} — § ${s}`,
						subLabel: `${w.abbrev} ${s}`,
						badge: 'Jump to §'
					});
				} else {
					targets.push({
						work: w,
						targetChapter: 1,
						targetSection: 1,
						label: w.titleEnglish,
						subLabel: `${w.titleLatin} (${w.totalSections} sections)`,
						badge: w.abbrev
					});
				}
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
		readerState.setWork(target.work.code, target.targetChapter, target.targetSection ?? 1);
		onClose();
		if (target.targetSection) {
			setTimeout(() => {
				const el = document.getElementById(`section-${target.targetSection}`);
				el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 150);
		}
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
		<div class="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-page)] shadow-2xl flex flex-col text-[var(--color-ink)]">
			<!-- Input Header -->
			<div class="flex items-center gap-3 border-b border-[var(--color-rule)] px-4 py-3 bg-[var(--color-card-bg)]">
				<svg class="h-5 w-5 text-[var(--color-ink-soft)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Jump to treatise or section (e.g. 'Opif 10', 'Leg 2.14', 'Moses 1')..."
					class="w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft)] focus:outline-hidden"
				/>
				<kbd class="hidden sm:inline-block rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">
					ESC
				</kbd>
			</div>

			<!-- Results list -->
			<div class="max-h-80 overflow-y-auto p-2">
				{#if parsedResults.length === 0}
					<div class="p-6 text-center text-xs text-[var(--color-ink-soft)]">
						No matching Philo treatises or sections found.
					</div>
				{:else}
					{#each parsedResults as item, idx}
						<button
							type="button"
							onclick={() => selectTarget(item)}
							onmouseenter={() => (selectedIndex = idx)}
							class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer {idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-[var(--color-card-bg)] text-[var(--color-ink)]'}"
						>
							<div class="min-w-0 pr-3">
								<div class="text-sm font-semibold truncate">{item.label}</div>
								<div class="text-xs text-[var(--color-ink-soft)] truncate mt-0.5">{item.subLabel}</div>
							</div>
							<span class="rounded px-2 py-0.5 text-xs font-mono font-medium shrink-0 {idx === selectedIndex ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200' : 'bg-[var(--color-card-bg)] border border-[var(--color-rule)] text-[var(--color-ink-soft)]'}">
								{item.badge}
							</span>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer tips -->
			<div class="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-2 text-[11px] text-[var(--color-ink-soft)]">
				<span>Navigate with <kbd class="font-bold">&uarr;</kbd> <kbd class="font-bold">&darr;</kbd></span>
				<span>Press <kbd class="font-bold">&crarr;</kbd> to jump</span>
			</div>
		</div>
	</div>
{/if}
