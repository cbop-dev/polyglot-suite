<script lang="ts">
	import type { TextUnit, Token } from '$lib/services/dbClient';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';

	let { greek = [], english = [], latin = [] } = $props<{
		greek: TextUnit[];
		english: TextUnit[];
		latin: TextUnit[];
	}>();

	// Group sections by section number
	let sectionNumbers = $derived.by(() => {
		const nums = new Set<number>();
		greek.forEach((u) => nums.add(u.section));
		english.forEach((u) => nums.add(u.section));
		latin.forEach((u) => nums.add(u.section));
		return Array.from(nums).sort((a, b) => a - b);
	});

	let greekBySec = $derived(new Map(greek.map((u) => [u.section, u])));
	let engBySec = $derived(new Map(english.map((u) => [u.section, u])));
	let latBySec = $derived(new Map(latin.map((u) => [u.section, u])));

	// Calculate visible column count
	let hasLatin = $derived(latin.length > 0 && readerState.showLatin);
	let hasGreek = $derived(readerState.showGreek);
	let hasEng = $derived(readerState.showEnglish);

	let gridColsClass = $derived.by(() => {
		let count = 0;
		if (hasGreek) count++;
		if (hasLatin) count++;
		if (hasEng) count++;
		if (count === 3) return 'grid-cols-1 md:grid-cols-3';
		if (count === 2) return 'grid-cols-1 md:grid-cols-2';
		return 'grid-cols-1';
	});

	function getHighlightStyle(lemma: string): string {
		const hl = highlightStore.get(lemma);
		if (!hl) return '';
		return `background-color: ${hl.bg}; color: ${hl.text}; padding: 0 2px; border-radius: 3px; font-weight: 600;`;
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
	<!-- Column Headers (desktop) -->
	<div class="hidden md:grid {gridColsClass} gap-6 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
		{#if hasGreek}
			<div>Kirsopp Lake Greek (1912)</div>
		{/if}
		{#if hasLatin}
			<div>Latin Text (Where Extant)</div>
		{/if}
		{#if hasEng}
			<div>Kirsopp Lake English Translation</div>
		{/if}
	</div>

	<!-- Section Rows -->
	<div class="divide-y divide-slate-100 dark:divide-slate-900">
		{#each sectionNumbers as sec}
			{@const gUnit = greekBySec.get(sec)}
			{@const lUnit = latBySec.get(sec)}
			{@const eUnit = engBySec.get(sec)}
			<div class="grid {gridColsClass} gap-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 rounded-lg transition-colors">
				<!-- Greek Column -->
				{#if hasGreek}
					<div class="text-lg leading-relaxed text-slate-900 dark:text-slate-100 greek-font">
						<span class="mr-2 text-xs font-semibold text-slate-400 select-none">
							{readerState.currentChapter}:{sec}
						</span>
						{#if gUnit && gUnit.tokens}
							{#each gUnit.tokens as tok}
								{@const style = getHighlightStyle(tok.l)}
								<button
									type="button"
									onclick={() => readerState.openLemma(tok, gUnit.display_citation)}
									class="inline cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden"
									{style}
									title="{tok.l} ({tok.p} {tok.m})"
								>
									{tok.w}
								</button>{' '}
							{/each}
						{:else if gUnit}
							<span>{gUnit.text_content}</span>
						{:else}
							<span class="italic text-slate-400 text-sm">(Greek text lacuna / not extant)</span>
						{/if}
					</div>
				{/if}

				<!-- Latin Column -->
				{#if hasLatin}
					<div class="text-base leading-relaxed text-slate-800 dark:text-slate-200 latin-font">
						<span class="mr-2 text-xs font-semibold text-slate-400 select-none">
							{readerState.currentChapter}:{sec}
						</span>
						{#if lUnit && lUnit.tokens}
							{#each lUnit.tokens as tok}
								{@const style = getHighlightStyle(tok.l)}
								<button
									type="button"
									onclick={() => readerState.openLemma(tok, lUnit.display_citation)}
									class="inline cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden"
									{style}
									title="{tok.l} ({tok.p} {tok.m})"
								>
									{tok.w}
								</button>{' '}
							{/each}
						{:else if lUnit}
							<span>{lUnit.text_content}</span>
						{:else}
							<span class="italic text-slate-400 text-sm">—</span>
						{/if}
					</div>
				{/if}

				<!-- English Column -->
				{#if hasEng}
					<div class="text-base leading-relaxed text-slate-700 dark:text-slate-300">
						<span class="mr-2 text-xs font-semibold text-slate-400 select-none">
							{readerState.currentChapter}:{sec}
						</span>
						{#if eUnit}
							<span>{eUnit.text_content}</span>
						{:else}
							<span class="italic text-slate-400 text-sm">(No English translation recorded)</span>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
