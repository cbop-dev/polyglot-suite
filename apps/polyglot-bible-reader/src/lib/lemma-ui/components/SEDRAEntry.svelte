<script lang="ts">
	import { SEDRAEntry as BaseSEDRAEntry } from '@polyglot/lemma-ui';

	let props = $props<{
		sedraId?: string;
		lemma?: string;
		word?: string;
		root?: string;
		calLemma?: string;
		autoOpen?: boolean;
	}>();
</script>

<BaseSEDRAEntry {...props} />
