<script>
	import Button from '../ui/Button.svelte';
	import OptionButton from '../ui/OptionButton.svelte';
	import SelectButtonsPanel from '../SelectButtonsPanel.svelte';
	import Select2DbuttonsPanel from '../Select2DbuttonsPanel.svelte';
	import { server } from '$lib/env/env.js';
	import { TF } from '$lib/TF';

	//import {TfLxxDataset } from '$lib/lxx/tfLXX';
	import { TfDataset } from '$lib/tf/tfDataset';
	/**
	 * @type  {{tfData:TfDataset}}
	 *
	 */
	let { tfData } = $props();

	const theURL = TF.getURI(tfData.dbAbbrev) + 'wordcloud?';
	let results = $state({
		ready: false,
		svg: '',
		reset() {
			this.ready = false;
			this.svg = '';
		}
	});

	//const theLocalURL = "http://localhost:5000/wordcloud?";

	const myTrue = $state(true);

	async function fetchWordCloudSVG(
		baseurl = theURL,
		sections = '623694',
		restrict = 'CONT',
		maxWords = '500',
		title = '1'
	) {
		const url =
			baseurl +
			'sections=' +
			sections +
			'&' +
			'restrict=' +
			restrict +
			'&' +
			'maxWords=' +
			maxWords +
			(title ? '&title=1' : '');
		//console.debug("fetching(" +url+")")
		const res = await fetch(url);
		let svg = await res.text();

		results.svg = svg;
		results.ready = true;
		//console.debug("got svg, we're ready!")
	}

	/**
fetches an svg from the external python lxx wordcloud service, and puts it in a div/panel
*/
	//const myTrue = $state(true);

	//let selectedSections=$state({});
	let booksSelected = $state({});
	let selectedSections = $state({});
	let chapsSelected = $state({});

	let chapsSelectedBooleanList = $state({}); //key: book id; value: true|false if any chap is selected or the whole book is.

	let chapterModals = $state({});
	let isModalOpen = $state(false);
	let chaptersOn = $state(false);
	let chapData = $derived.by(() => {
		const theData = Object.entries(tfData.booksDict.chapters).map(([id, chapList]) =>
			Object({
				id: id,
				text: tfData.booksDict.books[id].abbrev,
				children: Object.entries(chapList).map(([id, num]) => Object({ id: id, text: num }))
			})
		);
		////console.debug("chapData.theData:" + theData.map(","))
		////console.debug(theData);
		return theData;
	});

	let bookData = $derived.by(() => {
		return Object.entries(tfData.booksDict.books).map(([id, obj]) =>
			Object({ id: id, text: obj.abbrev })
		);
	});
	function getSelectedSections() {
		let selections = selectedSections; //chaptersOn ? chapsSelected : booksSelected
		const theObs = Object.entries(selections)
			.filter(([id, selected]) => selected == true)
			.map(([i, s]) => i)
			.join(',');
		////console.debug("the selections are: " +theObs)
		return theObs;
	}

	function bookChapsAreSelected(bookId) {
		const value =
			Object.entries(chapsSelected)
				.filter(([k, val]) => val == true)
				.map(([sectId, val]) => sectId)
				.filter((sectId) => Object.values(tfData.booksDict.chapters[bookId]).includes(sectId))
				.length > 0;

		////console.debug("booksAreSelected("+bookId+") = " + value)
		return value;
	}
</script>

<OptionButton buttonText="Select chapters" bind:selected={chaptersOn} />

{#if chaptersOn}
	<Select2DbuttonsPanel
		title="Select chapters"
		bind:selectedItems={selectedSections}
		itemData={chapData}
	/>
{/if}

<SelectButtonsPanel
	title="LXX Books"
	description="Select entire books:"
	itemData={bookData}
	bind:selectedItems={selectedSections}
/>

<Button
	toggled={() => {
		fetchWordCloudSVG('', getSelectedSections());
	}}
	buttonText="Generate WordCloud!"
/>

<div>
	{#if results.ready}
		{@html results.svg}
	{:else}
		Word Cloud SVG will show up here...
	{/if}
</div>
