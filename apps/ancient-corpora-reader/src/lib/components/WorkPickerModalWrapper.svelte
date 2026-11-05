<script lang="ts">
	import { WorkPickerModal } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { getCorpusWorks } from '../config/corpora.data.js';

	let searchQuery = $state<string>('');

	let allWorks = $derived(
		getCorpusWorks(readerState.currentCorpus).map((w) => ({
			code: w.code,
			titleEnglish: w.titleEnglish,
			titleGreek: w.titleGreek,
			titleLatin: w.titleLatin,
			abbrev: w.abbrev,
			category: w.category || 'general',
			totalBooks: w.totalDivisions
		}))
	);

	let filteredWorks = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return allWorks;

		return allWorks.filter((w) => {
			return (
				w.titleEnglish.toLowerCase().includes(q) ||
				w.code.toLowerCase().includes(q) ||
				(w.abbrev && w.abbrev.toLowerCase().includes(q)) ||
				(w.titleGreek && w.titleGreek.toLowerCase().includes(q)) ||
				(w.titleLatin && w.titleLatin.toLowerCase().includes(q))
			);
		});
	});

	function handleSelect(item: any) {
		readerState.setWork(item.code);
		readerState.isWorkModalOpen = false;
	}
</script>

<WorkPickerModal
	bind:open={readerState.isWorkModalOpen}
	bind:searchQuery
	placeholder="Filter works by title, abbrev, or code..."
	works={filteredWorks}
	currentWorkCode={readerState.currentWorkCode}
	onSelectWork={handleSelect}
	onClose={() => (readerState.isWorkModalOpen = false)}
/>