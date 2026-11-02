<script lang="ts">
	import { WorkPickerModal } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { getCorpusWorks, type UnifiedCanonicalWork } from '../config/canonicalWorks.js';

	let works = $derived(
		getCorpusWorks(readerState.currentCorpus).map((w) => ({
			code: w.code,
			titleEnglish: w.titleEnglish,
			titleGreek: w.titleGreek,
			titleLatin: w.titleLatin,
			abbrev: w.abbrev,
			category: w.category || 'general'
		}))
	);

	function handleSelect(item: any) {
		readerState.setWork(item.code);
		readerState.isWorkModalOpen = false;
	}
</script>

<WorkPickerModal
	open={readerState.isWorkModalOpen}
	placeholder="Search {readerState.currentWork.divisionLabel}s or titles..."
	{works}
	currentWorkCode={readerState.currentWorkCode}
	onSelectWork={handleSelect}
	onClose={() => (readerState.isWorkModalOpen = false)}
/>
