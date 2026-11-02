<script lang="ts">
	import JosephusReader from '$lib/components/JosephusReader.svelte';
	import { page } from '$app/state';

	const workCode = $derived(page.params.work);
	const book = $derived(parseInt(page.params.book || '1', 10));
</script>

<JosephusReader {workCode} {book} />
