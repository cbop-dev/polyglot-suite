<script lang="ts">
	import { CorpusPickerModal, type CorpusPickerItem } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { CORPUS_TITLES, getCorpusWorks } from '../config/corpora.js';
	import type { AncientCorpusId } from '@polyglot/ancient-languages';

	interface ExtendedCorpusItem extends CorpusPickerItem {
		id: AncientCorpusId;
	}

	let searchQuery = $state<string>('');

	const allCorpora: ExtendedCorpusItem[] = [
		{
			id: 'af',
			title: CORPUS_TITLES.af.name,
			subtitle: CORPUS_TITLES.af.subtitle,
			badge: CORPUS_TITLES.af.badge,
			era: '1st–2nd c. CE',
			totalWorks: getCorpusWorks('af').length
		},
		{
			id: 'philo',
			title: CORPUS_TITLES.philo.name,
			subtitle: CORPUS_TITLES.philo.subtitle,
			badge: CORPUS_TITLES.philo.badge,
			era: 'c. 20 BCE – 50 CE',
			totalWorks: getCorpusWorks('philo').length
		},
		{
			id: 'josephus',
			title: CORPUS_TITLES.josephus.name,
			subtitle: CORPUS_TITLES.josephus.subtitle,
			badge: CORPUS_TITLES.josephus.badge,
			era: 'c. 37 – 100 CE',
			totalWorks: getCorpusWorks('josephus').length
		}
	];

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
		}
		readerState.isCorpusModalOpen = false;
	}
</script>

<CorpusPickerModal
	bind:open={readerState.isCorpusModalOpen}
	bind:searchQuery
	placeholder="Filter corpora by name, era, or code..."
	corpora={filteredCorpora}
	currentCorpusId={readerState.currentCorpus}
	onSelectCorpus={handleSelect}
	onClose={() => (readerState.isCorpusModalOpen = false)}
/>
