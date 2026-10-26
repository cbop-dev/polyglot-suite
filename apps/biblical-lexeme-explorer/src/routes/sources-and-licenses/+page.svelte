<script>
	import { base } from '$app/paths';
	import { APP_REPO } from '$lib/config/version.js';
</script>

<svelte:head>
	<title>Sources &amp; Licenses | Biblical Lexeme Explorer</title>
</svelte:head>

<div class="license-page mx-auto max-w-4xl px-4 py-8 text-base-content">
	<!-- Navigation -->
	<div class="mb-6">
		<a href="{base}/" class="btn btn-outline btn-sm gap-2 hover:btn-primary">
			<span aria-hidden="true">&larr;</span> Back to Biblical Lexeme Explorer
		</a>
	</div>

	<!-- Title Section -->
	<header class="mb-10 border-b border-base-300 pb-6">
		<h1 class="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Sources &amp; Licenses</h1>
		<p class="text-base opacity-80 sm:text-lg">
			Licensing framework, upstream source attributions, and copyright notices for the <strong
				>Biblical Lexeme Explorer</strong
			>.
		</p>
	</header>

	<!-- Licensing Framework Overview -->
	<div class="mb-12 grid gap-6 md:grid-cols-2">
		<!-- AGPL Code Card -->
		<div
			class="card flex flex-col justify-between border border-base-300 bg-base-100 p-6 shadow-md"
		>
			<div>
				<div class="mb-4 flex items-center justify-between gap-3">
					<h2 class="text-xl font-bold">Application Code &amp; Markup</h2>
					<span
						class="badge badge-secondary shrink-0 whitespace-nowrap px-3 py-1.5 font-mono text-xs font-semibold"
						>GNU AGPL v3.0</span
					>
				</div>
				<p class="mb-3 text-sm opacity-90">
					The application source code, user interface components, frontend markup, scripts,
					algorithms, and stylesheets are licensed under the
					<a
						href="https://www.gnu.org/licenses/agpl-3.0.html"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">GNU Affero General Public License v3.0 (AGPL-3.0)</a
					>.
				</p>
				<ul class="mb-4 list-inside list-disc space-y-1 text-xs opacity-80">
					<li>Free to run, study, modify, and redistribute.</li>
					<li>
						Network copyleft: modified versions hosted over a network must make their complete
						corresponding source code available.
					</li>
					<li>Provided without warranty of any kind.</li>
				</ul>
			</div>
			<div class="flex flex-wrap gap-2 border-t border-base-200 pt-4 text-xs">
				<a href={APP_REPO} target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-xs">
					View GitHub Repository
				</a>
				<a
					href="https://www.gnu.org/licenses/agpl-3.0.html"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-ghost btn-xs"
				>
					View AGPL-3.0 License
				</a>
			</div>
		</div>

		<!-- CC BY-SA Data Card -->
		<div
			class="card flex flex-col justify-between border border-base-300 bg-base-100 p-6 shadow-md"
		>
			<div>
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 class="text-xl font-bold">Curated Datasets &amp; Static Indexes</h2>
					<span
						class="badge badge-primary shrink-0 whitespace-nowrap px-3 py-1.5 font-mono text-xs font-semibold flex-1"
						>CC BY-SA 4.0</span
					> or 
					<a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" ><span
						class="badge badge-primary shrink-0 whitespace-nowrap px-3 py-1.5 font-mono text-xs font-semibold hover:bg-white hover:text-black"
						>CC BY-NC 4.0 (BHS)</span></a>
				</div>
				<p class="mb-3 text-sm opacity-90">
					The curated static datasets, pre-compiled lemma search indexes, concordance structures,
					and dictionary sharded stores are licensed under the
					<a
						href="https://creativecommons.org/licenses/by-sa/4.0/"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium"
						>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</a
					> for everything except the BHS data which is license with the  <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank"
						rel="noopener noreferrer"
						class="font-medium">Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)</a>.
				</p>
				<ul class="mb-4 list-inside list-disc space-y-1 text-xs opacity-80">
					<li>
						<strong>Share:</strong> Copy and redistribute the material in any medium or format.
					</li>
					<li>
						<strong>Adapt:</strong> Remix, transform, and build upon the material for any purpose.
					</li>
					<li>
						<strong>Attribution:</strong> You must give appropriate credit and indicate if changes were
						made.
					</li>
					<li>
						<strong>ShareAlike:</strong> Distributed adaptations must remain under the same license.
					</li>
				</ul>
			</div>
			<div class="flex flex-wrap gap-2 border-t border-base-200 pt-4 text-xs">
				<a
					href="https://creativecommons.org/licenses/by-sa/4.0/"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-outline btn-xs"
				>
					View CC BY-SA 4.0 Deed
				</a>
				<a
					href="https://creativecommons.org/licenses/by-nc/4.0/"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-outline btn-xs"
				>
					View CC BY-NC 4.0 Deed
				</a>
			</div>
		</div>
	</div>

	<!-- Upstream Sources and Attributions Section -->
	<section class="space-y-6">
		<h2 class="border-b border-base-300 pb-2 text-2xl font-bold">
			Underlying Datasets &amp; Attributions
		</h2>
		<p class="text-sm opacity-80">
			The developer(s) is(are) grateful to the digital humanities projects whose
			open-licensed datasets make this work possible:
		</p>

		<div class="space-y-4">
			<!-- Swete LXX Text -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">
						Henry Barclay Swete Septuagint Edition (1887–1912, reprint 1930)
					</h3>
					<span class="badge badge-outline font-mono text-xs">Public Domain</span>
				</div>
				<p class="text-sm opacity-90">
					Base text: Henry Barclay Swete, <em
						>The Old Testament in Greek according to the Septuagint</em
					>
					(Cambridge University Press, 3 vols., 1887–1912, reprint 1930; author died 1917). Public domain
					worldwide. Digital transcription curated by Eliran Wong and collaborators (<a
						href="https://github.com/eliranwong/LXX-Swete-1930"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">eliranwong/LXX-Swete-1930</a
					>).
				</p>
			</div>

			<!-- In-House Greek Morphology Pipeline -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">Septuagint Neural &amp; Rule-Based Morphology Pipeline</h3>
					<span class="badge badge-outline font-mono text-xs">AGPL-3.0 / CC BY-SA 4.0</span>
				</div>
				<p class="text-sm opacity-90">
					Morphological parsing, POS tagging, and lemmatization generated via the open-source
					pipeline in this repository (<code>pipeline/swete_morphology/</code>). Powered by Stanford
					Stanza Ancient Greek neural language models (<code>grc_proiel</code>), contextual biblical
					proper-name gazetteers, and grammatical canonical unification algorithms.
				</p>
				<p class="mt-2 text-xs opacity-75">
					<em>Benchmarking note:</em> During development and quality assurance, the pipeline's
					morphological outputs were tested and benchmarked against the
					<a
						href="https://github.com/OpenScriptorium/lxx-morph"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">OpenScriptorium lxx-morph</a
					> dataset, but no data from OpenScriptorium was incorporated into this application's dataset.
				</p>
			</div>

			<!-- Open Scriptures Septuagint Project -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">Open Scriptures Septuagint Project</h3>
					<span class="badge badge-outline font-mono text-xs">CC BY 4.0</span>
				</div>
				<p class="text-sm opacity-90">
					Lexeme gloss alignments and Strong's Concordance cross-reference numbers are provided by
					the
					<a
						href="https://github.com/openscriptures/GreekResources"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">Open Scriptures Greek Resources Project</a
					>
					(including <code>GreekWordList.js</code> and <code>gwl2AsLookups.js</code>).
				</p>
			</div>

			<!-- Abbott-Smith Manual Greek Lexicon -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">Abbott-Smith Manual Greek Lexicon (1922)</h3>
					<span class="badge badge-outline font-mono text-xs">Public Domain</span>
				</div>
				<p class="text-sm opacity-90">
					G. Abbott-Smith, <em>A Manual Greek Lexicon of the New Testament</em> (New York: Charles
					Scribner's Sons, 1922). TEI XML digital edition curated by
					<a
						href="https://github.com/translatable-exegetical-tools/Abbott-Smith"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">translatable-exegetical-tools</a
					>.
				</p>
			</div>

			<!-- LSJ Lexicon -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">
						Liddell-Scott-Jones (LSJ) &amp; Middle Liddell Greek-English Lexicon
					</h3>
					<span class="badge badge-outline font-mono text-xs">Public Domain</span>
				</div>
				<p class="text-sm opacity-90">
					H.G. Liddell, R. Scott, H.S. Jones, <em>A Greek-English Lexicon</em> (Oxford: Clarendon
					Press, 1940) and
					<em>A Lexicon: Abridged from Liddell and Scott's Greek-English Lexicon</em> (1889). Digital
					editions curated by the Perseus Digital Library (Tufts University) and Logeion (University
					of Chicago).
				</p>
			</div>

			<!-- BHS Hebrew Bible / ETCBC -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">Biblia Hebraica Stuttgartensia Amstelodamensis (BHS / ETCBC)</h3>
					<span class="badge badge-outline font-mono text-xs"><a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank">CC BY-NC 4.0</a></span>
				</div>
				<p class="text-sm opacity-90">
					Hebrew Bible morphological and syntactic data developed by the
					<a href="https://etcbc.nl" target="_blank" rel="noopener noreferrer" class="font-medium"
						>Eep Talstra Centre for Bible and Computer</a
					> (Vrije Universiteit Amsterdam).
				</p>

				
			</div>

			<!-- SBLGNT & MorphGNT -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">
						The Greek New Testament: SBL Edition (SBLGNT) &amp; MorphGNT
					</h3>
					<span class="badge badge-outline font-mono text-xs">CC BY 4.0</span>
				</div>
				<p class="text-sm opacity-90">
					Edited by Michael W. Holmes in collaboration with the Society of Biblical Literature and
					Logos Bible Software (2010), licensed under CC BY 4.0. Morphological parsing provided by
					James Tauber's
					<a
						href="https://github.com/morphgnt"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">MorphGNT project</a
					>.
				</p>
			</div>

			<!-- Text-Fabric Tooling -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">Text-Fabric</h3>
					<span class="badge badge-ghost font-mono text-xs">Tooling &amp; Data Pipeline (MIT)</span>
				</div>
				<p class="text-sm opacity-90">
					Build-time corpus modeling, node structures, and feature graphs utilize
					<a
						href="https://github.com/annotation/text-fabric"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">Text-Fabric</a
					>, developed by Dirk Roorda (KNAW Humanities Cluster).
				</p>
			</div>

			<!-- OpenScriptorium Theme Slider Design -->
			<div class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">OpenScriptorium Reading Theme Architecture</h3>
					<span class="badge badge-ghost font-mono text-xs">UI Design Pattern (ISC License)</span>
				</div>
				<p class="text-sm opacity-90">
					The sliding scale reading theme selector and contrast-invariant piecewise color stop
					interpolation are adapted from the open-source reading theme controller developed by
					<a
						href="https://openscriptorium.org"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">Open Scriptorium</a
					>
					(licensed under the permissive
					<a
						href="https://opensource.org/licenses/ISC"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium">ISC License</a
					>).
				</p>
			</div>

			<!-- AI Development & Methodology -->
			<div id="ai-attribution" class="shadow-xs card border border-base-300 bg-base-100 p-5">
				<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
					<h3 class="text-lg font-bold">Google DeepMind Antigravity 2.0 &amp; Gemini</h3>
					<span class="badge badge-ghost font-mono text-xs">AI Engineering &amp; Development</span>
				</div>
				<p class="text-sm opacity-90">
					The application developer used Google DeepMind's Antigravity 2.0 and Gemini models in the
					development of this project.
				</p>
			</div>
		</div>
	</section>

	<!-- Copyright Notice -->
	<footer class="mt-12 border-t border-base-300 pt-6 text-center text-xs opacity-75">
		Web application &copy; Fr. Christopher Brannan, O.P., 2026. All rights reserved for original
		creative works where not otherwise licensed above.
	</footer>
</div>

<style>
	.license-page a:not(.btn) {
		color: #166534;
		text-decoration: underline;
		text-underline-offset: 2px;
		border-radius: 0.25rem;
		padding: 0.05rem 0.2rem;
		margin: -0.05rem -0.1rem;
		transition:
			background-color 0.15s ease-in-out,
			color 0.15s ease-in-out;
	}

	.license-page a:not(.btn):hover {
		background-color: #14532d;
		color: #ffffff;
		text-decoration: none;
	}

	div.license-page {
		background-color: var(--bg-content, #ffffff);
		border-radius: 12px;
	}

	.license-page :global(.badge),
	.license-page .badge {
		height: auto !important;
		min-height: 1.6rem;
		padding-top: 0.25rem;
		padding-bottom: 0.25rem;
		line-height: 1.25;
		display: inline-flex;
		align-items: center;
	}
</style>
