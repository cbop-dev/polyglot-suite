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

	let allChapters = $derived.by(() => {
		const min = readerState.currentWork.minChapter ?? 1;
		const max = readerState.currentWork.totalChapters;
		const list: { chapter: number; label: string; isLatin: boolean }[] = [];
		for (let i = min; i <= max; i++) {
			list.push({
				chapter: i,
				label: i === 0 ? 'Salutation' : `Chapter ${i}`,
				isLatin: readerState.hasLatinInChapter(readerState.currentWorkCode, i)
			});
		}
		return list;
	});

	let filteredChapters = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return allChapters;

		return allChapters.filter((c) => {
			if (c.chapter.toString() === q || c.chapter.toString().startsWith(q)) return true;
			if (c.label.toLowerCase().includes(q)) return true;
			if (q === 'lat' || q === 'latin') return c.isLatin;
			return false;
		});
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

	function selectChapter(ch: number) {
		readerState.setChapter(ch);
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (filteredChapters.length > 0) {
				selectedIndex = (selectedIndex + 1) % filteredChapters.length;
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (filteredChapters.length > 0) {
				selectedIndex = (selectedIndex - 1 + filteredChapters.length) % filteredChapters.length;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredChapters[selectedIndex]) {
				selectChapter(filteredChapters[selectedIndex].chapter);
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
			aria-label="Close chapter modal"
		></button>

		<!-- Modal Container -->
		<div class="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-page)] shadow-2xl flex flex-col text-[var(--color-ink)]">
			<!-- Filter Input -->
			<div class="flex items-center gap-3 border-b border-[var(--color-rule)] px-4 py-3 bg-[var(--color-card-bg)]">
				<svg class="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={searchQuery}
					type="text"
					placeholder="Type chapter number (1, 2, 3...)..."
					class="w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft)] focus:outline-hidden"
				/>
				<kbd class="rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-soft)]">
					Esc
				</kbd>
			</div>

			<!-- Chapter List -->
			<div class="max-h-72 overflow-y-auto p-2 grid grid-cols-1 gap-1">
				{#if filteredChapters.length === 0}
					<div class="p-6 text-center text-xs text-[var(--color-ink-soft)]">
						No chapters match "{searchQuery}"
					</div>
				{:else}
					{#each filteredChapters as item, idx}
						{@const isSelected = item.chapter === readerState.currentChapter}
						<button
							type="button"
							onclick={() => selectChapter(item.chapter)}
							onmouseenter={() => (selectedIndex = idx)}
							class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer {idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-[var(--color-card-bg)] text-[var(--color-ink)]'}"
						>
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold">{item.label}</span>
								{#if isSelected}
									<span class="rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
										Active
									</span>
								{/if}
								{#if item.isLatin}
									<span class="rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
										Latin Extant
									</span>
								{/if}
							</div>
							<span class="text-xs font-mono text-[var(--color-ink-soft)]">
								§
							</span>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-2 text-[11px] text-[var(--color-ink-soft)]">
				<span>Press <kbd class="font-bold">Enter</kbd> to jump</span>
				<span>Total: {allChapters.length}</span>
			</div>
		</div>
	</div>
{/if}
