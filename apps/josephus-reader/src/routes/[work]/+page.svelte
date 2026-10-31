<script lang="ts">
	import JosephusReader from '$lib/components/JosephusReader.svelte';
	import { page } from '$app/state';

	const workCode = $derived(page.params.work);
</script>

<JosephusReader {workCode} book={1} />
