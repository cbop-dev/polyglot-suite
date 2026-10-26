<script>
	import { LSJEntry as BaseLSJEntry } from '@polyglot/lemma-ui';
	import { getLexiconEntry } from '$lib/services/dbClient';

	let props = $props();

	async function fetchLsj(target, strongs, lang) {
		return await getLexiconEntry('lsj', target, strongs);
	}
</script>

<BaseLSJEntry {...props} fetchEntry={fetchLsj} />
