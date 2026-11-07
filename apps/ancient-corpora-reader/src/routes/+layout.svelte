<script lang="ts">
	import '../app.css';
	import { onMount, type Snippet } from 'svelte';
	import { initReadingTheme } from '@polyglot/theme/dom';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		initReadingTheme();
	});
</script>

<div class="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)] transition-colors duration-150">
	{#if children}
		{@render children()}
	{/if}
</div>
