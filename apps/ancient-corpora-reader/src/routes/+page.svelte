<script lang="ts">
	import { base , resolve} from '$app/paths';
	import {goto} from '$app/navigation';
	import { getAllCorpora } from '$lib/config/corpora.js';
	import { getCorpusWorks } from '$lib/config/corpora.data.js';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';

	const corpora = getAllCorpora();

	const suiteHref = import.meta.env.DEV 
		? 'http://localhost:5170'
		//: (base ? base.replace(/\/corpora\/?$/, '/') || '/' : '/');
		:  '/';

	const CORPUS_TAGS: Record<string, string[]> = {
		af: ['Kirsopp Lake Loeb', 'Greek Text', 'Latin Fragments', 'English Translation', 'LSJ Lexicon'],
		philo: ['Cohn-Wendland Greek', 'C.D. Yonge English', '31 Treatises', 'Mangey Citations', 'LSJ Lexicon'],
		josephus: ['Whiston English', 'Jewish War', 'Antiquities', 'Life & Apion', 'LSJ Lexicon']
	};
</script>

<svelte:head>
	<title>Ancient Corpora Reader | Polyglot Suite</title>
</svelte:head>

<header class="border-b border-[var(--color-rule)] bg-[var(--color-card-bg)] px-4 py-3 sticky top-0 z-20 shadow-xs">
	<div class="container mx-auto max-w-5xl flex items-center justify-between">
		<a
			href={suiteHref}
			class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--color-link)] hover:underline"
		>
			&larr; Polyglot Suite
		</a>
		<div class="flex items-center gap-3">
			<span class="text-xs font-mono font-medium text-[var(--color-ink-soft)] hidden sm:inline">
				Ancient Corpora Reader
			</span>
			<ThemeSlider align="right" />
		</div>
	</div>
</header>

<main class="container mx-auto max-w-5xl px-4 py-10">
	<header class="text-center mb-10">
		<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
			Ancient Corpora Reader
		</h1>
		<p class="mt-3 text-sm sm:text-base text-[var(--color-ink-soft)] max-w-2xl mx-auto leading-relaxed">
			A unified lexical reader and parallel text study environment for Hellenistic, early Jewish, and early Christian Greek literature.
		</p>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		{#each corpora as c (c.id)}
			{@const works = getCorpusWorks(c.id as any)}
			{@const tags = CORPUS_TAGS[c.id] || []}
			<div
				class="flex flex-col justify-between rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-6 shadow-xs hover:border-[var(--color-link)] hover:shadow-md transition-all duration-200"
			>
				<div>
					<div class="flex items-center justify-between gap-2 mb-3">
						<span class="rounded-full bg-[var(--color-page-soft)] text-[var(--color-accent)] border border-[var(--color-rule)] px-2.5 py-0.5 text-xs font-mono font-bold">
							{c.badge}
						</span>
						<span class="text-xs font-medium text-[var(--color-ink-soft)]">
							{works.length} Works
						</span>
					</div>

					<h2 class="text-xl font-bold text-[var(--color-ink)] mb-2">
						{c.name}
					</h2>
					<p class="text-xs text-[var(--color-ink-soft)] leading-relaxed mb-4">
						{c.subtitle}
					</p>

					{#if tags.length > 0}
						<div class="flex flex-wrap gap-1.5 mb-6">
							{#each tags as tag}
								<span class="inline-block px-2 py-0.5 rounded text-[0.7rem] font-medium bg-[var(--color-page-soft)] text-[var(--color-ink-soft)] border border-[var(--color-rule)]">
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<a
					href="{base}/{c.id}"
					class="inline-flex items-center justify-center w-full py-2 px-4 rounded-lg font-semibold text-sm transition-colors text-white bg-[var(--color-link)] hover:opacity-90 mt-2"
				>
					Open {c.name} &rarr;
				</a>
			</div>
		{/each}
	</div>

	<footer class="mt-16 text-center text-xs text-[var(--color-ink-soft)] border-t border-[var(--color-rule)] pt-6">
		<p>Ancient Corpora Reader &bull; Part of the <a href={suiteHref} class="text-[var(--color-link)] hover:underline">Polyglot Suite</a></p>
	</footer>
</main>
