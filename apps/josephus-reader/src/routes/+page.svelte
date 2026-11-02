<script lang="ts">
	import JosephusReader from '$lib/components/JosephusReader.svelte';
	import { page } from '$app/state';

	const work = $derived(
		page.url.searchParams.get('work') ??
		page.url.searchParams.get('w') ??
		'Antiquities'
	);
	const bookParam = $derived(
		page.url.searchParams.get('book') ??
		page.url.searchParams.get('b') ??
		'1'
	);
	const book = $derived(
		bookParam && !isNaN(parseInt(bookParam, 10)) ? parseInt(bookParam, 10) : 1
	);

	const sectionParam = $derived(
		page.url.searchParams.get('section') ??
		page.url.searchParams.get('sec') ??
		page.url.searchParams.get('s')
	);
	const section = $derived(sectionParam || null);
</script>

<JosephusReader workCode={work} {book} {section} />
