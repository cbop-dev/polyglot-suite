<script lang="ts">
	import { LexemeSidePanel } from '@polyglot/lemma-ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { highlightStore } from '../stores/highlightStore.svelte.js';
	import { CORPUS_TITLES } from '../config/corpora.js';
	import { getCorpusPrimaryLanguage } from '@polyglot/ancient-languages';
	import {
		fetchLexiconEntry,
		fetchLemmaStats,
		fetchConcordancePage,
		fetchConcordance,
		fetchSectionText,
		fetchSectionsTextBatch,
		fetchAttestedForms,
		searchLemmas,
		type ConcordanceRef
	} from '../services/dbClient.js';
	import ScriptureCitationsTab from './ScriptureCitationsTab.svelte';

	let corpusTitle = $derived(CORPUS_TITLES[readerState.currentCorpus]?.name || 'Corpus');

	function handleNavigateToRef(ref: any) {
		const targetDiv = ref.book ?? ref.chapter ?? 1;
		const targetSec = ref.section ?? ref.section_num ?? ref.niese_section ?? null;
		readerState.setWork(ref.work_code, targetDiv, targetSec);
	}
</script>

<LexemeSidePanel
	isOpen={readerState.isSidePanelOpen}
	onClose={() => (readerState.isSidePanelOpen = false)}
	activeTab={readerState.activeSidePanelTab}
	onTabChange={(tab) => (readerState.activeSidePanelTab = tab)}
	selectedToken={readerState.selectedToken}
	{corpusTitle}
	language={getCorpusPrimaryLanguage(readerState.currentCorpus)}
	top="53px"
	ariaLabel="Lexicon & Study Panel"
	{highlightStore}
	fetchLexiconEntry={(lemma) => fetchLexiconEntry(readerState.currentCorpus, lemma)}
	fetchLemmaStats={(lemma) => fetchLemmaStats(readerState.currentCorpus, lemma)}
	fetchConcordancePage={(lemma, offset, size, totalCount) => fetchConcordancePage(readerState.currentCorpus, lemma, offset, size, totalCount)}
	fetchConcordance={(lemma) => fetchConcordance(readerState.currentCorpus, lemma)}
	fetchSectionText={(ref) => fetchSectionText(readerState.currentCorpus, ref.work_unit_id ?? ref.id)}
	fetchSectionsTextBatch={(ids) => fetchSectionsTextBatch(readerState.currentCorpus, ids)}
	fetchAttestedForms={(lemma) => fetchAttestedForms(readerState.currentCorpus, lemma)}
	searchLemmas={(query) => searchLemmas(readerState.currentCorpus, query)}
	onSelectToken={(t) =>
		readerState.openToken({ w: t.w || '', l: t.l || '', m: t.m, p: t.p, lang: 'grc' }, '')}
	onNavigateToRef={handleNavigateToRef}
	extraTabs={readerState.currentCorpus === 'philo' ? [{ id: 'scripture', label: 'Scripture' }] : []}
>
	{#snippet extraTabPanels(tabId)}
		{#if tabId === 'scripture'}
			<ScriptureCitationsTab onNavigateToRef={handleNavigateToRef} />
		{/if}
	{/snippet}
</LexemeSidePanel>
