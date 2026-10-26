<script>
	import "tailwindcss/tailwind.css";
	import '../app.css';
	import Footer from '$lib/components/ui/Footer.svelte';

	let { children } = $props();
</script>

<div class="app-layout min-h-screen flex flex-col justify-between">
	<main class="flex-grow w-full pb-24 md:pb-20">
		{@render children()}
	</main>

	<Footer />
</div>
