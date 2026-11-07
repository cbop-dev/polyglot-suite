<script lang="ts">
	import type { PortalAppItem } from '../routes/+page.server';
	

	interface Props {
		app: PortalAppItem;
	}

	let { app }: Props = $props();
</script>

<div class="card">
	<div>
		<div class="card-header">
			<span class="badge badge-live">Available</span>
			<h2><a href={app.url} class="link hover:underline" rel="external" data-sveltekit-reload>{app.title}</a></h2>
		</div>
		<hr class="mb-2! card-heading-hr"/>
		<p class="description">{app.description}</p>
		<div class="tags">
			{#each app.tags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	</div>
	<a href={app.url} rel="external" data-sveltekit-reload class="btn">Launch {app.title} &rarr;</a>
</div>

<style>
	.card {
		background: var(--card-bg);
		border: 1px solid var(--border);
		border-radius: 1rem;
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
		position: relative;
		overflow: hidden;
	}
	.card:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
		border-color: var(--accent);
	}
	.card-header {
		margin-bottom: 1rem;
	}
	.badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		margin-bottom: 0.75rem;
	}
	.badge-live {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}
	h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.description {
		color: var(--text-muted);
		font-size: 0.95rem;
		margin-bottom: 1.25rem;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1.5rem;
	}
	.tag {
		background: var(--tag-bg);
		color: var(--tag-text);
		font-size: 0.75rem;
		padding: 0.2rem 0.5rem;
		border-radius: 0.375rem;
		font-weight: 500;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
		background: var(--accent);
		color: #ffffff;
		transition: background-color 0.2s ease;
	}
	.btn:hover {
		background: var(--accent-hover);
	}

	.card-heading-hr {
	border-color: var(--color-rule);
	}
</style>
