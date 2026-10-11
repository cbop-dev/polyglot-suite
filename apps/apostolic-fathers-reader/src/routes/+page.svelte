<script lang="ts">
	import ApostolicFathersReader from '$lib/components/ApostolicFathersReader.svelte';
	import { page } from '$app/state';

	const work = $derived(page.url.searchParams.get('work') ?? page.url.searchParams.get('book') ?? undefined);
	const chapterParam = $derived(page.url.searchParams.get('chapter') ?? page.url.searchParams.get('ch'));
	const chapter = $derived(chapterParam && !isNaN(parseInt(chapterParam, 10)) ? parseInt(chapterParam, 10) : undefined);
</script>

<ApostolicFathersReader workCode={work} {chapter} />
