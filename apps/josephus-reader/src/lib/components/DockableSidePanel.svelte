<script lang="ts">
	import { LexemeSidePanel } from '@polyglot/lemma-ui';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { getWork } from '$lib/config/canonicalWorks.generated';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		fetchAttestedFormsForLemma,
		fetchWordMorph,
		searchLemmata
	} from '$lib/services/dbClient';

	function handleNavigateToRef(ref: any) {
		readerState.closeAllModals();
		if (ref.work || ref.work_id) {
			const work = getWork(ref.work_id || ref.work);
			const title = work?.titleEnglish || ref.work || 'Antiquities';
			const book = ref.book || 1;
			const sec = ref.section;
			const hash = sec ? `#sec-${sec}` : '';
			goto(`${base}/${title}/book/${book}/${hash}`);
		}
	}
</script>

<LexemeSidePanel
	isOpen={readerState.isSidePanelOpen}
	onClose={() => readerState.closeAllModals()}
	activeTab={readerState.activeSidePanelTab}
	onTabChange={(tab) => (readerState.activeSidePanelTab = tab as any)}
	selectedToken={readerState.selectedToken}
	corpusTitle="Josephus"
	top="53px"
	ariaLabel="Josephus Reference and Lexicon Panel"
	{highlightStore}
	{fetchLexiconEntry}
	{fetchLemmaStats}
	{fetchConcordance}
	fetchAttestedForms={fetchAttestedFormsForLemma}
	{fetchWordMorph}
	searchLemmas={searchLemmata}
	onSelectToken={(t) => readerState.openToken({ w: t.w || '', l: t.l }, '')}
	onNavigateToRef={handleNavigateToRef}
/>
