<script>
	import { LSJEntry as BaseLSJEntry } from '@polyglot/lemma-ui';
	import { lsjProvider } from '$lib/engine/LsjProvider.js';

	let props = $props();

	async function fetchLsj(target, strongs, lang) {
		const plain = typeof props.lemma === 'object' ? props.lemma?.plain || '' : '';
		const res = await lsjProvider.getEntry(target, plain);
		return res?.entry
			? {
					headword: res.entry.headword,
					lsjIndex: res.entry.lsjIndex,
					matchType: res.entry.matchType,
					def: res.entry.markdown || res.entry.def,
					isProper: res.isProper
			  }
			: null;
	}
</script>

<BaseLSJEntry {...props} fetchEntry={fetchLsj} />
