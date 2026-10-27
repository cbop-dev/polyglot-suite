<script>
	import { goto } from '$app/navigation';
	import LexInBooks from '$lib/components/LexInBooks.svelte';
	import LexSearch from '$lib/components/LexSearch.svelte';
	import WordCloud2 from '$lib/components/WordCloud2.svelte';
	import { VocabDataset, TfDataset } from '$lib/data/VocabDataset.js';
	import { LxxVocabDataset, TfLxxDataset } from '$lib/lxx/lxxDataset.js';
	import { BhsVocabDataset, TfBhsDataset } from '$lib/bhs/bhsDataset.js';
	import { mylog } from '$lib/env/env.js';
	import { onMount } from 'svelte';
	import { Tabs2 } from '@polyglot/lemma-ui';
	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	const panes = ['book', 'lex', 'wc'];
	const paneHeadings = [
		{ label: 'Book Search', shortLabel: 'Book' },
		{ label: 'Lexeme Search', shortLabel: 'Lexeme' },
		{ label: 'Word Cloud', shortLabel: 'Cloud' }
	];
	let selectedPane = $state(0);
	const lxxData = new LxxVocabDataset();
	/** @type {VocabDataset} tfData*/
	let tfData = $state(lxxData);
	let options = $derived(data?.options);
	$effect(() => {
		if (options?.view?.panel && panes.includes(options.view.panel)) {
			selectedPane = panes.indexOf(options.view.panel);
		}
	});
	onMount(() => {
		if (typeof window !== 'undefined') {
			window.history.pushState({}, document.title, window.location.pathname);
		}
	});
</script>

<svelte:head>
	<title>{tfData.name} Lexemes</title>
</svelte:head>

<div class="flex justify-center my-3">
	<Tabs2 headings={paneHeadings} bind:selectedTabIndex={selectedPane} />
</div>

<div class={panes[selectedPane] == 'book' ? 'block' : 'hidden'}>
	<LexInBooks {tfData} hidden={panes[selectedPane] != 'book'} />
</div>

<div class={panes[selectedPane] == 'lex' ? 'block' : 'hidden'}>
	<LexSearch {tfData} />
</div>
<div class={panes[selectedPane] == 'wc' ? 'block' : 'hidden'}>
	<WordCloud2 {tfData} {options} />
</div>
