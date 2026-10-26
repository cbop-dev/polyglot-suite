<script>
	import { VocabDataset, TfDataset } from '$lib/data/VocabDataset.js';
	import { onMount, tick } from 'svelte';
	import { Utils } from '$lib/utils/utils';
	import Button from './ui/Button.svelte';
	import ModalButton from './ui/ModalButton.svelte';
	import { LexQuery, LexQueryFilter } from './LexQuery.svelte.js';
	import Icon from '$lib/components/ui/icons/Icon.svelte';
	import TextsDisplay from './TextsDisplay.svelte';
	import { VocabEngine, TF } from '$lib/engine/VocabEngine.js';
	import BookOpenSvg from '$lib/components/ui/icons/book-open.svg';
	import Modal2 from './ui/Modal2.svelte';
	import * as BibleUtils from '$lib/utils/bible-utils.js';
	import OptionButton from './ui/OptionButton.svelte';
	import CopyText from './ui/CopyText.svelte';

	/**
	 * @type {{
	 *  tfData:VocabDataset,
	 *  lexId:number,
	 *  lemma:string,
	 *  link:boolean,
	 *  lexRefQuery:LexQuery,
	 *  sections:number[]|null
	 * }}
	 */
	let {
		tfData,
		lexId,
		lemma,
		link = false,
		lexRefQuery = new LexQuery(),
		/**
		 * @type {null|number[]} sections
		 */
		sections = null
	} = $props();

	let wereReady = $state(false);

	let refsString = $derived(
		lexRefQuery?.response && lexRefQuery?.response['refs']
			? lexRefQuery.response['refs'].map((ref) => BibleUtils.standaradizeBibleRef(ref))
			: []
	);

	onMount(async () => {
		if (!lexRefQuery.ready) await VocabEngine.fetchRefs(lexId, sections, lexRefQuery, tfData.dbAbbrev);
		await tick();
		wereReady = lexRefQuery.ready;
	});
</script>

<h2>
	{#if !sections || sections.length == 0}All{/if}
	{#if lexRefQuery.ready && lexRefQuery.response && lexRefQuery.response['refs']}
		{lexRefQuery.response['refs'].length}
	{/if} verses with {lemma}
	{#if sections && sections.length > 0}in section(s){:else}in {tfData.abbrev}{/if}:
</h2>
<div class="rounded-lg bg-base-200/80 border border-base-300 p-2 shadow text-base-content">
	{#if lexRefQuery.sent == true && lexRefQuery.ready == false}
		<i>Awaiting data...</i>
	{:else if wereReady && lexRefQuery.ready == true}
		
		<br/>
		{#if lexRefQuery.response && lexRefQuery.response['refs']}
		<div class="float-right">
			<CopyText tooltip="Copy references to clipboard." 
			btnCssClass="bg-base-100 hover:bg-base-300 text-base-content"
			copyText={tfData.booksDict.combineRefs(lexRefQuery.response['refs'])} />
		</div>
		<TextsDisplay
				{tfData}
				lexID={lexId}
				sectionIDs={lexRefQuery.response['nodes']}
				refs={refsString}
				
			/>
			{/if}
		<!--{tfData.booksDict.combineRefs(lexRefQuery.response['refs'])}--><br/>
		<CopyText 
			copyText={tfData.booksDict.combineRefs(lexRefQuery.response['refs'])} 
			btnCssClass="bg-base-100 hover:bg-base-300 text-base-content" 
		/>
	{:else}
		<i>Lemma info will show here.</i>
	{/if}
</div>
<div class="float-right"></div>


