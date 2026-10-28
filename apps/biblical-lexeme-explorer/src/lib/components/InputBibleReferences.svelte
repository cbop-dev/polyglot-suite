<script>
	import { Button } from '@polyglot/ui';
	import * as BibleUtils  from '$lib/utils/bible-utils.js';
	import { TfDataset } from '$lib/data/VocabDataset.js';
	/**
	 * @type {{
	 *  refsText:string,
	 *  defaultRefs:string,
	 * tfData:TfDataset
	 * }}
	 */
	let { 
		refsText = $bindable(''),
		defaultRefs = 'Gen 1:1-4; Exod 3',
		tfData=null
		 
	} = $props();
</script>

<!-- manual bible input field-->
		<div class="mb-4 mt-4">
			<label class="mr-2 font-bold" for="refsText">Enter references (e.g. "{defaultRefs}")</label>
			<br/>
			<input
				id="refsText"
				type="text"
				class="input input-sm input-bordered w-full max-w-xs"
				bind:value={refsText}
				placeholder={defaultRefs}
			/>
			
			<Button buttonText="Validate" toggled={() => {
				if (tfData){
					refsText=tfData.booksDict.filterOutInvalidBooks(refsText);
				}else{
					refsText=BibleUtils.filterOutInvalidBooks(refsText);
				}
				}} 
			buttonStyle="btn btn-sm"
			buttonColors=""
			buttonFocusHover="hover:bg-orange-600 focus:outline-2 focus:outline-orange-600"
			style="rounded-full"/>
			<Button buttonText="Clear" toggled={() => refsText = ''} 
			buttonStyle="btn btn-sm"
			buttonColors=""
			buttonFocusHover="hover:bg-orange-600 focus:outline-2 focus:outline-orange-600"
			style="rounded-full"/>
		</div>


