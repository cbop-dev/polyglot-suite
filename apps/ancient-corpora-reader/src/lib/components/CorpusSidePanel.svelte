<script lang="ts">
	import { LexemeSidePanel } from '@polyglot/lemma-ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { findWork } from '../config/corpora.data.js';
	import { highlightStore } from '../stores/highlightStore.svelte.js';
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

	let corpusTitle = $derived(readerState.currentCorpusConfig?.name || 'Corpus');

	function handleNavigateToRef(ref: any) {
		const work = findWork(readerState.currentCorpus, ref.work_code);
		const pagLevel = work?.paginationLevel ?? 0;
		let targetDiv: string | number = ref.book ?? ref.chapter ?? 1;
		if (ref.coord_path) {
			targetDiv = String(ref.coord_path)
				.split('.')
				.slice(0, pagLevel + 1)
				.join('.');
		} else if (ref.book && ref.chapter && ref.book !== ref.chapter) {
			targetDiv = pagLevel >= 1 ? `${ref.book}.${ref.chapter}` : ref.book;
		}
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
	language={readerState.selectedToken?.lang || readerState.currentCorpusConfig.primaryLanguage || getCorpusPrimaryLanguage(readerState.currentCorpus)}
	top="53px"
	ariaLabel="Lexicon & Study Panel"
	{highlightStore}
	fetchLexiconEntry={(lemma) => fetchLexiconEntry(readerState.currentCorpus, lemma, readerState.selectedToken?.lang)}
	fetchLemmaStats={(lemma) => fetchLemmaStats(readerState.currentCorpus, lemma)}
	fetchConcordancePage={(lemma, offset, size, totalCount, formFilter) => fetchConcordancePage(readerState.currentCorpus, lemma, offset, size, totalCount, formFilter)}
	fetchConcordance={(lemma, formFilter) => fetchConcordance(readerState.currentCorpus, lemma, formFilter)}
	fetchSectionText={(ref) => fetchSectionText(readerState.currentCorpus, ref.work_unit_id ?? ref.id)}
	fetchSectionsTextBatch={(ids) => fetchSectionsTextBatch(readerState.currentCorpus, ids)}
	fetchAttestedForms={(lemma) => fetchAttestedForms(readerState.currentCorpus, lemma)}
	searchLemmas={(query) => searchLemmas(readerState.currentCorpus, query)}
	onSelectToken={(t) =>
		readerState.openToken(
			{
				w: t.w || '',
				l: t.l || '',
				m: t.m,
				p: t.p,
				lang: readerState.currentCorpusConfig.primaryLanguage || 'grc'
			},
			''
		)}
	onNavigateToRef={handleNavigateToRef}
	extraTabs={readerState.currentCorpus === 'philo' ? [{ id: 'scripture', label: 'Scripture' }] : []}
>
	{#snippet extraTabPanels(tabId)}
		{#if tabId === 'scripture'}
			<ScriptureCitationsTab onNavigateToRef={handleNavigateToRef} />
		{/if}
	{/snippet}
</LexemeSidePanel>
