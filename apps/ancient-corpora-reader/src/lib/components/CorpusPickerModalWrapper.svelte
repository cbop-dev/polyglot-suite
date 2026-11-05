<script lang="ts">
	import { CorpusPickerModal, type CorpusPickerItem } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { getCorpusWorks } from '../config/canonicalWorks.js';
	import { getAllCorpora } from '../config/corpora.js';
	import type { AncientCorpusId } from '@polyglot/ancient-languages';
	import { resolve } from '$app/paths';
	import {goto} from '$app/navigation';

	interface ExtendedCorpusItem extends CorpusPickerItem {
		id: AncientCorpusId;
	}

	let searchQuery = $state<string>('');

	const allCorpora: ExtendedCorpusItem[] = getAllCorpora().map((cfg) => ({
		id: cfg.id as AncientCorpusId,
		title: cfg.name,
		subtitle: cfg.subtitle,
		badge: cfg.badge,
		era: cfg.era,
		totalWorks: getCorpusWorks(cfg.id as AncientCorpusId).length
	}));

	let filteredCorpora = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return allCorpora;

		return allCorpora.filter((c) => {
			return (
				c.title.toLowerCase().includes(q) ||
				c.id.toLowerCase().includes(q) ||
				(c.badge && c.badge.toLowerCase().includes(q)) ||
				(c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
				(c.era && c.era.toLowerCase().includes(q))
			);
		});
	});

	function handleSelect(corpus: ExtendedCorpusItem) {
		if (corpus.id !== readerState.currentCorpus) {
			readerState.setCorpus(corpus.id);
			//goto(resolve('/')+corpus.id);

		}
		readerState.isCorpusModalOpen = false;
	}
</script>

<CorpusPickerModal
	bind:open={readerState.isCorpusModalOpen}
	bind:searchQuery
	
	corpora={filteredCorpora}
	currentCorpusId={readerState.currentCorpus}
	onSelectCorpus={handleSelect}
	onClose={() => (readerState.isCorpusModalOpen = false)}
/>
