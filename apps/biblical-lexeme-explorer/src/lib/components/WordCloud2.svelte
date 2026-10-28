<script>
	import { onMount, tick } from 'svelte';
	import WordCloudD32 from './WordCloudD3-2.svelte';
	import TfSelectBooksChaps from './SelectBooksChaps.svelte';
	import * as BibleUtils from '$lib/utils/bible-utils.js';
	import { TfDataset } from '$lib/data/VocabDataset.js';
	import { LexQuery, LexQueryFilter } from '$lib/components/LexQuery.svelte';
	import { Lexeme } from '$lib/Lexeme';
	import { TF } from '$lib/TF';
	import { mylog } from '$lib/env/env.js';
	import { jumpToDiv } from '$lib/utils/ui-utils.js';
	import { Button, Modal2, CopyText, Loading, ArrowUp, ArrowDown as DownArrow } from '@polyglot/ui';
	import LinkSvg from "@polyglot/ui/components/icons/link.svg";
	import LemmaInfo from './LemmaInfo.svelte';
	import { LexAppOptions } from '$lib/options/urlOptions';
	import InputBibleReferences from './InputBibleReferences.svelte';
	import { LexRefQueries } from '$lib/LexRefQueries.svelte';
	
	//import { query } from '$app/server';
	let showLexemeModal=$state(false);
	/**
	 * @type {Lexeme|null} selectedLemma
	 */
	let selectedLemma=$state(null);
	//
	/***
	 * @type {{
	 *  tfData:TfDataset,
	 *  highlightInputField:boolean,
	 *  options:LexAppOptions|null
	 * }}
	 */
	let { tfData, highlightInputField = $bindable(false),
		options=null
	 } = $props();
	let query = $state(new LexQuery());
	/**
	 * @type {{text:string, count:number}[]}
	 */
	let words = $state([]);
	//let filter = $state(new LexQueryFilter());
	let svg = $state({});
	let filterOptions = $state(new LexQueryFilter());
	let showEnglish = $state(false);
	let refText=$state('');
	const defaultSections = tfData?.booksDict?.chapters && Object.values(tfData.booksDict.chapters).length > 0 && Object.values(tfData.booksDict.chapters)[0]
		? Object.keys(Object.values(tfData.booksDict.chapters)[0]).slice(0, 3).map((k) => Number(k))
		: [];
	const defaults = {
		restrict: Lexeme.posGroups.CONT,
		maxWords: 400,
		sections: defaultSections
	};

	mylog(`WordCloud: default.sections=[${defaults.sections.join(',')}]`);
	function chooseDefaults() {
		resetChoices();
		resetSections(defaults.sections);
	}

	/**
	 * @param {number[]} sections
	 */
	function resetSections(sections = []) {
		
		Object.keys(selectedSections).forEach((s) => {
			selectedSections[s] = sections.includes(Number(s)) ? true : false;
		});
		for (const s of sections) {
			selectedSections[s] = true;
		}
	}
	function remindUserToSelectSomething() {
		messageNotify = true;
		highlightInputField = true;
	}

	/**
	 * @type {Object<number, boolean>}
	 */
	let selectedSections = $state({});
	/**
	 * @returns {number[]}
	 */
	function getSelectedSections() {
		let selections = selectedSections; //chaptersOn ? chapsSelected : booksSelected
		const theObs = Object.entries(selections)
			.filter(([id, selected]) => selected == true)
			.map(([i, s]) => Number(i));
		////console.debug("the selections are: " +theObs)
		return theObs;
	}
	$effect(() => {
		if (getSelectedSections().length > 0) highlightInputField = false;
	});

	let message = $state();
	let messageNotify = $state(false);

	function resetChoices() {
		resetSections();
		//query.reset();
		filterOptions.setRestricted(defaults.restrict);
		filterOptions.maxWords = defaults.maxWords;
	}
	//chooseForMe();
	resetChoices();

	function defaultCloud() {
		chooseDefaults();
		generateCloud(true);
	}

	function jumpToCloud() {
		jumpToDiv('wordCloudHeading');
	}

	function customCloud() {
		generateCloud(false);
	}

	function generateCloud(useDefaults = true, jump = true) {
		query.ready = false;
		query.sent = false;
		cloudReady = false;
		query.reset();

		//messageNotify = false;
		message = 'Generating word cloud...';
		/*if (useDefaults) {
			chooseForMe();
		} else {*/

		refText = tfData?.booksDict?.filterOutInvalidBooks ? tfData.booksDict.filterOutInvalidBooks(refText) : refText;
		if (refText.length){
			query.refsText=refText;
			query.sections = [];
			resetSections();
			
		}
		else {
			query.sections = getSelectedSections();
		}
		
		query.filter.copyFrom(filterOptions);
		//}
		if (query.sections.length || query.refsText.length) {
			highlightInputField = false;
			TF.fetchLexemes(query, true, tfData).then(() => {
				const words2 = query.results.lexemeArray
					.toSorted((a, b) => b.stats.queryCount - a.stats.queryCount)
					.slice(0, query.filter.maxWords)
					.map((l) => {
						return {
							text: filterOptions.englishOnly ? l.gloss.split(',')[0] : l.lemma,
							count: l.stats.queryCount,
							id:l.id
						};
					});
				words = words2;
				query.makeReady();
				if (jump) cloudPromise = tick().then(markCloudPrepared);
			});
			query.sent = true;
		} else {
			remindUserToSelectSomething();
		}
	}
	function markCloudPrepared() {
		cloudReady = true;
		jumpToCloud();
		return cloudReady;
	}
	let cloudPromise = $state();
	let cloudComponent = $state();
	let cloudReady = $state(false);
	
	async function handleWordClick(lexid){

		selectedLemma = query.results.lexemeArray.find((l) => l.id === lexid)?.copy() || null;
		if (selectedLemma){
		//	TF.fetchLexInfo(lexid, selectedLemma,tfData).then(()=>
			lexRefQueries.checkGetLemmaRefs(selectedLemma);
			showLexemeModal = true;
			
			
		//)
		} else {
			console.error("Could not find lemma with id " + lexid);
		}
		
		
		
	}
	
	function makeURL(){
		let theURL= '';
		let theOptions = new LexAppOptions();
		mylog(`makeURL(): options.view.panel = '${options.view.panel}'`, true);
		theOptions.view.panel="wc";
		if (query.sections?.length){
			theOptions.request.sections = query.sections;
		}
		else if(query.refsText?.length){
			theOptions.request.refs = query.refsText;
		}
		
		if (query?.exclude?.length) theOptions.request.exclude=query.exclude
		if (query?.restrict?.length) theOptions.request.restrict=query.restrict

		if (theOptions){

			theURL = window.location.protocol + '//' + window.location.host + window.location.pathname + theOptions.generateURI();

		}
		mylog(`Made url: '${theURL}'`);
		return theURL;
	}

	function makeURL2(){
		let theURL= '';
		mylog(`makeURL(): options.view.panel = '${options.view.panel}'`, true);
		let theOptions = options?.copy() || new LexAppOptions();
		
		
		if (query.sections?.length){
			theOptions.request.sections = query.sections;
		}
		else if(query.refsText?.length){
			theOptions.request.refs = query.refsText;
		}
		
		if (query?.exclude?.length) theOptions.request.exclude=query.exclude;
		if (query?.restrict?.length) theOptions.request.restrict=query.restrict;
		
		mylog(`query.exclude:${query.exclude}`, true);
		mylog(`query.restrict:${query.restrict}`, true);
		mylog(`theOptions.request.exclude:${theOptions.request.exclude}`, true);
		mylog(`theOptions.request.exclude:${theOptions.request.exclude}`, true);
		const queryCopy=query.copy();
		const filterCopy = new LexQueryFilter();
		filterCopy.copyFrom(filterOptions);
		queryCopy.filter=filterOptions;
		
		theURL = theOptions.generateURL(queryCopy);

		
		mylog(`Made url: '${theURL}'`);
		return theURL;
	}

	

	let defaultRefs= $derived(`${Object.entries(tfData.booksDict.books)[0][1].abbrev} 1; ${Object.entries(tfData.booksDict.books)[2][1].abbrev} 3:1-4`);
	let lexRefQueries=$derived(new LexRefQueries(tfData,query.sections));
	//$inspect(words, 'words');
	//$inspect(query.filter.maxWords, 'maxWords');
	$inspect('selectedLemma',selectedLemma)
	//$inspect('query',query.response)
	$inspect('lexRefQueries.corpusRefsQueries', lexRefQueries.corpusRefsQueries);
	onMount(()=>{
		if (options && (options.request.sections?.length || options.request.refs?.length)){

			resetChoices();
			
			if (options.request.sections?.length){
					for (const s of options.request.sections){
					selectedSections[s] = true;
				}
			}
			else{
				refText=tfData.booksDict.filterOutInvalidBooks(options.request.refs);
				query.refsText=refText;
				if (!query.refsText.length){
//					mylog("WHOA: got no refsText from url when I should have!", true);
				}
			}
			
			generateCloud(true);
				
		}
	})

	
