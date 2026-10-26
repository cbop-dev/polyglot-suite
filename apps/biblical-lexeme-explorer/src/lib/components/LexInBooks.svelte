<script>
	import { onMount } from 'svelte';
	import SelectBooksChaps from './SelectBooksChaps.svelte';
	import TfSelectBooksChaps from './SelectBooksChaps.svelte';
	import { VocabEngine, TF } from '$lib/engine/VocabEngine.js';
	import LexemeResultsPanel from './LexemeResultsPanel.svelte';
	import { VocabDataset, BookDict, TfDataset } from '$lib/data/VocabDataset.js';
	import Button from './ui/Button.svelte';
	import InputBibleReferences from './InputBibleReferences.svelte';
	import { LexQuery, LexQueryFilter } from './LexQuery.svelte.js';
	import { mylog } from '$lib/env/env.js';


	/**
	 * @type {{
	 *  hidden:boolean,
	 *  tfData:TfDataset,
	 *  initialRefs?: string
	 * }}
	 */
	let { hidden = false, tfData, initialRefs = '' } = $props();
	/**
	 * @type {Object<number,boolean>}
	 */
	let selectedSectionsFlags = $state({}); //stores the user selection of books/chapters from TfLxxSelectBooksChaps
	let selectedSectionsArray = $derived.by(getSelectedSections);
	let query = $state(new LexQuery());

	/**
	 * @returns {number[]}
	 */
	function getSelectedSections() {
		const selection = Object.entries(selectedSectionsFlags)
			.filter(([id, bool]) => bool)
			.map(([id, bool]) => Number(id));
		return selection;
	}
	async function fetchLexemes(showGloss = true, common = false, unique = false) {
		if (getSelectedSections().length == 0 && refsText.trim() === '') {
			highlightInputField = true;
		} else {
			highlightInputField = false;

			query.ready = false;
			query.sections = [...selectedSectionsArray];
			query.common = common;
			query.unique = unique;
			refsText = tfData.booksDict.filterOutInvalidBooks(refsText);
			query.refsText = refsText;
			mylog("query.refstext after removing invalid books:"+query.refsText)
			foundLexData.frequenciesReady = false;

			await VocabEngine.fetchLexemes(query, showGloss, tfData);

			foundLexData.lexemeArray = query.results.lexemeArray;
			query.makeReady();

			//console.debug("got response, we're ready, but not frequencies.")
			//calcFrequencies(); //asynronously calculate the frequency data for all found lexemes.
		}
	}
/*
	async function calcFrequencies() {
		for (let lex of foundLexData.lexemeArray) {
			lex.sectFreq = Number(((1000 * lex.count) / query.response.totalWords).toFixed(4));
			lex.totalFreq = Number(((1000 * lex.total) / tfData.lexStats.totalWords).toFixed(4));
			lex.freqSectTotalRatio = Number((lex.sectFreq / lex.totalFreq).toFixed(4));
		}
		foundLexData.frequenciesReady = true;
		//console.debug("Frequencies calculated!");
	}
*/
	let highlightInputField = $state(false);
	$effect(() => {
		if (getSelectedSections().length > 0 || query.refsText.trim() !== '')
			highlightInputField = false;
	});

	let frequenciesReady = $state(false);
	/**
	 * @type {Object}
	 */
	let foundLexData = $state({
		frequenciesReady: frequenciesReady,

		lexemeArray: []
	});
	let showSearchPanel = $state(true);
	let refsText = $state(initialRefs || '');

	onMount(() => {
		if (initialRefs) {
			refsText = initialRefs;
			fetchLexemes();
		}
	});
</script>

<hr class="thick" />
<div class="block self-center text-center">
	<h1>Lookup {tfData?.name || ''} Lexemes by Book/Chapter</h1>

	<div class="my-2 flex justify-center">
		<div class="tooltip tooltip-bottom" data-tip={showSearchPanel ? 'Hide Query Panel' : 'Show Query Panel'}>
			<button
				type="button"
				class="query-panel-toggle-btn"
				onclick={() => (showSearchPanel = !showSearchPanel)}
				title={showSearchPanel ? 'Hide Query Panel' : 'Show Query Panel'}
				aria-label={showSearchPanel ? 'Hide Query Panel' : 'Show Query Panel'}
				aria-expanded={showSearchPanel}
			>
				{#if showSearchPanel}
					<!-- Panel expanded: arrow points UP to collapse -->
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="m18 15-6-6-6 6" />
					</svg>
				{:else}
					<!-- Panel collapsed: arrow points DOWN to expand -->
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="m6 9 6 6 6-6" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<hr class="thick" />

	{#if showSearchPanel}
		{@const defaultRefs = tfData?.booksDict?.books && Object.keys(tfData.booksDict.books).length > 2 ? `${Object.entries(tfData.booksDict.books)[0][1].abbrev} 1; ${Object.entries(tfData.booksDict.books)[2][1].abbrev} 3:1-4` : ''}
		<InputBibleReferences
			defaultRefs={defaultRefs}
			bind:refsText={refsText}
			{tfData}
		/>

		<h2 class="itcali">AND/OR Select Books/Chapters:</h2>
		<TfSelectBooksChaps
			{tfData}
			bind:selectedSections={selectedSectionsFlags}
			bind:filterOptions={query.filter}
			bind:highlightInputField
		/>
		<div class="flex flex-wrap items-center justify-center gap-2 my-3">
			<Button toggled={() => fetchLexemes()} buttonColors="btn-lookup" buttonText="Find All Lexemes!" />
			<Button
				toggled={() => {
					fetchLexemes(true, true);
				}}
				buttonColors="btn-lookup"
				ready={refsText.length == 0}
				buttonText="Find Common Lexemes!"
			/>
			<Button
				toggled={() => {
					fetchLexemes(true, false, true);
				}}
				buttonColors="btn-lookup"
				buttonText="Find Unique Lexemes!"
			/>
			<Button
				toggled={() => {
					fetchLexemes(true, true, true);
				}}
				buttonColors="btn-lookup"
				buttonText="Find Common AND Unique Lexemes!"
				ready={refsText.length == 0}
			/>
		</div>

		<hr />
	{:else}{/if}

	<LexemeResultsPanel {tfData} bind:lexData={foundLexData} bind:query {hidden} />
</div>

<style>
	hr.thick {
		@apply mb-2 border-b-2 border-base-300;
	}

	.query-panel-toggle-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		padding: 0;
		margin: 0;
		border-radius: 50%;
		background-color: color-mix(in srgb, var(--color-page, var(--bg-content, canvas)) 85%, transparent);
		color: var(--color-ink, currentColor);
		border: 1.5px solid var(--color-rule, rgba(128, 128, 128, 0.35));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
		transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
	}

	.query-panel-toggle-btn:hover {
		background-color: var(--color-ink, #073642);
		color: var(--color-page, #ffffff);
		border-color: var(--color-ink, #073642);
		transform: scale(1.05);
	}

	.query-panel-toggle-btn:active {
		transform: scale(0.95);
	}

	.query-panel-toggle-btn svg {
		display: block;
		flex-shrink: 0;
	}
</style>

