<script lang="ts">
	import AncientCorporaReader from '$lib/components/AncientCorporaReader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<AncientCorporaReader initialCorpus={data.corpusId} initialWork={data.work} />
