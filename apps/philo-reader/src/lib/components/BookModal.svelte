<script lang="ts">
	import { CANONICAL_WORKS, type CanonicalWork, type PhiloCategory } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let searchQuery = $state<string>('');
	let selectedCategory = $state<PhiloCategory | 'all'>('all');
	let selectedIndex = $state<number>(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	const CATEGORY_LABELS: Record<PhiloCategory | 'all', string> = {
		all: 'All Treatises (31)',
		allegorical: 'Allegorical Commentary (18)',
		exposition: 'Exposition of the Law (9)',
		historical: 'Historical & Apologetic (2)',
		philosophical: 'Philosophical (2)'
	};

	let filteredWorks = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return CANONICAL_WORKS.filter((w) => {
			if (selectedCategory !== 'all' && w.category !== selectedCategory) {
				return false;
			}
			if (!q) return true;
			return (
				w.titleEnglish.toLowerCase().includes(q) ||
				w.titleLatin.toLowerCase().includes(q) ||
				w.titleGreek.toLowerCase().includes(q) ||
				w.abbrev.toLowerCase().includes(q) ||
				w.code.toLowerCase().includes(q) ||
				w.tlgId.toLowerCase().includes(q)
			);
		});
	});

	$effect(() => {
		if (open) {
			searchQuery = '';
			selectedCategory = 'all';
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
				inputEl?.select();
			}, 50);
		}
	});

	function selectWork(work: CanonicalWork) {
		readerState.setWork(work.code, 1);
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (filteredWorks.length > 0) {
				selectedIndex = (selectedIndex + 1) % filteredWorks.length;
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (filteredWorks.length > 0) {
				selectedIndex = (selectedIndex - 1 + filteredWorks.length) % filteredWorks.length;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredWorks[selectedIndex]) {
				selectWork(filteredWorks[selectedIndex]);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 sm:pt-16">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={onClose}
			aria-label="Close treatise modal"
		></button>

		<!-- Modal Container -->
		<div class="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-page)] shadow-2xl flex flex-col text-[var(--color-ink)]">
			<!-- Filter Input -->
			<div class="flex items-center gap-3 border-b border-[var(--color-rule)] px-4 py-3 bg-[var(--color-card-bg)]">
				<svg class="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={searchQuery}
					type="text"
					placeholder="Filter Philo's treatises (e.g. 'Creation', 'Opif.', 'Moses', 'Cherubim', 'Spec. Leg.')..."
					class="w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft)] focus:outline-hidden"
				/>
				<kbd class="rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-soft)]">
					Esc
				</kbd>
			</div>

			<!-- Category Filter Pills -->
			<div class="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--color-rule)] bg-[var(--color-page)] overflow-x-auto text-xs shrink-0">
				{#each (['all', 'allegorical', 'exposition', 'historical', 'philosophical'] as const) as cat}
					<button
						type="button"
						onclick={() => { selectedCategory = cat; selectedIndex = 0; }}
						class="rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer {selectedCategory === cat ? 'bg-blue-600 text-white shadow-2xs' : 'bg-[var(--color-card-bg)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] border border-[var(--color-rule)]'}"
					>
						{CATEGORY_LABELS[cat]}
					</button>
				{/each}
			</div>

			<!-- Work List -->
			<div class="flex-1 overflow-y-auto p-2">
				{#if filteredWorks.length === 0}
					<div class="p-8 text-center text-xs text-[var(--color-ink-soft)]">
						No treatises match "{searchQuery}"
					</div>
				{:else}
					{#each filteredWorks as work, idx}
						{@const isSelected = work.code === readerState.currentWorkCode}
						<button
							type="button"
							onclick={() => selectWork(work)}
							onmouseenter={() => (selectedIndex = idx)}
							class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer {idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-[var(--color-card-bg)] text-[var(--color-ink)]'}"
						>
							<div class="min-w-0 pr-3">
								<div class="text-sm font-semibold flex items-center gap-2 flex-wrap">
									<span>{work.titleEnglish}</span>
									{#if isSelected}
										<span class="rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
											Current
										</span>
									{/if}
									{#if work.totalBooks > 1}
										<span class="rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
											{work.totalBooks} Books
										</span>
									{/if}
								</div>
								<div class="text-xs text-[var(--color-ink-soft)] truncate mt-0.5">
									<span class="italic">{work.titleLatin}</span> &bull; <span class="greek-font">{work.titleGreek}</span> &bull; {work.totalSections} sections
								</div>
							</div>
							<div class="text-right shrink-0">
								<span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
									{work.abbrev}
								</span>
								<div class="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase">
									{work.tlgId}
								</div>
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-2 text-[11px] text-[var(--color-ink-soft)]">
				<span>Press <kbd class="font-bold">Enter</kbd> to select</span>
				<span>Navigate with <kbd class="font-bold">&uarr;</kbd> <kbd class="font-bold">&darr;</kbd></span>
			</div>
		</div>
	</div>
{/if}
