<script>
	import { base } from '$app/paths';
	import VersionButton from '$lib/components/ui/VersionButton.svelte';

	const corpora = [
		{
			id: 'lxx',
			title: 'Septuagint (LXX)',
			subtitle: 'Greek Old Testament',
			badge: 'Greek OT',
			description:
				'20,097 Greek lemmas from Henry Barclay Swete’s Septuaginta (1887–1912, reprint 1930, Public Domain) with neural and rule-based morphology, Abbott-Smith glosses, Strong’s numbers, and integrated LSJ lexicon.',
			path: `${base}/bible/lxx`,
			accentClass: 'border-emerald-500/40 hover:border-emerald-500',
			badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/30'
		},
		{
			id: 'bhs',
			title: 'Biblia Hebraica (BHS)',
			subtitle: 'Hebrew Old Testament',
			badge: 'Hebrew OT',
			description:
				'Complete Hebrew Bible vocabulary dataset from the ETCBC (Vrije Universiteit Amsterdam). Search lexemes and frequency distributions across all 39 books.',
			path: `${base}/bible/bhs`,
			accentClass: 'border-amber-500/40 hover:border-amber-500',
			badgeClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200 border border-amber-500/30'
		},
		{
			id: 'sblgnt',
			title: 'Greek NT (SBLGNT)',
			subtitle: 'Greek New Testament',
			badge: 'Greek NT',
			description:
				'Michael W. Holmes SBL Greek New Testament with MorphGNT linguistic annotations. Explore lemma occurrences across all 27 New Testament books.',
			path: `${base}/bible/sblgnt`,
			accentClass: 'border-sky-500/40 hover:border-sky-500',
			badgeClass: 'bg-sky-500/15 text-sky-800 dark:bg-sky-400/20 dark:text-sky-300 border border-sky-500/30'
		}
	];

	const features = [
		{
			title: 'Book-by-Book Frequencies',
			desc: 'Filter words occurring between min and max frequencies in any biblical book or across entire corpora.'
		},
		{
			title: 'Lexeme & Gloss Search',
			desc: 'Search by original Greek/Hebrew text, English glosses, or Strong’s concordance identifiers with instant occurrence counts.'
		},
		{
			title: 'Interactive Word Clouds',
			desc: 'Visualize vocabulary distributions with dynamic D3 word clouds, custom sizing thresholds, and color palettes.'
		},
		{
			title: 'Integrated Lexica & LSJ',
			desc: 'Access authoritative definitions from Abbott-Smith and the unabridged Liddell-Scott-Jones (LSJ) Greek lexicon.'
		}
	];
</script>

<svelte:head>
	<title>Biblical Lexeme Explorer</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 text-ink sm:py-12">
	<!-- Hero Section -->
	<div class="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
		<h1
			class="mb-4 inline-flex items-center gap-1.5 !border-none text-3xl font-extrabold tracking-tight !no-underline sm:text-5xl"
		>
			<span>Biblical Lexeme Explorer</span>
			<VersionButton />
		</h1>
		<p class="text-base leading-relaxed opacity-80 sm:text-xl">
			Interactive lexical discovery, concordance frequencies, and vocabulary analysis across the
			Hebrew Bible, Septuagint, and Greek New Testament.
		</p>
	</div>

	<!-- Corpora Cards -->
	<div class="mb-16 grid gap-6 sm:gap-8 md:grid-cols-3">
		{#each corpora as c}
			<div
				class="flex flex-col justify-between rounded-xl border border-rule/50 bg-page/80 shadow-md transition-all duration-200 hover:shadow-xl {c.accentClass}"
			>
				<div class="p-6">
					<div class="mb-2 flex items-center justify-between gap-2">
						<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold font-mono {c.badgeClass}">{c.badge}</span>
						<span class="text-xs font-semibold uppercase tracking-wider opacity-60"
							>{c.id.toUpperCase()}</span
						>
					</div>
					<h2 class="mb-1 !border-none text-xl font-bold tracking-tight !no-underline">
						{c.title}
					</h2>
					<p class="mb-3 text-xs font-medium opacity-70">{c.subtitle}</p>
					<p class="mb-6 text-sm leading-relaxed opacity-85">
						{c.description}
					</p>
				</div>

				<div class="space-y-2 border-t border-rule/30 p-6 pt-0">
					<a href={c.path} class="inline-flex items-center justify-center font-semibold rounded-lg bg-accent text-white hover:opacity-90 transition-opacity py-2 px-3 text-sm shadow-xs w-full gap-2 cursor-pointer">
						<span>Explore {c.id.toUpperCase()}</span>
						<span aria-hidden="true">&rarr;</span>
					</a>
					<div class="grid grid-cols-3 gap-1.5 pt-1 text-xs">
						<a href="{c.path}?panel=book" class="inline-flex items-center justify-center font-medium rounded-lg border border-rule/50 bg-page/70 text-ink hover:bg-rule/20 transition-colors py-1 px-2 text-xs cursor-pointer"
							>Books</a
						>
						<a href="{c.path}?panel=lex" class="inline-flex items-center justify-center font-medium rounded-lg border border-rule/50 bg-page/70 text-ink hover:bg-rule/20 transition-colors py-1 px-2 text-xs cursor-pointer"
							>Lexemes</a
						>
						<a href="{c.path}?panel=wc" class="inline-flex items-center justify-center font-medium rounded-lg border border-rule/50 bg-page/70 text-ink hover:bg-rule/20 transition-colors py-1 px-2 text-xs cursor-pointer">Cloud</a
						>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Features Grid -->
	<section class="mb-16">
		<h2 class="mb-8 !border-none text-center text-2xl font-bold tracking-tight !no-underline">
			Analytical Tools &amp; Features
		</h2>
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			{#each features as f}
				<div class="shadow-xs rounded-xl border border-rule/40 bg-page/70 p-5">
					<h3 class="mb-2 text-base font-bold">{f.title}</h3>
					<p class="text-xs leading-relaxed opacity-80 sm:text-sm">{f.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Open Source & Licensing Banner -->
	<div
		class="shadow-xs rounded-xl mx-auto max-w-3xl border border-rule/40 bg-page p-6 text-center sm:p-8"
	>
		<h3 class="mb-2 text-lg font-bold">Open Source &amp; Open Data</h3>
		<p class="mx-auto mb-4 max-w-2xl text-sm opacity-80">
			Biblical Lexeme Explorer is built on open-source code (<a
				href="https://www.gnu.org/licenses/agpl-3.0.html"
				target="_blank"
				rel="noopener noreferrer"
				class="link font-semibold">AGPL-3.0</a
			>) and variously open-licensed Biblical datasets (<a
				href="https://creativecommons.org/licenses/by-sa/4.0/"
				target="_blank"
				rel="noopener noreferrer"
				class="link font-semibold">CC BY-SA 4.0</a
			> and <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank">CC BY-NC 4.0 (BHS)</a>).
		</p>
		<div>
			<a href="{base}/sources-and-licenses" class="inline-flex items-center justify-center font-semibold rounded-lg border border-rule bg-page text-ink hover:bg-rule/20 transition-colors px-4 py-2 text-sm shadow-xs gap-2 cursor-pointer">
				<span>View Full Sources &amp; Licensing Framework</span>
				<span aria-hidden="true">&rarr;</span>
			</a>
		</div>
	</div>
</div>

<style>
	h1,
	h2 {
		font-family: inherit;
		padding-bottom: 0 !important;
	}
</style>