</script>

<hr class="thick" />
<div class=" self-center text-center">
	<h1 class="text-center text-3xl font-bold">{tfData.name} Vocab Word Cloud!</h1>
	<hr class="thick" />
	Type a Bible reference:
	
		<InputBibleReferences
			defaultRefs={defaultRefs}
			bind:refsText={refText}
			{tfData}
		/>

	<br/>OR select some books/chapters
	<div class="pb-3">
		<TfSelectBooksChaps
			{tfData}
			bind:filterOptions
			bind:selectedSections
			bind:highlightInputField
			enableEnglishOnly={true}
			enableMaxWords={true}
		/>
	<br/>OR 
		<Button toggled={chooseDefaults} buttonColors="btn-seconary" buttonText="Choose for me!" />

	<br/>THEN:
		<Button toggled={generateCloud} buttonText="Generate WordCloud!" />
		{#await cloudPromise then cloudReady}
			{#if cloudReady}<Button
					buttonColors="btn-ghost"
					buttonStyle="btn btn-md mb-0"
					buttonText=""
					tooltip="Scroll down to wordcloud!"
					toggled={jumpToCloud}><DownArrow height={24} width={24} /></Button
				>{/if}
		{/await}
		<!--<ChevronDown onclick={jumpToCloud} />-->
		<!--<DownButton target="wordCloudHeading" />
		<Button toggled={jumpToCloud} buttonText="V" />-->
	</div>
	<hr class="mb-5" />

	{#if query.ready && words.length}
		{@const words2 = $state.snapshot(words)}
		{@const querySections=query.sections.map((s) => tfData.booksDict.getRef(s))}
		{@const refscombined = querySections ? tfData.booksDict.combineRefs(querySections) : query.refsText}
		
		<h2 id="wordCloudHeading">
			Word Cloud of <span class="italic"
				>{refscombined || query.refsText || "refs: " + refText}</span
			>
		</h2><div class="float-right inline-block">
				<Button
				toggled={() => jumpToDiv()}
				buttonColors="btn-ghost"
				buttonStyle="btn btn-sm"
				buttonText=""
				tooltip="Scroll up to top."
				>
				<ArrowUp height={20} width={20} />
				</Button>
			</div>
			
			<p class="text-center italic">Top {words2.length} Lexemes <CopyText getTextFunc={makeURL} icon={LinkSvg} width={16} height={16} tooltip="Copy URL"/></p>
			
		{#key words2}
			
			
			<WordCloudD32
				bind:this={cloudComponent}
				words={words2}
				font={'SBL BibLit'}
				minRotate={-60}
				maxRotate={90}
				minFontSize={10}
				maxFontSize={200}
				width={1200}
				height={800}
				onWordClick={handleWordClick}
			/>
		{/key}
	{/if}
</div>
<Modal2 bind:showModal={showLexemeModal} max={true}>
	{#key selectedLemma}
		{#if selectedLemma?.id && (query.sections || query.refsText.length) && 
		 lexRefQueries.corpusRefsQueries[selectedLemma.id]?.ready && 
		 (!query.sections.length || (lexRefQueries.sectionRefsQueries[selectedLemma.id] && lexRefQueries.sectionRefsQueries[selectedLemma.id]?.ready))}
			
			
			<LemmaInfo
			
				{tfData}
				lemma={selectedLemma.copy()}
				sectionWords={Number(query.response.totalWords)}
				sections={query.sections}
				corpusRefsQuery={lexRefQueries.corpusRefsQueries[selectedLemma.id]}
				sectionRefsQuery={lexRefQueries.sectionRefsQueries[selectedLemma.id]}
			/>
		{:else}
		
		<div class="text-center m-auto"><Loading title="Please wait..." message={['..fetching word info...']}/></div> 
		{/if}
	{/key}
</Modal2>


<style>
	@reference "tailwindcss";
	svg {
		margin: auto;
	}

	hr.thick {
		@apply mb-2 border-b-2 border-b-black;
	}

	h2 {
		@apply text-center text-xl font-bold inline;
	}
	#wordCloudHeading{
		font-family:"SBL BibLit";
		@apply underline text-2xl;
	}
</style>
