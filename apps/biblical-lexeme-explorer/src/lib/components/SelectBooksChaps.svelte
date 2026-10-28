<script>
	import Button from './ui/Button.svelte';
	import Modal from './ui/Modal.svelte';
	import Modal2 from './ui/Modal2.svelte';
	import OptionButton from './ui/OptionButton.svelte';
	import SelectButtonsPanel from './SelectButtonsPanel.svelte';
	import Select2DbuttonsPanel from './Select2DbuttonsPanel.svelte';
	import LexFilter from './LexFilter.svelte';
	import * as BibleUtils from '$lib/utils/bible-utils.js';
	import { LexQuery, LexQueryFilter } from './LexQuery.svelte.js';
	import { TfDataset } from '$lib/data/VocabDataset.js';
	import { Lexeme } from '$lib/Lexeme.js';

	/**
	 * @type {{
	 * selectedSections:Object<number,boolean>,
	 * tfData:TfDataset,
	 * filterOptions:LexQueryFilter,
	 * highlightInputField:boolean,
	 * enableEnglishOnly:boolean,
	 * enableMaxWords:boolean,}}
	 */
	let {
		selectedSections = $bindable(),
		vocabData,
		tfData,
		/**
		 * @type {LexQueryFilter} filterOptions
		 */
		filterOptions = $bindable(new LexQueryFilter()),
		highlightInputField = $bindable(false),
		enableEnglishOnly = $bindable(false),
		enableMaxWords = false
	} = $props();

	const dataset = $derived(vocabData || tfData);

	let filterGroupSelection = $state('');

	let booksSelected = $state({});
	let chapsSelected = $state({});
	let filterOn = $state(false);
	let chapsSelectedBooleanList = $state({});
	let showFilterModal = $state(false);
	let chapterModals = $state({});
	let isModalOpen = $state(false);
	let showChapsPanel = $state(false);
	let showBooksPanel = $state(false);
	let showPosOptions = $state(false);

	let chapData = $derived.by(() => {
		if (!dataset?.booksDict?.chapters) return [];
		return Object.entries(dataset.booksDict.chapters).map(([id, chapList]) => ({
			id: id,
			text: dataset.booksDict.books?.[id]?.abbrev || id,
			label: dataset.booksDict.books?.[id]?.abbrev || id,
			abbrev: dataset.booksDict.books?.[id]?.abbrev || id,
			children: Object.entries(chapList).map(([chapId, num]) => ({
				id: chapId,
				text: String(num),
				label: String(num)
			}))
		}));
	});

	let bookData = $derived.by(() => {
		if (!dataset?.booksDict?.books) return [];
		return Object.entries(dataset.booksDict.books).map(([id, obj]) => ({
			id: id,
			text: obj.abbrev,
			label: obj.abbrev,
			abbrev: obj.abbrev
		}));
	});

	function deselectAllSections() {
		for (let k of Object.keys(selectedSections || {})) {
			selectedSections[k] = false;
		}
	}

	export function hidePanels() {
		showBooksPanel = false;
		showChapsPanel = false;
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center justify-center gap-2">
		<OptionButton
			buttonText="Select Books"
			bind:selected={showBooksPanel}
			miscStyle={highlightInputField && !showBooksPanel ? 'animate-bounce' : ''}
		/>
		<span class="text-sm opacity-70">and/or:</span>
		<OptionButton
			buttonText="Select Chapters"
			bind:selected={showChapsPanel}
			miscStyle={highlightInputField && !showChapsPanel ? 'animate-bounce' : ''}
		/>
	</div>
	{#if selectedSections && Object.entries(selectedSections).filter(([id, bool]) => bool).length > 0}
		<div class="m-auto max-w-sm overflow-hidden text-ellipsis border border-rule/60 rounded-xl bg-page/70 text-ink shadow-xs p-2 font-mono">
			<div class="text-md font-bold">Selected References:</div>
			<div class="text-sm">
				{dataset?.booksDict?.combineRefs(
					Object.entries(selectedSections)
						.filter(([id, bool]) => bool)
						.map(([id, bool]) => dataset.booksDict.getRef(id))
				)}
			</div>
		</div>
	{/if}
	<Button
		buttonStyle="btn"
		buttonColors="btn-ghost"
		textSize=""
		style="font-medium"
		buttonText="Deselect All"
		toggled={() => {
			deselectAllSections();
		}}
	/>

	{#if showBooksPanel}
		<div class={highlightInputField == true ? 'animate-pulse' : ''}>
			<SelectButtonsPanel
				title="Select entire books"
				itemData={bookData}
				bind:selectedItems={selectedSections}
			/>
		</div>
	{/if}
	<hr />
	{#if showChapsPanel}
		<div class="border border-rule/50 rounded-xl p-2 bg-page/60">
			<Select2DbuttonsPanel
				title="Select chapters:"
				bind:selectedItems={selectedSections}
				itemData={chapData}
			/>
		</div>
	{/if}

	<Button
		buttonColors="btn-ghost"
		toggled={() => {
			showFilterModal = true;
		}}
		buttonText="Filter Options"
	/>

	<Modal2 title="Filter Options" bind:showModal={showFilterModal}>
		<LexFilter
			tfData={dataset}
			bind:filterOptions
			showHeading={false}
			{enableMaxWords}
			{enableEnglishOnly}
		/>
	</Modal2>
</div>
