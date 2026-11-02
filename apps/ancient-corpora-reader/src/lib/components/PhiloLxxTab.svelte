<script lang="ts">
	import {
		fetchPhiloBiblicalSummaries,
		searchPhiloBiblicalCitations,
		type BiblicalCitation,
		type BiblicalBookSummary
	} from '../services/dbClient.js';
	import { Loading } from '@polyglot/ui';

	interface Props {
		onNavigateToRef?: (ref: { work_code: string; chapter?: number; section?: number }) => void;
	}

	let { onNavigateToRef }: Props = $props();

	let summaries = $state<BiblicalBookSummary[]>([]);
	let isSummariesLoading = $state<boolean>(false);
	let summariesLoaded = $state<boolean>(false);

	let selectedBookCode = $state<string>('');
	let citations = $state<BiblicalCitation[]>([]);
	let isCitationsLoading = $state<boolean>(false);
	let citationsLoaded = $state<boolean>(false);

	$effect(() => {
		if (!summariesLoaded && !isSummariesLoading) {
			loadSummaries();
		}
	});

	async function loadSummaries() {
		isSummariesLoading = true;
		try {
			summaries = await fetchPhiloBiblicalSummaries();
			summariesLoaded = true;
		} catch (err) {
			console.error('Failed to load Philo biblical summaries:', err);
		} finally {
			isSummariesLoading = false;
		}
	}

	async function selectBook(code: string) {
		selectedBookCode = code;
		isCitationsLoading = true;
		try {
			citations = await searchPhiloBiblicalCitations(code);
			citationsLoaded = true;
		} catch (err) {
			console.error('Failed to search biblical citations:', err);
		} finally {
			isCitationsLoading = false;
		}
	}
</script>

<div class="space-y-4">
	{#if selectedBookCode}
		<div class="flex items-center justify-between border-b border-[var(--color-rule)] pb-2">
			<button
				type="button"
				onclick={() => { selectedBookCode = ''; citations = []; }}
				class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
			>
				&larr; Back to Biblical Books
			</button>
			<span class="text-xs font-mono font-bold text-[var(--color-ink)]">
				{selectedBookCode} ({citations.length} occurrences)
			</span>
		</div>

		{#if isCitationsLoading}
			<div class="py-8 text-center">
				<Loading size="sm" title="Loading citations..." />
			</div>
		{:else if citations.length === 0}
			<p class="text-xs text-[var(--color-ink-soft)] text-center py-4">No citations found for {selectedBookCode}.</p>
		{:else}
			<div class="space-y-2 max-h-96 overflow-y-auto pr-1">
				{#each citations as cit}
					<button
						type="button"
						onclick={() => onNavigateToRef?.({ work_code: cit.work_code, chapter: cit.chapter, section: cit.section })}
						class="w-full text-left rounded-lg p-2 hover:bg-[var(--color-page)] border border-transparent hover:border-[var(--color-rule)] transition-colors cursor-pointer group"
					>
						<div class="flex items-center justify-between">
							<span class="font-bold text-blue-600 dark:text-blue-400 text-xs">
								{cit.display_citation}
							</span>
							<span class="text-[10px] text-[var(--color-ink-soft)] opacity-0 group-hover:opacity-100 transition-opacity">
								Jump &rarr;
							</span>
						</div>
						{#if cit.raw_citation}
							<div class="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-0.5">
								LXX: {cit.raw_citation}
							</div>
						{/if}
						{#if cit.text_snippet}
							<div class="text-[11px] text-[var(--color-ink-soft)] mt-1 line-clamp-2 leading-relaxed greek-font">
								{cit.text_snippet}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="pb-2 border-b border-[var(--color-rule)]">
			<h3 class="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider">
				Septuagint Index in Philo
			</h3>
			<p class="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
				Browse biblical citations identified across Philo's treatises.
			</p>
		</div>

		{#if isSummariesLoading}
			<div class="py-8 text-center">
				<Loading size="sm" title="Loading Septuagint index..." />
			</div>
		{:else if summaries.length === 0}
			<p class="text-xs text-[var(--color-ink-soft)] text-center py-4">No biblical citations available.</p>
		{:else}
			<div class="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
				{#each summaries as s}
					<button
						type="button"
						onclick={() => selectBook(s.book_code)}
						class="flex items-center justify-between p-2 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] hover:bg-[var(--color-rule)]/40 text-xs text-left cursor-pointer transition-colors"
					>
						<span class="font-semibold text-[var(--color-ink)] truncate mr-1">
							{s.book_name || s.book_code}
						</span>
						<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
							{s.total_count}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>
