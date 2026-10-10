<script lang="ts">
	import type { TextUnit, Token } from '$lib/services/dbClient';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';

	interface Props {
		greek?: TextUnit[];
		english?: TextUnit[];
		latin?: TextUnit[];
	}

	let { greek = [], english = [], latin = [] }: Props = $props();

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
</script>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
	<!-- Column Headers (desktop) -->
	<div class="hidden md:grid {gridColsClass} gap-6 border-b border-[var(--color-rule)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
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
	<div class="divide-y divide-[var(--color-rule)]">
		{#each sectionNumbers as sec}
			{@const gUnit = greekBySec.get(sec)}
			{@const lUnit = latBySec.get(sec)}
			{@const eUnit = engBySec.get(sec)}
			<div class="group/sec grid {gridColsClass} gap-6 py-4 hover:bg-[var(--color-card-bg)] rounded-lg transition-colors">
				<!-- Greek Column -->
				{#if hasGreek}
					<div class="text-lg leading-relaxed text-[var(--color-ink)] greek-font">
						<button
							type="button"
							onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter, sec)}
							class="mr-2 text-xs font-semibold text-[var(--color-ink-soft)] select-none hover:text-blue-600 hover:underline cursor-pointer"
							title="Cite section {readerState.currentChapter}:{sec}"
						>
							{readerState.currentChapter}:{sec}
						</button>
						{#if gUnit && gUnit.tokens}
							{#each gUnit.tokens as tok}
								{@const hl = highlightStore.get(tok.l)}
								<button
									type="button"
									onclick={() => readerState.openLemma(tok, gUnit.display_citation)}
									class="inline cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden {hl ? 'hl-token' : ''}"
									style={hl ? `--hl-bg: ${hl.bgLight}; --hl-text: ${hl.textLight}; --hl-border: ${hl.borderLight}; --hl-bg-dark: ${hl.bgDark}; --hl-text-dark: ${hl.textDark}; --hl-border-dark: ${hl.borderDark};` : undefined}
									title="{tok.l} ({tok.p} {tok.m})"
								>
									{tok.w}
								</button>{' '}
							{/each}
						{:else if gUnit}
							<span>{gUnit.text_content}</span>
						{:else}
							<span class="italic text-[var(--color-ink-soft)] text-sm">(Greek text lacuna / not extant)</span>
						{/if}
					</div>
				{/if}

				<!-- Latin Column -->
				{#if hasLatin}
					<div class="text-base leading-relaxed text-[var(--color-ink)] latin-font">
						<button
							type="button"
							onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter, sec)}
							class="mr-2 text-xs font-semibold text-[var(--color-ink-soft)] select-none hover:text-blue-600 hover:underline cursor-pointer"
							title="Cite section {readerState.currentChapter}:{sec}"
						>
							{readerState.currentChapter}:{sec}
						</button>
						{#if lUnit && lUnit.tokens}
							{#each lUnit.tokens as tok}
								{@const hl = highlightStore.get(tok.l)}
								<button
									type="button"
									onclick={() => readerState.openLemma(tok, lUnit.display_citation)}
									class="inline cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden {hl ? 'hl-token' : ''}"
									style={hl ? `--hl-bg: ${hl.bgLight}; --hl-text: ${hl.textLight}; --hl-border: ${hl.borderLight}; --hl-bg-dark: ${hl.bgDark}; --hl-text-dark: ${hl.textDark}; --hl-border-dark: ${hl.borderDark};` : undefined}
									title="{tok.l} ({tok.p} {tok.m})"
								>
									{tok.w}
								</button>{' '}
							{/each}
						{:else if lUnit}
							<span>{lUnit.text_content}</span>
						{:else}
							<span class="italic text-[var(--color-ink-soft)] text-sm">—</span>
						{/if}
					</div>
				{/if}

				<!-- English Column -->
				{#if hasEng}
					<div class="text-base leading-relaxed text-[var(--color-ink)]">
						<button
							type="button"
							onclick={() => readerState.openCitation(readerState.currentWorkCode, readerState.currentChapter, sec)}
							class="mr-2 text-xs font-semibold text-[var(--color-ink-soft)] select-none hover:text-blue-600 hover:underline cursor-pointer"
							title="Cite section {readerState.currentChapter}:{sec}"
						>
							{readerState.currentChapter}:{sec}
						</button>
						{#if eUnit}
							<span>{eUnit.text_content}</span>
						{:else}
							<span class="italic text-[var(--color-ink-soft)] text-sm">(No English translation recorded)</span>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
