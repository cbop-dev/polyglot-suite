<script>
	import { LexQuery } from './LexQuery.svelte';
	import { LexQueryFilter, Filter } from './LexQuery.svelte.js';
	import SearchBox from './ui/SearchBox.svelte';
	import { Lexeme } from '$lib/Lexeme.js';
	//import SortOptions from './ui/SortOptions.svelte';
	import Button from './ui/Button.svelte';
	import Modal2 from './ui/Modal2.svelte';
	import LemmaInfo from './LemmaInfo.svelte';
	import LexFilter from './LexFilter.svelte';
	import OptionButton from './ui/OptionButton.svelte';
	import { Utils } from '$lib/utils/utils';
	import { GreekUtils } from '$lib/utils/greek-utils';
	import ModalButton from './ui/ModalButton.svelte';
	//import { untrack } from 'svelte';
	import Grid from 'gridjs-svelte';
	import { h } from 'gridjs';
	import { mylog } from "$lib/env/env.js";
	import BubbleChart from './ui/BubbleChart.svelte';
	import { VocabDataset } from '$lib/data/VocabDataset.js';
	import * as StringUtils from '$lib/utils/string-utils.js';
	import LexFilterInput from './LexFilterInput.svelte';
	import { HebrewUtils } from '$lib/utils/hebrew-utils';
	import * as BibleUtils from '$lib/utils/bible-utils';
	import Loading from './ui/Loading.svelte';
	import { TF } from '$lib/TF';
	import {LexRefQueries} from "$lib/LexRefQueries.svelte.js";
	// import {TableHandler,Datatable, Search, RowsPerPage, RowCount, Pagination} from '@vincjo/datatables';

	//let datatable = $state();

	/**
	 * @typedef ResultsPanelProps
	 * @property {{lexemeArray: Lexeme[], frequenciesReady: boolean }} lexData
	 * @property {LexQuery} query
	 * @property {boolean} [hidden]
	 * @property {TfDataset} tfData
	 */

	/**
	 * @type ResultsPanelProps {{lexData: {lexemeArray: Lexeme[], frequenciesReady: boolean }, query: LexQuery, hidden: boolean, tfData: TfDataset}}
	 */
	let { lexData = $bindable(), query = $bindable(), hidden = false, tfData } = $props();

	let ready = $derived(query.ready);
	let range = $derived.by(() => {
		//        console.debug("deriving range...");
		if (query.ready && lexData.lexemeArray.length > 0) {
			return [
				Math.min(...lexData.lexemeArray.map((l) => l.stats.total)),
				Math.max(...lexData.lexemeArray.map((l) => l.stats.total))
			];
		} else return null;
	});

	let sectionRange = $derived.by(() => {
		//        console.debug("deriving sectionRange...");
		if (ready && lexData.lexemeArray.length > 0) {
			let sectionRange = [
				Math.min(...lexData.lexemeArray.map((l) => l.stats.queryCount)),
				Math.max(...lexData.lexemeArray.map((l) => l.stats.queryCount))
			];
			return sectionRange;
		} else return null;
	});

	/**
	 * @type {Lexeme}
	 */
	let selectedLemma = $state(new Lexeme());

	const lexSortMethods = [
		{
			name: 'Alphabetical',
			sortFunction: (lex1, lex2) => {
				return lex1.lemma.localeCompare(lex2.lemma);
			}
		},
		{
			name: 'Section frequency',
			sortFunction: (lex1, lex2) => {
				return lex2.stats.queryCount - lex1.stats.queryCount;
			}
		},
		{
			name: `${tfData.abbrev} frequency`,
			sortFunction: (lex1, lex2) => {
				return lex2.stats.total - lex1.stats.total;
			}
		},
		{
			name: 'Frequency ratio!',
			sortFunction: (lex1, lex2) =>
				lex2.stats.querySectionStats.freqRatio ? lex2.stats.querySectionStats.freqRatio - lex1.stats.querySectionStats.freqRatio : 0
		}
	];

	let lexemeViewFilter = $derived.by(() => {
		mylog('deriving new lexViewFilter...');
		const newFilter = new LexQueryFilter();
		if (query.ready) {
			newFilter.setMinMaxRanges(query.filter.corpusMinMaxRange, query.filter.sectionMinMaxRange);
			newFilter.setMinMaxValues(query.filter.corpusMinMaxRange, query.filter.sectionMinMaxRange);
		}

		return newFilter;
	});

	let currentSortIndex = $state(0);
	let sortMethod = $derived(lexSortMethods[currentSortIndex]); // index to lexSortMethods above
	//let range = $derived(lexData.lexemeArray)

	lexemeViewFilter.add(
		new Filter('uniqueness', (lex) => {
			let pass = true;
			if (uniqueFilter == 'isolate') {
				if (
					!(
						(uniqueAbsolutely && lex.stats.queryCount >= lex.stats.total) ||
						(!uniqueAbsolutely && passesUniqueThreshold(lex))
					)
				) {
					pass = false;
				}
			} else if (uniqueFilter == 'remove') {
				if (
					!(
						(uniqueAbsolutely && lex.stats.queryCount < lex.stats.total) ||
						(!uniqueAbsolutely && !passesUniqueThreshold(lex))
					)
				) {
					pass = false;
				}
			}

			return pass;
		})
	);

	let showViewOptions = $state(false);

	let uniqueFilter = $state('none');
	let uniqueAbsolutely = $state(false);
	//let uniqueThreshold=$state(0);
	$effect(() => {
		lexemeViewFilter.uniqueFilterType = uniqueFilter;
		if (uniqueAbsolutely) lexemeViewFilter.minUniqueness = 100;
	});
	let showTextFilterInput = $state(false);
	let showLexemeModal = $state(false);
	let showResultFilters = $state(false);
	let showGlosses = $state(false);
	let currentLayout = $state('Buttons');
	const displayLayouts = $derived(query.sections.length ? ['Buttons', 'List', 'Data Table', 'Bubble'] : ['Buttons', 'List', 'Data Table']);

	/**
	 */
	const viewFilterPresetsList = {
		fav: {
			title: 'Favorites, by ratio!',
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(20)
				
				//lexemeViewFilter.corpusMinMaxRange[0] = 20;
				//lexemeViewFilter.sectionMinMaxRange[0] = 20; //this may seem redundant, but it isn't. :-). You'll learn the hard way if you ignore this line or comment. (Hint: you cannot predict what the user has alreay done.)
				lexemeViewFilter.pos[26] = 'exclude';
				uniqueFilter = 'color';
				currentSortIndex = 3;
			}
		},
		fav2: {
			title: 'Favorites, by frequency!',
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(20);
				//lexemeViewFilter.setMinMaxValues([20,lexemeViewFilter.corpusMinMaxRange[1]], 
				//[20,lexemeViewFilter.sectionMinMaxRange[1]]);
				//lexemeViewFilter.corpusMinMaxRange[0] = 20;
				//lexemeViewFilter.sectionMinMaxRange[0] = 20; //see comment above. Or don't, and remove this, and suffer for it.
				lexemeViewFilter.pos[26] = 'exclude';
				uniqueFilter = 'color';
				currentSortIndex = 1;
			}
		},
		max500:{
			title: "Less common (<500)",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(0,500);
				//lexemeViewFilter.corpusMinMaxRange[1] = 500;
				//lexemeViewFilter.sectionMinMaxRange[1] = lexemeViewFilter.corpusMinMaxRange[0]; //see comment above. Or don't, and remove this, and suffer for it.
				
			}
		},
		max500ByFreq:{
			title: "Less common, by freq. ratio",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(0,500);
				//lexemeViewFilter.corpusMinMaxRange[1] = 500;
				//lexemeViewFilter.sectionMinMaxRange[1] = lexemeViewFilter.corpusMinMaxRange[0]; //see comment above. Or don't, and remove this, and suffer for it.
				currentSortIndex=3;
				uniqueFilter="color";
			}
		},
		max100:{
			title: "Uncommon (<100)",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(0,100)
				//lexemeViewFilter.sectionMinMaxRange[1] = lexemeViewFilter.corpusMinMaxRange[1]; //see comment above. Or don't, and remove this, and suffer for it.
				
			}
		},
		max50:{
			title: "Very uncommon (<50)",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(0,50);
				//lexemeViewFilter.setMinMaxValues([50,lexemeViewFilter.corpusMinMaxRange[1]], [50,lexemeViewFilter.sectionMinMaxRange[1]]);
				//lexemeViewFilter.corpusMinMaxRange[1] = 50;
				//lexemeViewFilter.sectionMinMaxRange[1] = lexemeViewFilter.corpusMinMaxRange[0]; //see comment above. Or don't, and remove this, and suffer for it.
				
			}
		},
		max10:{
			title: "Extremely uncommon (<10)",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(0,10);
				//lexemeViewFilter.setMinMaxValues([50,lexemeViewFilter.corpusMinMaxRange[1]], [50,lexemeViewFilter.sectionMinMaxRange[1]]);
				//lexemeViewFilter.corpusMinMaxRange[1] = 50;
				//lexemeViewFilter.sectionMinMaxRange[1] = lexemeViewFilter.corpusMinMaxRange[0]; //see comment above. Or don't, and remove this, and suffer for it.
				
			}
		},
		hapax:{
			title: "Hapax (1x)",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(null,1);
				//lexemeViewFilter.setMinMaxValues([50,lexemeViewFilter.corpusMinMaxRange[1]], [50,lexemeViewFilter.sectionMinMaxRange[1]]);
				//lexemeViewFilter.corpusMinMaxRange[1] = 50;
				//lexemeViewFilter.sectionMinMaxRange[1] = lexemeViewFilter.corpusMinMaxRange[0]; //see comment above. Or don't, and remove this, and suffer for it.
				
			}
		},

		min500:{
			title: "Common (>500)",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(500,null);
				
				
			}
		},
		min1000:{
			title: "Very common (>1000)",
			setFilterFunc: () => {
				lexemeViewFilter.reset();
				lexemeViewFilter.setMinOrMax(1000,null);
			}
		}
	};
	/**
	 * @type {LexFilter} lexFilterComponent
	 */
	let lexFilterComponent;
	let lexFilterInputComp;
	let sortOptionComp;
	let filteredLexIndexes = $derived.by(() => {
		let results = lexData.lexemeArray
			.map((lex, i) => i)
			.filter((i) => lexemeViewFilter.pass(lexData.lexemeArray[i]));
		//console.debug("First part fo filteredLexIndexes before sorting: " + results.slice(0,10).map((i)=>lexData.lexemeArray[i]).join(','));
		results.sort((a, b) => sortMethod.sortFunction(lexData.lexemeArray[a], lexData.lexemeArray[b]));

		return results;
	});

	/**
	 * @type {number[]}
	 */
	let textFilteredLexIndexes = $derived.by(() => {
		if (lexemeViewFilter.textFilter.length == 0) return filteredLexIndexes;
		else return filteredLexIndexes.filter((i) => lexemeViewFilter.pass2(lexData.lexemeArray[i]));
	});

	let panelWidth = $state();

	function getRadius(sectionCount) {
		const maxRadius = panelWidth / 10;
		const minRadius = 5;
		/*const logBase = 4;
    const logPoint = Math.pow(logBase,2);

    

    const logScaledVal = Math.log(logPoint * val) / Math.log(logBase) -1;*/
		const val = sectionCount / query.response.totalWords;
		//results.sectionTotalWords;
		const scaledVal = Math.sqrt(val);
		const radius = Math.round((maxRadius - minRadius) * scaledVal + minRadius);
		//mylog('Results.getRadius(' +sectionCount +') = ' + radius);
		return radius;
	}

	function floatRound(float, decimals = 3) {
		const factor = Math.pow(10, decimals);
		return Math.round(float * factor) / factor;
	}

	let chooseLemma = $state(false);
	let lemmaChoices = $state([]);

	$effect(() => {
		if (hidden || !query.ready || showTextFilterInput || showResultFilters)
			currentLayout = 'Buttons';
	});

	$effect(() => {
		if (currentLayout != 'Buttons') {
			showTextFilterInput = false;
			showResultFilters = false;
		}
	});
	/**
	 *
	 * @param {number[]} lemmaIDs
	 */
	function bubbleClick(lemmaIDs) {
		// mylog("ResultsPanel.bubbleClick()! LemmaIds = " + lemmaIDs.join(','));
		if (lemmaIDs.length == 1) {
			const foundLemma = filteredLexIndexes
				.map((i) => lexData.lexemeArray[i])
				.find((l) => l.id == lemmaIDs[0]);
			if (foundLemma) {
				showLexeme(foundLemma);
			}
		} else if (lemmaIDs.length > 1) {
			lemmaChoices = lemmaIDs.map((lID) =>
				filteredLexIndexes.map((i) => lexData.lexemeArray[i]).find((l) => lID == l.id)
			);
			chooseLemma = true;
		}
	}

	/**
	 * @returns {BubbleData}
	 */
	function generateBubbleData() {
		mylog('generating bubble data...');
		const theData = {};

		/**
		 *
		 * @param {Lexeme} lex
		 * @returns {string} - background color for lexem's bubble
		 */
		function generateColor(lex) {
			//let [red, green, blue] = [0,0,0];

			const colorPoints = [
				/*  [0,0,0],
            [0,40,20],
            [220,85,50],
            [270,100,75]
            */
				[0, 0, 0],
				[0, 50, 50],
				[250, 90, 55],
				[270, 100, 75]
			];

			const ratioPoints = [0.25, 5, 30];
			let [h, s, l] = [0, 0, 0];

			if (lex.stats.querySectionStats.freqRatio < ratioPoints[0]) {
				// let's make it grayscale, between hsl(0,0,0) and (0,40,20) -- a dark greyish red.
				s = Math.round((lex.stats.querySectionStats.freqRatio * colorPoints[1][1]) / ratioPoints[0]);
				l = Math.round((lex.stats.querySectionStats.freqRatio * colorPoints[1][2]) / ratioPoints[0]);
			} else if (
				lex.stats.querySectionStats.freqRatio > ratioPoints[0] &&
				lex.stats.querySectionStats.freqRatio < ratioPoints[1]
			) {
				// from red to blue! (0,40,20)
				const baseRatio =
					(lex.stats.querySectionStats.freqRatio - ratioPoints[0]) / (ratioPoints[1] - ratioPoints[0]);
				h = Math.round(baseRatio * (colorPoints[2][0] - colorPoints[1][0]) + colorPoints[1][0]);
				s = Math.round(baseRatio * (colorPoints[2][1] - colorPoints[1][1]) + colorPoints[1][1]);
				l = Math.round(baseRatio * (colorPoints[2][2] - colorPoints[1][2]) + colorPoints[1][2]);
			} else {
				// > 10

				const baseRatio =
					lex.stats.querySectionStats.freqRatio > ratioPoints[2]
						? 1
						: (lex.stats.querySectionStats.freqRatio - ratioPoints[1]) / (ratioPoints[2] - ratioPoints[1]);

				h = Math.round(baseRatio * (colorPoints[3][0] - colorPoints[2][0]) + colorPoints[2][0]);
				s = Math.round(baseRatio * (colorPoints[3][1] - colorPoints[2][1]) + colorPoints[2][1]);
				l = Math.round(baseRatio * (colorPoints[3][2] - colorPoints[2][2]) + colorPoints[2][2]);
			}

			return 'hsl(' + h + ',' + s + '%, ' + l + '%)';
		}
		theData.datasets = textFilteredLexIndexes.map((lIndex) => {
			mylog('generating bubbleData...');
			const l = lexData.lexemeArray[lIndex];
			
			return {
				label: l.lemma,
				data: [
					{
						x: floatRound(l.stats.totalFreq, 3),
						y: floatRound(l.stats.sectionFreq, 3),
						rVal: l.stats.queryCount,
						r: getRadius(l.stats.queryCount)
					}
				],
				backgroundColor: generateColor(l),
				lexID: l.id
			};
		});
		const myDatasets = [
			{
				label: 'ἄνθρωπος',
				data: [
					{
						x: 20,
						y: 30,
						r: 15
					}
				],
				backgroundColor: 'rgb(255, 99, 132)'
			},
			{
				label: 'θεός',
				data: [
					{
						x: 40,
						y: 10,
						r: 10
					}
				],
				backgroundColor: 'rgb(99, 255, 132)'
			}
		];
		return theData;
	}

	let tableData = $derived(
		textFilteredLexIndexes
			.map((i) => lexData.lexemeArray[i])
			.map(
				/**
				 *
				 * @param {Lexeme} l
				 */
				(l, index) => {
					const ratio = l.stats.querySectionStats.freqRatio;
					return [
						l,
						l.gloss,
						l.beta,
						l.stats.queryCount,
						l.stats.total,
						l.stats.sectionFreq.toFixed(3),
						l.stats.totalFreq.toFixed(3),
						Number(ratio.toFixed(3)),
					
						l.stats.queryCount > 1
							? Number(
									(Math.log2(1 + l.stats.queryCount  / query.results.avgSectionLexCount) * ratio).toFixed(3)
								)
							: l.stats.queryCount  - 1
					];
				}
			)
	);

	//let datatable =  new TableHandler(tableData, { rowsPerPage: 10 });
	// FUNCTIONS:

	function updateMinMaxRanges() {
		//let range, sectionRange;
		if (lexData.lexemeArray.length > 0) {
			range = [
				Math.min(...lexData.lexemeArray.map((l) => l.stats.total)),
				Math.max(...lexData.lexemeArray.map((l) => l.stats.total))
			];
			sectionRange = [
				Math.min(...lexData.lexemeArray.map((l) => l.stats.queryCount)),
				Math.max(...lexData.lexemeArray.map((l) => l.stats.queryCount))
			];
		} else {
			range = [0, 90000];
			sectionRange = [0, 1000];
		}
	}

	/**
	 *
	 * @param {Lexeme} lex
	 */
	async function showLexeme(lex) {
//		mylog('showLexeme('+lex.lemma+')',true);
		theLexRefQueries.checkGetLemmaRefs(lex);
		selectedLemma = lex;
		
		//selectedLemma.
		//    count: lexInfo.count, total: lexInfo.total, pos: lexInfo.pos, proper: lexInfo.proper,totalWords: resultsInfo.totalWords}
		showLexemeModal = true;
	}
	function hideLexeme() {
		showLexemeModal = false;
		selectedLemma = new Lexeme();
	}

	/**
	 * 
	 * @param {Lexeme} lex
	 */
	function getGradientColorClass(lex) {
		const bgBlueGradient = [
			'bg-blue-950 text-white',
			'bg-blue-900 text-white',
			'bg-blue-800 text-white',
			'bg-blue-700 text-white',
			'bg-blue-600 text-white',
			'bg-blue-500 text-white',
			'bg-blue-400 text-black',
			'bg-blue-300 text-black',
			'bg-blue-200 text-black',
			'bg-blue-100 text-black',
			'bg-blue-50  text-black'
		];

		const bgGreenGradient = [
			'bg-green-500  text-black',
			'bg-green-600  text-white',
			'bg-green-700  text-white',
			'bg-green-800  text-white',
			'bg-green-900  text-white',
			'bg-green-950  text-white'
		];

		const bgRedGradient = [
			'bg-red-950  text-white',
			'bg-red-900  text-white',
			'bg-red-800  text-white',
			'bg-red-700  text-white',
			'bg-red-600  text-white',
			'bg-red-500  text-black'
		];
		let colorString = ' btn-lemma ';

		if (uniqueFilter == 'color') {
			if (lex.stats.querySectionStats.freqRatio < 1) {
				const index = lex.stats.querySectionStats.freqRatio <= 0 ? 0 : Math.floor(6 * lex.stats.querySectionStats.freqRatio);
				colorString = bgRedGradient[index] + ' ';
			} else if (lex.stats.querySectionStats.freqRatio > 1 && lex.stats.querySectionStats.freqRatio < 3) {
				const index = Math.floor((6 * (lex.stats.querySectionStats.freqRatio - 1)) / 2);
				colorString = ' ' + bgGreenGradient[index] + ' ';
			} else if (lex.stats.querySectionStats.freqRatio < 10) {
				const index = Math.floor((10 * (lex.stats.querySectionStats.freqRatio - 3)) / 7);
				colorString = ' ' + bgBlueGradient[index] + ' ';
			} else {
				// > 10
				colorString = 'bg-base-100 text-base-content border border-base-300';
			}
		}

		return colorString;
	}

	function clearAllViewOptions() {
		lexemeViewFilter.reset();
		if (lexFilterComponent) lexFilterComponent.clear();
		//if (lexFilterInputComp) lexFilterInputComp.clear();
		//if (sortOptionComp) sortOptionComp.clear();
		uniqueFilter = 'none';
		lexemeViewFilter.textFilter = '';
	}

	/**
	 *
	 * @param {Lexeme} lex
	 * @returns {boolean}
	 */
	function passesUniqueThreshold(lex) {
		//return Number(lex.stats.querySectionStats.freqRatio) >= Number(uniquenessMin);
		return (100 * (lex.stats.queryCount / lex.stats.total)) >= lexemeViewFilter.minUniqueness;
	}

	let theLexRefQueries=$derived(new LexRefQueries(tfData,query.sections));
	$inspect('theLexRefQueries:',theLexRefQueries);
	$inspect('LexResultsPanel:query.sections:',query.sections)
	$inspect('lexemeViewFilter',lexemeViewFilter);
	$inspect('lexemeViewFilter.corpusMinMaxRange',lexemeViewFilter.corpusMinMaxRange);
	$inspect('lexemeViewFilter.corpusMinMaxRange',lexemeViewFilter.corpusMinMaxRange);
