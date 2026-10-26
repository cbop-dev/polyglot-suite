<script>
	import { BDBEntry as BaseBDBEntry } from '@polyglot/lemma-ui';
	import { bdbProvider } from '$lib/engine/BdbProvider.js';

	let props = $props();

	async function fetchBdb(target, strongs, lang) {
		const plain = typeof props.lemma === 'object' ? props.lemma?.plain || '' : '';
		const res = await bdbProvider.getEntry(target, plain);
		return res?.entry
			? {
					headword: res.entry.headword,
					strongs: res.entry.strongs,
					matchType: res.entry.matchType,
					def: res.entry.markdown || res.entry.def
			  }
			: null;
	}
</script>

<BaseBDBEntry {...props} fetchEntry={fetchBdb} />
