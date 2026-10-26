<script>
	import Button from './ui/Button.svelte';
	import TfSelectBooksChaps from './TfSelectBooksChaps.svelte';
	import { server } from '$lib/env/env';

	const theURL = server + 'wordcloud?';
	import { LexQuery, LexQueryFilter } from './LexQuery.svelte';
	import { stringify } from 'postcss';
	//import { tfLxxBooksDict, posDict } from "$lib/lxx/tfLXX";
	import { TfDataset } from '$lib/tf/tfDataset';
	import { Lexeme } from '$lib/Lexeme';
	let query = new LexQuery();
	let svg = $state({});
	let filterOptions = new LexQueryFilter();
	const defaults = {
		restrict: Lexeme.posGroups.CONT.join(','),
		maxWords: 150,
		sections: [1, 2, 3, 4, 5, 6, 7]
	};
	let { tfData, highlightInputField = $bindable(false) } = $props();

	/**
	 *
	 * @param baseurl {string}
	 * @param sections {string}
	 * @param restrict {string}
	 * @param exclude {string}
	 * @param maxWords {string}
	 * @param title {boolean}
	 * @param gloss {boolean}
	 */
	async function fetchWordCloudSVG(
		baseurl = '',
		sections = '1',
		restrict = Lexeme.posGroups.CONT.join(','),
		exclude = '',
		maxWords = '100',
		title = false,
		gloss = false
	) {
		if (Number(maxWords) == 0) maxWords = '500';
		if (!baseurl) baseurl = theURL;
		const url =
			baseurl +
			'sections=' +
			sections +
			'&' +
			'restrict=' +
			restrict +
			'&maxWords=' +
			maxWords +
			(title ? '&title=1' : '') +
			(gloss ? '&gloss=1' : '');
		//console.debug("fetching(" +url+")")
		const res = await fetch(url);
		svg = await res.text();
		query.response = svg;
		//query.ready = true;
		query.makeReady();
		//console.debug("got svg, we're ready!")
	}

	let selectedSections = $state({});
	$effect(() => {
		if (getSelectedSections().length > 0) highlightInputField = false;
	});
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
	let message = $state();
	let messageNotify = $state(false);

	function generateClicked() {
		query.ready = false;
		query.sent = false;
		messageNotify = false;
		message = 'Generating word cloud...';
		if (getSelectedSections().length > 0) {
			highlightInputField = false;
			fetchWordCloudSVG(
				'',
				getSelectedSections()
					.map((x) => x.toString())
					.join(','),
				filterOptions
					.getRestricted()
					.map((x) => x.toString())
					.join(','),
				filterOptions
					.getExcluded()
					.map((x) => x.toString())
					.join(','),
				filterOptions.maxWords.toString(),
				false,
				filterOptions.englishOnly
			);
			query.sent = true;
		} else {
			messageNotify = true;
			highlightInputField = true;
		}
	}
</script>

<div class="pb-3">
	<TfSelectBooksChaps
		{tfData}
		bind:filterOptions
		bind:selectedSections
		bind:highlightInputField
		enableEnglishOnly={true}
		enableMaxWords={true}
	/>

	<Button toggled={generateClicked} buttonText="Generate WordCloud!" />
</div>
<hr />

<div class="block self-center pt-3 text-center">
	{#if query.ready == false}
		{#if query.sent == false}
			Word Cloud SVG will show up here. <p>
				Select some book/chapters above and then click "Generate Word Cloud"
			</p>
		{:else}
			Generating world cloud...<br /><span class="loading loading-spinner loading-lg"></span>
		{/if}
	{:else}
		<h1>
			Word Cloud for [{tfData.booksDict.combineRefs(
				getSelectedSections().map((id) => tfData.booksDict.getRef(id))
			)}]
		</h1>
		{#if filterOptions.getExcluded().length > 0}
			Excluding: [{filterOptions
				.getExcluded()
				.map((id) => Lexeme.getPosFromEnum(id).abbrev)
				.join(', ')}]
		{/if}
		{#if filterOptions.getRestricted().length > 1}
			Restricted to: [{filterOptions
				.getRestricted()
				.map((id) => Lexeme.getPosFromEnum(id).abbrev)
				.join(', ')}]
		{/if}
		<div class="m-auto block max-w-4xl self-center">
			{@html query.response}
		</div>
	{/if}
</div>

<style>
	svg {
		margin: auto !important;
	}
</style>
