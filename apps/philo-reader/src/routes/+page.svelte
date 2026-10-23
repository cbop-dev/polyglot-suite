<script lang="ts">
	import PhiloReader from '$lib/components/PhiloReader.svelte';
	import { page } from '$app/state';

	const work = $derived(
		page.url.searchParams.get('work') ??
		page.url.searchParams.get('treatise') ??
		page.url.searchParams.get('book') ??
		undefined
	);
	const chapterParam = $derived(
		page.url.searchParams.get('chapter') ??
		page.url.searchParams.get('ch') ??
		page.url.searchParams.get('b')
	);
	const chapter = $derived(
		chapterParam && !isNaN(parseInt(chapterParam, 10)) ? parseInt(chapterParam, 10) : undefined
	);

	const sectionParam = $derived(
		page.url.searchParams.get('section') ??
		page.url.searchParams.get('sec') ??
		page.url.searchParams.get('s')
	);
	const section = $derived(
		sectionParam && !isNaN(parseInt(sectionParam, 10)) ? parseInt(sectionParam, 10) : undefined
	);
</script>

<PhiloReader workCode={work} {chapter} {section} />
