<script lang="ts">
	import PortalCard from '$lib/PortalCard.svelte';
	import type { PageData } from './$types';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';
	let { data }: { data: PageData } = $props();
</script>

<div class="page-wrapper">
	<div class="container">
		
		<header>
			<div class="block w-full"><h1 class="inline-block">Polyglot Suite</h1>
				<div class="float-right"><ThemeSlider enableFontSizeSlider={false} align="right" /></div>
				</div>
				
			<p class="subtitle">
				Digital editions, lexical engines, and comparative textual readers for ancient literature.
			</p>
			
		</header>

		<div class="grid">
			{#each data.apps as app (app.id)}
				<PortalCard {app} />
			{/each}
		</div>

		<footer>
			<p>Polyglot Suite &bull; Maintained by <a href="https://github.com/cbop-dev/polyglot-suite">cbop-dev</a></p>
		</footer>
	</div>
</div>

<style>
	:root{
		--bg: var(--color-page);
		--text: var(--color-page);
		--text-muted: var(--color-ink-soft);
		--card-bg: var(--color-card-bg);
		--border: var(--color-rule);
		--accent: var(--color-link);
		--tag-bg: var(--color-page-soft);
	}
	/*:root {
		--bg: #f8fafc;
		--card-bg: #ffffff;
		--border: #e2e8f0;
		--text: #0f172a;
		--text-muted: #475569;
		--accent: #2563eb;
		--accent-hover: #1d4ed8;
		--tag-bg: #f1f5f9;
		--tag-text: #334155;
	}
	@media (prefers-color-scheme: dark) {
		:root {
			--bg: #0f172a;
			--card-bg: #1e293b;
			--border: #334155;
			--text: #f8fafc;
			--text-muted: #94a3b8;
			--accent: #3b82f6;
			--accent-hover: #60a5fa;
			--tag-bg: #334155;
			--tag-text: #cbd5e1;
		}
	}*/
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		background: var(--bg);
		color: var(--text);
		line-height: 1.6;
		min-height: 100vh;
	}
	.page-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1.25rem 4rem;
		min-height: 100vh;
	}
	.container {
		max-width: 1080px;
		width: 100%;
	}
	header {
		text-align: center;
		margin-bottom: 3rem;
		padding-top: 2rem;
	}
	h1 {
		font-size: 2.75rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		margin-bottom: 0.75rem;
	}
	.subtitle {
		font-size: 1.15rem;
		color: var(--text-muted);
		max-width: 650px;
		margin: 0 auto;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.75rem;
		margin-bottom: 3.5rem;
	}
	footer {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.85rem;
		border-top: 1px solid var(--border);
		padding-top: 2rem;
		width: 100%;
	}
	footer a {
		color: var(--accent);
		text-decoration: none;
	}
	footer a:hover {
		text-decoration: underline;
	}
</style>
