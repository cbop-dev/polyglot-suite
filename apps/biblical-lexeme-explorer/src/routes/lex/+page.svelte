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
	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	const panes = ['book', 'lex', 'wc'];
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
	<LexInBooks {tfData} hidden={panes[selectedPane] != 'book'} />
</div>

<div class={panes[selectedPane] == 'lex' ? 'block' : 'hidden'}>
	<LexSearch {tfData} />
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
