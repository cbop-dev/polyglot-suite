<script lang="ts">
	import { base } from '$app/paths';
	import { getAllCorpora } from '$lib/config/corpora.js';
	import { getCorpusWorks } from '$lib/config/canonicalWorks.js';

	const corpora = getAllCorpora();
</script>

<svelte:head>
	<title>Ancient Corpora Reader | Polyglot Suite</title>
</svelte:head>

<main class="container mx-auto max-w-4xl px-4 py-12">
	<header class="text-center">
		<h1 class="text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
			Ancient Corpora Reader
		</h1>
		<p class="mt-3 text-base text-[var(--color-ink-soft)] max-w-2xl mx-auto">
			A unified lexical reader and parallel text study environment for Hellenistic, early Jewish, and early Christian Greek literature.
		</p>
	</header>

	<div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
		{#each corpora as c (c.id)}
			{@const works = getCorpusWorks(c.id as any)}
			<a
				href="{base}/{c.id}"
				class="group block p-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs hover:border-blue-500 hover:shadow-md transition-all"
			>
				<div class="flex items-center justify-between">
					<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 text-xs font-mono font-bold">
						{c.badge}
					</span>
					<span class="text-xs text-[var(--color-ink-soft)] group-hover:text-blue-600 transition-colors">
						{works.length} Works &rarr;
					</span>
				</div>
				<h2 class="mt-4 text-lg font-bold text-[var(--color-ink)] group-hover:text-blue-600 transition-colors">
					{c.name}
				</h2>
				<p class="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
					{c.subtitle}
				</p>
			</a>
		{/each}
	</div>
</main>
