<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let searchQuery = $state<string>('');
	let selectedIndex = $state<number>(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	let currentWork = $derived(readerState.currentWork);
	let isMultiBook = $derived(currentWork.totalBooks > 1);

	let allBooks = $derived.by(() => {
		const list: { book: number; label: string; sections: number }[] = [];
		for (let i = 1; i <= currentWork.totalBooks; i++) {
			const secCount = currentWork.sectionsByBook?.[i] || currentWork.totalSections;
			list.push({
				book: i,
				label: isMultiBook ? `Book ${i}` : 'Complete Treatise',
				sections: secCount
			});
		}
		return list;
	});

	let maxSectionInBook = $derived.by(() => {
		if (currentWork.sectionsByBook && currentWork.sectionsByBook[readerState.currentChapter]) {
			return currentWork.sectionsByBook[readerState.currentChapter];
		}
		return currentWork.totalSections;
	});

	$effect(() => {
		if (open) {
			searchQuery = '';
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
				inputEl?.select();
			}, 50);
		}
	});

	function selectBook(b: number) {
		readerState.setChapter(b);
		onClose();
	}

	function jumpToSection(secNum: number) {
		const clamped = Math.max(1, Math.min(secNum, maxSectionInBook));
		readerState.currentSection = clamped;
		onClose();
		setTimeout(() => {
			const el = document.getElementById(`section-${clamped}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const val = parseInt(searchQuery.trim(), 10);
			if (!isNaN(val) && val > 0) {
				if (isMultiBook && val <= currentWork.totalBooks && val > 0 && searchQuery.trim().length === 1) {
					selectBook(val);
				} else {
					jumpToSection(val);
				}
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 sm:pt-20">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={onClose}
			aria-label="Close navigation modal"
		></button>

		<!-- Modal Container -->
		<div class="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-page)] shadow-2xl flex flex-col text-[var(--color-ink)]">
			<!-- Header / Quick Jump -->
			<div class="border-b border-[var(--color-rule)] px-4 py-3 bg-[var(--color-card-bg)]">
				<div class="flex items-center gap-2">
					<svg class="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
					</svg>
					<input
						bind:this={inputEl}
						bind:value={searchQuery}
						type="text"
						placeholder="Jump to section (1..{maxSectionInBook})..."
						class="w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft)] focus:outline-hidden"
					/>
					<kbd class="rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-soft)]">
						Esc
					</kbd>
				</div>
			</div>

			<!-- Multi-book selection (if work has > 1 book) -->
			{#if isMultiBook}
				<div class="p-3 border-b border-[var(--color-rule)] bg-[var(--color-page)]">
					<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2 block">
						Select Book
					</span>
					<div class="grid grid-cols-2 gap-2">
						{#each allBooks as item}
							{@const isSelected = item.book === readerState.currentChapter}
							<button
								type="button"
								onclick={() => selectBook(item.book)}
								class="flex items-center justify-between rounded-xl p-2.5 text-left border transition-all cursor-pointer {isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-bold shadow-2xs' : 'border-[var(--color-rule)] bg-[var(--color-card-bg)] text-[var(--color-ink)] hover:bg-[var(--color-rule)]'}"
							>
								<span>{item.label}</span>
								<span class="text-xs text-[var(--color-ink-soft)] font-normal">{item.sections} §</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Quick Section Jump Grid -->
			<div class="p-3 max-h-60 overflow-y-auto">
				<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2 block">
					Sections in {isMultiBook ? `Book ${readerState.currentChapter}` : currentWork.abbrev} (Total {maxSectionInBook})
				</span>
				<div class="grid grid-cols-5 gap-1.5 text-center">
					{#each [1, 10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 350].filter(n => n <= maxSectionInBook) as n}
						<button
							type="button"
							onclick={() => jumpToSection(n)}
							class="rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors cursor-pointer"
						>
							§ {n}
						</button>
					{/each}
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-2 text-[11px] text-[var(--color-ink-soft)]">
				<span>Type section & press <kbd class="font-bold">Enter</kbd></span>
				<span class="font-mono">{currentWork.abbrev} {isMultiBook ? `${readerState.currentChapter}.` : ''}1–{maxSectionInBook}</span>
			</div>
		</div>
	</div>
{/if}
