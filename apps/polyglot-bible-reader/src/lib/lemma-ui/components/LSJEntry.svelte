<script lang="ts">
	import { LSJEntry as BaseLSJEntry } from '@polyglot/lemma-ui';
	import { getLexiconEntry } from '$lib/services/dbClient';

	let props = $props();

	async function fetchLsj(target: string, strongs?: string, lang?: string) {
		return await getLexiconEntry('lsj', target, strongs);
	}
</script>

<BaseLSJEntry {...props} fetchEntry={fetchLsj} />
