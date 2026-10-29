<script>
	import { VocabDataset, TfDataset } from '$lib/data/VocabDataset.js';
	import { onMount, tick } from 'svelte';
	import { Utils } from '$lib/utils/utils';
	import { Button, ModalButton, Modal2, OptionButton, CopyText, Icon } from '@polyglot/ui';
	import { LexQuery, LexQueryFilter } from './LexQuery.svelte.js';
	import { TextsDisplay } from '@polyglot/lemma-ui';
	import { VocabEngine, TF } from '$lib/engine/VocabEngine.js';
	import BookOpenSvg from '@polyglot/ui/components/icons/book-open.svg';
	import * as BibleUtils from '$lib/utils/bible-utils.js';
	import { getReaderVerseUrl } from '$lib/utils/navigation.js';
	import { getBookCanonicalIndex } from '@polyglot/ancient-languages';

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
<div class="rounded-lg bg-page/70 border border-rule/50 p-2 shadow-xs text-ink">
	{#if lexRefQuery.sent == true && lexRefQuery.ready == false}
		<i>Awaiting data...</i>
	{:else if wereReady && lexRefQuery.ready == true}
		
		<br/>
		{#if lexRefQuery.response && lexRefQuery.response['refs']}
		<div class="float-right">
			<CopyText tooltip="Copy references to clipboard." 
			btnCssClass="bg-page hover:bg-rule/20 text-ink border border-rule/50"
			copyText={tfData.booksDict.combineRefs(lexRefQuery.response['refs'])} />
		</div>
		<TextsDisplay
			sectionIDs={lexRefQuery.response['nodes']}
			refs={refsString}
			lang={tfData?.lang || (tfData?.dbAbbrev === 'bhs' ? 'hebrew' : 'greek')}
			dbAbbrev={tfData?.dbAbbrev || 'lxx'}
			lemma={lemma}
			lookupKey={lemma}
			fetchBatchTexts={async (ids) => {
				const batch = {};
				await Promise.all(ids.map(async (id) => {
					const res = await VocabEngine.fetchText(id, tfData.dbAbbrev);
					if (res?.text) {
						batch[id] = { text: res.text, matchedWords: [lemma] };
					}
				}));
				return batch;
			}}
			fetchVerseDetail={async (id) => {
				const res = await VocabEngine.fetchText(id, tfData.dbAbbrev);
				return res?.text ? { text: res.text, matchedWords: [lemma] } : null;
			}}
			getReaderVerseUrl={(ref) => getReaderVerseUrl(ref, tfData?.dbAbbrev)}
			formatBookAbbrev={(book) => tfData?.booksDict?.lookupBookAbbrev?.(book) || book}
			getBookCanonicalIndex={(book) => getBookCanonicalIndex(book, tfData?.dbAbbrev)}
		/>
		{/if}
		<!--{tfData.booksDict.combineRefs(lexRefQuery.response['refs'])}--><br/>
		<CopyText 
			copyText={tfData.booksDict.combineRefs(lexRefQuery.response['refs'])} 
			btnCssClass="bg-page hover:bg-rule/20 text-ink border border-rule/50" 
		/>
	{:else}
		<i>Lemma info will show here.</i>
	{/if}
</div>
<div class="float-right"></div>


