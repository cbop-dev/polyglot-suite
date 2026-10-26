<script>
	/**
	 * This UI component allows the user to select filtering options for query or display,
	 * and has its own LexQueryFilter object passed as a bindable property for the parent to use.
	 */
	import { LexQuery, LexQueryFilter } from './LexQuery.svelte';
	import { mylog } from '$lib/env/env.js';

	import OptionButton from './ui/OptionButton.svelte';
	import Button from './ui/Button.svelte';
	import ModalButton from './ui/ModalButton.svelte';
	import { VocabDataset, TfDataset } from '$lib/data/VocabDataset.js';
	import RangeSlider from 'svelte-range-slider-pips';
	import { Lexeme } from '$lib/Lexeme';
	//import { filter } from "d3-array";

	let {
		enableEnglishOnly = false,
		enableMaxWords = false,
		filterOptions = $bindable(new LexQueryFilter()),
		title = 'Filtering Options',
		description = 'Select from below options to filter.',
		showHeading = true,
		enableOccurences = false,
		resetHook = null,
		/**
		 * @type {TfDataset}
		 */
		tfData
	} = $props();
	let corpusSliderValues = $state([...filterOptions.corpusSliderValues]);
	let sectionSliderValues = $state([...filterOptions.sectionSliderValues]);
	let corpusStep = $derived(
		Math.floor((filterOptions.corpusMinMaxRange[1] - filterOptions.corpusMinMaxRange[0]) / 50)
	);
	let sectionStep = $derived(
		Math.floor((filterOptions.sectionMinMaxRange[1] - filterOptions.sectionMinMaxRange[0]) / 50)
	);

	let filterGroupSelection = $state('');
	let showPosOptions = $state(false);
	let showMaxWords = $state(false);

	//unfinished business here (trying to refactor....):
	/*
let optionGroupsDisplay = $state({
    showPosOptions: false,
    showMaxWords: false,
    isolate: () =>{

    }
})
*/

	/**
	 *
	 * @param {string} filterValue
	 */
	function setFilterGroupOptions(filterValue) {
		const posGroups = Lexeme.posGroups;
		//console.debug('setfilterGroup('+filterValue+') for ' + filterGroupSelection)
		if (posGroups[filterGroupSelection] && posGroups[filterGroupSelection].length > 0) {
			for (const posId of posGroups[filterGroupSelection]) {
				filterOptions.pos[posId] = filterValue;
				//console.debug("setting filteropt["+posId+'] = '+filterValue)
			}
		}
		//else
		//console.debug("setFilterGroup not doing nothing.")
	}
	export function clear() {
		mylog('LexFilter.clear() called...');
		resetFilter();
	}
	function resetFilter() {
		filterOptions.reset();
		corpusSliderValues = [...filterOptions.corpusSliderValues];
		sectionSliderValues = [...filterOptions.sectionSliderValues];
		console.debug('called filter.reset()');
		//filterOptions.maxWords = 0;
		filterGroupSelection = '';
		if (resetHook) {
			resetHook();
		}
	}

	function applyFilter() {
//		mylog(`LexFilter: applying minmax values: corpus: [${corpusSliderValues.join(',')}] section: [${sectionSliderValues.join(',')}]`, true)
		//filterOptions.setMinMaxValues(corpusSliderValues, sectionSliderValues);
		filterOptions.setMinMaxValues(corpusSliderValues, sectionSliderValues);
	}
	//$inspect("corpusSliderValues:",corpusSliderValues, "sectionSliderValues:", sectionSliderValues, "filterOptions:", filterOptions);
</script>

