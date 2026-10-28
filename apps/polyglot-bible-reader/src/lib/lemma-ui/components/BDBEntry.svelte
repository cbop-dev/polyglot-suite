<script lang="ts">
	import { BDBEntry as BaseBDBEntry } from '@polyglot/lemma-ui';
	import { getLexiconEntry } from '$lib/services/dbClient';

	let props = $props();

	async function fetchBdb(target: string, strongs?: string, lang?: string) {
		return await getLexiconEntry('bdb', target, strongs);
	}
</script>

<BaseBDBEntry {...props} fetchEntry={fetchBdb} />
