<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
	{#if children}
		{@render children()}
	{/if}
</div>
