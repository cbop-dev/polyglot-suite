<script>
    import WordCloudClient from "./WordCloudClient.svelte";
    import { VocabDataset } from "$lib/data/VocabDataset.js";
    /** @type{{
     * vocabData?: VocabDataset,
     * tfData?: VocabDataset
    }}*/
    let {
        vocabData,
        tfData 
    } = $props();

    const dataset = $derived(vocabData || tfData);
    let highlightInputField = $state(false);
</script>
<style>
    svg {
        margin: auto;
    }

    hr.thick {
        @apply border-b-black border-b-2 mb-2;
    }
</style>
<hr class="thick"/>
<div class="text-center self-center">
    <h1 class='text-3xl font-bold text-center'>{dataset?.name || 'LXX'} Vocab Word Cloud!</h1>
    <hr class="thick"/>
    Select some books/chapters, and see the words in a word cloud!
    <WordCloudClient vocabData={dataset} bind:highlightInputField />
</div>