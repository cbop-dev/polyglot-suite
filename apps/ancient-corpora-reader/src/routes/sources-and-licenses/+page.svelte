<script lang="ts">
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { getRegisteredCorpora, isCorpusInstalled, isCorpusEnabled } from '$lib/config/corpora.js';

	const corpora = getRegisteredCorpora();
	let canGoBack = $state(false);

	afterNavigate(({ from }) => {
		canGoBack = from !== null;
	});

	function handleBack(e: MouseEvent) {
		if (canGoBack) {
			e.preventDefault();
			history.back();
		}
	}
</script>

<svelte:head>
	<title>Sources &amp; Licenses — Ancient Corpora Reader</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] px-4 py-8 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl space-y-8">
		<header class="border-b border-[var(--color-rule)] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Sources &amp; Licenses</h1>
				<p class="mt-1 text-sm text-[var(--color-ink-soft)]">
					Textual editions, lemmatization datasets, lexicons, and open-source licensing for Ancient Corpora Reader.
				</p>
			</div>
			<a
				href="{base}/"
				onclick={handleBack}
				class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-rule)] transition-colors self-start"
			>
				← Back to Reader
			</a>
		</header>

		<section class="space-y-4">
			<h2 class="text-xl font-semibold">Corpora &amp; Text Editions</h2>
			<div class="grid gap-4">
				{#each corpora as corpus (corpus.id)}
					{@const installed = isCorpusInstalled(corpus.id)}
					{@const enabled = isCorpusEnabled(corpus.id)}
					<article class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-5 shadow-2xs space-y-3">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<h3 class="text-lg font-bold">{corpus.name}</h3>
								<span class="rounded px-2 py-0.5 text-xs font-mono border border-[var(--color-rule)]">
									{corpus.era}
								</span>
								{#if !installed || !enabled}
									<span class="rounded px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
										{!enabled ? 'Disabled' : 'Not Installed'}
									</span>
								{/if}
							</div>
							{#if corpus.license}
								<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
									{corpus.license.name}
								</span>
							{/if}
						</div>

						{#if corpus.license?.notice}
							<p class="text-sm text-[var(--color-ink-soft)] leading-relaxed">
								{corpus.license.notice}
							</p>
						{/if}

						{#if corpus.license?.editions && corpus.license.editions.length > 0}
							<ul class="space-y-1.5 text-sm border-t border-[var(--color-rule)] pt-3">
								{#each corpus.license.editions as ed}
									<li class="flex flex-wrap items-baseline justify-between gap-2">
										<span>
											<strong class="font-medium">{ed.label}:</strong>
											{#if ed.url}
												<a href={ed.url} target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80">
													{ed.source}
												</a>
											{:else}
												{ed.source}
											{/if}
										</span>
										<span class="text-xs font-mono text-[var(--color-ink-soft)]">{ed.license}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</article>
				{/each}
			</div>
		</section>

		<section class="rounded-xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-5 space-y-2">
			<h2 class="text-lg font-semibold">Lexicons &amp; Application Software</h2>
			<p class="text-sm text-[var(--color-ink-soft)] leading-relaxed">
				<strong>Liddell–Scott–Jones (LSJ) Greek Lexicon:</strong> Derived from the STEPBible TFLSJ dataset and Perseus Digital Library / Logeion editions (CC BY-SA 4.0 / Public Domain).
			</p>
			<p class="text-sm text-[var(--color-ink-soft)] leading-relaxed">
				<strong>Application Source Code:</strong> Licensed under the <strong>GNU Affero General Public License v3.0 (AGPL-3.0)</strong> as part of the Polyglot Suite monorepo.
			</p>
		</section>
	</div>
</div>
