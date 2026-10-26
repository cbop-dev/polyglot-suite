<!--- 
NB: this module has been made to not be (very) reactive to the properties sent to it by the parent, because the data charts do not react well to dynamic changes. 
THUS: any instance used by the parent should be destroyed and re-rendered when the lemma or sections properties change. 
That is, the <LemmaInfo> tag should be surrounded by tags such as : {#key lemma ... } {/key} 

-->
<script>
	import { VocabDataset, TfDataset } from '$lib/data/VocabDataset.js';
	import { Lexeme } from '$lib/Lexeme.js';
	import * as BibleUtils from '$lib/utils/bible-utils.js';
	import * as StringUtils from '$lib/utils/string-utils.js';
	import Icon from '$lib/components/ui/icons/Icon.svelte';
	import BarsSvg from '$lib/components/ui/icons/colorful-bar-chart.svg';
	import BookOpenSvg from '$lib/components/ui/icons/book-open.svg';
	import BookSvg from '$lib/components/ui/icons/book.svg';
	//import { getQueriesForElement, queryAllByAltText } from "@storybook/test";
	import OptionButton from './ui/OptionButton.svelte';
	import LemmaRefs from './LemmaRefs.svelte';
	import { onMount } from 'svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	import Button from '$lib/components/ui/Button.svelte';
	import Tabs from '$lib/components/ui/Tabs2.svelte';
	import BarChart from './ui/BarChart.svelte';
	import PieChart from './ui/PieChart.svelte';
	import { LexQuery } from './LexQuery.svelte';
	import { untrack } from 'svelte';
	import { VocabEngine, TF } from '$lib/engine/VocabEngine.js';
	

	import Grid from 'gridjs-svelte';
	import { mylog } from "$lib/env/env.js"
	import Loading from './ui/Loading.svelte';
	import LSJEntry from './LSJEntry.svelte';
	import BDBEntry from './BDBEntry.svelte';

	/**
	 * @typedef LemmaInfoProps
	 * @property {Lexeme} lemma
	 * @property {TfDataset} tfData
	 * @property {LexQuery} corpusRefsQuery
	 * @property {LexQuery} sectionRefsQuery
	 * @property {number} [sectionWords=0]
	 * @property {number[]} [sections=[]]
	 *
	 */
	/**
	 * @type {LemmaInfoProps} props
	 */
	let {
		tfData,
		/**
		 * @type {Lexeme} lemma
		 **/
		lemma,
		//sectionWords = 0,
		corpusRefsQuery,
		sectionRefsQuery,
		sections = [],
		//bookId=0,//optional
	} = $props();
	
	
	let showReferences = $state(false);
	let showSectionReferences = $state(false);
	let selectedMainTab=$state(0);
	let selectedStatsTab = $state(0);
	let bookIdSelectOption = $state(0);
	let chosenBookId = $state(0);
	let sectionStats=$derived(chosenBookId ? lemma.stats.bookStats[chosenBookId] : lemma.stats.querySectionStats);
	let sectionWords = $derived(sectionStats?.words?.section);
	//let userSelectedSections=$derived(chosenBookId ? [chosenBookId] : sections);
	//todo make use of chosenBookId;
	let userSelectedSections=$derived(
		 sectionRefsQuery?.sections?.length ? [...sectionRefsQuery.sections] 
		 : 
			sections.length ?
				sections	
			:
				[]
	);

	let theLemma=$state(lemma.copy());
	/**
	 *
	 * @param text {string}
	 */
	function copyToClipboard(text) {
		navigator.clipboard.writeText(text);
	}

	function lemmaDetailsClick() {}

	//let corpusRefsQuery = $state(new LexQuery());
	//let sectionRefsQuery = $state(new LexQuery());

	let showStats = $state(false);
	function floatRound(float, decimals = 3) {
		const factor = Math.pow(10, decimals);
		return Math.round(float * factor) / factor;
	}

	$effect(()=>{
		if (!showStats){
			selectedStatsTab = 0;		
			
			
		}
		if (!tabs[selectedStatsTab].includes("Large")){
			lemmaBookCountChartOptionIndex=lemmaBookCountChartOptions.length-1;
		}

	})


	/**
	 * @type {{nums: number[], labels: string[]}|null}
	 */
	let lemmaBookCountsChartData = $derived.by(() => {
		if (corpusRefsQuery.ready && corpusRefsQuery?.results?.bookCounts) {
			return untrack(()=>{
				return {
				nums: Object.values(corpusRefsQuery.results.bookCounts),
				labels: Object.keys(corpusRefsQuery.results.bookCounts)?.map(
					(id) => tfData?.booksDict?.books?.[Number(id)]?.abbrev || id
				)
			}});
		} else {
			return null;
		}
	});
	let lemmaCorpusFreq = $derived(lemma.stats.totalFreq); 

	let lemmaBookCountChartOptionIndex = $state(0);
	let lemmaBookCountChartOptions = ['Lemma Count', 'Frequency', 'Data Table'];

	let lemmaBookFreqChartData = $derived.by(() => {
		if (corpusRefsQuery.ready && corpusRefsQuery.results.bookCounts) {
			return  untrack(()=>{
				return {
				nums: Object.entries(corpusRefsQuery.results.bookCounts).map(
					([id, count]) => (1000 * count) / (tfData?.booksDict?.books?.[Number(id)]?.words || 1)
				),
				labels: Object.keys(corpusRefsQuery.results.bookCounts).map(
					(id) => tfData?.booksDict?.books?.[Number(id)]?.abbrev || id
				)
			}});
		} else {
			return null;
		}
	});

	let lemmaBookTable = $derived.by(() => {
		if (!lemmaBookCountsChartData || !lemmaBookFreqChartData) return null;
		else {
			mylog('generating lemmaBookTable rows...');
			return untrack(()=>{
				return {
				data: lemmaBookCountsChartData.nums.map((count, index) => [
					lemmaBookCountsChartData.labels[index],
					count,
					floatRound(lemmaBookFreqChartData.nums[index].toFixed(3), 3),
					floatRound(lemmaBookFreqChartData.nums[index] / lemma.stats.totalFreq, 3)
				]),
				columns: ['Book', 'Count', 'Freq', 'Freq ratio']
			}});

			//dummy data to test
			/*return {
            data: [
                ["Jack", 2, 3.5],
                ["Jill", 4, 6.5],
                ["George", 9, 0.5],
            ],
            columns: ["Book", "Count", "Freq"] 
       }*/
		}
	});
	$effect(() => {
		if (innerWidth.current) {
			//Bar Chart resizing can cause a recursive loop that crashes the browser window.  :-(
			// Change tabs! BUT, we need to use untrack to avoid causing yet ANOTHER recursive loop!
			selectedStatsTab = untrack(() => (tabs[selectedStatsTab].includes("Large") ? 0 : selectedStatsTab));
		}
	});
	

	onMount(() => {
		if (sectionRefsQuery && !sectionRefsQuery.ready && lemma?.id >= 0) {
			VocabEngine.fetchRefs(lemma.id, userSelectedSections, sectionRefsQuery, tfData?.dbAbbrev || 'lxx');
		}
		if (corpusRefsQuery && !corpusRefsQuery.ready && lemma?.id >= 0) {
			VocabEngine.fetchRefs(lemma.id, null, corpusRefsQuery, tfData?.dbAbbrev || 'lxx');
		}
	});

	let zoomCharts = $state(false);
	let querySectionRef = $derived(
		tfData.booksDict.combineRefs(userSelectedSections.length ? userSelectedSections.map((sId) => tfData.booksDict.getRef(sId)) : [])
	);
	let sectionRef = $derived(
		chosenBookId
			? tfData.booksDict.getRef(chosenBookId)
			: tfData.booksDict.combineRefs(userSelectedSections.length ? userSelectedSections.map((sId) => tfData.booksDict.getRef(sId)) : [])
	);

	const tabs = true || userSelectedSections.length || chosenBookId
		? ['Basic Stats', 'Small Charts', 'Large Charts/Table']
		: ['Basic Stats', 'Large Charts/Table'];
	//$inspect('bookcounts chart data:', lemmaBookCountsChartData);
	//$inspect("tfData.lexStats.totalWords=",tfData.lexStats.totalWords);
	//$inspect("corpusRefsQuery:", corpusRefsQuery);
	//mylog("WHAT HEREHE!",true)
	$inspect(`lemma.bookStats(len=${Object.keys(lemma.stats.bookStats).length})`,lemma.stats.bookStats);
	$inspect("userSelectedSections=",userSelectedSections);
</script>

<div class="items-center text-center">
	<h1 class="text-xxl greek font-bold">{lemma.lemma}</h1>

	<h2 class="inline-block">Gloss:</h2>
	{lemma.gloss}<br />
	<h2 class="inline-block">Part of speech:</h2>
	{lemma.posEnums.map((p) => (Lexeme.getPosFromEnum(p)?.desc || tfData?.posDict?.[p]?.desc || 'Unspecified')).join(', ')}
	<br/>
	<span class="inline-block italic text-sm">
		ID: {lemma.id}{#if lemma.strongs}; Strongs: {lemma.strongs}{/if}
	</span>

	{#if tfData?.lang === 'greek' || (tfData?.dbAbbrev !== 'bhs' && tfData?.lang !== 'hebrew')}
		<div class="max-w-xl mx-auto px-2">
			<LSJEntry {lemma} lang={tfData?.lang || 'greek'} dbAbbrev={tfData?.dbAbbrev || 'lxx'} />
		</div>
	{:else if tfData?.dbAbbrev === 'bhs' || tfData?.lang === 'hebrew'}
		<div class="max-w-xl mx-auto px-2">
			<BDBEntry {lemma} lang={tfData?.lang || 'hebrew'} dbAbbrev={tfData?.dbAbbrev || 'bhs'} />
		</div>
	{/if}

	<div class="m-0 mt-1 block self-center p-0 text-center">
	
		<OptionButton bind:selected={showStats} buttonText=""
		customClickHandler={()=>{showSectionReferences=false; showReferences=false;}}>
			<Icon svg={BarsSvg} />Stats!
		</OptionButton>
		{#if !chosenBookId && userSelectedSections && userSelectedSections.length > 0}
			<OptionButton
				buttonText=""
				bind:selected={showSectionReferences}
				customClickHandler={()=>{showStats=false; showReferences=false;}}
				
			>
			{#if showSectionReferences}
				<Icon svg={BookOpenSvg} />	
			{:else}
				<Icon svg={BookSvg} />
			{/if}
			See {lemma.stats.querySectionStats.lexCounts.section} instance{#if lemma.stats.querySectionStats.lexCounts.section > 1}s{/if}. in {sectionRef}
		</OptionButton>
		{/if}
		<OptionButton
			buttonText=""
			bind:selected={showReferences}
			customClickHandler={()=>{showStats=false; showSectionReferences=false;}}
		>
			{#if showReferences}
				<Icon svg={BookOpenSvg} />	
			{:else}
				<Icon svg={BookSvg} />
			{/if}See {lemma.stats.total} {StringUtils.capitalize(tfData.abbrev)} instance{#if lemma.stats.total > 1}s{/if}.
		</OptionButton>
	</div>
	{#if showStats}
		
		<hr />
		<h2 class="text-2xl pb-1">Stats and Charts</h2>
		<span
			class="greek block text-xs p0 m0"
			title="τί τὸ σοφώτατον; ἀριθμός· δεύτερον δὲ τὸ τοῖς πράγμασι τὰ ὀνόματα τιθέμενον. In Pythagoras, 'Testimonia, Part C: Attributed Doctrines (D)', LCL 527:118-119"
			>"What is the wisest? Number. The second is what gives things their names." &ndash;Pythagorus</span
		>
		<span
			class="block text-center text-xs mb-2"
			title="Twain, Mark. 'Chapters from My Autobiography: XX.' The North American Review 185, no. 618 (1907): 465–74. http://www.jstor.org/stable/25105919."
			>"There are three kinds of lies: lies, d*mned lies, and statistics." &ndash;Mark Twain</span
		>

		<Tabs
			headings={tabs}
			bind:selectedTabIndex={selectedStatsTab}
			classes={['inline-block', 'text-center']}
		/>
		<hr/>
		<h2>Lemma Stats for {lemma.lemma} in {#if chosenBookId || userSelectedSections.length > 0}: {sectionRef} / {/if} {tfData.abbrev}</h2><br/>
		

			
			{#if !tabs[selectedStatsTab].includes("Large")}
				<div class="block m-auto p-1.5 flex items-center justify-center gap-2">
				
				<select bind:value={bookIdSelectOption} class="select select-bordered select-sm bg-base-100 text-base-content">
					{#if userSelectedSections.length && querySectionRef}
						<option  value={0}>{querySectionRef}</option>
					{/if}
					{#each Object.keys(lemma.stats.bookStats) as bId}
						{#if tfData.booksDict.books[Number(bId)]?.abbrev}
						
							<option value={Number(bId)}>{tfData.booksDict.books[Number(bId)].abbrev}</option>
						
						{/if}
					{/each}
				</select><Button
					buttonText="Go!"
					buttonColors="btn-primary btn-sm"
					toggled={() => {
						chosenBookId=bookIdSelectOption;
					}}
				></Button>
			</div>
			{/if}

			{#if tabs[selectedStatsTab].includes("Basic")}
		<!-- from synop-->
			{#key userSelectedSections.length && selectedStatsTab && chosenBookId}
				
					
				
					<!-- stats section-->
				{#if chosenBookId || userSelectedSections.length > 0}
					<div class="stats stats-vertical lg:stats-horizontal shadow inline-block">
						<div class="stat">
							<div class="stat-title">Section Word count</div>
							<div class="stat-value">{sectionStats.lexCounts.section}</div>
							<div class="stat-desc">Total instances of {lemma.lemma} in {sectionRef}</div>
						</div>
					</div>
					

					
					<div class="stats shadow inline-block">
						<div class="stat">
							<div class="stat-title">Rest of {tfData.abbrev} Word count (excluding {sectionRef})</div>
							<div class="stat-value">{sectionStats.lexCounts.rest}</div>
							<div class="stat-desc">
								Total instances of {lemma.lemma}{#if chosenBookId || userSelectedSections.length > 0} (minus {sectionRef}) {/if} in {tfData.abbrev}
							</div>
						</div>
					</div>

				{#if sectionStats.freq.section}
					<div class="stats shadow inline-block">
						<div class="stat">
							<div class="stat-title">Section frequency</div>
							<div class="stat-value">{sectionStats.freq.section.toFixed(3)}</div>
							<div class="stat-desc">
								Frequency of {lemma.lemma} in {sectionRef} per 1,000 words
							</div>
						</div>
					</div>
				{/if}

				<div class="stats shadow inline-block">
					<div class="stat">
						<div class="stat-title">Rest of {tfData.abbrev} frequency (excluding {sectionRef})</div>
						<div class="stat-value">{sectionStats.freq.rest.toFixed(3)}</div>
						<div class="stat-desc">per 1,000 words</div>
					</div>
				</div>

				<div class="stats shadow inline-block">
					<div class="stat">
						<div class="stat-title">Percentage of {tfData.abbrev} use</div>
						<div class="stat-value">
							{(
								(100 * sectionStats.lexCounts.section) /
								lemma.stats.total
							).toFixed(1)}%
						</div>
						<div class="stat-desc">Section's share of {tfData.abbrev}'s total use of {lemma.lemma}</div>
					</div>
				</div>
				{/if}
				<div class="stats shadow inline-block">
					<div class="stat">
						<div class="stat-title">{tfData.abbrev} count</div>
						<div class="stat-value">{lemma.stats.total}</div>
						<div class="stat-desc">Total {lemma.lemma} count in {tfData.abbrev}</div>
					</div>
				</div>

				

				

				<div class="stats shadow inline-block">
					<div class="stat">
						<div class="stat-title">Average {tfData.abbrev} frequency</div>
						<div class="stat-value">{lemma.stats.totalFreq.toFixed(3)}</div>
						<div class="stat-desc">Frequency of {lemma.lemma} per 1,000 words in {tfData.abbrev}</div>
					</div>
				</div>
				
				
				
			{/key}
		<!-- end from synp-->
		
		{/if}
		
		{#if tabs[selectedStatsTab].includes("Large")}
		
		<hr />
		<h2>Use by Book:</h2>
		{#key lemmaBookCountsChartData && lemmaBookCountChartOptionIndex}
			{#if lemmaBookCountsChartData}
				<!--<div class="w-screen"></div>-->
				<div class="mt-2 mb-2">
					<select
						name="lemmaBookCountChartOption"
						id="lemmaBookCountChartOption"
						bind:value={lemmaBookCountChartOptionIndex}
						class="select select-bordered select-sm bg-base-100 text-base-content inline-block self-center text-center align-top"
					>
						{#each lemmaBookCountChartOptions as name, index}
							<option value={index}>{name}</option>
						{/each}
					</select>
					<br />
					<i
						>{#if lemmaBookCountChartOptionIndex == 0}
							"# per book":
						{:else if lemmaBookCountChartOptionIndex == 1}
							"per 1000 words":
						{/if}</i
					>

					{#if lemmaBookCountChartOptionIndex == 0}
						<div id="lemma-info-corpus-book-counts-chart">
						
							<BarChart barData={lemmaBookCountsChartData} horizontal={true} corpusAbbrev={tfData.abbrev}/>
						
						</div>
					{:else if lemmaBookCountChartOptionIndex == 1}
						<div id="lemma-info-corpus-book-counts-chart">
						
							<BarChart barData={lemmaBookFreqChartData} horizontal={true} corpusAbbrev={tfData.abbrev}/>
						
						</div>
					{:else if lemmaBookCountChartOptionIndex == 2 && lemmaBookTable?.data}
						{#key lemmaBookCountChartOptionIndex && showStats}
							<Grid
								data={lemmaBookTable.data}
								sort={true}
								columns={lemmaBookTable.columns}
								pagination={{ limit: 50 }}
								style={"td{'font-family':'SBL BibLit'}"}
							/>
						{/key}
					{/if}
				</div>
			{:else}
				<i>Loading chart data...</i>
				<span class="loading loading-spinner loading-lg"></span>
			{/if}
		{/key}
		{/if}
		{#if tabs[selectedStatsTab].includes("Small")}
			{#if chosenBookId || userSelectedSections.length > 0}
				<hr />
				<div class="stats inline-block shadow">
					<h2>{sectionRef} vs. {StringUtils.capitalize(tfData.abbrev)} Lemma Count</h2>
					<div class="stat">
						<div class="stat-title">% of {StringUtils.capitalize(tfData.abbrev)}'s</div>
						{#key lemma && sectionStats}
						<PieChart pieData={{ nums: [sectionStats.lexCounts.section, lemma.stats.total - sectionStats.lexCounts.section] }} />
						{/key}
						<div class="stat-value">{((100 * sectionStats.lexCounts.section) / lemma.stats.total).toFixed(2)}%</div>
						<div class="stat-desc">
							This section's share of {StringUtils.capitalize(tfData.abbrev)}'s total use of this
							word.
						</div>
					</div>
				</div>
			{/if}

			{#if sectionStats.freqRatio && sections}
				<div class="stats inline-block shadow">
					<h2>{sectionRef} vs. Rest of {StringUtils.capitalize(tfData.abbrev)}: Frequency Ratio</h2>
					<div class="stat">
						<div class="stat-title">How much more/less does this section use this lemma?</div>
						{#key sectionStats && tfData && sectionRef}
						<BarChart
							barData={{ nums: [floatRound(sectionStats.freq.section.toFixed(3),3), 
									floatRound(sectionStats.freq.rest.toFixed(3), 3)],
									labels:[sectionRef,`Rest of ${tfData.abbrev}`]
									}}
							yAxisLabel="Frequency (#/1000)"
							corpusAbbrev={tfData.abbrev}
						/>
						{/key}
						<div class="stat-value">{floatRound(sectionStats.freqRatio,3)}</div>
						<div class="stat-desc">(1.0=same; 2.0=2x; 0.5=half)</div>
					</div>
				</div>
			{/if}
		{/if}
	{/if}

	{#if showSectionReferences}
		<hr />
		<LemmaRefs
			{tfData}
			lexId={lemma.id}
			lemma={lemma.lemma}
			{sections}
			lexRefQuery={sectionRefsQuery}
		/>
	{/if}
	{#if showReferences}
		<hr />
		{#await corpusRefsQuery.ready}
		<Loading title="Please wait..." message={["..loading references"]}/>
		{:then}
		<LemmaRefs {tfData} lexId={lemma.id} lemma={lemma.lemma} lexRefQuery={corpusRefsQuery} />
		{/await}
	{/if}

	<div></div>
</div>

<!-- {sections.map((id)=>tfData.booksDict.getRef(id)).join('; ')} -->

<style>
	@import 'https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css';
	@reference "tailwindcss";
	
	/*.greek {
        font-family: "SBL BibLit", "Gentium";
    }*/
	h1,
	p {
		text-align: center;
	}
	h1 {
		@apply text-3xl font-bold;
	}
		hr {
		@apply my-3 border-base-300;
	}

	.stats {
		@apply bg-base-200/80 m-1 p-3 border border-base-300 shadow-md text-base-content;
		border-radius: 0.75rem;
	}

	.stat-title {
		@apply font-semibold opacity-75 text-xs sm:text-sm;
	}

	.stat-value {
		@apply font-bold text-xl sm:text-2xl text-primary;
	}

	.stat-desc {
		@apply opacity-70 text-xs;
	}

	:global(.gridjs-container) {
		color: var(--color-ink, inherit) !important;
	}
	:global(.gridjs-wrapper) {
		background-color: var(--color-page, var(--fallback-b1, transparent)) !important;
		border-color: var(--color-rule, rgba(0, 0, 0, 0.15)) !important;
	}
	:global(.gridjs-table) {
		background-color: var(--color-page, var(--fallback-b1, transparent)) !important;
		color: var(--color-ink, inherit) !important;
	}
	:global(.gridjs-th) {
		background-color: var(--fallback-b2, rgba(128, 128, 128, 0.1)) !important;
		color: var(--color-ink, inherit) !important;
		border-color: var(--color-rule, rgba(0, 0, 0, 0.15)) !important;
	}
	:global(.gridjs-td) {
		background-color: var(--color-page, var(--fallback-b1, transparent)) !important;
		color: var(--color-ink, inherit) !important;
		border-color: var(--color-rule, rgba(0, 0, 0, 0.1)) !important;
	}
	:global(.gridjs-tr:hover td) {
		background-color: var(--fallback-b2, rgba(128, 128, 128, 0.1)) !important;
	}
	:global(.gridjs-footer) {
		background-color: var(--fallback-b2, rgba(128, 128, 128, 0.1)) !important;
		color: var(--color-ink, inherit) !important;
		border-color: var(--color-rule, rgba(0, 0, 0, 0.15)) !important;
	}
	:global(.gridjs-pagination button) {
		background-color: var(--color-page, var(--fallback-b1, transparent)) !important;
		color: var(--color-ink, inherit) !important;
		border-color: var(--color-rule, rgba(0, 0, 0, 0.2)) !important;
	}
	:global(.gridjs-pagination button:disabled) {
		opacity: 0.35 !important;
	}
</style>
