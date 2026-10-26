<script>
	/** @type {{ data: import('./$types').PageData }} */

	import { LexQuery, LexQueryFilter } from '$lib/components/LexQuery.svelte';
	import LemmaInfo from '$lib/components/LemmaInfo.svelte';
	import * as sblGntLexesList from '$lib/sblgnt/sblGntLexes.json';
	import { SblGntVocabDataset, TfSblGntDataset } from '$lib/sblgnt/sblgntDataset.js';
	import { VocabDataset, TfDataset } from '$lib/data/VocabDataset.js';
	import { Lexeme } from '$lib/Lexeme';
	import Button from '$lib/components/ui/Button.svelte';

	import Modal from '$lib/components/ui/Modal.svelte';
	import { VocabEngine } from '$lib/engine/VocabEngine.js';
	import { TF } from '$lib/TF';

	import LexFilterInput from '$lib/components/LexFilterInput.svelte';
	import Modal2 from '$lib/components/ui/Modal2.svelte';

	const sblGntData = new SblGntVocabDataset();
	/** @type {VocabDataset} tfData*/
	let tfData = sblGntData;
	/**
	 * @type {number[]} matchedIndexes
	 */
	let bestMatchedIndexes = $state([]);

	/**
	 * @type {number[]} matchedIndexes
	 */
	let otherMatchedIndexes = $state([]);

	let selectedLexeme = $state();
	let showModal = $state(false);

	/**
	 *
	 * @param {string} beta
	 * @returns {Object[]}
	 */
	function lookupLexemesFromBeta(beta) {
		beta = beta.trim().toLowerCase();
		let matches = [];
		if (beta.length > 0) {
			beta = beta.replace('h', 'e').replace('w', 'o');
			const max = 50;
			let count = 0;

			for (const [k, lexBeta] of Object.entries(sblGntLexesList.plain)) {
				if (lexBeta.toLowerCase().includes(beta)) {
					matches.push({ id: sblGntLexesList.id[k], greek: sblGntLexesList.greek[k] });
					count += 1;
					if (count > max) break;
				}
			}
		}
		return matches;
	}
	/**
	 *
	 * @param {number} id
	 */
	async function selectLemma(id) {
		selectedLexeme = id;
		fetchLemma();
	}
	async function fetchLemma() {
		let id = Number(selectedLexeme);
		showModal = true;
		let lemma = new Lexeme();

		if (id >= 0) {
			queryReady = false;
			await VocabEngine.fetchLexInfo(id, lemma, tfData);
			if (lemma.id == id) {
				foundLemma = lemma;
				queryReady = true;
			}
		}
	}
	let queryReady = $state(false);
	let foundLemma = $state();
	/**
	 *
	 * @param {string} input
	 * @returns {string[]}
	 */
	function betaFilter(input) {
		input = input
			.trim()
			.toLowerCase()
			.replace('w', 'o')
			.replace(/[^a-z]/g, '');
		return [input, input.replace('h', 'e')];
	}
</script>

<div class="block items-center">
	<h1>Lookup {tfData.abbrev} Lexemes</h1>
	<h2>Search for a Lexeme:</h2>

	<LexFilterInput
		lang={tfData.lang}
		itemsList={sblGntLexesList.plain}
		bind:bestMatches={bestMatchedIndexes}
		bind:otherMatches={otherMatchedIndexes}
		tooltip="Enter (case-sensitive) Latin characters, which will convert automatically to Greek!"
		caseinsensitive={false}
	/>
</div>
<hr />

<div>
	{#if bestMatchedIndexes.length > 0 || otherMatchedIndexes.length > 0}
		<div>
			{#if bestMatchedIndexes.length > 0}
				<h2>Best Matches:</h2>
				{#each bestMatchedIndexes as key}
					<Button
						buttonText={sblGntLexesList.greek[key]}
						toggled={() => {
							selectLemma(sblGntLexesList.id[key]);
						}}
						textSize="text-2xl "
						buttonColors="btn-lemma"
						style="font-bold greek "
					/> &nbsp;
				{/each}
			{/if}

			{#if otherMatchedIndexes.length > 0}
				{#if bestMatchedIndexes.length > 0}<hr />{/if}
				<h2>
					{#if bestMatchedIndexes.length > 0}Other{/if} Matches:
				</h2>
				{#each otherMatchedIndexes as key}
					<Button
						buttonText={sblGntLexesList.greek[key]}
						toggled={() => {
							selectLemma(sblGntLexesList.id[key]);
						}}
						textSize="text-2xl "
						buttonColors="btn-lemma"
						style="font-bold greek "
					/> &nbsp;
				{/each}
			{/if}
		</div>
	{:else}
		Type some text above to search for Greek words.
	{/if}
</div>

<svelte:head>
	<title>{tfData.abbrev} Lexeme Search</title>
</svelte:head>

<Modal bind:showModal title="Greek Lemma Details">
	{#if queryReady == true && foundLemma?.id >= 0}
		<LemmaInfo {tfData} lemma={foundLemma} />
	{:else}
		Retreiving Lemma information...<span class="loading loading-spinner loading-lg"></span>
	{/if}
</Modal>

<style>
	h1,
	h2,
	input,
	p,
	select,
	div {
		@apply items-center self-center text-center;
	}

	h1,
	h2 {
		@apply break-after-all break-after-column;
	}
	hr {
		@apply m-1 p-1;
	}
</style>
