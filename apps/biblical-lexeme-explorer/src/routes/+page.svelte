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
			badgeClass: 'badge-success text-emerald-950 font-bold'
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
			badgeClass: 'badge-warning text-amber-950 font-bold'
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
			badgeClass: 'badge-info text-sky-950 font-bold'
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

<div class="mx-auto max-w-6xl px-4 py-8 text-base-content sm:py-12">
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
				class="card flex flex-col justify-between border bg-base-100 shadow-md transition-all duration-200 hover:shadow-xl {c.accentClass}"
			>
				<div class="p-6">
					<div class="mb-2 flex items-center justify-between gap-2">
						<span class="badge badge-sm font-mono {c.badgeClass}">{c.badge}</span>
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

				<div class="space-y-2 border-t border-base-200 p-6 pt-0">
					<a href={c.path} class="shadow-xs btn btn-primary btn-sm w-full gap-2">
						<span>Explore {c.id.toUpperCase()}</span>
						<span aria-hidden="true">&rarr;</span>
					</a>
					<div class="grid grid-cols-3 gap-1.5 pt-1 text-xs">
						<a href="{c.path}?panel=book" class="btn btn-ghost btn-xs border border-base-300"
							>Books</a
						>
						<a href="{c.path}?panel=lex" class="btn btn-ghost btn-xs border border-base-300"
							>Lexemes</a
						>
						<a href="{c.path}?panel=wc" class="btn btn-ghost btn-xs border border-base-300">Cloud</a
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
				<div class="shadow-xs card border border-base-300 bg-base-100/70 p-5">
					<h3 class="mb-2 text-base font-bold">{f.title}</h3>
					<p class="text-xs leading-relaxed opacity-80 sm:text-sm">{f.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Open Source & Licensing Banner -->
	<div
		class="shadow-xs card mx-auto max-w-3xl border border-base-300 bg-base-100 p-6 text-center sm:p-8"
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
			<a href="{base}/sources-and-licenses" class="btn btn-outline btn-sm gap-2">
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