{#if showHeading}<h1>Filter Options</h1>{/if}

<!--<OptionButton  bind:selected={showPosOptions} buttonText="Parts of Speech"/>-->
<ModalButton
	buttonText="Parts of Speech"
	title="Filter by Parts of Speech"
	buttonStyle=" btn btn-outline btn-primary "
>
	<hr class="pb-3 pt-3" />
	<div class="overflow-x-auto">
		<!--<h2>Filter by Parts of Speech</h2>-->
		<select
			aria-label="groupSelect"
			name="groupSelection"
			bind:value={filterGroupSelection}
			id="groupSelect"
			class="inline-block self-center text-center align-top"
		>
			{#each Object.entries(Lexeme.posGroupsUIDesc) as posDescObj}
				<option value={posDescObj[0]} selected>{posDescObj[1]}</option>
			{/each}
		</select>
		<Button
			style="inline"
			buttonColors="btn-ghost"
			buttonText="Reset All"
			toggled={() => {
				Object.keys(filterOptions.pos).forEach((k) => (filterOptions.pos[k] = 'include'));
			}}
		/>
		<Button
			style="inline"
			buttonColors="btn-ghost"
			buttonText="Include"
			toggled={() => {
				setFilterGroupOptions('include');
			}}
		/>
		<Button
			style="inline"
			buttonStyle="btn"
			buttonColors="btn-ghost"
			buttonText="Exclude"
			toggled={() => {
				setFilterGroupOptions('exclude');
			}}
		/>
		<Button
			style="inline"
			buttonColors="btn-ghost"
			buttonText="Restrict to"
			toggled={() => {
				setFilterGroupOptions('restrict');
			}}
		/>

		<table class="table">
			<!-- head -->
			<thead>
				<tr>
					<th class="font-bold">Part of Speech</th>
					<th class="font-bold">Include</th>
					<th class="font-bold">Exclude</th>
					<th class="font-bold">Restrict to</th>
				</tr>
			</thead>
			<tbody>
				{#each Object.entries(Lexeme.PosDict) as [posEnum, posAbbrevDesc]}
					<tr>
						<td>
							<div class="tooltip">
								{posAbbrevDesc.desc}
							</div>
						</td>
						<td
							><input
								type="radio"
								name={posAbbrevDesc.abbrev}
								class="radio"
								bind:group={filterOptions.pos[posEnum]}
								value="include"
								checked
							/></td
						>
						<td
							><input
								type="radio"
								name={posAbbrevDesc.abbrev}
								class="radio"
								bind:group={filterOptions.pos[posEnum]}
								value="exclude"
							/></td
						>
						<td
							><input
								type="radio"
								name={posAbbrevDesc.abbrev}
								class="radio"
								bind:group={filterOptions.pos[posEnum]}
								value="restrict"
							/></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</ModalButton>
{#if enableOccurences}
	<ModalButton buttonStyle=" btn btn-outline btn-primary " buttonText="Word count">
		<h2><label for="minCorpusCount" class="label-text inline">Min/Max Word Filter</label></h2>
		<div>
			<style>
				.rangeSlider {
					overflow: visible;
				}
			</style>
			<div class="mr-2 inline-block">
				<b class="block">Corpus:</b>
				<br />Max:
				<input
					type="number"
					size="6"
					bind:value={corpusSliderValues[1]}
					class="text-sm"
					step={corpusStep}
				/>
				<br />

				<RangeSlider
					springValues={{ stiffness: 1, damping: 1 }}
					vertical
					range
					pushy
					float
					min={filterOptions.corpusMinMaxRange[0]}
					max={filterOptions.corpusMinMaxRange[1]}
					bind:values={corpusSliderValues}
				/>
				<br />Min:
				<input
					type="number"
					size="6"
					bind:value={corpusSliderValues[0]}
					class="text-sm"
					step={corpusStep}
				/><br />
			</div>
			<div class="ml-2 inline-block">
				<b class="block">Section:</b>

				<br />Max:
				<input
					type="number"
					size="5"
					bind:value={sectionSliderValues[1]}
					class="text-sm"
					step={sectionStep}
				/>
				<br />
				<RangeSlider
					vertical
					springValues={{ stiffness: 1, damping: 1 }}
					range
					pushy
					float
					min={filterOptions.sectionMinMaxRange[0]}
					max={filterOptions.sectionMinMaxRange[1]}
					bind:values={sectionSliderValues}
				/>
				<br />Min:
				<input
					type="number"
					size="5"
					bind:value={sectionSliderValues[0]}
					class="text-sm"
					step={sectionStep}
				/>
				<br />
			</div>
		</div>

		<hr />

		<div class="block items-center">
			<Button toggled={applyFilter} buttonText="Apply" buttonStyle="btn btn-secondary" />
			<Button
				toggled={() => {
					resetFilter();
					console.debug('reset...');
				}}
				buttonText="Reset!"
				buttonStyle="btn btn-secondary"
			/>
		</div>
	</ModalButton>
{/if}

{#if enableMaxWords}
	<OptionButton
		buttonStyle="b-0 p-1 pt-0 pb-0 rounded-sm"
		bind:selected={showMaxWords}
		buttonText="Max Words"
	/>
{/if}
{#if enableEnglishOnly}
	<div class="form-control text-center">
		<hr />
		<label class="label cursor-pointer">
			<span class="label-text inline">Use English glosses</span>
			<input type="checkbox" bind:checked={filterOptions.englishOnly} class="checkbox inline" />
		</label>
		<hr />
	</div>
{/if}
<Button
	buttonText="Reset All"
	buttonColors="btn btn-ghost text-base-content"
	style="font-light"
	toggled={resetFilter}
/>
<div class="rounded-sm"></div>

{#if enableMaxWords && showMaxWords}
	<label for="maxwords" class="label-text inline">Max Words:</label>
	<input
		name="maxwords"
		type="range"
		min="10"
		max="610"
		bind:value={filterOptions.maxWords}
		class="range"
		step="1"
	/>
	<input name="maxwords" type="number" bind:value={filterOptions.maxWords} size="10" />
{/if}
