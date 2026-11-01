<script lang="ts">
	import { LexemeSidePanel } from '@polyglot/lemma-ui';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordance,
		fetchAttestedForms,
		searchLemmas
	} from '$lib/services/dbClient';

	function handleNavigateToRef(ref: any) {
		if (ref.work_code && ref.chapter !== undefined) {
			readerState.setWork(ref.work_code, ref.chapter);
		}
	}
</script>

<LexemeSidePanel
	isOpen={readerState.isSidePanelOpen}
	onClose={() => (readerState.isSidePanelOpen = false)}
	activeTab={readerState.activeSidePanelTab}
	onTabChange={(tab) => (readerState.activeSidePanelTab = tab as any)}
	selectedToken={readerState.selectedToken}
	corpusTitle="Apostolic Fathers"
	top="53px"
	ariaLabel="Lexicon & Study Panel"
	{highlightStore}
	{fetchLexiconEntry}
	{fetchLemmaStats}
	{fetchConcordance}
	{fetchAttestedForms}
	{searchLemmas}
	onSelectToken={(t) =>
		readerState.openLemma({ w: t.w || '', l: t.l || '', m: '', p: '', lang: 'grc' }, '')}
	onNavigateToRef={handleNavigateToRef}
/>
