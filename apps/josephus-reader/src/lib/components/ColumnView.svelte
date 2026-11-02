<script lang="ts">
	import type { TextUnit } from '$lib/services/dbClient';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { highlightStore } from '$lib/stores/highlightStore.svelte';
	import { ParallelColumnView } from '@polyglot/ui';

	interface Props {
		greek?: TextUnit[];
		english?: TextUnit[];
	}

	let { greek = [], english = [] }: Props = $props();

	function handleBookmarkToggle(secStr: string, snippet: string) {
		if (typeof window === 'undefined') return;
		try {
			const saved = localStorage.getItem('josephus_bookmarks');
			let bms = saved ? JSON.parse(saved) : [];
			const id = `${readerState.currentWorkCode}-${readerState.currentBook}-${secStr}`;
			const exists = bms.some((b: any) => b.id === id);
			if (exists) {
				bms = bms.filter((b: any) => b.id !== id);
			} else {
				bms.push({
					id,
					work: readerState.currentWorkCode,
					book: readerState.currentBook,
					section: secStr,
					snippet: snippet.slice(0, 100),
					timestamp: Date.now()
				});
			}
			localStorage.setItem('josephus_bookmarks', JSON.stringify(bms));
		} catch {}
	}
</script>

<ParallelColumnView
	{greek}
	{english}
	viewMode={readerState.viewMode}
	showGreek={readerState.showGreek}
	showEnglish={readerState.showEnglish}
	{highlightStore}
	rowId={(secKey) => `niese-${secKey}`}
	greekHeaderTitle="Benedikt Niese Greek Critical Text (1885–1895)"
	greekHeaderSubtitle="Click Greek word for LSJ & morphology"
	englishHeaderTitle="William Whiston English Translation (1856)"
	englishHeaderSubtitle="Facing English Text"
	showBookmarkButton={true}
	showCiteButton={true}
	onWordClick={(tok, citation) => readerState.openToken(tok, citation)}
	onBookmarkToggle={handleBookmarkToggle}
	onCitationClick={(secKey, gUnit, eUnit) => {
		const nieseSec = gUnit?.niese_section || eUnit?.niese_section || String(secKey);
		readerState.openCitation(readerState.currentWorkCode, readerState.currentBook, nieseSec);
	}}
	getCitation={(secKey, gUnit, eUnit) => {
		const nieseSec = gUnit?.niese_section || eUnit?.niese_section || String(secKey);
		return gUnit?.display_citation || eUnit?.display_citation || `${readerState.currentWork.abbrev} ${readerState.currentBook}.${nieseSec}`;
	}}
/>
