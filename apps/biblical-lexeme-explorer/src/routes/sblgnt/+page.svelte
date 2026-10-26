<script>
	import LexInBooks from '$lib/components/LexInBooks.svelte';
	import WordCloud2 from '$lib/components/WordCloud2.svelte';
	import LexSearch from '$lib/components/LexSearch.svelte';
	import { SblGntVocabDataset, TfSblGntDataset } from '$lib/sblgnt/sblgntDataset.js';
	import { VocabDataset, TfDataset } from '$lib/data/VocabDataset.js';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import TopNavBar from '$lib/components/ui/TopNavBar.svelte';
	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	const panes = ['book', 'lex', 'wc'];
	let selectedPane = $state(0);
	const sblGntData = new SblGntVocabDataset();
	/** @type {VocabDataset} tfData */
	let tfData = $state(sblGntData);
	let options = $derived(data?.options);

	let urlPanel = $derived(page.url.searchParams.get('panel'));
	let urlRefs = $derived(
		page.url.searchParams.get('refs') ||
		(page.url.searchParams.get('book')
			? `${page.url.searchParams.get('book')} ${page.url.searchParams.get('chapter') || '1'}${page.url.searchParams.get('verse') ? ':' + page.url.searchParams.get('verse') : ''}`
			: '')
	);
	let urlLemma = $derived(page.url.searchParams.get('lemma') || page.url.searchParams.get('lex') || '');

	$effect(() => {
		const activePanel = urlPanel || options?.view?.panel;
		if (activePanel && panes.includes(activePanel)) {
			selectedPane = panes.indexOf(activePanel);
		}
	});
	onMount(() => {
		if (typeof window !== 'undefined' && !urlRefs && !urlLemma && !urlPanel) {
			window.history.pushState({}, document.title, window.location.pathname);
		}
	});
</script>

<svelte:head>
	<title>NT Lexemes | Biblical Lexeme Explorer</title>
</svelte:head>

<TopNavBar currentVersion="sblgnt" />

<div role="tablist" class="tabs tabs-lifted">
	<a
		role="tab"
		class="tab {selectedPane == 0 ? 'tab-active' : ''} "
		tabindex="0"
		onclick={() => {
			selectedPane = 0;
		}}
	>
		<span class="sm:hidden">Book</span>
		<span class="hidden sm:inline">Book Search</span>
	</a>
	<a
		role="tab"
		class="tab {selectedPane == 1 ? 'tab-active' : ''} "
		tabindex="1"
		onclick={() => {
			selectedPane = 1;
		}}
	>
		<span class="sm:hidden">Lexeme</span>
		<span class="hidden sm:inline">Lexeme Search</span>
	</a>
	<a
		role="tab"
		class="tab {selectedPane == 2 ? 'tab-active' : ''} "
		tabindex="2"
		onclick={() => {
			selectedPane = 2;
		}}
	>
		<span class="sm:hidden">Cloud</span>
		<span class="hidden sm:inline">Word Cloud</span>
	</a>
</div>
<div class={panes[selectedPane] == 'book' ? 'block' : 'hidden'}>
	<LexInBooks {tfData} initialRefs={urlRefs || options?.request?.refs || ''} hidden={panes[selectedPane] != 'book'} />
</div>

<div class={panes[selectedPane] == 'lex' ? 'block' : 'hidden'}>
	<LexSearch {tfData} initialLemma={urlLemma || ''} />
</div>
<div class={panes[selectedPane] == 'wc' ? 'block' : 'hidden'}>
	<WordCloud2 {tfData} {options} />
</div>

<style>
	.tabs .tab-active {
		@apply bg-accent !important;
		font-weight: bold;
	}

	.tab {
		height: auto;
	}
</style>
