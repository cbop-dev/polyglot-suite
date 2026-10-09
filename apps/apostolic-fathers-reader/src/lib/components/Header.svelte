<script lang="ts">
	import { base } from '$app/paths';
	import { CANONICAL_WORKS } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';

	function handleWorkChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		readerState.setWork(target.value, 1);
	}

	function handleChapterChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		readerState.setChapter(parseInt(target.value, 10));
	}
</script>

<header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 shadow-sm">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
		<!-- Left: Suite link & Work selector -->
		<div class="flex items-center gap-3">
			<a href="{base}/" class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
				&larr; Suite
			</a>
			<span class="text-slate-300 dark:text-slate-700">/</span>
			<h1 class="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline">
				Apostolic Fathers
			</h1>

			<!-- Work Selector -->
			<select
				value={readerState.currentWorkCode}
				onchange={handleWorkChange}
				class="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
			>
				{#each CANONICAL_WORKS as work}
					<option value={work.code}>{work.titleEnglish}</option>
				{/each}
			</select>

			<!-- Chapter Selector & Arrows -->
			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={() => readerState.prevChapter()}
					class="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
					aria-label="Previous chapter"
				>
					&larr;
				</button>
				<select
					value={readerState.currentChapter}
					onchange={handleChapterChange}
					class="rounded border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-800 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
				>
					{#each Array.from({ length: readerState.currentWork.totalChapters }, (_, i) => i + 1) as ch}
						<option value={ch}>Ch. {ch}</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={() => readerState.nextChapter()}
					class="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
					aria-label="Next chapter"
				>
					&rarr;
				</button>
			</div>
		</div>

		<!-- Right: Column toggles & Search button -->
		<div class="flex items-center gap-3">
			<div class="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
				<label class="inline-flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={readerState.showGreek} class="rounded text-blue-600" />
					Greek
				</label>
				<label class="inline-flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={readerState.showLatin} class="rounded text-blue-600" />
					Latin
				</label>
				<label class="inline-flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={readerState.showEnglish} class="rounded text-blue-600" />
					English
				</label>
			</div>

			<!-- Search button -->
			<button
				type="button"
				onclick={() => readerState.toggleSearch()}
				class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
			>
				<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				Search Lemmas
			</button>
		</div>
	</div>
</header>
