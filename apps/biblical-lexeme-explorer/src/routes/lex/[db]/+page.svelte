<script>
	import LexInBooks from '$lib/components/LexInBooks.svelte';
	import LexSearch from '$lib/components/LexSearch.svelte';
	import WordCloud2 from '$lib/components/WordCloud2.svelte';
	import { LxxVocabDataset } from '$lib/lxx/lxxDataset.js';
	import { SblGntVocabDataset } from '$lib/sblgnt/sblgntDataset.js';
	import { BhsVocabDataset } from '$lib/bhs/bhsDataset.js';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Tabs2 } from '@polyglot/lemma-ui';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	const db = data.db;

	const panes = ['book', 'lex', 'wc'];
	const paneHeadings = [
		{ label: 'Book Search', shortLabel: 'Book' },
		{ label: 'Lexeme Search', shortLabel: 'Lexeme' },
		{ label: 'Word Cloud', shortLabel: 'Cloud' }
	];
	let selectedPane = $state(0);

	let tfData = $derived.by(() => {
		if (db === 'sblgnt') return new SblGntVocabDataset();
		if (db === 'bhs') return new BhsVocabDataset();
		return new LxxVocabDataset();
	});

	let options = $derived(data?.options);

	let urlPanel = $derived(page.url.searchParams.get('panel'));
	let urlRefs = $derived(
		page.url.searchParams.get('refs') ||
		(page.url.searchParams.get('book')
			? `${page.url.searchParams.get('book')} ${page.url.searchParams.get('chapter') || '1'}${page.url.searchParams.get('verse') ? ':' + page.url.searchParams.get('verse') : ''}`
			: '')
	);
	let urlLemma = $derived(page.url.searchParams.get('lemma') || page.url.searchParams.get('lex') || '');
	let urlId = $derived(page.url.searchParams.get('id') || '');

	$effect(() => {
		const activePanel = urlPanel || (urlId || urlLemma ? 'lex' : null) || options?.view?.panel;
		if (activePanel && panes.includes(activePanel)) {
			selectedPane = panes.indexOf(activePanel);
		}
	});
	onMount(() => {
		if (typeof window !== 'undefined' && !urlRefs && !urlLemma && !urlId && !urlPanel) {
			window.history.pushState({}, document.title, window.location.pathname);
		}
	});
</script>

<svelte:head>
	<title>{tfData.name || tfData.abbrev} Lexemes</title>
</svelte:head>

<div class="flex justify-center my-3">
	<Tabs2 headings={paneHeadings} bind:selectedTabIndex={selectedPane} />
</div>

<div class={panes[selectedPane] == 'book' ? 'block' : 'hidden'}>
	<LexInBooks {tfData} initialRefs={urlRefs || options?.request?.refs || ''} hidden={panes[selectedPane] != 'book'} />
</div>

<div class={panes[selectedPane] == 'lex' ? 'block' : 'hidden'}>
	<LexSearch {tfData} initialLemma={urlLemma || ''} initialId={urlId || ''} />
</div>
<div class={panes[selectedPane] == 'wc' ? 'block' : 'hidden'}>
	<WordCloud2 {tfData} {options} />
</div>
