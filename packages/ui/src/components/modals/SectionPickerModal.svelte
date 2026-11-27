<script lang="ts">
	import Modal2 from '../controls/Modal2.svelte';
	import type { SubBookItem, SectionListItem } from '../../types.js';

	interface Props {
		open: boolean;
		placeholder?: string;
		searchQuery?: string;
		subBooks?: SubBookItem[];
		onSelectSubBook?: (book: number) => void;
		subBookLabel?: string;
		subBookShortLabel?: string;
		quickJumpSections?: number[];
		items?: SectionListItem[];
		totalCount?: number;
		currentValue?: number;
		onSelect: (value: number, book?: number) => void;
		onClose: () => void;
		// N-level hierarchy support
		levels?: string[];
		paginationLevel?: number;
		pages?: string[];
		unitsByPage?: Record<string, number>;
		currentPage?: string;
		onSelectPage?: (pagePath: string, section?: number) => void;
	}

	let {
		open = $bindable(false),
		placeholder = "Type number to jump...",
		searchQuery = $bindable(''),
		subBooks = [],
		onSelectSubBook = () => {},
		subBookLabel = "Book",
		subBookShortLabel = "Bk.",
		quickJumpSections = [],
		items = [],
		totalCount = 0,
		currentValue,
		onSelect,
		onClose,
		levels,
		paginationLevel = 0,
		pages,
		unitsByPage,
		currentPage,
		onSelectPage
	}: Props = $props();

	let selectedIndex = $state<number>(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let isBooksOpen = $state<boolean>(false);
	let draftCoords = $state<string[]>([]);

	let isMultiTier = $derived(
		Boolean(levels && pages && pages.length > 0 && paginationLevel >= 1 && onSelectPage)
	);

	function sortCoords(a: string, b: string): number {
		const na = Number(a);
		const nb = Number(b);
		if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
		return a.localeCompare(b);
	}

	function getTierOptions(tierIdx: number, prefix: string[]): string[] {
		if (!pages) return [];
		const seen = new Set<string>();
		for (const p of pages) {
			const parts = p.split('.');
			if (parts.length <= tierIdx) continue;
			let matches = true;
			for (let i = 0; i < tierIdx; i++) {
				if (parts[i] !== prefix[i]) {
					matches = false;
					break;
				}
			}
			if (matches) seen.add(parts[tierIdx]);
		}
		return Array.from(seen).sort(sortCoords);
	}

	function selectTierCoord(tierIdx: number, val: string) {
		const next = [...draftCoords.slice(0, tierIdx), val];
		if (tierIdx >= paginationLevel) {
			onSelectPage?.(next.join('.'));
			return;
		}
		// Fill remaining tiers up to paginationLevel with first available child
		for (let t = tierIdx + 1; t <= paginationLevel; t++) {
			const opts = getTierOptions(t, next);
			if (opts.length > 0) next.push(opts[0]);
		}
		draftCoords = next;
	}

	$effect(() => {
		if (open) {
			searchQuery = '';
			selectedIndex = 0;
			if (isMultiTier && pages && pages.length > 0) {
				const base = currentPage && pages.includes(currentPage) ? currentPage : pages[0];
				draftCoords = base.split('.');
			}
			setTimeout(() => {
				inputEl?.focus();
				inputEl?.select();
			}, 50);
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
		} else if (e.key === 'ArrowDown') {
			if (items.length > 0) {
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % items.length;
			}
		} else if (e.key === 'ArrowUp') {
			if (items.length > 0) {
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + items.length) % items.length;
			}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const raw = searchQuery.trim();
			if (!raw) return;

			if (isMultiTier && onSelectPage && pages) {
				const parts = raw.split(/[.:\s]+/).filter(Boolean);
				if (parts.length === paginationLevel + 1) {
					const target = parts.join('.');
					if (pages.includes(target)) {
						onSelectPage(target);
						return;
					}
				} else if (parts.length > paginationLevel + 1) {
					const target = parts.slice(0, paginationLevel + 1).join('.');
					const sec = parseInt(parts[paginationLevel + 1], 10);
					if (pages.includes(target)) {
						onSelectPage(target, isNaN(sec) ? undefined : sec);
						return;
					}
				} else if (parts.length === 1) {
					const val = parseInt(parts[0], 10);
					if (!isNaN(val) && val > 0 && currentPage) {
						onSelectPage(currentPage, val);
						return;
					}
				}
			}

			// Compound reference format: e.g. "2.110", "2:110", "2 110" (book 2, section 110)
			const compoundMatch = raw.match(/^(\d+)[.:\s](\d+)$/);
			if (compoundMatch) {
				const b = parseInt(compoundMatch[1], 10);
				const s = parseInt(compoundMatch[2], 10);
				if (!isNaN(b) && !isNaN(s) && b > 0 && s > 0) {
					onSelect(s, b);
					return;
				}
			}

			const val = parseInt(raw, 10);
			if (!isNaN(val) && val > 0) {
				onSelect(val);
			} else if (items.length > 0 && items[selectedIndex]) {
				onSelect(items[selectedIndex].value);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Modal2
	bind:showModal={open}
	onclose={onClose}
	showFooter={false}
	showMaximize={false}
	showClose={false}
	maxWidth="max-w-sm"
>
	<div class="flex flex-col text-[var(--color-ink)]">
		<!-- Header / Quick Jump -->
		<div class="flex items-center gap-3 border-b border-[var(--color-rule)] px-4 py-3 bg-[var(--color-card-bg)]">
			<svg class="h-4 w-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
			</svg>
			<input
				bind:this={inputEl}
				bind:value={searchQuery}
				type="text"
				{placeholder}
				class="nj-input w-full bg-transparent text-sm font-medium placeholder:text-[var(--color-ink-soft)] focus:outline-hidden"
			/>
			<button type="button" onclick={onClose} aria-label="Close" class="cursor-pointer">
				<kbd class="rounded border border-[var(--color-rule)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-soft)]">
					Esc
				</kbd>
			</button>
		</div>

		<!-- Multi-level cascading selector (for N-level works with paginationLevel >= 1) -->
		{#if isMultiTier && levels && pages}
			{#each Array.from({ length: paginationLevel + 1 }, (_, i) => i) as tierIdx}
				{@const tierLabel = levels[tierIdx] || `Level ${tierIdx + 1}`}
				{@const options = getTierOptions(tierIdx, draftCoords)}
				{@const selectedOpt = draftCoords[tierIdx]}
				<div class="p-3 border-b border-[var(--color-rule)] bg-[var(--color-page)]">
					<div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
						<span>{tierLabel}</span>
						{#if selectedOpt !== undefined}
							<span class="text-[11px] font-normal normal-case text-blue-600 dark:text-blue-400">
								{tierLabel} {selectedOpt}
							</span>
						{/if}
					</div>
					<div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
						{#each options as opt}
							{@const isActivePage =
								tierIdx === paginationLevel &&
								currentPage === [...draftCoords.slice(0, tierIdx), opt].join('.')}
							{@const isSelected = opt === selectedOpt}
							{@const pageKey = tierIdx === paginationLevel ? [...draftCoords.slice(0, tierIdx), opt].join('.') : ''}
							{@const unitCount = pageKey && unitsByPage ? unitsByPage[pageKey] : undefined}
							<button
								type="button"
								onclick={() => selectTierCoord(tierIdx, opt)}
								class="rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer {isActivePage || (tierIdx < paginationLevel && isSelected) ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-bold shadow-2xs' : 'border-[var(--color-rule)] bg-[var(--color-card-bg)] text-[var(--color-ink)] hover:bg-[var(--color-rule)]'}"
								title={unitCount ? `${tierLabel} ${opt} (${unitCount} sections)` : `${tierLabel} ${opt}`}
							>
								{opt}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		{:else if subBooks.length > 0}
			<!-- Sub-book selector (if provided, e.g. multi-book treatises) -->
			{@const currentSelectedBook = subBooks.find((b) => b.isSelected)?.book}
			<div class="p-3 border-b border-[var(--color-rule)] bg-[var(--color-page)]">
				<button
					type="button"
					onclick={() => (isBooksOpen = !isBooksOpen)}
					class="select-book-toggle w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer select-none py-0.5"
					aria-expanded={isBooksOpen}
				>
					<span class="flex items-center gap-1.5">
						<span>Select {subBookLabel}</span>
						{#if currentSelectedBook !== undefined}
							<span class="text-[11px] font-normal normal-case text-blue-600 dark:text-blue-400">({subBookShortLabel} {currentSelectedBook})</span>
						{/if}
					</span>
					<span class="text-[10px] transform transition-transform duration-150 {isBooksOpen ? 'rotate-180' : ''}">▾</span>
				</button>
				{#if isBooksOpen}
					<div class="flex flex-wrap gap-1.5 pt-2 max-h-48 overflow-y-auto">
						{#each subBooks as item}
							<button
								type="button"
								onclick={() => onSelectSubBook(item.book)}
								class="rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer {item.isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-bold shadow-2xs' : 'border-[var(--color-rule)] bg-[var(--color-card-bg)] text-[var(--color-ink)] hover:bg-[var(--color-rule)]'}"
								title="{item.label}{item.sections ? ` (${item.sections} sections)` : ''}"
							>
								{item.label || `${subBookShortLabel} ${item.book}`}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Quick Jump Grid (if provided) -->
		{#if quickJumpSections.length > 0}
			<div class="p-3 max-h-60 overflow-y-auto">
				<span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2 block">
					Quick Jump
				</span>
				<div class="grid grid-cols-5 gap-1.5">
					{#each quickJumpSections as sec}
						{@const isSelected = sec === currentValue}
						<button
							type="button"
							onclick={() => onSelect(sec)}
							class="rounded-lg py-1.5 text-center text-xs font-semibold transition-all cursor-pointer {isSelected ? 'bg-blue-600 text-white shadow-2xs' : 'bg-[var(--color-card-bg)] text-[var(--color-ink)] hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 border border-[var(--color-rule)]'}"
						>
							§ {sec}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Items List (if provided) -->
		{#if items.length > 0}
			<div class="max-h-72 overflow-y-auto p-2 grid grid-cols-1 gap-1">
				{#each items as item, idx}
					{@const isSelected = item.isSelected ?? (item.value === currentValue)}
					{@const isHighlighted = idx === selectedIndex}
					<button
						type="button"
						onclick={() => onSelect(item.value)}
						onmouseenter={() => (selectedIndex = idx)}
						class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer {isHighlighted ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100' : 'hover:bg-[var(--color-card-bg)] text-[var(--color-ink)]'}"
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
							{item.badge || '§'}
						</span>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-2 text-[11px] text-[var(--color-ink-soft)]">
			<span>Press <kbd class="font-bold">Enter</kbd> to jump</span>
			{#if totalCount > 0}
				<span>Total: {totalCount}</span>
			{/if}
		</div>
	</div>
</Modal2>
