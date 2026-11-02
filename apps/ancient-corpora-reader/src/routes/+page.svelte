<script lang="ts">
	import { base } from '$app/paths';
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
		<!-- Apostolic Fathers -->
		<a
			href="{base}/af"
			class="group block p-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs hover:border-blue-500 hover:shadow-md transition-all"
		>
			<div class="flex items-center justify-between">
				<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 text-xs font-mono font-bold">
					AF
				</span>
				<span class="text-xs text-[var(--color-ink-soft)] group-hover:text-blue-600 transition-colors">
					18 Works &rarr;
				</span>
			</div>
			<h2 class="mt-4 text-lg font-bold text-[var(--color-ink)] group-hover:text-blue-600 transition-colors">
				Apostolic Fathers
			</h2>
			<p class="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
				Kirsopp Lake Greek text, English translations, and parallel Latin witness for Polycarp and Hermas.
			</p>
		</a>

		<!-- Philo of Alexandria -->
		<a
			href="{base}/philo"
			class="group block p-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs hover:border-blue-500 hover:shadow-md transition-all"
		>
			<div class="flex items-center justify-between">
				<span class="rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 text-xs font-mono font-bold">
					PHILO
				</span>
				<span class="text-xs text-[var(--color-ink-soft)] group-hover:text-amber-600 transition-colors">
					34 Treatises &rarr;
				</span>
			</div>
			<h2 class="mt-4 text-lg font-bold text-[var(--color-ink)] group-hover:text-amber-600 transition-colors">
				Philo of Alexandria
			</h2>
			<p class="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
				Cohn-Wendland Greek, Yonge English, Mangey volume/page milestones, and Septuagint citation index.
			</p>
		</a>

		<!-- Flavius Josephus -->
		<a
			href="{base}/josephus"
			class="group block p-6 rounded-2xl border border-[var(--color-rule)] bg-[var(--color-card-bg)] shadow-xs hover:border-blue-500 hover:shadow-md transition-all"
		>
			<div class="flex items-center justify-between">
				<span class="rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 text-xs font-mono font-bold">
					JOSEPHUS
				</span>
				<span class="text-xs text-[var(--color-ink-soft)] group-hover:text-emerald-600 transition-colors">
					4 Corpora &rarr;
				</span>
			</div>
			<h2 class="mt-4 text-lg font-bold text-[var(--color-ink)] group-hover:text-emerald-600 transition-colors">
				Flavius Josephus
			</h2>
			<p class="mt-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
				Niese sectioning, Thackeray translation, Whiston cross-references, and PDF export engine.
			</p>
		</a>
	</div>
</main>
