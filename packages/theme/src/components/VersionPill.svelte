<script lang="ts">
	interface Props {
		version?: string;
		href?: string;
		title?: string;
		class?: string;
	}

	let {
		version = '0.0.0',
		href = '#',
		title = 'View project repository on GitHub',
		class: className = ''
	}: Props = $props();
</script>

<a
	{href}
	target="_blank"
	rel="noopener noreferrer"
	class="version-pill {className}"
	{title}
>
	v{version}
</a>

<style>
	.version-pill {
		padding: 0.08rem 0.35rem;
		background-color: var(--color-card-bg, var(--col-bg, #ffffff));
		color: var(--color-ink-soft, var(--text-mid, #64748b));
		border: 1px solid var(--color-rule, var(--border, #e2e8f0));
		border-radius: 9999px;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.65rem;
		line-height: 0.85rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
		white-space: nowrap;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		vertical-align: middle;
	}

	@media (min-width: 640px) {
		.version-pill {
			padding: 0.1rem 0.4rem;
			font-size: 0.7rem;
			line-height: 0.95rem;
		}
	}

	a:link.version-pill,
	a:visited.version-pill {
		text-decoration: none !important;
	}

	.version-pill:hover {
		background-color: var(--color-rule, var(--border, #e2e8f0));
		color: var(--color-ink, var(--text, #0f172a));
		border-color: var(--color-link, var(--accent, #1f4d8a));
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}
</style>
