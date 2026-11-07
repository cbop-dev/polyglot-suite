<script lang="ts">
	//import './layout.css';
	import '../app.css';
	//import favicon from '$lib/assets/favicon.png';
	import { initReadingTheme } from '@polyglot/theme/dom';
    import { onMount } from 'svelte';
	let { children } = $props();

	onMount(()=>{
         initReadingTheme();
	});
	
</script>

<svelte:head>
	<!--<link rel="icon" type="image/png" href={favicon} />
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />-->
</svelte:head>

<div class="min-h-screen flex flex-col bg-[var(--color-page)] text-[var(--color-ink)] transition-colors duration-150">
	<main class="flex-grow">
     {#if children}
		{@render children()}
    {/if}
	</main>
	
</div>