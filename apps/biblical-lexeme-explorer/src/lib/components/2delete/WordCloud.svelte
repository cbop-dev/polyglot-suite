<script>
	import WordCloudPy from './WordCloudPy.svelte';
	import WordCloudPy2 from './WordCloudPy2.svelte';
	import WordCloudD3 from './WordCloudD3.svelte';
	import { TfDataset } from '$lib/tf/tfDataset';
	/** @type{{
     * tfData:TfDataset
    }}*/
	let { tfData } = $props();
	/**
	 * @type {boolean} highlightInputField
	 */
	let highlightInputField = $state(false);
</script>

<hr class="thick" />
<div class=" self-center text-center">
	<!--<WordCloudPy/>-->
	<h1 class="text-center text-3xl font-bold">LXX Vocab Word Cloud!</h1>
	<hr class="thick" />
	Select some books/chapters, and see the words in a word cloud!
	<!--<WordCloudPy2 {tfData} bind:highlightInputField />-->

	<!--<WordCloudD3 />-->
</div>

<style>
	svg {
		margin: auto;
	}

	hr.thick {
		@apply mb-2 border-b-2 border-b-black;
	}
</style>
