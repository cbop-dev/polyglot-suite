<script>
	import LexInBooks from '$lib/components/LexInBooks.svelte';
	import LexSearch from '$lib/components/LexSearch.svelte';
	//import WordCloud from '$lib/components/WordCloud.svelte';
	import WordCloud2 from '$lib/components/WordCloud2.svelte';
	import { TfLxxDataset } from '$lib/lxx/tfLXX';
	import {TfBhsDataset} from '$lib/bhs/bhs.js';
	import { TfDataset } from '$lib/data/VocabDataset.js';
	import {TfSblGntDataset} from "$lib/sblgnt/tfSblGnt.js"
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import TopNavBar from '$lib/components/ui/TopNavBar.svelte';
	/** @type {{ data: import('./$types').PageData }} */
	/***/
	let { data } = $props();

	const panes = ['book', 'lex', 'wc'];
	let tfdataName = $derived((data?.tfdataName || 'lxx').toLowerCase());
	const dataSets = { lxx: new TfLxxDataset(), bhs: new TfBhsDataset(), sblgnt: new TfSblGntDataset() };
	const tfData = $derived(dataSets[tfdataName] || dataSets.lxx);
	let selectedPane = $state(0);

	let options = $derived(data?.options);
	$effect(() => {
		if (mounted && (selectedPane >=0 && panes.length >selectedPane)){
			options.view.panel=panes[selectedPane];
		}
		
	});
	let mounted=$state(false);
	onMount(() => {
		if (typeof window !== 'undefined') {
			window.history.pushState({}, document.title, window.location.pathname);
		}
		if (options?.view?.panel && panes.includes(options.view.panel)) {
			selectedPane = panes.indexOf(options.view.panel);
		}

		mounted = true;
	});
</script>

<svelte:head>
	<title>{tfData?.abbrev || tfData?.name || 'Bible'} Lexemes | Biblical Lexeme Explorer</title>
</svelte:head>
<!--<h1>Got panel={data.options.view.panel}</h1>-->

<TopNavBar currentVersion={tfdataName} />

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
{#if tfData}
<div class={panes[selectedPane] == 'book' ? 'block' : 'hidden'}>
	<LexInBooks {tfData} hidden={panes[selectedPane] != 'book'} />
</div>

<div class={panes[selectedPane] == 'lex' ? 'block' : 'hidden'}>
	<LexSearch {tfData} />
</div>
<div class={panes[selectedPane] == 'wc' ? 'block' : 'hidden'}>
	<WordCloud2 {tfData} {options}/>
</div>
{/if}

<style>
	.tabs .tab-active {
		@apply bg-accent text-accent-content !important;
		font-weight: bold;
	}

	.tab {
		height: auto;
	}
</style>