</script>

<div id="output" class="mt-5 block self-center text-center" bind:clientWidth={panelWidth}>
	{#if query.sent && !query.ready}
		
		Awaiting response...<span class="loading loading-spinner loading-lg"></span>
	{:else if query.ready}
		{@const sectionRefsArray = query.sections.map((id) => tfData?.booksDict.getRef(Number(id)))}
		{@const typedRefsArray = BibleUtils.expandRefs(query.refsText)}
		{@const allTheRefs =[...typedRefsArray, ...sectionRefsArray]}
		<i class="block self-center text-center">
			Results for: 
			<b
	
				>{tfData.booksDict.combineRefs(allTheRefs)}</b
			></i
		>
		<h1>
			All {#if query.common}
				Common
				{#if query.unique}
					and Unique
				{/if}
			{:else if query.unique}
				Unique
			{/if}
			Words
		</h1>

		{#if query.filter.getExcluded().length > 0}
			Excluding: [{query.filter
				.getExcluded()
				.map((id) => Lexeme.getPosFromEnum(id).desc)
				.join(', ')}]
		{/if}
		<br />
		{#if query.filter.getRestricted().length > 0}
			Restricted to : [{query.filter
				.getRestricted()
				.map((id) => Lexeme.getPosFromEnum(id).desc)
				.join(', ')}]
		{/if}
		<h2 class="block self-center text-center">
			Found {query.results.lexemeArray.length}
			{StringUtils.capitalize(tfData.lang)} lexemes:
		</h2>
		{#if showResultFilters}
			<div class="">
				<OptionButton
					bind:selected={showResultFilters}
					buttonSize="btn-large m-1"
					buttonColors="bg-base-200 text-base-content border border-base-300"
					miscStyle="italic  font-light"
					buttonText="Hide Filters ✕"
				/> <br />
				<OptionButton bind:selected={showViewOptions} buttonText="View Options" />
				<OptionButton bind:selected={showTextFilterInput} buttonText="Textual Filter" />
				
			</div>

			<div>
				<div class="{showTextFilterInput ? 'block' : 'hidden'} m-2">
					<label for="inputfilter">Filter:</label>
					<ModalButton title="Text Filter Help" buttonText="(?)">
						<div class="block text-left">
							Enter Latin characters, which will convert automatically to Greek/Hebrew!
						</div>
					</ModalButton>

					<br />
					<SearchBox
						transform={(input) => {
							if (tfData.lang == 'greek') {
								return GreekUtils.removeDiacritics(GreekUtils.beta2Greek(input));
							} else if (tfData.lang == 'hebrew') {
								return HebrewUtils.makePlain(HebrewUtils.beta2Hebrew(input));
							} else {
								return input;
							}
						}}
						bind:casesensitive={lexemeViewFilter.textCaseSensitive}
						bind:searchText={lexemeViewFilter.textFilter}
					/>

					<br class="p-2" />
				</div>

				<Button buttonText="Reset View Options" toggled={clearAllViewOptions} />
				<Modal2 bind:showModal={showViewOptions} title="Filter/Highlight Options">
					<LexFilter
						{tfData}
						bind:this={lexFilterComponent}
						resetHook={() => {
							currentSortIndex = 0;
							uniqueFilter = 'none';
						}}
						showHeading={false}
						bind:filterOptions={lexemeViewFilter}
						enableOccurences={true}
					/>

					<label for="sortBy">Sort by:</label>
					<select
						name="sortBy"
						aria-label="Sort"
						bind:value={currentSortIndex}
						class="inline-block self-center text-center align-top"
					>
						{#each lexSortMethods as { name, sortFunction: func }, index}
							<option value={index}>{name}</option>
						{/each}
					</select>

					<!--    <SortOptions bind:data={lexData.lexemeArray} sortMethods={lexSortMethods} 
            bind:currentMethodIndex={currentSortIndex} bind:this={sortOptionComp}/>  -->

					<br />
					<label for="Uniqueness">Uniqueness Filter:</label>

					<select
						name="Uniqueness"
						id="groupSelect"
						bind:value={uniqueFilter}
						class="inline-block self-center text-center align-top"
					>
						<option value="none">None</option>
						<option value="ping">Highlight</option>
						<option value="remove">Remove</option>
						<option value="isolate">Isolate</option>
						<option value="color">Color gradient</option>
					</select>
					<ModalButton buttonText="What is this?" title="Uniqueness">
						<style>
							p {
								@apply mb-4 text-left;
							}
						</style>
						<p>
							'Uniqueness' here is the percentage a word's occurences in the entire Corpus(here: {tfData.abbrev})
							by one text (or group). I.e., if ἀγαπάω shows up 8 times in the Song of Songs of the
							283 times in the LXX, that is 2.8%.
						</p>

						<p>
							A 'uniqueness' of 50% means that the book or selection contains half of all occurences
							of a word. 100% means that the word appears only in the selected texts, and never
							elsehwere in the Corpus(here: {tfData.abbrev}). This would include any hapaxes, but
							also words that appear more than once, but only in the selected book(s)/chapter(s).
						</p>

						<p>
							Admittedly, "uniqueness" may not be the best name for this metric. Tell me if you can
							suggest a better name, or a better metric.
						</p>
					</ModalButton>
					<br />

					{#if uniqueFilter != 'none' && uniqueFilter != 'color'}
						<div>
							<label class="label inline cursor-pointer">
								<span class="label-text inline">Absolutely unique:</span>
								<input type="checkbox" bind:checked={uniqueAbsolutely} class="checkbox" />
							</label>
							<ModalButton buttonText="What is this?" title="Absolutely unique">
								This means a word shows up in a book (or set of books), but nowhere else in the
								entire corpus. This is the same as setting the minimum uniqueness slider to 100%.
							</ModalButton>
						</div>

						{#if !uniqueAbsolutely}
							<label for="uniquenessRatio">Minimum Uniqueness %:</label>
							<input
								type="range"
								min="0"
								max="100"
								bind:value={lexemeViewFilter.minUniqueness}
								class="range"
								step="5"
							/>
							<div class="flex w-full justify-between px-2 text-xs">
								<span>|</span>
								<span>|</span>
								<span>|</span>
								<span>|</span>
								<span>|</span>
							</div>
							<input
								name="maxwords"
								type="number"
								bind:value={lexemeViewFilter.minUniqueness}
								size="3"
							/>
						{/if}
					{/if}
				</Modal2>
			</div>
			<br />
		{:else}
			<OptionButton
				bind:selected={showResultFilters}
				buttonSize="btn-large"
				buttonColors="bg-base-200 text-base-content border border-base-300"
				miscStyle="italic font-bold"
				buttonText="Results Filters ☰"
			/>
		
		{/if}
		<ModalButton
					buttonText="Presets"
					title="View/Sort Presets:"
					buttonStyle="btn btn-outline btn-primary m-0 ml-1 mb-1 font-bold text-sm"
				>
					<div class="flex flex-wrap ">
						{#each Object.values(viewFilterPresetsList) as preset}
							<Button buttonText={preset.title} toggled={preset.setFilterFunc} style="p-2" /> &nbsp;
						{/each}
					</div>
		</ModalButton>
		<OptionButton
				bind:selected={showGlosses}
				buttonSize="btn-large"
				
				buttonText="Glosses"
			/>
		{#snippet uniquePing(lex)}
			{#if passesUniqueThreshold(lex)}
				<span class="relative inline-flex h-3 w-3">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"
					></span>
					<span class="relative inline-flex h-3 w-3 rounded-full bg-sky-500"></span>
				</span>
			{/if}
		{/snippet}
		{#if textFilteredLexIndexes.length > 0}
			<div id="results-display-buttons-panel" class="mt-1">
				<div id="copy-button" class="inline-block">
					<Button
						buttonColors="btn btn-secondary"
						buttonStyle="m-1 p-1 mt-0 mb-0 p-0"
						toggled={() => {
							Utils.copyToClipboard(
								textFilteredLexIndexes
									.map((i) => lexData.lexemeArray[i].lemma + ': ' + lexData.lexemeArray[i].gloss)
									.join('\n')
							);
						}}
						buttonText="Copy Results"
					/>
				</div>

				<div id="results-view-option" class="inline-block">
					<label for="panel-view" class="align-middle font-medium">Display:</label>
					<select
						name="panel-view"
						id="groupSelect"
						bind:value={currentLayout}
						class="m-1 inline-block self-center p-1 pr-8 text-center align-middle"
					>
						{#each displayLayouts as layout}
							<option value={layout}>{layout}</option>
						{/each}
					</select>
				</div>
			</div>
			<hr />
		{/if}
		<div id="lexeme-results">
			<span class="italic"
				>{#if textFilteredLexIndexes.length != lexData.lexemeArray.length}Filtered down to {textFilteredLexIndexes.length}
					lexemes.{:else}
					Showing all results.{/if}</span
			><br />

			<div id="lexeme-buttons" class="{currentLayout == 'Buttons' ? '' : 'hidden'} ">
				{#each textFilteredLexIndexes.map((i) => lexData.lexemeArray[i]) as lex}
					<div class="lex-div inline-block">
						<div class="lex-button inline-block">
							<Button
								textSize="text-2xl"
								buttonText={lex.lemma}
								toggled={() => {
									showLexeme(lex);
								}}
								tooltip={lex.gloss}
								buttonColors={getGradientColorClass(lex)}
								style="greek inline-block m-auto h-auto "
								buttonSubtext={showGlosses ? lex.gloss : ''}
							>
								

								{#if uniqueFilter == 'ping' && ((uniqueAbsolutely && lex.stats.queryCount == lex.stats.total) || (!uniqueAbsolutely && passesUniqueThreshold(lex)))}
									{@render uniquePing(lex)}
								{/if}
							</Button>
						</div>
					</div>
				{/each}
			</div>

			<div id="lexeme-list" class={currentLayout == 'List' ? '' : 'hidden'}>
				<dl class=" divide-black-100 columns-sm divide-y">
					{#each textFilteredLexIndexes.map((i) => lexData.lexemeArray[i]) as lex}
						<!--<div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt class="text-sm/6 font-medium text-gray-900">{lex.lemma}</dt>
                <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{lex.gloss}</dd>
              </div>


            -->
						<!--<div class="block text-left  sm:grid sm:grid-cols-3 sm:gap-1 sm:px-0">-->
						<div class="grid grid-cols-3 gap-0 px-0 text-left odd:bg-base-200/50 hover:bg-base-200 text-base-content transition-colors">
							<dt class="greek pl-2 text-lg font-bold text-base-content" lang="el">
								{lex.lemma}
							</dt>

							<dd class="mt-0 hyphens-auto text-wrap text-sm/6 text-base-content/85 sm:col-span-2 sm:mt-0">
								<span class={showGlosses ? '' : 'hidden'}>{lex.gloss} </span>
								<div class="float-right pr-1">
									<button
										class="text-lg"
										onclick={() => {
											showLexeme(lex);
										}}>ⓘ</button
									>
								</div>
							</dd>
						</div>
					{/each}
				</dl>
			</div>
			<div
				id="lexeme-datatable"
				class="greek items-center self-center {currentLayout == 'Data Table' ? '' : 'hidden'}"
			>
				<Grid
					data={tableData}
					sort={true}
					columns={// ["Lemma", "Gloss", "Section count", "Corpus Total", "Section Frequency", "Corpus Frequency", "Sect./Corpus Freq. Ratio"]
					[
						{
							name: 'Lemma',
							sort: {
								compare: (a, b) => {
									return GreekUtils.removeDiacritics(a.lemma)
										.toLocaleLowerCase()
										.localeCompare(GreekUtils.removeDiacritics(b.lemma).toLocaleLowerCase());
								}
							},
							formatter: (cell, row) => {
								return [
									cell.lemma + ' ',
									h(
										'button',
										{
											className: 'float-right ',
											onClick: () => {
												//const l = NtStats.getLemma(cell);
												showLexeme(cell);
											}
										},
										'ⓘ'
									)
								];
							}
						},
						{ name: 'Gloss' },
						{ name: 'Beta', hidden: true },
						{ name: 'Section Count' },
						{ name: `${tfData.abbrev} Total` },
						{ name: 'Section Frequency ' },
						{ name: `${tfData.abbrev} Frequency` },
						{ name: `Sect./${tfData.abbrev} Freq. Ratio` },
						{ name: "'Favored' Metric" }
					]}
					search={{ ignoreHiddenColumns: false }}
					pagination={{ limit: 50 }}
					style={"td{'font-family':'SBL BibLit'}"}
				/>
			</div>

			{#if !hidden && currentLayout == 'Bubble'}
				{#if query.sections && query.sections.length > 0}
				{@const bubbleData=generateBubbleData()}
					<div
						id="lexeme-datatable"
						class="greek items-center self-center {currentLayout == 'Bubble' ? '' : 'hidden'}"
					>
						<h2>
							Bubble Chart: NT frequencies (X-axis) vs. Section frequencies (Y-axis) + Section Count
							(radius):
						</h2>
						{#key generateBubbleData}
						<BubbleChart
							bubbleData={bubbleData}
							bubbleRadiusFunc={getRadius}
							onclick={bubbleClick}
						/>
						{/key}
					</div>
				{:else}
					Please select some books or chapters above and try again!
				{/if}
			{/if}
		</div>
	{:else}
		<p><i>Output will go here.</i></p>
	{/if}
</div>
<Modal2 bind:showModal={showLexemeModal} max={true}>
	{#key selectedLemma}
		
		{#if selectedLemma}
			{#if (query.sections?.length || query.refsText) && theLexRefQueries.corpusRefsQueries[selectedLemma.id]?.ready 
			&& (!query.sections?.length || theLexRefQueries.sectionRefsQueries[selectedLemma.id].ready)}
				
				<LemmaInfo
					
					{tfData}
					lemma={selectedLemma.copy()}
					sectionWords={Number(query.response.totalWords)}
					sections={query.sections}
					corpusRefsQuery={theLexRefQueries.corpusRefsQueries[selectedLemma.id]}
					sectionRefsQuery={theLexRefQueries.sectionRefsQueries[selectedLemma.id]}
					
					
				/>
			{:else}
			<Loading title="Loading" message={[`Retrieving data for ${selectedLemma.lemma}`]}/>
	
			{/if}
		{:else}
				<Loading title="Loading Lexeme info..."
				/>
				
		{/if}
	{/key}
</Modal2>

{#key chooseLemma}
	<div style="font-family: 'SBL BibLit'">
		<Modal2
			bind:showModal={chooseLemma}
			title="Select Lemma to View"
			onclose={() => {
				lemmaChoices = [];
				chooseLemma = false;
			}}
		>
			{#each lemmaChoices as l}
				<Button
					buttonText={l.lemma}
					toggled={() => {
						//mylog("chooseLemma.showLemmaInfo(" + l.ID +"), printing lexeme...)");
						//mylog(l)
						showLexeme(l);
						lemmaChoices = [];
						chooseLemma = false;
					}}
					buttonColors="btn-lemma"
					style="text-2xl mr-1 font-bold"
					textSize="text-2xl"
				/>
			{/each}
		</Modal2>
	</div>
{/key}

<style>
	@import 'https://cdn.jsdelivr.net/npm/gridjs/dist/theme/mermaid.min.css';

	.lex-div {
		display: inline-block;
		margin: 0.25rem 0.2rem;
	}

	.lex-div :global(button) {
		padding: 0.25rem 0.65rem !important;
		min-height: 2.2rem !important;
		height: auto !important;
	}
</style>
